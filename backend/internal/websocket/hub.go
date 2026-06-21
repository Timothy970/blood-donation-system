package websocket

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"blood-donation-system/backend/internal/config"
	"blood-donation-system/backend/internal/models"

	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow connections from Next.js and Expo
	},
}

// Client represents a connected user.
type Client struct {
	Hub    *Hub
	Conn   *websocket.Conn
	UserID uint
	Send   chan []byte
}

// WSMessage represents the payload format exchanged via WebSockets.
type WSMessage struct {
	ReceiverID uint   `json:"receiver_id"`
	Content    string `json:"content"`
}

// Hub maintains active client connections.
type Hub struct {
	clients    map[uint]*Client
	register   chan *Client
	unregister chan *Client
	mu         sync.Mutex
}

// NewHub creates a new hub.
func NewHub() *Hub {
	return &Hub{
		clients:    make(map[uint]*Client),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

// Run starts the hub loop to monitor register/unregister channels.
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client.UserID] = client
			h.mu.Unlock()
			fmt.Printf("User %d connected to chat WebSocket\n", client.UserID)
		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client.UserID]; ok {
				delete(h.clients, client.UserID)
				close(client.Send)
			}
			h.mu.Unlock()
			fmt.Printf("User %d disconnected from chat WebSocket\n", client.UserID)
		}
	}
}

// SendToUser routes a raw message byte slice to a specific user if online.
func (h *Hub) SendToUser(userID uint, message []byte) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if client, ok := h.clients[userID]; ok {
		select {
		case client.Send <- message:
		default:
			close(client.Send)
			delete(h.clients, userID)
		}
	}
}

// ReadPump pumps messages from the websocket connection to the hub.
func (c *Client) ReadPump() {
	defer func() {
		c.Hub.unregister <- c
		c.Conn.Close()
	}()

	c.Conn.SetReadLimit(512 * 1024)
	_ = c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.Conn.SetPongHandler(func(string) error {
		_ = c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket read error: %v", err)
			}
			break
		}

		var wsMsg WSMessage
		if err := json.Unmarshal(message, &wsMsg); err != nil {
			log.Printf("WS message parse error: %v", err)
			continue
		}

		if wsMsg.Content == "" || wsMsg.ReceiverID == 0 {
			continue
		}

		// Find or create Chat
		var chat models.Chat
		// Match exact 1-to-1 chat room (equivalent to django logic)
		config.DB.Raw(`
			Select c.* from chats c
			Join user_chats uc1 ON uc1.chat_id = c.id AND uc1.user_id = ?
			Join user_chats uc2 ON uc2.chat_id = c.id AND uc2.user_id = ?
		`, c.UserID, wsMsg.ReceiverID).Scan(&chat)

		if chat.ID == 0 {
			// Create new chat
			chat = models.Chat{}
			if err := config.DB.Create(&chat).Error; err != nil {
				log.Printf("Failed to create chat: %v", err)
				continue
			}
			// Assign participants
			var sender, receiver models.User
			config.DB.First(&sender, c.UserID)
			config.DB.First(&receiver, wsMsg.ReceiverID)
			config.DB.Model(&chat).Association("Participants").Append(&sender, &receiver)
		}

		// Store in database
		dbMsg := models.Message{
			ChatID:     chat.ID,
			SenderID:   c.UserID,
			ReceiverID: wsMsg.ReceiverID,
			Content:    wsMsg.Content,
			IsRead:     false,
		}

		if err := config.DB.Create(&dbMsg).Error; err != nil {
			log.Printf("Failed to persist message: %v", err)
			continue
		}

		// Prepare broadcast payload
		respPayload, _ := json.Marshal(ginH{
			"id":          dbMsg.ID,
			"chat_id":     chat.ID,
			"sender_id":   dbMsg.SenderID,
			"receiver_id": dbMsg.ReceiverID,
			"content":     dbMsg.Content,
			"created_at":  dbMsg.CreatedAt.Format(time.RFC3339),
			"is_read":     dbMsg.IsRead,
		})

		// Send to recipient
		c.Hub.SendToUser(wsMsg.ReceiverID, respPayload)

		// Echo back to sender
		c.Hub.SendToUser(c.UserID, respPayload)
	}
}

// WritePump pumps messages from the hub to the websocket connection.
func (c *Client) WritePump() {
	ticker := time.NewTicker(54 * time.Second)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.Send:
			_ = c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				_ = c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.Conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			_, _ = w.Write(message)

			// Add queued messages
			n := len(c.Send)
			for i := 0; i < n; i++ {
				_, _ = w.Write([]byte("\n"))
				_, _ = w.Write(<-c.Send)
			}

			if err := w.Close(); err != nil {
				return
			}
		case <-ticker.C:
			_ = c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

type ginH map[string]interface{}

// ServeWs handles websocket requests from peer clients.
func ServeWs(hub *Hub, w http.ResponseWriter, r *http.Request) {
	// Authenticate via token query parameter (standard for websockets)
	tokenStr := r.URL.Query().Get("token")
	if tokenStr == "" {
		http.Error(w, "Unauthorized: token missing", http.StatusUnauthorized)
		return
	}

	token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
		return []byte(config.GlobalConfig.JWTSecret), nil
	})

	if err != nil || !token.Valid {
		http.Error(w, "Unauthorized: invalid token", http.StatusUnauthorized)
		return
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		http.Error(w, "Unauthorized: invalid claims", http.StatusUnauthorized)
		return
	}

	userIDFloat, ok := claims["user_id"].(float64)
	if !ok {
		http.Error(w, "Unauthorized: missing user id", http.StatusUnauthorized)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WS Upgrade error: %v", err)
		return
	}

	client := &Client{
		Hub:    hub,
		Conn:   conn,
		UserID: uint(userIDFloat),
		Send:   make(chan []byte, 256),
	}

	client.Hub.register <- client

	go client.WritePump()
	go client.ReadPump()
}

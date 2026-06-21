package handlers

import (
	"net/http"
	"strconv"
	"time"

	"blood-donation-system/backend/internal/config"
	"blood-donation-system/backend/internal/models"

	"github.com/gin-gonic/gin"
)

// ChatRow represents a direct conversation summary.
type ChatRow struct {
	ChatID        uint         `json:"chat_id"`
	OtherUser     models.User  `json:"other_user"`
	LatestMessage string       `json:"latest_message"`
	UnreadCount   int64        `json:"unread_count"`
	Timestamp     time.Time    `json:"timestamp"`
}

// GetChats lists all distinct direct chats of the user.
func GetChats(c *gin.Context) {
	userID, _ := c.Get("userID")

	// Query chats where user is a participant
	var chats []models.Chat
	config.DB.Preload("Participants.Profile").
		Joins("JOIN user_chats uc ON uc.chat_id = chats.id").
		Where("uc.user_id = ?", userID.(uint)).
		Find(&chats)

	chatRows := []ChatRow{}
	for _, chat := range chats {
		// Find other participant
		var otherUser models.User
		found := false
		for _, p := range chat.Participants {
			if p.ID != userID.(uint) {
				otherUser = p
				found = true
				break
			}
		}

		if !found {
			continue
		}

		// Fetch latest message
		var latestMsg models.Message
		config.DB.Where("chat_id = ?", chat.ID).Order("created_at desc").First(&latestMsg)

		// Count unread received messages
		var unreadCount int64
		config.DB.Model(&models.Message{}).
			Where("chat_id = ? AND receiver_id = ? AND is_read = ?", chat.ID, userID.(uint), false).
			Count(&unreadCount)

		chatRows = append(chatRows, ChatRow{
			ChatID:        chat.ID,
			OtherUser:     otherUser,
			LatestMessage: latestMsg.Content,
			UnreadCount:   unreadCount,
			Timestamp:     latestMsg.CreatedAt,
		})
	}

	c.JSON(http.StatusOK, chatRows)
}

// GetChatMessages retrieves historical messages between the current user and target user.
func GetChatMessages(c *gin.Context) {
	userID, _ := c.Get("userID")
	otherUserIDStr := c.Param("other_id")
	otherUserID, err := strconv.ParseUint(otherUserIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid other user ID"})
		return
	}

	// Fetch messages between these two users (ordered from oldest to newest)
	var messages []models.Message
	err = config.DB.Where(
		"(sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)",
		userID.(uint), uint(otherUserID), uint(otherUserID), userID.(uint),
	).Order("created_at asc").Find(&messages).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve messages"})
		return
	}

	c.JSON(http.StatusOK, messages)
}

// MarkMessagesRead marks all unread incoming messages from other user as read.
func MarkMessagesRead(c *gin.Context) {
	userID, _ := c.Get("userID")
	otherUserIDStr := c.Param("other_id")
	otherUserID, err := strconv.ParseUint(otherUserIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid other user ID"})
		return
	}

	result := config.DB.Model(&models.Message{}).
		Where("sender_id = ? AND receiver_id = ? AND is_read = ?", uint(otherUserID), userID.(uint), false).
		Update("is_read", true)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update messages status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"marked_read": result.RowsAffected})
}

// GetUsersList returns a list of other registered users (e.g. for donor search / chat starting).
func GetUsersList(c *gin.Context) {
	userID, _ := c.Get("userID")

	var users []models.User
	// Load all users except current user, pre-load profile
	if err := config.DB.Preload("Profile").Where("id != ?", userID.(uint)).Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list users"})
		return
	}

	c.JSON(http.StatusOK, users)
}

package main

import (
	"fmt"
	"net/http"

	"blood-donation-system/backend/internal/config"
	"blood-donation-system/backend/internal/handlers"
	"blood-donation-system/backend/internal/websocket"

	"github.com/gin-gonic/gin"
)

// CORSMiddleware manages cross-origin resource sharing.
func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}

func main() {
	// Initialize configuration and connect to database
	config.LoadConfig()
	config.ConnectDatabase()

	// Spin up real-time websocket chat hub
	hub := websocket.NewHub()
	go hub.Run()

	// Setup router
	router := gin.Default()
	router.Use(CORSMiddleware())

	// Public Routes
	api := router.Group("/api")
	{
		api.POST("/register", handlers.Register)
		api.POST("/login", handlers.Login)
		api.GET("/requests", handlers.GetBloodRequests)
		api.GET("/requests/count", handlers.GetBloodRequestsCount)
	}

	// Protected Routes (require JWT Token)
	protected := router.Group("/api")
	protected.Use(handlers.AuthMiddleware())
	{
		// Profile & Users list
		protected.GET("/users", handlers.GetUsersList)
		protected.PUT("/profile", handlers.UpdateProfile)

		// Booking & Schedules
		protected.POST("/bookings", handlers.CreateBooking)
		protected.GET("/bookings", handlers.GetBookings)
		protected.DELETE("/bookings/:id", handlers.DeleteBooking)

		// Blood Request
		protected.POST("/requests", handlers.CreateBloodRequest)

		// Donation History & Points Gamification
		protected.POST("/donations", handlers.LogDonation)
		protected.GET("/donations", handlers.GetDonationHistory)
		protected.GET("/rewards", handlers.GetRewardStatus)

		// Chat Room APIs
		protected.GET("/chats", handlers.GetChats)
		protected.GET("/chats/:other_id/messages", handlers.GetChatMessages)
		protected.POST("/chats/:other_id/read", handlers.MarkMessagesRead)

		// Admin Routes (Inherits AuthMiddleware, adds AdminMiddleware)
		adminGroup := protected.Group("/admin")
		adminGroup.Use(handlers.AdminMiddleware())
		{
			adminGroup.GET("/stats", handlers.GetAdminStats)
			adminGroup.GET("/users", handlers.GetAdminUsers)
			adminGroup.DELETE("/users/:id", handlers.DeleteAdminUser)
			adminGroup.GET("/bookings", handlers.GetAdminBookings)
			adminGroup.PUT("/bookings/:id", handlers.UpdateAdminBooking)
			adminGroup.GET("/requests", handlers.GetAdminRequests)
			adminGroup.DELETE("/requests/:id", handlers.DeleteAdminRequest)
		}
	}

	// WebSocket handler for real-time direct chat
	router.GET("/ws/chat", func(c *gin.Context) {
		websocket.ServeWs(hub, c.Writer, c.Request)
	})

	// Start Server
	port := config.GlobalConfig.Port
	fmt.Printf("Blood Donation System Backend running on port %s\n", port)
	_ = router.Run(":" + port)
}

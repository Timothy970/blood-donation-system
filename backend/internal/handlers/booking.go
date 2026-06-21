package handlers

import (
	"net/http"
	"time"

	"blood-donation-system/backend/internal/config"
	"blood-donation-system/backend/internal/models"

	"github.com/gin-gonic/gin"
)

type BookingRequest struct {
	FirstName string    `json:"first_name" binding:"required"`
	LastName  string    `json:"last_name" binding:"required"`
	Date      time.Time `json:"date" binding:"required"`
	TimeSlot  string    `json:"time_slot" binding:"required"` // e.g., "09:00"
	Location  string    `json:"location" binding:"required"`
}

// CreateBooking schedules a new donation appointment.
func CreateBooking(c *gin.Context) {
	userID, _ := c.Get("userID")

	var req BookingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	booking := models.Booking{
		UserID:    userID.(uint),
		FirstName: req.FirstName,
		LastName:  req.LastName,
		Date:      req.Date,
		TimeSlot:  req.TimeSlot,
		Location:  req.Location,
		Status:    "Pending",
	}

	if err := config.DB.Create(&booking).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create booking"})
		return
	}

	c.JSON(http.StatusCreated, booking)
}

// GetBookings retrieves all bookings for the logged-in user.
func GetBookings(c *gin.Context) {
	userID, _ := c.Get("userID")

	var bookings []models.Booking
	if err := config.DB.Where("user_id = ?", userID.(uint)).Order("date desc").Find(&bookings).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch bookings"})
		return
	}

	c.JSON(http.StatusOK, bookings)
}

// DeleteBooking deletes/cancels a scheduled booking.
func DeleteBooking(c *gin.Context) {
	userID, _ := c.Get("userID")
	bookingID := c.Param("id")

	var booking models.Booking
	if err := config.DB.Where("id = ? AND user_id = ?", bookingID, userID.(uint)).First(&booking).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Booking not found"})
		return
	}

	if err := config.DB.Delete(&booking).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to cancel booking"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Booking cancelled successfully"})
}

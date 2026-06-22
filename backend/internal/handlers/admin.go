package handlers

import (
	"net/http"
	"strconv"

	"blood-donation-system/backend/internal/config"
	"blood-donation-system/backend/internal/models"

	"github.com/gin-gonic/gin"
)

// AdminMiddleware checks if the current authenticated user is an administrator.
func AdminMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("userID")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: Session missing"})
			c.Abort()
			return
		}

		var user models.User
		if err := config.DB.First(&user, userID).Error; err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
			c.Abort()
			return
		}

		if user.Role != "admin" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: Requires Admin role privileges"})
			c.Abort()
			return
		}

		c.Next()
	}
}

// GetAdminStats calculates the counts of registered profiles and active processes.
func GetAdminStats(c *gin.Context) {
	var usersCount int64
	var donationsCount int64
	var totalVolume struct{ Sum int64 }
	var pendingBookingsCount int64
	var activeSosRequestsCount int64

	config.DB.Model(&models.User{}).Count(&usersCount)
	config.DB.Model(&models.DonationMade{}).Count(&donationsCount)
	config.DB.Model(&models.DonationMade{}).Select("SUM(quantity_ml) as sum").Scan(&totalVolume)
	config.DB.Model(&models.Booking{}).Where("status = ?", "Pending").Count(&pendingBookingsCount)
	config.DB.Model(&models.BloodRequest{}).Where("is_emergency = ?", true).Count(&activeSosRequestsCount)

	c.JSON(http.StatusOK, gin.H{
		"total_users":              usersCount,
		"total_donations":          donationsCount,
		"total_donation_volume_ml": totalVolume.Sum,
		"total_active_bookings":    pendingBookingsCount,
		"total_active_requests":    activeSosRequestsCount,
	})
}

// GetAdminUsers returns all users in the system preloaded with profiles.
func GetAdminUsers(c *gin.Context) {
	var users []models.User
	if err := config.DB.Preload("Profile").Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query system users"})
		return
	}

	c.JSON(http.StatusOK, users)
}

// DeleteAdminUser removes a user and their profile from the database.
func DeleteAdminUser(c *gin.Context) {
	id := c.Param("id")
	if err := config.DB.Delete(&models.User{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User profile deleted successfully"})
}

// GetAdminBookings lists all bookings sorted by date.
func GetAdminBookings(c *gin.Context) {
	var bookings []models.Booking
	if err := config.DB.Order("date desc").Find(&bookings).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query bookings"})
		return
	}

	c.JSON(http.StatusOK, bookings)
}

// UpdateAdminBooking updates booking status. Completing a booking awards points.
func UpdateAdminBooking(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid booking ID"})
		return
	}

	type UpdatePayload struct {
		Status string `json:"status" binding:"required"`
	}

	var req UpdatePayload
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var booking models.Booking
	if err := config.DB.First(&booking, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Booking not found"})
		return
	}

	oldStatus := booking.Status
	booking.Status = req.Status

	tx := config.DB.Begin()
	if err := tx.Save(&booking).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update booking status"})
		return
	}

	// If marked as Completed, generate a donation log for the user if it was not already completed
	if req.Status == "Completed" && oldStatus != "Completed" {
		var user models.User
		if err := tx.Preload("Profile").First(&user, booking.UserID).Error; err == nil {
			bloodType := "O-"
			if user.Profile.BloodType != "" {
				bloodType = user.Profile.BloodType
			}

			// Add a donation log (450ml awards 45 XP points)
			donation := models.DonationMade{
				DonorID:      booking.UserID,
				Date:         booking.Date,
				Location:     booking.Location,
				BloodType:    bloodType,
				QuantityML:   450,
				Notes:        "Donation completed and verified via clinic booking.",
				PointsEarned: 45,
			}

			if err := tx.Create(&donation).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create donation log for completed booking"})
				return
			}
		}
	}

	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Transaction failed"})
		return
	}

	c.JSON(http.StatusOK, booking)
}

// GetAdminRequests returns all active blood requests.
func GetAdminRequests(c *gin.Context) {
	var requests []models.BloodRequest
	if err := config.DB.Order("created_at desc").Find(&requests).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query active requests"})
		return
	}

	c.JSON(http.StatusOK, requests)
}

// DeleteAdminRequest resolves/removes a blood request.
func DeleteAdminRequest(c *gin.Context) {
	id := c.Param("id")
	if err := config.DB.Delete(&models.BloodRequest{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete request"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Blood request deleted/resolved successfully"})
}

package handlers

import (
	"net/http"
	"time"

	"blood-donation-system/backend/internal/config"
	"blood-donation-system/backend/internal/models"

	"github.com/gin-gonic/gin"
)

type LogDonationPayload struct {
	Date       time.Time `json:"date" binding:"required"`
	Location   string    `json:"location" binding:"required"`
	BloodType  string    `json:"blood_type" binding:"required"`
	QuantityML int       `json:"quantity_ml" binding:"required,gt=0"`
	Notes      string    `json:"notes"`
}

// LogDonation records a donation made and adds points to the donor.
func LogDonation(c *gin.Context) {
	userID, _ := c.Get("userID")

	var payload LogDonationPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Double check donation cooling down: whole blood is generally 56 days
	var lastDonation models.DonationMade
	err := config.DB.Where("donor_id = ?", userID.(uint)).Order("date desc").First(&lastDonation).Error
	if err == nil {
		daysSince := time.Since(lastDonation.Date).Hours() / 24
		if daysSince < 56 {
			c.JSON(http.StatusForbidden, gin.H{
				"error":          "Donor cooling down",
				"days_remaining": int(56 - daysSince),
				"message":        "You must wait 56 days between whole blood donations.",
			})
			return
		}
	}

	// Points are proportional to quantity: e.g. 10 points per 100ml
	pointsEarned := (payload.QuantityML / 100) * 10
	if pointsEarned == 0 {
		pointsEarned = 10 // minimum points
	}

	donation := models.DonationMade{
		DonorID:      userID.(uint),
		Date:         payload.Date,
		Location:     payload.Location,
		BloodType:    payload.BloodType,
		QuantityML:   payload.QuantityML,
		Notes:        payload.Notes,
		PointsEarned: pointsEarned,
	}

	if err := config.DB.Create(&donation).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to log donation record"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":  "Donation logged successfully",
		"donation": donation,
	})
}

// GetDonationHistory retrieves the list of logged donations for a donor.
func GetDonationHistory(c *gin.Context) {
	userID, _ := c.Get("userID")

	var donations []models.DonationMade
	if err := config.DB.Where("donor_id = ?", userID.(uint)).Order("date desc").Find(&donations).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve donation history"})
		return
	}

	c.JSON(http.StatusOK, donations)
}

// GetRewardStatus calculates total points and checks badge achievements.
func GetRewardStatus(c *gin.Context) {
	userID, _ := c.Get("userID")

	var donations []models.DonationMade
	if err := config.DB.Where("donor_id = ?", userID.(uint)).Find(&donations).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to calculate rewards"})
		return
	}

	totalPoints := 0
	for _, d := range donations {
		totalPoints += d.PointsEarned
	}

	var badge string
	var nextBadge string
	var pointsNeeded int

	if totalPoints >= 400 {
		badge = "Platinum"
		nextBadge = "Max Level"
		pointsNeeded = 0
	} else if totalPoints >= 200 {
		badge = "Gold"
		nextBadge = "Platinum"
		pointsNeeded = 400 - totalPoints
	} else if totalPoints >= 100 {
		badge = "Silver"
		nextBadge = "Gold"
		pointsNeeded = 200 - totalPoints
	} else if totalPoints >= 50 {
		badge = "Bronze"
		nextBadge = "Silver"
		pointsNeeded = 100 - totalPoints
	} else {
		badge = "None"
		nextBadge = "Bronze"
		pointsNeeded = 50 - totalPoints
	}

	c.JSON(http.StatusOK, gin.H{
		"total_points":  totalPoints,
		"current_badge": badge,
		"next_badge":    nextBadge,
		"points_needed": pointsNeeded,
	})
}

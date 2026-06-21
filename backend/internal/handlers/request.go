package handlers

import (
	"math"
	"net/http"
	"time"

	"blood-donation-system/backend/internal/config"
	"blood-donation-system/backend/internal/models"

	"github.com/gin-gonic/gin"
)

type BloodRequestPayload struct {
	FirstName     string  `json:"first_name" binding:"required"`
	LastName      string  `json:"last_name" binding:"required"`
	BloodType     string  `json:"blood_type" binding:"required"`
	ContactNumber string  `json:"contact_number" binding:"required"`
	Location      string  `json:"location" binding:"required"`
	Latitude      float64 `json:"latitude"`
	Longitude     float64 `json:"longitude"`
	IsEmergency   bool    `json:"is_emergency"`
}

// Map of compatible donor blood types for each recipient blood type.
// Key = Recipient, Value = list of compatible Donors.
var bloodCompatibility = map[string][]string{
	"A+":  {"A+", "A-", "O+", "O-"},
	"A-":  {"A-", "O-"},
	"B+":  {"B+", "B-", "O+", "O-"},
	"B-":  {"B-", "O-"},
	"AB+": {"A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"}, // Universal recipient
	"AB-": {"A-", "B-", "AB-", "O-"},
	"O+":  {"O+", "O-"},
	"O-":  {"O-"}, // Universal donor
}

// CalculateDistance uses the Haversine formula to find distance in km between coordinates.
func CalculateDistance(lat1, lon1, lat2, lon2 float64) float64 {
	const EarthRadiusKm = 6371.0

	dLat := (lat2 - lat1) * (math.Pi / 180.0)
	dLon := (lon2 - lon1) * (math.Pi / 180.0)

	rLat1 := lat1 * (math.Pi / 180.0)
	rLat2 := lat2 * (math.Pi / 180.0)

	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Sin(dLon/2)*math.Sin(dLon/2)*math.Cos(rLat1)*math.Cos(rLat2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))

	return EarthRadiusKm * c
}

// CreateBloodRequest submits a new blood request and searches for matching donors.
func CreateBloodRequest(c *gin.Context) {
	var payload BloodRequestPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var requesterID *uint
	if val, exists := c.Get("userID"); exists {
		id := val.(uint)
		requesterID = &id
	}

	bloodRequest := models.BloodRequest{
		RequesterID:   requesterID,
		FirstName:     payload.FirstName,
		LastName:      payload.LastName,
		BloodType:     payload.BloodType,
		ContactNumber: payload.ContactNumber,
		Location:      payload.Location,
		Latitude:      payload.Latitude,
		Longitude:     payload.Longitude,
		IsEmergency:   payload.IsEmergency,
		ExpiresAt:     time.Now().Add(24 * time.Hour), // Expire request in 24 hours by default
	}

	if err := config.DB.Create(&bloodRequest).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create blood request"})
		return
	}

	// Smart Matching Engine: Find compatible donors in the system
	var profiles []models.Profile
	compatTypes := bloodCompatibility[payload.BloodType]
	if len(compatTypes) == 0 {
		compatTypes = []string{payload.BloodType} // fallback to exact match
	}

	// Query active donors with compatible blood types
	config.DB.Where("blood_type IN ?", compatTypes).Find(&profiles)

	matchingDonors := []gin.H{}
	for _, p := range profiles {
		// Calculate distance if coordinates are present
		distance := 0.0
		if payload.Latitude != 0 && payload.Longitude != 0 && p.Latitude != 0 && p.Longitude != 0 {
			distance = CalculateDistance(payload.Latitude, payload.Longitude, p.Latitude, p.Longitude)
		}

		// Pull User info for display
		var u models.User
		config.DB.Select("username, email").First(&u, p.UserID)

		// Recommend if distance <= 50km or coordinates are missing
		if distance <= 50.0 || (payload.Latitude == 0 || p.Latitude == 0) {
			matchingDonors = append(matchingDonors, gin.H{
				"user_id":      p.UserID,
				"username":     u.Username,
				"email":        u.Email,
				"phone_number": p.PhoneNumber,
				"city":         p.City,
				"blood_type":   p.BloodType,
				"distance_km":  math.Round(distance*100) / 100, // round to 2 decimal places
			})
		}
	}

	c.JSON(http.StatusCreated, gin.H{
		"request":         bloodRequest,
		"matching_donors": matchingDonors,
		"message":         "Blood request submitted. Matching donors identified.",
	})
}

// GetBloodRequests lists all active, non-expired blood requests.
func GetBloodRequests(c *gin.Context) {
	var requests []models.BloodRequest
	now := time.Now()

	// Filter by blood type if query param exists
	query := config.DB.Where("expires_at > ?", now)
	if bType := c.Query("blood_type"); bType != "" {
		query = query.Where("blood_type = ?", bType)
	}

	if err := query.Order("created_at desc").Find(&requests).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve blood requests"})
		return
	}

	c.JSON(http.StatusOK, requests)
}

// GetBloodRequestsCount returns the current count of active requests.
func GetBloodRequestsCount(c *gin.Context) {
	var count int64
	now := time.Now()

	if err := config.DB.Model(&models.BloodRequest{}).Where("expires_at > ?", now).Count(&count).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count requests"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"count": count})
}

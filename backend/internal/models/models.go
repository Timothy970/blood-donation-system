package models

import (
	"time"

	"gorm.io/gorm"
)

// User represents a system user (donor or recipient).
type User struct {
	ID           uint           `gorm:"primaryKey" json:"id"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
	Username     string         `gorm:"unique;not null;type:varchar(100)" json:"username"`
	Email        string         `gorm:"unique;not null;type:varchar(100)" json:"email"`
	PasswordHash string         `gorm:"not null;type:varchar(255)" json:"-"`
	Role         string         `gorm:"type:varchar(20);default:'user'" json:"role"`
	Profile      Profile        `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"profile"`
}

// Profile holds extended profile information for a donor or recipient.
type Profile struct {
	ID           uint           `gorm:"primaryKey" json:"id"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
	UserID       uint           `gorm:"unique;not null" json:"user_id"`
	DateOfBirth  time.Time      `gorm:"type:date;not null" json:"date_of_birth"`
	PhotoURL     string         `gorm:"type:varchar(255)" json:"photo_url"`
	Availability string         `gorm:"type:varchar(20);default:'Anyday'" json:"availability"` // Anyday, Weekdays, Weekends
	Gender       string         `gorm:"type:varchar(10)" json:"gender"`                        // M, F, O
	BloodType    string         `gorm:"type:varchar(5);not null" json:"blood_type"`            // A+, A-, B+, B-, AB+, AB-, O+, O-
	City         string         `gorm:"type:varchar(100);default:'Nairobi'" json:"city"`
	PhoneNumber  string         `gorm:"type:varchar(20);not null" json:"phone_number"`
	Latitude     float64        `gorm:"type:decimal(9,6)" json:"latitude"`
	Longitude    float64        `gorm:"type:decimal(9,6)" json:"longitude"`
}

// BloodRequest represents an active or emergency request for blood.
type BloodRequest struct {
	ID            uint           `gorm:"primaryKey" json:"id"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`
	RequesterID   *uint          `json:"requester_id,omitempty"` // User who requested (optional for guest requests)
	FirstName     string         `gorm:"type:varchar(100);not null" json:"first_name"`
	LastName      string         `gorm:"type:varchar(100);not null" json:"last_name"`
	BloodType     string         `gorm:"type:varchar(5);not null" json:"blood_type"`
	ContactNumber string         `gorm:"type:varchar(20);not null" json:"contact_number"`
	Location      string         `gorm:"type:varchar(100);not null" json:"location"`
	Latitude      float64        `gorm:"type:decimal(9,6)" json:"latitude"`
	Longitude     float64        `gorm:"type:decimal(9,6)" json:"longitude"`
	IsEmergency   bool           `gorm:"default:false" json:"is_emergency"`
	ExpiresAt     time.Time      `json:"expires_at"`
}

// Booking represents a scheduled blood donation appointment.
type Booking struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
	UserID    uint           `gorm:"not null" json:"user_id"`
	FirstName string         `gorm:"type:varchar(100);not null" json:"first_name"`
	LastName  string         `gorm:"type:varchar(100);not null" json:"last_name"`
	Date      time.Time      `gorm:"type:date;not null" json:"date"`
	TimeSlot  string         `gorm:"type:varchar(10);not null" json:"time_slot"` // e.g. "10:30"
	Location  string         `gorm:"type:varchar(100);not null" json:"location"`
	Status    string         `gorm:"type:varchar(20);default:'Pending'" json:"status"` // Pending, Completed, Cancelled
}

// DonationMade logs a completed blood donation by a donor, carrying points for gamification.
type DonationMade struct {
	ID           uint           `gorm:"primaryKey" json:"id"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
	DonorID      uint           `gorm:"not null" json:"donor_id"`
	Date         time.Time      `gorm:"type:date;not null" json:"date"`
	Location     string         `gorm:"type:varchar(100);not null" json:"location"`
	BloodType    string         `gorm:"type:varchar(5);not null" json:"blood_type"`
	QuantityML   int            `gorm:"not null" json:"quantity_ml"`
	Notes        string         `gorm:"type:text" json:"notes"`
	PointsEarned int            `gorm:"default:0" json:"points_earned"`
}

// Chat represents a chat room/conversation between participants.
type Chat struct {
	ID           uint           `gorm:"primaryKey" json:"id"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
	Participants []User         `gorm:"many2many:user_chats;" json:"participants"`
	Messages     []Message      `gorm:"foreignKey:ChatID" json:"messages"`
}

// Message represents an individual message sent inside a Chat room.
type Message struct {
	ID         uint           `gorm:"primaryKey" json:"id"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `gorm:"index" json:"-"`
	ChatID     uint           `gorm:"not null" json:"chat_id"`
	SenderID   uint           `gorm:"not null" json:"sender_id"`
	ReceiverID uint           `gorm:"not null" json:"receiver_id"`
	Content    string         `gorm:"type:text;not null" json:"content"`
	IsRead     bool           `gorm:"default:false" json:"is_read"`
}

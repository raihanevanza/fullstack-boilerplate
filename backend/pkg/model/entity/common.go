// Package entity contains GORM models. The schema uses PascalCase names, so
// every column is mapped explicitly with a gorm:"column:..." tag.
package entity

import "time"

type Ping struct {
	CurrentDate time.Time `gorm:"column:CurrentDate"`
}

type AuditLog struct {
	ID         int64     `gorm:"column:Id;primaryKey"`
	UserID     *int64    `gorm:"column:UserId"`
	Action     string    `gorm:"column:Action"`
	EntityName string    `gorm:"column:EntityName"`
	EntityID   *int64    `gorm:"column:EntityId"`
	OldValues  *string   `gorm:"column:OldValues"` // JSON
	NewValues  *string   `gorm:"column:NewValues"` // JSON
	IpAddress  *string   `gorm:"column:IpAddress"`
	CreatedAt  time.Time `gorm:"column:CreatedAt"`
}

func (AuditLog) TableName() string { return "dbo.AuditLogs" }

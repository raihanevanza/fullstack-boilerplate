package entity

import (
	"time"

	"gorm.io/gorm"
)

type Role struct {
	ID   int    `gorm:"column:Id;primaryKey"`
	Code string `gorm:"column:Code"`
	Name string `gorm:"column:Name"`
}

func (Role) TableName() string { return "dbo.Roles" }

type User struct {
	ID           int64          `gorm:"column:Id;primaryKey"`
	RoleID       int            `gorm:"column:RoleId"`
	FullName     string         `gorm:"column:FullName"`
	Email        string         `gorm:"column:Email"`
	PasswordHash string         `gorm:"column:PasswordHash"`
	IsActive     bool           `gorm:"column:IsActive"`
	LastLoginAt  *time.Time     `gorm:"column:LastLoginAt"`
	CreatedAt    time.Time      `gorm:"column:CreatedAt"`
	UpdatedAt    *time.Time     `gorm:"column:UpdatedAt"`
	DeletedAt    gorm.DeletedAt `gorm:"column:DeletedAt"`

	Role Role `gorm:"foreignKey:RoleID"`
}

func (User) TableName() string { return "dbo.Users" }

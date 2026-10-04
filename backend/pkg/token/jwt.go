// Package token issues and verifies HS256 access tokens (JWT).
package token

import (
	"errors"
	"strconv"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type Claims struct {
	Name string `json:"name"`
	Role string `json:"role"`
	jwt.RegisteredClaims
}

// UserID returns the user ID stored in the "sub" claim.
func (c Claims) UserID() (int64, error) {
	return strconv.ParseInt(c.Subject, 10, 64)
}

type Manager interface {
	Issue(userID int64, name, role string) (token string, expiresAt time.Time, err error)
	Parse(token string) (*Claims, error)
}

type manager struct {
	secret []byte
	ttl    time.Duration
	issuer string
}

// NewManager creates a token manager. issuer is written to and required in
// the "iss" claim, so tokens from another service with the same secret are
// rejected.
func NewManager(secret string, ttl time.Duration, issuer string) Manager {
	return &manager{secret: []byte(secret), ttl: ttl, issuer: issuer}
}

func (m *manager) Issue(userID int64, name, role string) (string, time.Time, error) {
	now := time.Now().UTC()
	expiresAt := now.Add(m.ttl)

	claims := Claims{
		Name: name,
		Role: role,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   strconv.FormatInt(userID, 10),
			Issuer:    m.issuer,
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(expiresAt),
		},
	}

	signed, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(m.secret)
	return signed, expiresAt.Truncate(time.Second), err
}

func (m *manager) Parse(tokenString string) (*Claims, error) {
	claims := &Claims{}
	_, err := jwt.ParseWithClaims(tokenString, claims,
		func(*jwt.Token) (any, error) { return m.secret, nil },
		jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}),
		jwt.WithIssuer(m.issuer),
		jwt.WithExpirationRequired(),
	)
	if err != nil {
		return nil, err
	}
	if id, err := claims.UserID(); err != nil || id <= 0 {
		return nil, errors.New("token: invalid subject")
	}

	return claims, nil
}

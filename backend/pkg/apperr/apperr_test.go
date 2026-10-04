package apperr_test

import (
	"fmt"
	"testing"

	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/apperr"

	"github.com/stretchr/testify/assert"
)

func TestErrorTranslation(t *testing.T) {
	assert.Equal(t, "Not found", apperr.ErrNotFound.Title("en"))
	assert.Equal(t, "Data tidak ditemukan", apperr.ErrNotFound.Title("id"))
	assert.Equal(t, "The data you are looking for does not exist.", apperr.ErrNotFound.Message(""))

	dup := apperr.ErrDuplicate.WithMessage("msg.duplicate_sku", map[string]any{"Sku": "PRD-1"})
	assert.Equal(t, "SKU PRD-1 is already used by another product.", dup.Message("en"))
	assert.Equal(t, "SKU PRD-1 sudah dipakai produk lain.", dup.Message("id"))
	assert.Equal(t, "Duplicate data", dup.Title("en"))
	// The declared variable is untouched.
	assert.Equal(t, "A record with the same unique value already exists.", apperr.ErrDuplicate.Message("en"))
}

func TestErrorIs(t *testing.T) {
	dup := apperr.ErrDuplicate.WithMessage("msg.duplicate_sku", nil)
	wrapped := fmt.Errorf("create product: %w", dup)

	assert.ErrorIs(t, wrapped, apperr.ErrDuplicate)
	assert.NotErrorIs(t, wrapped, apperr.ErrNotFound)

	got, ok := apperr.From(wrapped)
	assert.True(t, ok)
	assert.Equal(t, 409, got.Status)
}

func TestEveryCodeIsTranslated(t *testing.T) {
	for _, code := range apperr.Codes() {
		for _, lang := range []string{"en", "id"} {
			e := &apperr.Error{Code: code}
			assert.NotEqual(t, code+".title", e.Title(lang), "%s missing title in %s", code, lang)
			assert.NotEqual(t, code+".message", e.Message(lang), "%s missing message in %s", code, lang)
		}
	}
}

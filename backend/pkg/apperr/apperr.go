// Package apperr defines the error type returned by use cases and turned into
// the API error envelope by pkg/model/response.
//
// An *Error carries three things:
//   - Code: the stable, machine-readable error_code sent to clients,
//   - Status: the HTTP status used for the response,
//   - an optional message override (an i18n message ID plus template data).
//
// Titles and messages are never stored as text. They are looked up in
// /locales at response time, so the same error is rendered in whatever
// language the client asked for:
//
//	<code>.title    -> error.title
//	<code>.message  -> error.message (unless WithMessage set another ID)
package apperr

import (
	"errors"
	"net/http"
	"sort"
	"sync"

	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/i18n"
)

type Error struct {
	Code   string
	Status int

	messageID string
	data      map[string]any
}

var (
	registryMu sync.Mutex
	registry   = map[string]*Error{}
)

// New declares an error code. Declare codes once, as package-level variables.
func New(code string, status int) *Error {
	e := &Error{Code: code, Status: status}

	registryMu.Lock()
	registry[code] = e
	registryMu.Unlock()

	return e
}

// Error implements the error interface. It returns the code only: user-facing
// text depends on the request language and is produced by Title/Message.
func (e *Error) Error() string {
	if e.messageID != "" {
		return e.Code + ": " + e.messageID
	}

	return e.Code
}

// Is makes errors.Is match on the code, so a copy made by WithMessage still
// matches the declared variable: errors.Is(err, apperr.ErrDuplicate).
func (e *Error) Is(target error) bool {
	var t *Error
	if errors.As(target, &t) {
		return t.Code == e.Code
	}

	return false
}

// WithMessage returns a copy of e whose message is the i18n entry messageID,
// rendered with data. The receiver is not modified.
func (e *Error) WithMessage(messageID string, data map[string]any) *Error {
	clone := *e
	clone.messageID = messageID
	clone.data = data

	return &clone
}

// Title returns the translated title for the given Accept-Language value.
func (e *Error) Title(lang string) string {
	return i18n.T(lang, e.Code+".title", nil)
}

// Message returns the translated message for the given Accept-Language value.
func (e *Error) Message(lang string) string {
	if e.messageID != "" {
		return i18n.T(lang, e.messageID, e.data)
	}

	return i18n.T(lang, e.Code+".message", nil)
}

// From extracts an *Error from err (following wrapped errors).
func From(err error) (*Error, bool) {
	var e *Error
	if errors.As(err, &e) {
		return e, true
	}

	return nil, false
}

// Codes returns every declared error code, sorted. Used by tests to check that
// all codes are translated.
func Codes() []string {
	registryMu.Lock()
	defer registryMu.Unlock()

	codes := make([]string, 0, len(registry))
	for code := range registry {
		codes = append(codes, code)
	}
	sort.Strings(codes)

	return codes
}

// Error codes shared by the whole API (see docs/API.md).
var (
	ErrBadRequest         = New("bad_request", http.StatusBadRequest)
	ErrInvalidCredential  = New("err_invalid_credential", http.StatusUnauthorized)
	ErrUnauthorized       = New("err_unauthorized", http.StatusUnauthorized)
	ErrForbidden          = New("err_forbidden", http.StatusForbidden)
	ErrUserInactive       = New("err_user_inactive", http.StatusForbidden)
	ErrNotFound           = New("err_not_found", http.StatusNotFound)
	ErrDuplicate          = New("err_duplicate", http.StatusConflict)
	ErrInternal           = New("internal_server_error", http.StatusInternalServerError)
	ErrServiceUnavailable = New("err_service_unavailable", http.StatusServiceUnavailable)
)

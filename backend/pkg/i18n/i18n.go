// Package i18n translates user-facing messages (error titles, error messages
// and validation messages) using the YAML files embedded from /locales.
//
// The language is picked from the raw Accept-Language header value, e.g.
// "id", "en-US" or "id-ID,id;q=0.9,en;q=0.8". Anything unknown falls back to
// English (DEFAULT_LANGUAGE).
package i18n

import (
	"fmt"
	"io/fs"
	"sync"

	"github.com/raihanevanza/fullstack-boilerplate/backend/locales"

	goi18n "github.com/nicksnyder/go-i18n/v2/i18n"
	"golang.org/x/text/language"
	"gopkg.in/yaml.v3"
)

// DEFAULT_LANGUAGE is used when Accept-Language is missing or unsupported.
var DEFAULT_LANGUAGE = language.English

var (
	once      sync.Once
	bundle    *goi18n.Bundle
	bundleErr error
)

// Init loads the embedded locale files. It is safe to call more than once and
// is also called lazily by T, so tests do not need any setup.
func Init() error {
	once.Do(func() {
		bundle, bundleErr = load(locales.FS)
	})

	return bundleErr
}

func load(fsys fs.FS) (*goi18n.Bundle, error) {
	b := goi18n.NewBundle(DEFAULT_LANGUAGE)
	b.RegisterUnmarshalFunc("yaml", yaml.Unmarshal)

	files, err := fs.Glob(fsys, "*.yaml")
	if err != nil {
		return nil, err
	}
	if len(files) == 0 {
		return nil, fmt.Errorf("i18n: no locale files found")
	}

	for _, file := range files {
		if _, err := b.LoadMessageFileFS(fsys, file); err != nil {
			return nil, fmt.Errorf("i18n: load %s: %w", file, err)
		}
	}

	return b, nil
}

// T translates messageID into the language negotiated from acceptLanguage.
// Nested YAML keys are joined with a dot ("validation.required").
// When the message does not exist, messageID itself is returned so missing
// translations are easy to spot.
func T(acceptLanguage, messageID string, data map[string]any) string {
	if err := Init(); err != nil {
		return messageID
	}

	msg, err := goi18n.NewLocalizer(bundle, acceptLanguage).Localize(&goi18n.LocalizeConfig{
		MessageID:    messageID,
		TemplateData: data,
	})
	if err != nil || msg == "" {
		return messageID
	}

	return msg
}

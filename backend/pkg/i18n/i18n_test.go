package i18n

import (
	"io/fs"
	"sort"
	"strings"
	"testing"

	"github.com/raihanevanza/fullstack-boilerplate/backend/locales"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gopkg.in/yaml.v3"
)

func TestTranslate(t *testing.T) {
	tests := []struct {
		name string
		lang string
		want string
	}{
		{"no header falls back to English", "", "Not found"},
		{"English", "en", "Not found"},
		{"Indonesian", "id", "Data tidak ditemukan"},
		{"Indonesian with region and q-values", "id-ID,id;q=0.9,en;q=0.8", "Data tidak ditemukan"},
		{"unsupported language falls back to English", "fr-FR", "Not found"},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			assert.Equal(t, test.want, T(test.lang, "err_not_found.title", nil))
		})
	}

	assert.Equal(t, "sku is required.", T("en", "validation.required", map[string]any{"Field": "sku"}))
	assert.Equal(t, "missing.key", T("en", "missing.key", nil))
}

// Every locale file must define exactly the same keys.
func TestLocaleKeysMatch(t *testing.T) {
	files, err := fs.Glob(locales.FS, "*.yaml")
	require.NoError(t, err)
	require.GreaterOrEqual(t, len(files), 2)

	keysOf := func(file string) []string {
		raw, err := fs.ReadFile(locales.FS, file)
		require.NoError(t, err)

		var tree map[string]any
		require.NoError(t, yaml.Unmarshal(raw, &tree))

		var keys []string
		var walk func(prefix string, node map[string]any)
		walk = func(prefix string, node map[string]any) {
			for k, v := range node {
				if child, ok := v.(map[string]any); ok {
					walk(prefix+k+".", child)
					continue
				}
				keys = append(keys, prefix+k)
			}
		}
		walk("", tree)
		sort.Strings(keys)

		return keys
	}

	reference := keysOf(files[0])
	for _, file := range files[1:] {
		assert.Equal(t, reference, keysOf(file), "%s and %s have different keys", files[0], file)
	}

	for _, key := range reference {
		assert.NotEqual(t, key, T("en", key, map[string]any{"Field": "x", "Param": "1", "Sku": "X", "Method": "GET", "Path": "/"}),
			"key %s does not resolve", key)
		assert.False(t, strings.Contains(T("en", key, nil), "{{"), "key %s has a broken template", key)
	}
}

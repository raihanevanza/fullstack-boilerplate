// Package locales embeds the translation files so the binary does not depend
// on the working directory at runtime.
package locales

import "embed"

// FS contains every *.yaml file in this directory (one file per language).
//
//go:embed *.yaml
var FS embed.FS

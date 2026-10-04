// Package utils bootstraps process-wide state: configuration, logger and
// translations.
package utils

import (
	"errors"

	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/i18n"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/logger"
)

var globalConfig *Config

// Init loads the configuration, then initialises the logger and translations.
func Init() error {
	conf, err := LoadConfig("")
	if err != nil {
		return err
	}

	if err := logger.Init(logger.Config{ServiceName: conf.ServiceName, Stage: conf.STAGE}); err != nil {
		return err
	}

	if err := i18n.Init(); err != nil {
		return err
	}

	globalConfig = conf
	return nil
}

// GetConfig returns the configuration loaded by Init.
func GetConfig() *Config {
	if globalConfig == nil {
		panic(errors.New("utils.Init must be called before GetConfig"))
	}

	return globalConfig
}

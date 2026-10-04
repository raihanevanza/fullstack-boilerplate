package datasource

import (
	"log"
	"os"
	"time"

	"gorm.io/driver/sqlserver"
	"gorm.io/gorm"
	gormlogger "gorm.io/gorm/logger"
	"gorm.io/gorm/schema"
)

type Options struct {
	DSN string
	// Verbose logs every SQL statement (development). Otherwise only slow
	// queries and errors are logged.
	Verbose bool
}

// New opens a SQL Server connection pool through GORM.
func New(opts Options) (*Datasource, error) {
	level := gormlogger.Warn
	if opts.Verbose {
		level = gormlogger.Info
	}

	db, err := gorm.Open(sqlserver.Open(opts.DSN), &gorm.Config{
		// Use explicit transactions (WithTransaction) instead of one per write.
		SkipDefaultTransaction: true,
		Logger: gormlogger.New(log.New(os.Stdout, "", log.LstdFlags), gormlogger.Config{
			SlowThreshold:             500 * time.Millisecond,
			LogLevel:                  level,
			IgnoreRecordNotFoundError: true,
		}),
		// Tables and columns are PascalCase (dbo.Products.CreatedAt).
		NamingStrategy: schema.NamingStrategy{NoLowerCase: true},
		// Every timestamp is stored in UTC.
		NowFunc: func() time.Time { return time.Now().UTC() },
	})
	if err != nil {
		return nil, err
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, err
	}
	sqlDB.SetMaxOpenConns(25)
	sqlDB.SetMaxIdleConns(5)
	sqlDB.SetConnMaxLifetime(30 * time.Minute)

	return &Datasource{GormDB: db}, nil
}

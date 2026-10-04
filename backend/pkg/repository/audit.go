package repository

import (
	"context"
	"encoding/json"

	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/datasource"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/model/entity"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/model/request"
)

type AuditRepository interface {
	// Log inserts one dbo.AuditLogs row. oldValues/newValues are stored as
	// JSON (nil = NULL). Call it with the ctx of a transaction so the audit
	// row is committed or rolled back together with the change.
	Log(ctx context.Context, actor request.Actor, action, entityName string, entityID int64, oldValues, newValues any) error
}

type auditRepository struct {
	Datasource *datasource.Datasource
}

func NewAuditRepository(ds *datasource.Datasource) AuditRepository {
	return &auditRepository{Datasource: ds}
}

func (repo *auditRepository) Log(ctx context.Context, actor request.Actor, action, entityName string, entityID int64, oldValues, newValues any) error {
	row := entity.AuditLog{Action: action, EntityName: entityName, EntityID: &entityID}
	if actor.UserID > 0 {
		row.UserID = &actor.UserID
	}
	if actor.IP != "" {
		row.IpAddress = &actor.IP
	}

	var err error
	if row.OldValues, err = toJSON(oldValues); err != nil {
		return err
	}
	if row.NewValues, err = toJSON(newValues); err != nil {
		return err
	}

	return repo.Datasource.DB(ctx).Create(&row).Error
}

func toJSON(v any) (*string, error) {
	if v == nil {
		return nil, nil
	}

	b, err := json.Marshal(v)
	if err != nil {
		return nil, err
	}

	s := string(b)
	return &s, nil
}

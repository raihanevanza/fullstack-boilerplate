// Package constantvar holds application-wide constants: header and context
// keys, stages, roles, permissions and audit actions.
package constantvar

// HEADER
const (
	HEADER_AUTHORIZATION        = "Authorization"
	HEADER_ACCEPT_LANGUAGE      = "Accept-Language"
	HEADER_PLATFORM_TYPE        = "X-Platform"
	HEADER_PLATFORM_TYPE_MOBILE = "mobile"
	HEADER_PLATFORM_TYPE_WEB    = "web"
)

// CONTEXT (gin.Context keys)
const (
	CONTEXT_PLATFORM_TYPE = "PLATFORM_TYPE"
	CONTEXT_ACTOR         = "ACTOR"
)

// STAGE (the STAGE env var)
const (
	CONFIG_STAGE_DEV     = "DEVELOPMENT"
	CONFIG_STAGE_STAGING = "STAGING"
	CONFIG_STAGE_PROD    = "PRODUCTION"
)

// ROLE (dbo.Roles.Code)
const (
	ROLE_ADMIN = "ADMIN"
	ROLE_STAFF = "STAFF"
)

// PERMISSION. The role -> permission map below is the single source of truth.
// Clients receive the list through GET /api/auth/me and never hard-code roles.
const (
	PERM_PRODUCT_WRITE = "product.write" // create, update and delete products
)

var ROLE_PERMISSIONS = map[string][]string{
	ROLE_ADMIN: {PERM_PRODUCT_WRITE},
	ROLE_STAFF: {},
}

// HasPermission reports whether the given role grants the permission.
func HasPermission(role, permission string) bool {
	for _, p := range ROLE_PERMISSIONS[role] {
		if p == permission {
			return true
		}
	}

	return false
}

// Permissions returns a copy of the permissions granted to role (never nil).
func Permissions(role string) []string {
	return append([]string{}, ROLE_PERMISSIONS[role]...)
}

// AUDIT ACTION (dbo.AuditLogs.Action)
const (
	AUDIT_CREATE = "CREATE"
	AUDIT_UPDATE = "UPDATE"
	AUDIT_DELETE = "DELETE"
	AUDIT_LOGIN  = "LOGIN"
)

// AUDIT ENTITY (dbo.AuditLogs.EntityName)
const (
	ENTITY_USER    = "User"
	ENTITY_PRODUCT = "Product"
)

// BUSINESS RULES
const (
	// Active products with Stock <= LOW_STOCK_THRESHOLD count as low stock on the dashboard.
	LOW_STOCK_THRESHOLD = 10
	// Number of products returned in dashboard.recent_products.
	DASHBOARD_RECENT_PRODUCTS = 5
)

// PAGINATION
const (
	DEFAULT_PAGE  = 1
	DEFAULT_LIMIT = 20
	MAX_LIMIT     = 100
)

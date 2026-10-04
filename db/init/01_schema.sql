/* =====================================================================
   Fullstack boilerplate - schema
   Target : SQL Server 2019 / 2022
   Run    : sqlcmd ... -I -i 01_schema.sql   (-I = QUOTED_IDENTIFIER ON,
            required by the filtered unique indexes)
   Notes  : - Every timestamp is UTC (SYSUTCDATETIME)
            - Soft delete through the DeletedAt column
            - Money is DECIMAL(18,2), quantities are INT
            - Safe to run more than once: existing objects are skipped
   ===================================================================== */

IF DB_ID('AppDb') IS NULL
    CREATE DATABASE AppDb;
GO
USE AppDb;
GO

SET NOCOUNT ON;
GO

/* =====================================================================
   1. AUTH
   ===================================================================== */
IF OBJECT_ID('dbo.Roles', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Roles (
        Id    INT IDENTITY(1,1) CONSTRAINT PK_Roles PRIMARY KEY,
        Code  NVARCHAR(30)  NOT NULL CONSTRAINT UQ_Roles_Code UNIQUE, -- ADMIN, STAFF (see backend pkg/constantvar)
        Name  NVARCHAR(100) NOT NULL,
        CONSTRAINT CK_Roles_Code CHECK (Code = UPPER(Code) AND LEN(Code) > 0)
    );
END;
GO

IF OBJECT_ID('dbo.Users', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Users (
        Id           BIGINT IDENTITY(1,1) CONSTRAINT PK_Users PRIMARY KEY,
        RoleId       INT           NOT NULL CONSTRAINT FK_Users_Roles REFERENCES dbo.Roles(Id),
        FullName     NVARCHAR(150) NOT NULL,
        Email        NVARCHAR(150) NOT NULL,
        PasswordHash NVARCHAR(255) NOT NULL,                    -- bcrypt (backend: go run ./cmd/hashpassword)
        IsActive     BIT           NOT NULL CONSTRAINT DF_Users_IsActive DEFAULT 1,
        LastLoginAt  DATETIME2     NULL,
        CreatedAt    DATETIME2     NOT NULL CONSTRAINT DF_Users_CreatedAt DEFAULT SYSUTCDATETIME(),
        UpdatedAt    DATETIME2     NULL,
        DeletedAt    DATETIME2     NULL,
        CONSTRAINT CK_Users_Email CHECK (Email LIKE '%_@_%')
    );

    -- Email is unique among non-deleted users only
    CREATE UNIQUE INDEX UX_Users_Email ON dbo.Users(Email) WHERE DeletedAt IS NULL;
    CREATE INDEX IX_Users_RoleId ON dbo.Users(RoleId);
END;
GO

/* =====================================================================
   2. PRODUCTS (example module)
   ===================================================================== */
IF OBJECT_ID('dbo.Products', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Products (
        Id          BIGINT IDENTITY(1,1) CONSTRAINT PK_Products PRIMARY KEY,
        Sku         NVARCHAR(50)  NOT NULL,
        Name        NVARCHAR(200) NOT NULL,
        Description NVARCHAR(500) NULL,
        Price       DECIMAL(18,2) NOT NULL CONSTRAINT DF_Products_Price DEFAULT 0,
        Stock       INT           NOT NULL CONSTRAINT DF_Products_Stock DEFAULT 0,
        IsActive    BIT           NOT NULL CONSTRAINT DF_Products_IsActive DEFAULT 1,
        CreatedAt   DATETIME2     NOT NULL CONSTRAINT DF_Products_CreatedAt DEFAULT SYSUTCDATETIME(),
        UpdatedAt   DATETIME2     NULL,
        DeletedAt   DATETIME2     NULL,
        CONSTRAINT CK_Products_Sku   CHECK (LEN(Sku) > 0),
        CONSTRAINT CK_Products_Name  CHECK (LEN(Name) > 0),
        CONSTRAINT CK_Products_Price CHECK (Price >= 0),
        CONSTRAINT CK_Products_Stock CHECK (Stock >= 0)
    );

    -- SKU is unique among non-deleted products, so a deleted SKU can be reused.
    -- The backend maps a violation (error 2601) to HTTP 409 err_duplicate.
    CREATE UNIQUE INDEX UX_Products_Sku ON dbo.Products(Sku) WHERE DeletedAt IS NULL;
    CREATE INDEX IX_Products_Name ON dbo.Products(Name) WHERE DeletedAt IS NULL;
    -- Default list order (newest first)
    CREATE INDEX IX_Products_CreatedAt ON dbo.Products(CreatedAt DESC, Id DESC) WHERE DeletedAt IS NULL;
END;
GO

/* =====================================================================
   3. AUDIT LOG
   Written by the backend in the same transaction as the change it records.
   ===================================================================== */
IF OBJECT_ID('dbo.AuditLogs', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.AuditLogs (
        Id          BIGINT IDENTITY(1,1) CONSTRAINT PK_AuditLogs PRIMARY KEY,
        UserId      BIGINT         NULL CONSTRAINT FK_AuditLogs_Users REFERENCES dbo.Users(Id),
        Action      NVARCHAR(30)   NOT NULL,   -- CREATE, UPDATE, DELETE, LOGIN
        EntityName  NVARCHAR(100)  NOT NULL,   -- e.g. 'Product'
        EntityId    BIGINT         NULL,
        OldValues   NVARCHAR(MAX)  NULL,       -- JSON
        NewValues   NVARCHAR(MAX)  NULL,       -- JSON
        IpAddress   NVARCHAR(45)   NULL,
        CreatedAt   DATETIME2      NOT NULL CONSTRAINT DF_AuditLogs_CreatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT CK_AuditLogs_OldJson CHECK (OldValues IS NULL OR ISJSON(OldValues) = 1),
        CONSTRAINT CK_AuditLogs_NewJson CHECK (NewValues IS NULL OR ISJSON(NewValues) = 1)
    );

    CREATE INDEX IX_AuditLogs_Entity ON dbo.AuditLogs(EntityName, EntityId);
    CREATE INDEX IX_AuditLogs_CreatedAt ON dbo.AuditLogs(CreatedAt DESC);
END;
GO

/* =====================================================================
   4. REFERENCE DATA (all environments)
   ===================================================================== */
INSERT INTO dbo.Roles (Code, Name)
SELECT v.Code, v.Name
FROM (VALUES
    (N'ADMIN', N'Administrator'),
    (N'STAFF', N'Staff')
) AS v(Code, Name)
WHERE NOT EXISTS (SELECT 1 FROM dbo.Roles r WHERE r.Code = v.Code);
GO

/* =====================================================================
   DEVELOPMENT SEED DATA - never run this in production.
   Every user below has the password: Password123!
   (hash generated with: cd backend && go run ./cmd/hashpassword 'Password123!')
   Safe to run more than once: existing rows (by email / SKU) are skipped.
   ===================================================================== */
USE AppDb;
GO

SET NOCOUNT ON;

/* ---------- Users (one per role) ---------- */
DECLARE @hash NVARCHAR(255) = N'$2a$10$SMGmZFqI/gt4CiZIATtvEu1ZUFDS1pjs3tJt/hGAC3XvGEsayy2lu';

INSERT INTO dbo.Users (RoleId, FullName, Email, PasswordHash)
SELECT r.Id, v.FullName, v.Email, @hash
FROM (VALUES
    (N'ADMIN', N'Admin User', N'admin@example.com'),
    (N'STAFF', N'Staff User', N'staff@example.com')
) AS v(RoleCode, FullName, Email)
JOIN dbo.Roles r ON r.Code = v.RoleCode
WHERE NOT EXISTS (SELECT 1 FROM dbo.Users u WHERE u.Email = v.Email AND u.DeletedAt IS NULL);

/* ---------- Products ----------
   12 products: 10 active, 2 inactive, 3 active ones with stock <= 10
   (the dashboard's low-stock threshold). AgeMinutes spreads CreatedAt so
   "newest first" ordering is visible: PRD-0012 is the newest. */
INSERT INTO dbo.Products (Sku, Name, Description, Price, Stock, IsActive, CreatedAt)
SELECT v.Sku, v.Name, v.Description, v.Price, v.Stock, v.IsActive,
       DATEADD(MINUTE, -v.AgeMinutes, SYSUTCDATETIME())
FROM (VALUES
    (N'PRD-0001', N'Wireless Mouse',                N'2.4 GHz, silent click',               99000.00,  25, 1, 120),
    (N'PRD-0002', N'Mechanical Keyboard',           N'Hot-swappable switches, US layout',  450000.00,   8, 1, 110),
    (N'PRD-0003', N'USB-C Hub 7-in-1',              N'HDMI 4K, 3x USB-A, SD, 100 W PD',    275000.00,  30, 1, 100),
    (N'PRD-0004', N'27-inch Monitor',               N'QHD IPS, 75 Hz',                    2350000.00,   6, 1,  90),
    (N'PRD-0005', N'Laptop Stand',                  N'Aluminium, adjustable height',       185000.00,  40, 1,  80),
    (N'PRD-0006', N'HD Webcam 1080p',               NULL,                                  320000.00,  15, 1,  70),
    (N'PRD-0007', N'Noise-Cancelling Headset',      N'Bluetooth 5.3, 30 h battery',        650000.00,   4, 1,  60),
    (N'PRD-0008', N'A4 Copy Paper (500 sheets)',    N'80 gsm',                              55000.00, 120, 1,  50),
    (N'PRD-0009', N'Ballpoint Pens (box of 12)',    N'Black ink, 0.7 mm',                   36000.00,  80, 1,  40),
    (N'PRD-0010', N'Desk Organizer',                NULL,                                   75000.00,  22, 1,  30),
    (N'PRD-0011', N'Whiteboard Markers (set of 4)', N'Discontinued',                        42000.00,   0, 0,  20),
    (N'PRD-0012', N'LED Desk Lamp',                 N'Dimmable, USB powered',              210000.00,  12, 0,  10)
) AS v(Sku, Name, Description, Price, Stock, IsActive, AgeMinutes)
WHERE NOT EXISTS (SELECT 1 FROM dbo.Products p WHERE p.Sku = v.Sku AND p.DeletedAt IS NULL);
GO

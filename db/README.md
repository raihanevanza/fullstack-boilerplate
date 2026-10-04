# Database (SQL Server 2022)

Local SQL Server for development, plus the schema and seed scripts used by the backend.

| File                   | Contents                                                                                       |
| ---------------------- | ---------------------------------------------------------------------------------------------- |
| `docker-compose.yml`   | SQL Server 2022 Developer edition, container `boilerplate-mssql`, data in a named volume       |
| `init/01_schema.sql`   | Database `AppDb`: tables `Roles`, `Users`, `Products`, `AuditLogs`, indexes, roles ADMIN/STAFF |
| `init/02_seed_dev.sql` | **Development only**: 2 users and 12 sample products                                           |

Both scripts can be run more than once: existing tables and rows are skipped.

## Start SQL Server

```sh
cd db
cp example.env .env        # then set MSSQL_SA_PASSWORD
docker compose up -d
docker compose ps          # wait until the status is "healthy"
```

The password must meet the SQL Server policy: at least 8 characters, with upper case, lower case, digits and symbols. `MSSQL_PORT` (default `1433`) changes the port published on the host.

**Apple Silicon:** the image is published for `linux/amd64` only, and the compose file pins that platform. Turn on Rosetta emulation: in Docker Desktop, enable *Settings → General → Use Rosetta for x86_64/amd64 emulation*. With Colima, run `colima start --vm-type vz --vz-rosetta --cpu 2 --memory 4`.

## Load the schema and seed

The `init/` folder is mounted read-only at `/init` in the container, so the scripts can run with the `sqlcmd` that ships in the image:

```sh
cd db
set -a; . ./.env; set +a
SQLCMD="/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -C -I -b"

docker exec -e SQLCMDPASSWORD="$MSSQL_SA_PASSWORD" boilerplate-mssql $SQLCMD -i /init/01_schema.sql
docker exec -e SQLCMDPASSWORD="$MSSQL_SA_PASSWORD" boilerplate-mssql $SQLCMD -i /init/02_seed_dev.sql
```

- `-I` is **required**. It turns on `QUOTED_IDENTIFIER`, and without it the filtered unique indexes (`WHERE DeletedAt IS NULL`) cannot be created or written to.
- `-C` trusts the container's self-signed certificate. `-b` stops on the first error.
- With `sqlcmd` installed on the host, the same commands work with `-S localhost,1433 -i init/01_schema.sql`.

Dev accounts (password `Password123!`):

| Email               | Role  | Name       |
| ------------------- | ----- | ---------- |
| `admin@example.com` | ADMIN | Admin User |
| `staff@example.com` | STAFF | Staff User |

To create another password hash, run `cd backend && go run ./cmd/hashpassword 'NewPassword!'`.

### Reset

This deletes **all** data in `AppDb`:

```sh
docker exec -e SQLCMDPASSWORD="$MSSQL_SA_PASSWORD" boilerplate-mssql $SQLCMD -Q "DROP DATABASE IF EXISTS AppDb"
# then load the schema and seed again
```

## Connecting

| Field    | Value                                                      |
| -------- | ---------------------------------------------------------- |
| Host     | `localhost`                                                |
| Port     | `1433` (or `MSSQL_PORT`)                                   |
| Database | `AppDb`                                                    |
| User     | `sa`                                                       |
| Password | `MSSQL_SA_PASSWORD` from `db/.env`                         |
| TLS      | Trust the server certificate (it is self-signed)           |

Backend DSN (`backend/.env`). URL-encode special characters in the password, for example `#` → `%23` and `@` → `%40`:

```
SQL_SERVER_URI=sqlserver://sa:<url-encoded-password>@localhost:1433?database=AppDb&encrypt=disable
```

## Schema conventions

- Every timestamp is UTC (`DEFAULT SYSUTCDATETIME()`).
- Soft delete: rows get `DeletedAt` instead of being removed, and unique values use filtered indexes (`... WHERE DeletedAt IS NULL`) so a deleted value can be reused.
- CHECK constraints back up the API validation (`Price >= 0`, `Stock >= 0`, JSON-only audit columns).
- Money is `DECIMAL(18,2)` and quantities are `INT`.
- `AuditLogs` is written by the backend in the same transaction as the change it records.

## Other commands

```sh
docker compose logs -f mssql   # follow logs
docker compose down            # stop (data stays in the volume)
docker compose down -v         # stop and delete all data
```

# CoffeeRaffa Backend (Go)

Go port of the former Django/DRF backend. Same API, same sqlite database, same DRF token auth (existing Django users and pbkdf2_sha256 password hashes keep working).

## Run

```sh
go run .
```

Env vars:

| Var | Default | Meaning |
|-----|---------|---------|
| `PORT` | `8000` | Listen port |
| `DB_PATH` | `db.sqlite3` | SQLite database file |
| `MEDIA_ROOT` | `/var/www/images` | Upload dir, served at `/images/` |

## Seed coffee data

```sh
go run . import_coffee_data
```

## API

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/health_check/` | – |
| POST | `/api/login/` | – (`{"email","password"}` → `{"token"}`) |
| GET | `/api/coffee/` | – |
| GET | `/api/{id}/` | – |
| POST | `/api/coffee/create/` | `Authorization: Token <key>`, multipart |
| PUT/PATCH | `/api/{id}/update/` | `Authorization: Token <key>`, multipart |
| DELETE | `/api/{id}/delete/` | `Authorization: Token <key>` |
| GET | `/images/<file>` | – |

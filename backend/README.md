# CoffeeRaffa Backend (Go)

Go port of the former Django/DRF backend. Existing API routes, sqlite data, DRF tokens, and Django `pbkdf2_sha256` password hashes remain compatible. The catalog also supports dynamic categories and gram-based product prices.

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
| GET | `/api/categories/` | – |
| POST | `/api/categories/create/` | `Authorization: Token <key>`, JSON |
| PUT/PATCH | `/api/categories/{id}/update/` | `Authorization: Token <key>`, JSON |
| DELETE | `/api/categories/{id}/delete/` | `Authorization: Token <key>` |
| GET | `/images/<file>` | – |

Product create/update requests accept a `category_id` and a JSON `price_options` field:

```json
[
  { "grams": 250, "price": 14 },
  { "grams": 500, "price": 25 }
]
```

The legacy `prices` object remains in product responses. New clients should use the sorted `price_options` array.

package main

import (
	"database/sql"
	"fmt"

	_ "modernc.org/sqlite"
)

// Schema mirrors the Django migrations so an existing db.sqlite3 keeps working
// and a fresh one gets the same tables.
var schema = []string{
	`CREATE TABLE IF NOT EXISTS "auth_user" (
		"id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
		"password" varchar(128) NOT NULL,
		"last_login" datetime NULL,
		"is_superuser" bool NOT NULL,
		"username" varchar(150) NOT NULL UNIQUE,
		"last_name" varchar(150) NOT NULL,
		"email" varchar(254) NOT NULL,
		"is_staff" bool NOT NULL,
		"is_active" bool NOT NULL,
		"date_joined" datetime NOT NULL,
		"first_name" varchar(150) NOT NULL)`,
	`CREATE TABLE IF NOT EXISTS "authtoken_token" (
		"key" varchar(40) NOT NULL PRIMARY KEY,
		"created" datetime NOT NULL,
		"user_id" integer NOT NULL UNIQUE REFERENCES "auth_user" ("id") DEFERRABLE INITIALLY DEFERRED)`,
	`CREATE TABLE IF NOT EXISTS "api_category" (
		"id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
		"name" varchar(100) NOT NULL COLLATE NOCASE UNIQUE,
		"description" text NOT NULL DEFAULT '',
		"sort_order" integer NOT NULL DEFAULT 0,
		"is_active" bool NOT NULL DEFAULT 1)`,
	`CREATE TABLE IF NOT EXISTS "api_coffee" (
		"id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
		"name" varchar(100) NOT NULL,
		"description" text NOT NULL,
		"img" varchar(100) NULL,
		"prices" text NOT NULL CHECK ((JSON_VALID("prices") OR "prices" IS NULL)),
		"quality" text NOT NULL CHECK ((JSON_VALID("quality") OR "quality" IS NULL)),
		"star" integer NOT NULL,
		"category_id" integer NULL REFERENCES "api_category" ("id") DEFERRABLE INITIALLY DEFERRED)`,
	`CREATE TABLE IF NOT EXISTS "api_userprofile" (
		"id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
		"user_id" integer NOT NULL UNIQUE REFERENCES "auth_user" ("id") DEFERRABLE INITIALLY DEFERRED,
		"is_super_user" bool NOT NULL)`,
	`CREATE TABLE IF NOT EXISTS "api_order" (
		"id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
		"created_at" datetime NOT NULL,
		"status" varchar(20) NOT NULL,
		"payment_method" varchar(20) NOT NULL,
		"location" text NULL,
		"phone_number" varchar(20) NULL,
		"name" varchar(100) NULL)`,
	`CREATE TABLE IF NOT EXISTS "api_orderitem" (
		"id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
		"quantity" integer NOT NULL,
		"coffee_id" bigint NOT NULL REFERENCES "api_coffee" ("id") DEFERRABLE INITIALLY DEFERRED,
		"order_id" bigint NOT NULL REFERENCES "api_order" ("id") DEFERRABLE INITIALLY DEFERRED)`,
}

func hasColumn(db *sql.DB, table, column string) (bool, error) {
	rows, err := db.Query(fmt.Sprintf(`PRAGMA table_info(%q)`, table))
	if err != nil {
		return false, err
	}
	defer rows.Close()
	for rows.Next() {
		var cid, notNull, pk int
		var name, columnType string
		var defaultValue any
		if err := rows.Scan(&cid, &name, &columnType, &notNull, &defaultValue, &pk); err != nil {
			return false, err
		}
		if name == column {
			return true, nil
		}
	}
	return false, rows.Err()
}

func migrateCatalog(db *sql.DB) error {
	hasCategory, err := hasColumn(db, "api_coffee", "category_id")
	if err != nil {
		return err
	}
	if !hasCategory {
		if _, err := db.Exec(`ALTER TABLE api_coffee ADD COLUMN category_id integer NULL REFERENCES api_category(id)`); err != nil {
			return err
		}
	}
	_, err = db.Exec(`CREATE INDEX IF NOT EXISTS api_coffee_category_id_idx ON api_coffee(category_id)`)
	return err
}

func openDB(path string) (*sql.DB, error) {
	db, err := sql.Open("sqlite", path)
	if err != nil {
		return nil, err
	}
	for _, stmt := range schema {
		if _, err := db.Exec(stmt); err != nil {
			db.Close()
			return nil, err
		}
	}
	if err := migrateCatalog(db); err != nil {
		db.Close()
		return nil, err
	}
	return db, nil
}

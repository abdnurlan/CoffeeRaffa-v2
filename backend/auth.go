package main

import (
	"crypto/hmac"
	"crypto/pbkdf2"
	"crypto/rand"
	"crypto/sha256"
	"database/sql"
	"encoding/base64"
	"encoding/hex"
	"net/http"
	"strconv"
	"strings"
	"time"
)

// checkDjangoPassword verifies a Django pbkdf2_sha256$<iterations>$<salt>$<b64hash> hash.
func checkDjangoPassword(password, encoded string) bool {
	parts := strings.SplitN(encoded, "$", 4)
	if len(parts) != 4 || parts[0] != "pbkdf2_sha256" {
		return false
	}
	iterations, err := strconv.Atoi(parts[1])
	if err != nil {
		return false
	}
	expected, err := base64.StdEncoding.DecodeString(parts[3])
	if err != nil {
		return false
	}
	derived, err := pbkdf2.Key(sha256.New, password, []byte(parts[2]), iterations, len(expected))
	if err != nil {
		return false
	}
	return hmac.Equal(derived, expected)
}

// getOrCreateToken mirrors DRF's Token.objects.get_or_create: 40 hex chars.
func getOrCreateToken(db *sql.DB, userID int64) (string, error) {
	var key string
	err := db.QueryRow(`SELECT key FROM authtoken_token WHERE user_id = ?`, userID).Scan(&key)
	if err == nil {
		return key, nil
	}
	if err != sql.ErrNoRows {
		return "", err
	}
	raw := make([]byte, 20)
	if _, err := rand.Read(raw); err != nil {
		return "", err
	}
	key = hex.EncodeToString(raw)
	_, err = db.Exec(`INSERT INTO authtoken_token (key, created, user_id) VALUES (?, ?, ?)`,
		key, time.Now().UTC().Format("2006-01-02 15:04:05.000000"), userID)
	return key, err
}

// requireToken replicates DRF TokenAuthentication + IsAuthenticated.
func (a *App) requireToken(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		auth := r.Header.Get("Authorization")
		if !strings.HasPrefix(auth, "Token ") {
			writeJSON(w, http.StatusUnauthorized, map[string]string{"detail": "Authentication credentials were not provided."})
			return
		}
		key := strings.TrimSpace(strings.TrimPrefix(auth, "Token "))
		var userID int64
		err := a.DB.QueryRow(
			`SELECT u.id FROM authtoken_token t JOIN auth_user u ON u.id = t.user_id WHERE t.key = ? AND u.is_active = 1`,
			key).Scan(&userID)
		if err != nil {
			writeJSON(w, http.StatusUnauthorized, map[string]string{"detail": "Invalid token."})
			return
		}
		next(w, r)
	}
}

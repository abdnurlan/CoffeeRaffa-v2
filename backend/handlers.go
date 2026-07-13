package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

type App struct {
	DB        *sql.DB
	MediaRoot string
}

type Coffee struct {
	ID          int64           `json:"id"`
	Name        string          `json:"name"`
	Description string          `json:"description"`
	Quality     json.RawMessage `json:"quality"`
	Prices      json.RawMessage `json:"prices"`
	Star        int             `json:"star"`
	Img         *string         `json:"img"`
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func notFound(w http.ResponseWriter) {
	writeJSON(w, http.StatusNotFound, map[string]string{"detail": "Not found."})
}

// imgURL mirrors DRF ImageField serialization: absolute MEDIA_URL link or null.
func imgURL(r *http.Request, img sql.NullString) *string {
	if !img.Valid || img.String == "" {
		return nil
	}
	scheme := "http"
	if r.TLS != nil || r.Header.Get("X-Forwarded-Proto") == "https" {
		scheme = "https"
	}
	u := fmt.Sprintf("%s://%s/images/%s", scheme, r.Host, img.String)
	return &u
}

func scanCoffee(r *http.Request, row interface{ Scan(...any) error }) (Coffee, error) {
	var c Coffee
	var img sql.NullString
	var quality, prices string
	if err := row.Scan(&c.ID, &c.Name, &c.Description, &quality, &prices, &c.Star, &img); err != nil {
		return c, err
	}
	c.Quality = json.RawMessage(quality)
	c.Prices = json.RawMessage(prices)
	c.Img = imgURL(r, img)
	return c, nil
}

const coffeeCols = `id, name, description, quality, prices, star, img`

func (a *App) HealthCheck(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"message": "Server Running"})
}

// Login mirrors LoginView: lookup by email (404 if missing), check password,
// get_or_create token.
func (a *App) Login(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid request body"})
		return
	}
	var userID int64
	var hash string
	err := a.DB.QueryRow(`SELECT id, password FROM auth_user WHERE email = ?`, body.Email).Scan(&userID, &hash)
	if err != nil {
		notFound(w)
		return
	}
	if !checkDjangoPassword(body.Password, hash) {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid Credentials"})
		return
	}
	token, err := getOrCreateToken(a.DB, userID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"token": token})
}

func (a *App) CoffeeList(w http.ResponseWriter, r *http.Request) {
	rows, err := a.DB.Query(`SELECT ` + coffeeCols + ` FROM api_coffee`)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	defer rows.Close()
	coffees := []Coffee{}
	for rows.Next() {
		c, err := scanCoffee(r, rows)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
			return
		}
		coffees = append(coffees, c)
	}
	writeJSON(w, http.StatusOK, coffees)
}

func (a *App) CoffeeDetail(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		notFound(w)
		return
	}
	row := a.DB.QueryRow(`SELECT `+coffeeCols+` FROM api_coffee WHERE id = ?`, id)
	c, err := scanCoffee(r, row)
	if err != nil {
		notFound(w)
		return
	}
	writeJSON(w, http.StatusOK, c)
}

// saveUpload stores the file under MEDIA_ROOT using its original name
// (user_directory_path), deduplicating like Django's storage.
func (a *App) saveUpload(r *http.Request) (string, error) {
	file, header, err := r.FormFile("img")
	if err != nil {
		if err == http.ErrMissingFile {
			return "", nil
		}
		return "", err
	}
	defer file.Close()

	if err := os.MkdirAll(a.MediaRoot, 0o755); err != nil {
		return "", err
	}
	name := strings.ReplaceAll(filepath.Base(header.Filename), " ", "_")
	ext := filepath.Ext(name)
	base := strings.TrimSuffix(name, ext)
	for i := 1; ; i++ {
		if _, err := os.Stat(filepath.Join(a.MediaRoot, name)); os.IsNotExist(err) {
			break
		}
		name = fmt.Sprintf("%s_%d%s", base, i, ext)
	}
	dst, err := os.Create(filepath.Join(a.MediaRoot, name))
	if err != nil {
		return "", err
	}
	defer dst.Close()
	if _, err := io.Copy(dst, file); err != nil {
		return "", err
	}
	return name, nil
}

func (a *App) CoffeeCreate(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(32 << 20); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	errs := map[string][]string{}
	for _, f := range []string{"name", "description"} {
		if r.FormValue(f) == "" {
			errs[f] = []string{"This field is required."}
		}
	}
	if len(errs) > 0 {
		writeJSON(w, http.StatusBadRequest, errs)
		return
	}
	quality := jsonOrDefault(r.FormValue("quality"), "{}")
	prices := jsonOrDefault(r.FormValue("prices"), "{}")
	star, _ := strconv.Atoi(r.FormValue("star"))

	img, err := a.saveUpload(r)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"img": err.Error()})
		return
	}

	res, err := a.DB.Exec(
		`INSERT INTO api_coffee (name, description, quality, prices, star, img) VALUES (?, ?, ?, ?, ?, ?)`,
		r.FormValue("name"), r.FormValue("description"), quality, prices, star, img)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	id, _ := res.LastInsertId()
	row := a.DB.QueryRow(`SELECT `+coffeeCols+` FROM api_coffee WHERE id = ?`, id)
	c, _ := scanCoffee(r, row)
	writeJSON(w, http.StatusCreated, c)
}

// CoffeeUpdate handles PUT (full) and PATCH (partial) like UpdateAPIView.
func (a *App) CoffeeUpdate(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		notFound(w)
		return
	}
	var exists int64
	if err := a.DB.QueryRow(`SELECT id FROM api_coffee WHERE id = ?`, id).Scan(&exists); err != nil {
		notFound(w)
		return
	}
	if err := r.ParseMultipartForm(32 << 20); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	set := []string{}
	args := []any{}
	for _, f := range []string{"name", "description", "quality", "prices", "star"} {
		if _, ok := r.MultipartForm.Value[f]; !ok {
			if r.Method == http.MethodPut && (f == "name" || f == "description") {
				writeJSON(w, http.StatusBadRequest, map[string][]string{f: {"This field is required."}})
				return
			}
			continue
		}
		v := r.FormValue(f)
		switch f {
		case "star":
			n, _ := strconv.Atoi(v)
			set, args = append(set, "star = ?"), append(args, n)
		case "quality", "prices":
			set, args = append(set, f+" = ?"), append(args, jsonOrDefault(v, "{}"))
		default:
			set, args = append(set, f+" = ?"), append(args, v)
		}
	}
	img, err := a.saveUpload(r)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"img": err.Error()})
		return
	}
	if img != "" {
		set, args = append(set, "img = ?"), append(args, img)
	}
	if len(set) > 0 {
		args = append(args, id)
		if _, err := a.DB.Exec(`UPDATE api_coffee SET `+strings.Join(set, ", ")+` WHERE id = ?`, args...); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
			return
		}
	}
	row := a.DB.QueryRow(`SELECT `+coffeeCols+` FROM api_coffee WHERE id = ?`, id)
	c, _ := scanCoffee(r, row)
	writeJSON(w, http.StatusOK, c)
}

func (a *App) CoffeeDelete(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		notFound(w)
		return
	}
	res, err := a.DB.Exec(`DELETE FROM api_coffee WHERE id = ?`, id)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	if n, _ := res.RowsAffected(); n == 0 {
		notFound(w)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func jsonOrDefault(s, def string) string {
	if s == "" || !json.Valid([]byte(s)) {
		return def
	}
	return s
}

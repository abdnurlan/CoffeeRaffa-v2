package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"math"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
)

type App struct {
	DB        *sql.DB
	MediaRoot string
}

type Category struct {
	ID           int64  `json:"id"`
	Name         string `json:"name"`
	Description  string `json:"description"`
	SortOrder    int    `json:"sort_order"`
	IsActive     bool   `json:"is_active"`
	ProductCount int    `json:"product_count"`
}

type PriceOption struct {
	Grams int     `json:"grams"`
	Price float64 `json:"price"`
}

type Coffee struct {
	ID           int64           `json:"id"`
	Name         string          `json:"name"`
	Description  string          `json:"description"`
	Quality      json.RawMessage `json:"quality"`
	Prices       json.RawMessage `json:"prices"`
	Star         int             `json:"star"`
	Img          *string         `json:"img"`
	CategoryID   *int64          `json:"category_id"`
	Category     *Category       `json:"category"`
	PriceOptions []PriceOption   `json:"price_options"`
	ProductType  string          `json:"product_type"`
	UnitPrice    *float64        `json:"unit_price"`
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

func parseGrams(label string) (int, error) {
	value := strings.ToLower(strings.TrimSpace(label))
	value = strings.ReplaceAll(value, " ", "")
	multiplier := 1.0
	if strings.HasSuffix(value, "kg") {
		value = strings.TrimSuffix(value, "kg")
		multiplier = 1000
	} else {
		for _, suffix := range []string{"grams", "gram", "qram", "gr", "qr", "g"} {
			if strings.HasSuffix(value, suffix) {
				value = strings.TrimSuffix(value, suffix)
				break
			}
		}
	}
	n, err := strconv.ParseFloat(value, 64)
	if err != nil || n <= 0 {
		return 0, fmt.Errorf("invalid gram amount %q", label)
	}
	grams := int(n*multiplier + 0.5)
	if grams <= 0 {
		return 0, fmt.Errorf("invalid gram amount %q", label)
	}
	return grams, nil
}

func priceOptionsFromJSON(raw string) ([]PriceOption, error) {
	var list []PriceOption
	if err := json.Unmarshal([]byte(raw), &list); err == nil && list != nil {
		return normalizePriceList(list)
	}
	var legacy map[string]float64
	if err := json.Unmarshal([]byte(raw), &legacy); err != nil {
		return nil, err
	}
	for label, price := range legacy {
		grams, err := parseGrams(label)
		if err != nil {
			return nil, err
		}
		list = append(list, PriceOption{Grams: grams, Price: price})
	}
	return normalizePriceList(list)
}

func normalizePriceList(list []PriceOption) ([]PriceOption, error) {
	byGrams := make(map[int]float64, len(list))
	for _, option := range list {
		if option.Grams <= 0 {
			return nil, fmt.Errorf("grams must be greater than zero")
		}
		if option.Price < 0 {
			return nil, fmt.Errorf("price cannot be negative")
		}
		byGrams[option.Grams] = option.Price
	}
	normalized := make([]PriceOption, 0, len(byGrams))
	for grams, price := range byGrams {
		normalized = append(normalized, PriceOption{Grams: grams, Price: price})
	}
	sort.Slice(normalized, func(i, j int) bool { return normalized[i].Grams < normalized[j].Grams })
	return normalized, nil
}

func canonicalPrices(raw string) (string, []PriceOption, error) {
	options, err := priceOptionsFromJSON(raw)
	if err != nil {
		return "", nil, err
	}
	if len(options) == 0 {
		return "", nil, fmt.Errorf("at least one gram price is required")
	}
	prices := make(map[string]float64, len(options))
	for _, option := range options {
		prices[strconv.Itoa(option.Grams)] = option.Price
	}
	encoded, err := json.Marshal(prices)
	return string(encoded), options, err
}

func normalizeProductType(value string) (string, error) {
	value = strings.ToLower(strings.TrimSpace(value))
	if value == "" {
		return "coffee", nil
	}
	if value != "coffee" && value != "product" {
		return "", fmt.Errorf("product_type must be coffee or product")
	}
	return value, nil
}

func canonicalUnitPrice(raw string) (string, float64, error) {
	price, err := strconv.ParseFloat(strings.TrimSpace(raw), 64)
	if err != nil || math.IsNaN(price) || math.IsInf(price, 0) || price < 0 {
		return "", 0, fmt.Errorf("unit_price must be a valid non-negative price")
	}
	encoded, err := json.Marshal(map[string]float64{"unit": price})
	return string(encoded), price, err
}

func scanCoffee(r *http.Request, row interface{ Scan(...any) error }) (Coffee, error) {
	var c Coffee
	var img sql.NullString
	var categoryID sql.NullInt64
	var categoryName, categoryDescription sql.NullString
	var categorySortOrder sql.NullInt64
	var categoryActive sql.NullBool
	var unitPrice sql.NullFloat64
	var quality, prices string
	if err := row.Scan(
		&c.ID, &c.Name, &c.Description, &quality, &prices, &c.Star, &img,
		&categoryID, &categoryName, &categoryDescription, &categorySortOrder, &categoryActive,
		&c.ProductType, &unitPrice,
	); err != nil {
		return c, err
	}
	c.Quality = json.RawMessage(quality)
	c.Prices = json.RawMessage(prices)
	c.PriceOptions = []PriceOption{}
	if c.ProductType == "coffee" {
		options, _ := priceOptionsFromJSON(prices)
		c.PriceOptions = options
	}
	if unitPrice.Valid {
		price := unitPrice.Float64
		c.UnitPrice = &price
	}
	c.Img = imgURL(r, img)
	if categoryID.Valid {
		id := categoryID.Int64
		c.CategoryID = &id
		c.Category = &Category{
			ID: id, Name: categoryName.String, Description: categoryDescription.String,
			SortOrder: int(categorySortOrder.Int64), IsActive: categoryActive.Bool,
		}
	}
	return c, nil
}

const coffeeSelect = `SELECT
	c.id, c.name, c.description, c.quality, c.prices, c.star, c.img,
	c.category_id, category.name, category.description, category.sort_order, category.is_active,
	c.product_type, c.unit_price
	FROM api_coffee c
	LEFT JOIN api_category category ON category.id = c.category_id`

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
	rows, err := a.DB.Query(coffeeSelect + ` ORDER BY category.sort_order, category.name, c.name`)
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
	row := a.DB.QueryRow(coffeeSelect+` WHERE c.id = ?`, id)
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
	quality := jsonOrDefault(r.FormValue("quality"), `["Medium"]`)
	productType, err := normalizeProductType(r.FormValue("product_type"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string][]string{"product_type": {err.Error()}})
		return
	}
	var prices string
	var unitPrice any
	if productType == "coffee" {
		priceInput := r.FormValue("price_options")
		if priceInput == "" {
			priceInput = r.FormValue("prices")
		}
		prices, _, err = canonicalPrices(priceInput)
		if err != nil {
			writeJSON(w, http.StatusBadRequest, map[string][]string{"price_options": {err.Error()}})
			return
		}
	} else {
		var price float64
		prices, price, err = canonicalUnitPrice(r.FormValue("unit_price"))
		if err != nil {
			writeJSON(w, http.StatusBadRequest, map[string][]string{"unit_price": {err.Error()}})
			return
		}
		unitPrice = price
		quality = `[]`
	}
	categoryID, err := a.categoryIDFromForm(r.FormValue("category_id"), true)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string][]string{"category_id": {err.Error()}})
		return
	}
	star, _ := strconv.Atoi(r.FormValue("star"))
	if star < 1 || star > 5 {
		star = 5
	}

	img, err := a.saveUpload(r)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"img": err.Error()})
		return
	}

	res, err := a.DB.Exec(
		`INSERT INTO api_coffee (name, description, quality, prices, star, img, category_id, product_type, unit_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		r.FormValue("name"), r.FormValue("description"), quality, prices, star, img, categoryID, productType, unitPrice)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	id, _ := res.LastInsertId()
	row := a.DB.QueryRow(coffeeSelect+` WHERE c.id = ?`, id)
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
	var currentType string
	var currentUnitPrice sql.NullFloat64
	if err := a.DB.QueryRow(`SELECT product_type, unit_price FROM api_coffee WHERE id = ?`, id).Scan(&currentType, &currentUnitPrice); err != nil {
		notFound(w)
		return
	}
	if err := r.ParseMultipartForm(32 << 20); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	set := []string{}
	args := []any{}
	if r.Method == http.MethodPut {
		for _, field := range []string{"name", "description"} {
			if _, ok := r.MultipartForm.Value[field]; !ok {
				writeJSON(w, http.StatusBadRequest, map[string][]string{field: {"This field is required."}})
				return
			}
		}
	}

	targetType := currentType
	_, typeProvided := r.MultipartForm.Value["product_type"]
	if typeProvided {
		targetType, err = normalizeProductType(r.FormValue("product_type"))
		if err != nil {
			writeJSON(w, http.StatusBadRequest, map[string][]string{"product_type": {err.Error()}})
			return
		}
		set, args = append(set, "product_type = ?"), append(args, targetType)
	}

	if targetType == "product" {
		_, unitPriceProvided := r.MultipartForm.Value["unit_price"]
		if currentType != "product" && !unitPriceProvided {
			writeJSON(w, http.StatusBadRequest, map[string][]string{"unit_price": {"unit_price is required for a physical product"}})
			return
		}
		if unitPriceProvided {
			prices, price, err := canonicalUnitPrice(r.FormValue("unit_price"))
			if err != nil {
				writeJSON(w, http.StatusBadRequest, map[string][]string{"unit_price": {err.Error()}})
				return
			}
			set, args = append(set, "prices = ?", "unit_price = ?"), append(args, prices, price)
		}
		if currentType != "product" {
			set, args = append(set, "quality = ?"), append(args, `[]`)
		}
	} else {
		priceInput := ""
		_, priceOptionsProvided := r.MultipartForm.Value["price_options"]
		_, legacyPricesProvided := r.MultipartForm.Value["prices"]
		if priceOptionsProvided {
			priceInput = r.FormValue("price_options")
		} else if legacyPricesProvided {
			priceInput = r.FormValue("prices")
		}
		if currentType != "coffee" && priceInput == "" {
			writeJSON(w, http.StatusBadRequest, map[string][]string{"price_options": {"price_options is required for coffee"}})
			return
		}
		if priceInput != "" {
			prices, _, err := canonicalPrices(priceInput)
			if err != nil {
				writeJSON(w, http.StatusBadRequest, map[string][]string{"price_options": {err.Error()}})
				return
			}
			set, args = append(set, "prices = ?"), append(args, prices)
		}
		if currentType != "coffee" || currentUnitPrice.Valid {
			set = append(set, "unit_price = NULL")
		}
	}

	for _, f := range []string{"name", "description", "quality", "star", "category_id"} {
		if _, ok := r.MultipartForm.Value[f]; !ok {
			continue
		}
		v := r.FormValue(f)
		switch f {
		case "star":
			n, _ := strconv.Atoi(v)
			if n < 1 || n > 5 {
				writeJSON(w, http.StatusBadRequest, map[string][]string{"star": {"Must be between 1 and 5."}})
				return
			}
			set, args = append(set, "star = ?"), append(args, n)
		case "quality":
			if targetType == "coffee" {
				set, args = append(set, "quality = ?"), append(args, jsonOrDefault(v, `["Medium"]`))
			}
		case "category_id":
			categoryID, err := a.categoryIDFromForm(v, true)
			if err != nil {
				writeJSON(w, http.StatusBadRequest, map[string][]string{"category_id": {err.Error()}})
				return
			}
			set, args = append(set, "category_id = ?"), append(args, categoryID)
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
	row := a.DB.QueryRow(coffeeSelect+` WHERE c.id = ?`, id)
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

func contains(values []string, target string) bool {
	for _, value := range values {
		if value == target {
			return true
		}
	}
	return false
}

func (a *App) categoryIDFromForm(value string, required bool) (any, error) {
	value = strings.TrimSpace(value)
	if value == "" {
		if required {
			return nil, fmt.Errorf("This field is required.")
		}
		return nil, nil
	}
	id, err := strconv.ParseInt(value, 10, 64)
	if err != nil || id <= 0 {
		return nil, fmt.Errorf("Invalid category.")
	}
	var active bool
	if err := a.DB.QueryRow(`SELECT is_active FROM api_category WHERE id = ?`, id).Scan(&active); err != nil {
		return nil, fmt.Errorf("Category does not exist.")
	}
	if !active {
		return nil, fmt.Errorf("Category is inactive.")
	}
	return id, nil
}

func (a *App) CategoryList(w http.ResponseWriter, r *http.Request) {
	rows, err := a.DB.Query(`
		SELECT category.id, category.name, category.description, category.sort_order,
			category.is_active, COUNT(coffee.id)
		FROM api_category category
		LEFT JOIN api_coffee coffee ON coffee.category_id = category.id
		GROUP BY category.id
		ORDER BY category.sort_order, category.name`)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	defer rows.Close()
	categories := []Category{}
	for rows.Next() {
		var category Category
		if err := rows.Scan(
			&category.ID, &category.Name, &category.Description, &category.SortOrder,
			&category.IsActive, &category.ProductCount,
		); err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
			return
		}
		categories = append(categories, category)
	}
	writeJSON(w, http.StatusOK, categories)
}

type categoryInput struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	SortOrder   int    `json:"sort_order"`
	IsActive    *bool  `json:"is_active"`
}

func readCategoryInput(r *http.Request) (categoryInput, error) {
	var input categoryInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		return input, fmt.Errorf("Invalid request body.")
	}
	input.Name = strings.TrimSpace(input.Name)
	input.Description = strings.TrimSpace(input.Description)
	if input.Name == "" {
		return input, fmt.Errorf("Category name is required.")
	}
	return input, nil
}

func (a *App) CategoryCreate(w http.ResponseWriter, r *http.Request) {
	input, err := readCategoryInput(r)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	active := true
	if input.IsActive != nil {
		active = *input.IsActive
	}
	result, err := a.DB.Exec(
		`INSERT INTO api_category (name, description, sort_order, is_active) VALUES (?, ?, ?, ?)`,
		input.Name, input.Description, input.SortOrder, active,
	)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "A category with this name already exists."})
		return
	}
	id, _ := result.LastInsertId()
	writeJSON(w, http.StatusCreated, Category{
		ID: id, Name: input.Name, Description: input.Description,
		SortOrder: input.SortOrder, IsActive: active,
	})
}

func (a *App) CategoryUpdate(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		notFound(w)
		return
	}
	var current Category
	if err := a.DB.QueryRow(
		`SELECT id, name, description, sort_order, is_active FROM api_category WHERE id = ?`, id,
	).Scan(&current.ID, &current.Name, &current.Description, &current.SortOrder, &current.IsActive); err != nil {
		notFound(w)
		return
	}
	input, err := readCategoryInput(r)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	active := current.IsActive
	if input.IsActive != nil {
		active = *input.IsActive
	}
	if _, err := a.DB.Exec(
		`UPDATE api_category SET name = ?, description = ?, sort_order = ?, is_active = ? WHERE id = ?`,
		input.Name, input.Description, input.SortOrder, active, id,
	); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "A category with this name already exists."})
		return
	}
	writeJSON(w, http.StatusOK, Category{
		ID: id, Name: input.Name, Description: input.Description,
		SortOrder: input.SortOrder, IsActive: active,
	})
}

func (a *App) CategoryDelete(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		notFound(w)
		return
	}
	var productCount int
	if err := a.DB.QueryRow(`SELECT COUNT(*) FROM api_coffee WHERE category_id = ?`, id).Scan(&productCount); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	if productCount > 0 {
		writeJSON(w, http.StatusConflict, map[string]string{"error": "Move or delete this category's products first."})
		return
	}
	result, err := a.DB.Exec(`DELETE FROM api_category WHERE id = ?`, id)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	if affected, _ := result.RowsAffected(); affected == 0 {
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

package main

import (
	"bytes"
	"encoding/json"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strconv"
	"testing"
)

func testApp(t *testing.T) *App {
	t.Helper()
	db, err := openDB(filepath.Join(t.TempDir(), "catalog.sqlite3"))
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { db.Close() })
	return &App{DB: db, MediaRoot: t.TempDir()}
}

func TestPriceOptionsAcceptLegacyAndCanonicalFormats(t *testing.T) {
	legacy, err := priceOptionsFromJSON(`{"0.250kg":12,"500g":20,"1kg":35}`)
	if err != nil {
		t.Fatal(err)
	}
	if len(legacy) != 3 || legacy[0].Grams != 250 || legacy[2].Grams != 1000 {
		t.Fatalf("unexpected legacy normalization: %#v", legacy)
	}

	encoded, options, err := canonicalPrices(`[{"grams":500,"price":22},{"grams":125,"price":8}]`)
	if err != nil {
		t.Fatal(err)
	}
	if encoded != `{"125":8,"500":22}` || options[0].Grams != 125 {
		t.Fatalf("unexpected canonical prices: %s %#v", encoded, options)
	}
}

func TestCategoryAndProductCatalogFlow(t *testing.T) {
	app := testApp(t)

	categoryBody := bytes.NewBufferString(`{
		"name":"Moka Pot Coffee",
		"description":"Coffee selected for stovetop brewing",
		"sort_order":2,
		"is_active":true
	}`)
	categoryRequest := httptest.NewRequest(http.MethodPost, "/api/categories/create/", categoryBody)
	categoryRecorder := httptest.NewRecorder()
	app.CategoryCreate(categoryRecorder, categoryRequest)
	if categoryRecorder.Code != http.StatusCreated {
		t.Fatalf("create category: status=%d body=%s", categoryRecorder.Code, categoryRecorder.Body.String())
	}
	var category Category
	if err := json.Unmarshal(categoryRecorder.Body.Bytes(), &category); err != nil {
		t.Fatal(err)
	}

	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	fields := map[string]string{
		"name":          "Daily Moka",
		"description":   "Chocolate-forward medium roast",
		"category_id":   strconv.FormatInt(category.ID, 10),
		"quality":       `["Medium"]`,
		"star":          "5",
		"price_options": `[{"grams":250,"price":14},{"grams":500,"price":25}]`,
	}
	for key, value := range fields {
		if err := writer.WriteField(key, value); err != nil {
			t.Fatal(err)
		}
	}
	if err := writer.Close(); err != nil {
		t.Fatal(err)
	}
	productRequest := httptest.NewRequest(http.MethodPost, "/api/coffee/create/", &body)
	productRequest.Header.Set("Content-Type", writer.FormDataContentType())
	productRecorder := httptest.NewRecorder()
	app.CoffeeCreate(productRecorder, productRequest)
	if productRecorder.Code != http.StatusCreated {
		t.Fatalf("create product: status=%d body=%s", productRecorder.Code, productRecorder.Body.String())
	}

	listRequest := httptest.NewRequest(http.MethodGet, "https://api.example/api/coffee/", nil)
	listRecorder := httptest.NewRecorder()
	app.CoffeeList(listRecorder, listRequest)
	if listRecorder.Code != http.StatusOK {
		t.Fatalf("list products: status=%d body=%s", listRecorder.Code, listRecorder.Body.String())
	}
	var products []Coffee
	if err := json.Unmarshal(listRecorder.Body.Bytes(), &products); err != nil {
		t.Fatal(err)
	}
	if len(products) != 1 {
		t.Fatalf("expected one product, got %d", len(products))
	}
	product := products[0]
	if product.Category == nil || product.Category.ID != category.ID || product.Category.Name != "Moka Pot Coffee" {
		t.Fatalf("unexpected category: %#v", product.Category)
	}
	if len(product.PriceOptions) != 2 || product.PriceOptions[0].Grams != 250 || product.PriceOptions[1].Price != 25 {
		t.Fatalf("unexpected price options: %#v", product.PriceOptions)
	}
}

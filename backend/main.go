package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
)

func env(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func main() {
	dbPath := env("DB_PATH", "db.sqlite3")
	mediaRoot := env("MEDIA_ROOT", "/var/www/images")
	port := env("PORT", "8000")

	db, err := openDB(dbPath)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	if len(os.Args) > 1 && os.Args[1] == "import_coffee_data" {
		if err := importCoffeeData(db); err != nil {
			log.Fatal(err)
		}
		fmt.Println("Successfully imported coffee product data")
		return
	}

	app := &App{DB: db, MediaRoot: mediaRoot}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/health_check/{$}", app.HealthCheck)
	mux.HandleFunc("POST /api/login/{$}", app.Login)
	mux.HandleFunc("GET /api/coffee/{$}", app.CoffeeList)
	mux.HandleFunc("POST /api/coffee/create/{$}", app.requireToken(app.CoffeeCreate))
	mux.HandleFunc("GET /api/categories/{$}", app.CategoryList)
	mux.HandleFunc("POST /api/categories/create/{$}", app.requireToken(app.CategoryCreate))
	mux.HandleFunc("PATCH /api/categories/{id}/update/{$}", app.requireToken(app.CategoryUpdate))
	mux.HandleFunc("PUT /api/categories/{id}/update/{$}", app.requireToken(app.CategoryUpdate))
	mux.HandleFunc("DELETE /api/categories/{id}/delete/{$}", app.requireToken(app.CategoryDelete))
	mux.HandleFunc("GET /api/{id}/{$}", app.CoffeeDetail)
	mux.HandleFunc("PUT /api/{id}/update/{$}", app.requireToken(app.CoffeeUpdate))
	mux.HandleFunc("PATCH /api/{id}/update/{$}", app.requireToken(app.CoffeeUpdate))
	mux.HandleFunc("DELETE /api/{id}/delete/{$}", app.requireToken(app.CoffeeDelete))
	mux.Handle("GET /images/", http.StripPrefix("/images/", http.FileServer(http.Dir(mediaRoot))))

	log.Printf("Listening on :%s (db=%s media=%s)", port, dbPath, mediaRoot)
	log.Fatal(http.ListenAndServe(":"+port, cors(mux)))
}

// CORS_ALLOW_ALL_ORIGINS = True in Django settings
func cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}

package main

import (
	"database/sql"
	"encoding/json"
)

type seedCoffee struct {
	ID          int64
	Name        string
	Description string
	Quality     []string
	Prices      map[int]float64
	Star        int
	Img         string
}

// importCoffeeData is the port of the import_coffee_data management command.
func importCoffeeData(db *sql.DB) error {
	_, err := db.Exec(`
		INSERT INTO api_category (name, description, sort_order, is_active)
		VALUES (?, ?, 0, 1)
		ON CONFLICT(name) DO UPDATE SET is_active = 1`,
		"Coffee Beans", "Freshly roasted whole-bean and ground coffee")
	if err != nil {
		return err
	}
	var categoryID int64
	if err := db.QueryRow(`SELECT id FROM api_category WHERE name = ?`, "Coffee Beans").Scan(&categoryID); err != nil {
		return err
	}
	data := []seedCoffee{
		{1, "Brasil", "Braziliya mənşəli bu Arabica 100% qəhvəsi, orta qovurulmuşdur.",
			[]string{"Medium"}, map[int]float64{250: 12, 500: 20, 1000: 30}, 5, "product-1.png"},
		{2, "Guatemala", "Qvatemala mənşəli Arabica 100% qəhvəsi, orta qovurulmuş zəngin və balanslı dad təqdim edir.",
			[]string{"Medium"}, map[int]float64{250: 15, 500: 22, 1000: 42}, 5, "product-2.png"},
		{3, "Columbia(Supremo)", "Kolumbiya mənşəli bu Supremo qəhvəsi, yüksək keyfiyyəti və incə, zəngin dadı ilə tanınır.",
			[]string{"Medium"}, map[int]float64{250: 15, 500: 22, 1000: 42}, 5, "product-3.png"},
		{4, "Honduras", "Honduras mənşəli bu qəhvə, dadında meyvə və şokolad notları ilə məşhur olan yüksək keyfiyyətli bir seçkidir.",
			[]string{"Medium"}, map[int]float64{250: 14, 500: 21, 1000: 40}, 4, "product-1.png"},
		{5, "Keniya AA", "Keniya mənşəli bu AA qəhvəsi, yüksək keyfiyyəti və canlı turşuluğu ilə tanınan zəngin bir dad təcrübəsi təqdim edir.",
			[]string{"Medium"}, map[int]float64{250: 15, 500: 22, 1000: 42}, 5, "product-2.png"},
		{6, "Efiopiya(Sidamo)", "Efiopiyanın Sidamo bölgəsindən olan bu qəhvə, çiçək notları və incə meyvə dadları ilə fərqlənir.",
			[]string{"Medium"}, map[int]float64{250: 12, 500: 20, 1000: 35}, 5, "product-3.png"},
		{7, "Morning Blend", "Müxtəlif qəhvə dənələrindən ibarət bu blend, unikal və zəngin bir dad təcrübəsi təqdim edir.",
			[]string{"Medium"}, map[int]float64{250: 12, 500: 20, 1000: 30}, 5, "product-1.png"},
		{8, "Afternoon Blend", "Müxtəlif qəhvə dənələrindən ibarət bu blend, unikal və zəngin bir dad təcrübəsi təqdim edir.",
			[]string{"Medium"}, map[int]float64{250: 12, 500: 22, 1000: 36}, 5, "product-2.png"},
		{9, "Evening Blend", "Müxtəlif qəhvə dənələrindən ibarət bu blend, unikal və zəngin bir dad təcrübəsi təqdim edir.",
			[]string{"Medium"}, map[int]float64{125: 12, 500: 22, 1000: 36}, 5, "product-3.png"},
	}

	for _, c := range data {
		quality, err := json.Marshal(c.Quality)
		if err != nil {
			return err
		}
		prices, err := json.Marshal(c.Prices)
		if err != nil {
			return err
		}
		_, err = db.Exec(`
			INSERT INTO api_coffee (id, name, description, quality, prices, star, img, category_id)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?)
			ON CONFLICT(id) DO UPDATE SET
				name = excluded.name,
				description = excluded.description,
				quality = excluded.quality,
				prices = excluded.prices,
				star = excluded.star,
				img = excluded.img,
				category_id = excluded.category_id`,
			c.ID, c.Name, c.Description, string(quality), string(prices), c.Star, c.Img, categoryID)
		if err != nil {
			return err
		}
	}
	return nil
}

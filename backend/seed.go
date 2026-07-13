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
	Prices      map[string]float64
	Star        int
	Img         string
}

// importCoffeeData is the port of the import_coffee_data management command.
func importCoffeeData(db *sql.DB) error {
	data := []seedCoffee{
		{1, "Brasil", "Braziliya mənşəli bu Arabica 100% qəhvəsi, orta qovurulmuşdur.",
			[]string{"Medium"}, map[string]float64{"0.250kg": 12, "0.500kg": 20, "1kg": 30}, 5, "product-1.png"},
		{2, "Guatemala", "Qvatemala mənşəli Arabica 100% qəhvəsi, orta qovurulmuş zəngin və balanslı dad təqdim edir.",
			[]string{"Medium"}, map[string]float64{"0.250kg": 15, "0.500kg": 22, "1kg": 42}, 5, "product-2.png"},
		{3, "Columbia(Supremo)", "Kolumbiya mənşəli bu Supremo qəhvəsi, yüksək keyfiyyəti və incə, zəngin dadı ilə tanınır.",
			[]string{"Medium"}, map[string]float64{"0.250kg": 15, "0.500kg": 22, "1kg": 42}, 5, "product-3.png"},
		{4, "Honduras", "Honduras mənşəli bu qəhvə, dadında meyvə və şokolad notları ilə məşhur olan yüksək keyfiyyətli bir seçkidir.",
			[]string{"Medium"}, map[string]float64{"0.250kg": 14, "0.500kg": 21, "1kg": 40}, 4, "product-1.png"},
		{5, "Keniya AA", "Keniya mənşəli bu AA qəhvəsi, yüksək keyfiyyəti və canlı turşuluğu ilə tanınan zəngin bir dad təcrübəsi təqdim edir.",
			[]string{"Medium"}, map[string]float64{"0.250kg": 15, "0.500kg": 22, "1kg": 42}, 5, "product-2.png"},
		{6, "Efiopiya(Sidamo)", "Efiopiyanın Sidamo bölgəsindən olan bu qəhvə, çiçək notları və incə meyvə dadları ilə fərqlənir.",
			[]string{"Medium"}, map[string]float64{"0.250kg": 12, "0.500kg": 20, "1kg": 35}, 5, "product-3.png"},
		{7, "Morning Blend", "Müxtəlif qəhvə dənələrindən ibarət bu blend, unikal və zəngin bir dad təcrübəsi təqdim edir.",
			[]string{"Medium"}, map[string]float64{"0.250kg": 12, "0.500kg": 20, "1kg": 30}, 5, "product-1.png"},
		{8, "Afternoon Blend", "Müxtəlif qəhvə dənələrindən ibarət bu blend, unikal və zəngin bir dad təcrübəsi təqdim edir.",
			[]string{"Medium"}, map[string]float64{"0.250kg": 12, "0.500kg": 22, "1kg": 36}, 5, "product-2.png"},
		{9, "Evening Blend", "Müxtəlif qəhvə dənələrindən ibarət bu blend, unikal və zəngin bir dad təcrübəsi təqdim edir.",
			[]string{"Medium"}, map[string]float64{"0.125kg": 12, "0.500kg": 22, "1kg": 36}, 5, "product-3.png"},
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
			INSERT INTO api_coffee (id, name, description, quality, prices, star, img)
			VALUES (?, ?, ?, ?, ?, ?, ?)
			ON CONFLICT(id) DO UPDATE SET
				name = excluded.name,
				description = excluded.description,
				quality = excluded.quality,
				prices = excluded.prices,
				star = excluded.star,
				img = excluded.img`,
			c.ID, c.Name, c.Description, string(quality), string(prices), c.Star, c.Img)
		if err != nil {
			return err
		}
	}
	return nil
}

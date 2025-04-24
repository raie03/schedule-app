package db

import (
	"fmt"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// Connect establishes a connection to the database
func Connect() (*gorm.DB, error) {
	// dsn := fmt.Sprintf(
	// 	"host=%s user=%s password=%s dbname=%s port=%s sslmode=disable",
	// 	os.Getenv("DB_HOST"),
	// 	os.Getenv("DB_USER"),
	// 	os.Getenv("DB_PASSWORD"),
	// 	os.Getenv("DB_NAME"),
	// 	os.Getenv("DB_PORT"),
	// )
	dsn := fmt.Sprintf("host=%s port=%s user=%s dbname=%s password=%s sslmode=disable",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_PORT"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_NAME"),
		os.Getenv("DB_PASSWORD"),
	)
	// dsn := os.Getenv("DB_URL")

	// db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
	// 	PrepareStmt: false,
	// })
	//　prepared statement already exists (SQLSTATE 42P05)を解決した
	db, err := gorm.Open(postgres.New(postgres.Config{
		DSN:                  dsn,
		PreferSimpleProtocol: true,
	}), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	//マイグレーション
	// err = db.AutoMigrate(
	// 	&models.Event{},
	// 	&models.Date{},
	// 	&models.Performance{},
	// 	&models.Response{},
	// 	&models.ResponseAnswer{},
	// 	&models.UserPerformance{},
	// 	//&models.ConflictReport{},
	// )
	// if err != nil {
	// 	return nil, err
	// }

	return db, nil
}

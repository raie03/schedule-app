package main

import (
	"log"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/raie03/schedule-app/backend/internal/db"
	"github.com/raie03/schedule-app/backend/internal/handlers"
)

func main() {
	// .env ファイルのロード
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	// データベース接続
	database, err := db.Connect()
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// ルーターの設定
	router := gin.Default()

	// CORSの設定
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", os.Getenv("FRONTEND_URL")},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))
	// router.Use(cors.Default())
	router.Use(gin.Logger())

	// ハンドラーの初期化
	h := handlers.NewHandler(database)

	// ルートの設定
	api := router.Group("/api")
	{
		events := api.Group("/events")
		{
			events.POST("", h.CreateEvent)
			events.GET("/:id", h.GetEvent)
			events.POST("/:id/responses", h.AddResponse)
			events.GET("/:id/responses", h.GetResponses)
			events.GET("/:id/optimal-schedule", h.SuggestOptimalSchedule)
			events.GET("/:id/multi-optimal-schedule", h.SuggestOptimalMultiSessionSchedule)
		}
	}

	// サーバーの起動
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080" // デフォルトポート
	}
	log.Printf("Server running on port %s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

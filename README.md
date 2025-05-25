# 接案網站平台 (Freelance Platform)

一個基於 React + Go + PostgreSQL 的現代化接案平台，支援即時聊天、專案管理和安全支付功能。

## 🏗️ 技術架構

- **前端**: React 18 + TypeScript + Tailwind CSS
- **後端**: Go + Gin框架 + GORM
- **資料庫**: PostgreSQL 15
- **快取**: Redis 7
- **容器化**: Docker + Docker Compose
- **反向代理**: Nginx

## 📋 功能特色

- 👤 用戶註冊/登入系統
- 💼 專案發布與投標
- 💬 即時聊天系統
- 💰 安全支付整合
- 📊 數據統計面板
- 🔍 進階搜尋與篩選
- 📱 響應式設計

## 🚀 快速開始

### 前置需求

- Docker 20.10+
- Docker Compose 2.0+
- Git

### 一鍵啟動

```bash
# 克隆專案
git clone https://github.com/anderson155081/Freelance-Platform.git
cd freelance-platform

# 複製環境變數文件
cp .env.example .env

# 啟動開發環境（推薦）
docker-compose -f docker-compose.dev.yml up -d

# 或啟動生產環境
docker-compose up -d

# 查看服務狀態
docker-compose ps
```

### 服務端點

**開發環境：**
- **前端應用**: http://localhost:3000
- **API 服務**: http://localhost:8080
- **資料庫**: localhost:5432
- **Redis**: localhost:6379
- **Adminer (資料庫管理)**: http://localhost:8081
- **Redis Commander**: http://localhost:8082

**生產環境：**
- **應用入口**: http://localhost (Nginx)
- **管理面板**: http://localhost/admin

## 📁 專案結構

```
freelance-platform/
├── frontend/                 # React 前端
│   ├── src/
│   │   ├── components/       # 可重用組件
│   │   ├── pages/           # 頁面組件
│   │   ├── hooks/           # 自定義 Hooks
│   │   ├── services/        # API 服務
│   │   └── utils/           # 工具函數
│   ├── public/
│   └── package.json
├── backend/                  # Go 後端
│   ├── cmd/                 # 主程式入口
│   ├── internal/
│   │   ├── handlers/        # HTTP 處理器
│   │   ├── services/        # 業務邏輯
│   │   ├── models/          # 資料模型
│   │   ├── middleware/      # 中間件
│   │   └── database/        # 資料庫連接
│   ├── pkg/                 # 共用套件
│   ├── migrations/          # 資料庫遷移
│   └── go.mod
├── nginx/                   # Nginx 配置
├── scripts/                 # 部署腳本
├── docker-compose.yml       # 生產環境配置
├── docker-compose.dev.yml   # 開發環境配置
├── docker-compose.test.yml  # 測試環境配置
└── README.md
```

## 🔧 開發設置

### 環境變數設置

複製並編輯環境變數文件：

```bash
# 複製範例文件
cp .env.example .env

# 編輯設置
nano .env
```

主要配置項目：

```bash
# 資料庫配置
DB_HOST=localhost
DB_PORT=5432
DB_USER=freelance_user
DB_PASSWORD=your_secure_password
DB_NAME=freelance_platform

# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT 設置
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE_HOURS=24

# 應用配置
APP_ENV=development
API_PORT=8080
FRONTEND_URL=http://localhost:3000

# 第三方服務
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
CLOUDINARY_URL=cloudinary://...
```

### 開發模式

所有開發都在 Docker 容器內進行，無需本地安裝 Node.js 或 Go：

#### 啟動開發環境

```bash
# 啟動開發環境（支援熱重載）
docker-compose -f docker-compose.dev.yml up -d

# 查看即時日誌
docker-compose -f docker-compose.dev.yml logs -f
```

#### 在容器內執行指令

```bash
# 後端相關指令
docker-compose exec api go mod tidy
docker-compose exec api go test ./...

# 前端相關指令
docker-compose exec frontend npm install
docker-compose exec frontend npm test

# 進入容器進行開發
docker-compose exec api bash
docker-compose exec frontend bash
```

### 資料庫管理

```bash
# 執行遷移
docker-compose exec api go run cmd/migrate/main.go

# 重置資料庫
docker-compose exec api go run cmd/migrate/main.go -reset

# 種子資料
docker-compose exec api go run cmd/seed/main.go

# 連接資料庫
docker-compose exec db psql -U freelance_user -d freelance_platform
```

## 🔨 常用指令

### Docker 操作

```bash
# 重新建構所有服務
docker-compose build

# 重新啟動特定服務
docker-compose restart api

# 查看日誌
docker-compose logs -f api

# 進入容器
docker-compose exec api bash

# 清理未使用的映像
docker system prune -a
```

### 測試指令

```bash
### 測試指令

```bash
# 執行所有測試
docker-compose -f docker-compose.test.yml up --abort-on-container-exit

# 單獨測試後端
docker-compose exec api go test ./...

# 單獨測試前端
docker-compose exec frontend npm test

# 測試覆蓋率
docker-compose exec api go test -cover ./...
```
```

## 📊 API 文檔

### 認證端點

```
POST   /api/auth/register     # 用戶註冊
POST   /api/auth/login        # 用戶登入
POST   /api/auth/logout       # 用戶登出
GET    /api/auth/me           # 獲取當前用戶
```

### 專案管理

```
GET    /api/projects          # 獲取專案列表
POST   /api/projects          # 創建新專案
GET    /api/projects/:id      # 獲取專案詳情
PUT    /api/projects/:id      # 更新專案
DELETE /api/projects/:id      # 刪除專案
```

### 聊天系統

```
GET    /api/chats             # 獲取聊天室列表
POST   /api/chats             # 創建聊天室
WS     /ws/chat/:room_id      # WebSocket 連接
```

詳細 API 文檔請訪問: http://localhost:8080/swagger

## 🚀 部署指南

### 開發環境部署

```bash
# 使用開發配置（推薦用於開發）
docker-compose -f docker-compose.dev.yml up -d
```

### 生產環境部署

```bash
# 使用生產配置
docker-compose up -d

# 或使用部署腳本
./scripts/deploy.sh production
```

### AWS/GCP 部署

參考 `docs/deployment/` 目錄下的詳細部署指南。

## 🔐 安全考量

- JWT Token 認證
- CORS 配置
- Rate Limiting
- SQL Injection 防護
- XSS 防護
- HTTPS 強制使用

## 📈 性能優化

- Redis 快取策略
- 資料庫索引優化
- 圖片 CDN 加速
- Gzip 壓縮
- 連接池配置

## 🐛 常見問題

### 資料庫連接失敗

```bash
# 檢查資料庫狀態
docker-compose ps db

# 查看資料庫日誌
docker-compose logs db

# 重啟資料庫服務
docker-compose restart db
```

### 前端無法連接 API

1. 確認 API 服務正在運行
2. 檢查 CORS 配置
3. 驗證環境變數設置

### Redis 連接問題

```bash
# 測試 Redis 連接
docker-compose exec redis redis-cli ping
```

## 🤝 貢獻指南

1. Fork 此專案
2. 創建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交變更 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

### 代碼規範

- Go: 使用 `gofmt` 和 `golint`
- React: 使用 ESLint 和 Prettier
- 提交訊息遵循 [Conventional Commits](https://conventionalcommits.org/)

## 📝 授權條款

此專案使用 MIT 授權條款 - 詳見 [LICENSE](LICENSE) 文件

## 📞 聯絡資訊

- 專案維護者: Your Name
- Email: your.email@example.com
- 專案連結: https://github.com/your-username/freelance-platform

## 🙏 致謝

感謝所有貢獻者和開源社群的支持！

---

**開始建構你的接案平台吧！** 🚀
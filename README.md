# MVP Starter

一個最小可行的全端腳手架，目標提供：
- Web（Next.js）基本頁面 + 健康檢查
- API（OpenAPI）最小規格：/health、/auth/login
- DB Schema（SQL）與基礎安全策略示例
- 簡要文件（部署/架構）

注意：本文檔描述之目錄與檔案為「規劃結構」。請依 TODO 建立對應檔案後再執行快速啟動步驟。

## 目錄結構（規劃）
- api/
  - openapi.yaml：OpenAPI 3.0 規格（只含 /health 與 /auth/login）
- db/
  - database.sql：資料表與索引、RLS/政策示例
- web/
  - pages/：Next.js 頁面（含 /api/health）
  - components/Layout.tsx：最小佈局
- docs/
  - deployment.md：部署概要
  - architecture.md：架構概要
- .env.example：必要環境變數鍵名與註解

## 快速啟動（待上述檔案建立後）
1) 準備環境
- Node.js >= 18、pnpm 或 npm
- 可用的 PostgreSQL（本機或雲端）

2) 設定環境變數
- 複製 .env.example 為 .env，依註解填入實際值（請勿將真值提交版本庫）。

3) 建立資料庫結構
- 以具備足夠權限的帳號執行 db/database.sql：
  psql <connection> -f db/database.sql

4) 啟動前端（Next.js）
- 進入 web 目錄安裝與啟動：
  cd web
  pnpm i   # 或 npm i
  pnpm dev # 或 npm run dev
- 開啟 http://localhost:3000 檢視首頁；/api/health 應回傳狀態。

5) 檢視 API 規格
- 使用您慣用的 OpenAPI 檢視器開啟 api/openapi.yaml（如 Redoc/Swagger UI 工具）。

6) 健康檢查
- 瀏覽器或 curl 測試：
  curl -i http://localhost:3000/api/health

## 開發指引（極簡）
- 分支策略：main 為穩定分支，feature/* 進行開發後以 PR 合併。
- 程式風格：TypeScript 嚴格模式；API 與 DB 變更需同步更新 OpenAPI 與 SQL。
- 秘密管理：一律使用 .env（或 Secret Manager），避免提交真值到版本庫。

## 測試（建議）
- Web：針對 /api/health 與首頁 fetch 撰寫最小測試。
- API：以 OpenAPI 驗證工具檢查規格與回應型別一致性。

## 部署（概覽）
- 推薦：將 Web 與 API 部署至同一 Node 服務或支援 Edge Runtime 的平台；DB 使用受管 PostgreSQL。
- 需配置環境變數與資料庫連線；以 CI/CD 自動化部署與基本健康檢查。

## TODO
- 建立 api/openapi.yaml（/health、/auth/login 最小 MVP）。
- 建立 db/database.sql（1~2 張表 + 必要索引與 RLS/政策示例）。
- 建立 web/pages（含 /api/health 與首頁，首頁最小 fetch 健康檢查）。
- 建立 web/components/Layout.tsx（最小 header/children）。
- 建立 docs/deployment.md、docs/architecture.md（條列精簡）。
- 提供 .env.example（僅鍵名與註解，不含真值）。

## 授權
- 視專案需求選擇授權條款（MIT/Apache-2.0 等）。

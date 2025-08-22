# 系統架構與技術決策摘要

## 目標與範圍
- 提供最小可運作的使用者驗證與健康檢查能力。
- 明確技術決策，為後續擴充（授權、觀測、可用性）打底。

## 高階架構
- 用戶端（Web）：Next.js（pages 路由），以瀏覽器為主的互動界面。
- API 服務：Node.js（TypeScript），提供 REST 端點。
- 資料庫：PostgreSQL，保存使用者與認證所需資料。
- OpenAPI 規格：定義 /health 與 /auth/login 的合約以利一致性與測試。

## 核心流程
- 健康檢查：Client → GET /health → 200/OK（含基本服務狀態）。
- 登入：Client → POST /auth/login（email、password）→ 簽發存取憑證（JWT 或等價 Token）。
- 後續請求：於 Authorization: Bearer <token> 攜帶，MVP 僅演示登入成功與失敗處理。

## 技術選型與理由
- 語言/平台：TypeScript + Node.js 18+（成熟生態、型別安全、長期支援）。
- Web：Next.js（快速開發、SSR/SSG 能力，MVP 僅需基本頁面與健康檢查 fetch）。
- API：輕量 HTTP 框架（如 Express 或等價），便於中介層擴充（驗證、日誌、錯誤處理）。
- 規格：OpenAPI 3.0（單一來源的介面契約，驅動測試與文件）。
- 資料庫：PostgreSQL（ACID、索引豐富、易於橫向擴展讀取）。
- 遷移：以 SQL 為主（更可控的 schema 進化，容易審閱與回滾）。
- 驗證：JWT（短存活 access token；refresh token 後續擴充）。
- 雜湊：強雜湊演算法（如 Argon2/bcrypt），加鹽與參數化成本控制。

## 資料模型（MVP）
- users：id（PK）、email（唯一）、password_hash、is_active、created_at、updated_at、last_login_at。
- 索引：unique(email)，必要查詢欄位建立 B-Tree 索引。
- 權限（後續）：以角色/權限表擴充；MVP 僅限登入驗證。

## 安全性
- 全程 HTTPS；嚴格的 Transport Security 與現代 TLS 配置。
- CORS 僅允許受信來源與必要方法/標頭。
- 速率限制與暴力嘗試防護；登入失敗指數退避。
- 祕密金鑰以安全管道配置；不將敏感資訊寫入日誌。
- Token 設計：短存活、可撤銷（後續以黑名單或版本欄位策略）。

## 可觀測性與營運
- 結構化日誌（JSON），至少包含請求 ID、路由、狀態碼、延遲。
- 指標：QPS、P95/P99 延遲、5xx 比率、登入成功/失敗比。
- 追蹤（可選）：跨服務 trace ID；MVP 可先記錄請求 ID。
- 健康檢查：/health 做為 liveness；readiness 需外掛檢查 DB 連線與依賴狀態。

## 擴展性與效能
- API 無狀態，利於水平擴展；Session 僅由 Token 承載。
- 連線池管理與指數退避重試（僅冪等操作）。
- 針對查詢熱點建立索引；避免 N+1 查詢。

## 部署與環境
- 環境：dev / staging / prod，配置隔離與不同密鑰。
- 部署策略：滾動更新；健康檢查門檻達標再切流。
- 資料保護：自動備份、定期還原演練；版本化遷移與回滾流程。

## 失敗模式與復原
- 資料庫故障：快速失敗 + 重試策略；降級為只回應 /health。
- Token 洩漏：旋轉金鑰、撤銷可疑 Token、縮短有效期。
- 外部依賴延遲：設置超時、斷路器與回退邏輯。

## 測試策略
- 單元測試：密碼雜湊/驗證、JWT 簽發與驗證、輸入驗證。
- 整合測試：/health 與 /auth/login 成功/失敗路徑。
- 端對端（輕量）：瀏覽器自動化驗證登入流程與錯誤提示。

## 隱私與合規
- 最小化收集（僅 email 與雜湊後密碼）。
- 用戶資料請求與刪除機制（後續提供自助端點）。
- 日誌遮罩 PII；配置資料保留週期。

## 風險與緩解
- 密鑰管理不當 → 嚴格分權、輪換與稽核。
- 密碼攻擊 → 強化速率限制、WAF 規則、行為風控。
- 規格漂移 → 以 OpenAPI 做契約測試，CI 變更守門。

## TODO（近期）
- 補充登入錯誤碼與文件示例（含 401/429）。
- 設計 refresh token 與旋轉策略；增加登出（伺服器端撤銷）介面。
- 追加審計日誌（登入、密鑰操作、權限變更）。
- 加入運維指標告警（延遲、錯誤率、登入失敗）。
- 定義 readiness 健檢項（資料庫、依賴服務）。
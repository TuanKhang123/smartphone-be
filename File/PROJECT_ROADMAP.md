# Roadmap xây dựng SmartPhone Shop (FE trước, BE hỗ trợ)

> Thư mục này (`smartphone-be/File/`) chứa toàn bộ tài liệu dùng chung cho cả FE và BE — trước đây nằm ở `d:\SmartPhone\File\` (ngoài mọi git repo), đã được move vào đây để đi theo Git, không bị mất khi đổi máy. Xem thêm `SUMMARY.md` trong cùng thư mục này để nắm nhanh toàn bộ trạng thái dự án tính đến hiện tại.
>
> Đi kèm `LEARNING_COLLABORATION.md` (quy ước làm việc) và `learning_prompts_khang.md` (18 prompt học từng chủ đề). File này trả lời câu hỏi: **"bây giờ làm gì tiếp, theo thứ tự nào, học gì ở bước đó."**
>
> Cách dùng: đi theo milestone từ trên xuống. Mỗi milestone = 1 phần tính năng thật của dự án (tham chiếu mã trang `[P1-S-xx]`/`[P1-A-xx]` trong `UI_GENERATION_PROMPT.md` và collection trong `DATABASE_DESIGN.md`, cùng thư mục này) + chủ đề học tương ứng (tham chiếu Prompt `01`–`18` trong `learning_prompts_khang.md`). Đánh dấu `[x]` khi xong.

## Nguyên tắc xuyên suốt

- Scope Phase 1 của `DATABASE_DESIGN.md` / `UI_GENERATION_PROMPT.md` — **không** làm review, coupon, banner, thanh toán online, multi-warehouse (đó là Phase 2/3, để sau).
- FE: bạn tự code, AI hướng dẫn. BE: bạn hỏi nhiều hơn nhưng vẫn tự code trước, AI review/gợi ý (theo `LEARNING_COLLABORATION.md`).
- Mỗi milestone nên kết thúc bằng: chạy thử thật trên trình duyệt + trả lời câu hỏi kiểm tra của chủ đề học liên quan.
- Không nhảy cóc sang milestone sau nếu milestone hiện tại chưa chạy được — dự án này ưu tiên hiểu sâu hơn là làm nhanh.
- Với mỗi feature Frontend: build → xác định expected behavior → chọn test case quan trọng → viết test → verify → mới sang feature tiếp theo. Ưu tiên Vitest + React Testing Library cho component/integration; unit test cho hook/utility/business logic; Playwright E2E để sau cho critical flow.
- Test hành vi người dùng và các trạng thái/rủi ro thật sự có thể vỡ; không test chỉ để tăng coverage hoặc over-test UI tĩnh/trivial.

---

## Milestone 0 — Nền móng (đang làm)

- [x] `smartphone-fe`: Next.js (App Router) + TypeScript + Tailwind, npm, đã chạy `npm run dev` được

- [x] `smartphone-be`: khởi tạo Express + TypeScript + Mongoose + zod (giữ stack cũ vì `DATABASE_DESIGN.md` được thiết kế riêng cho MongoDB)

- [x] `smartphone-be` có route `GET /health` trả `{ ok: true }`, kết nối MongoDB local/Atlas thành công

- [x] 2 repo Git riêng, đã push lên GitHub (theo quyết định đã chốt)

**Học ở bước này:** không có prompt riêng — đây là lúc làm quen lại Express/TS nếu đã quên, không cần ép sâu.

---

## Milestone 1 — UI khung sườn, chưa có data thật (FE only, dùng mock)

Mục tiêu: dựng xong khung giao diện storefront, thấy được hình hài sản phẩm, chưa nối API.

- [x] `[P1-S-01]` Layout chung: Header + Footer + nút Zalo cố định

- [x] `[P1-S-02]` Trang chủ: Hero, Category grid, Featured products, Brand strip (dữ liệu tạm hardcode trong file `mock-data.ts`)

- [x] `[P1-S-03]` Trang danh sách sản phẩm: layout sidebar filter + grid, chưa cần filter chạy thật

- [x] `[P1-S-04]` Trang chi tiết sản phẩm: gallery + variant selector (state cục bộ, chưa gọi API)

- [x] Cài `shadcn/ui`, dựng lại các component cơ bản cần dùng (Button, Card, Badge, Input...)

**Học ở bước này:** làm quen App Router (`app/`, `layout.tsx`, nested routes), Tailwind, component composition cơ bản. Nếu thấy React fundamentals (re-render, props/state) đã mơ hồ, tranh thủ đọc qua **Prompt 01–03** (React Internals, Hooks, Performance) song song — chưa cần áp dụng tối ưu gì vội, chỉ cần hiểu để không viết sai ngay từ đầu.

---

## Milestone 2 — Backend: models + API đọc dữ liệu (BE, cần AI hỗ trợ nhiều)

Dựng đúng schema đã thiết kế sẵn trong `DATABASE_DESIGN.md` — không tự bịa field khác. Chi tiết field/quan hệ từng model đã phân tích xem ở `SUMMARY.md`.

Mongoose models (đủ field theo mục 4.1–4.8 của `DATABASE_DESIGN.md`, KHÔNG thêm `.index()` phụ lúc này — xem lý do ở mục ngay dưới):

- [x] `Category`<u> </u>— `src/models/Category.ts`

- [x] `Brand` — `src/models/Brand.ts`

- [x] `AttributeDefinition` — `src/models/AttributeDefinition.ts`

- [x] `Product` — `src/models/Product.ts` (bộ field MVP, có `specs` embedded)

- [x] `ProductVariant` — `src/models/ProductVariant.ts` (SKU, attributes, price, originalPrice, images)

- [x] `Inventory` — `src/models/Inventory.ts` (tồn kho theo từng variant)

- [x] Seed script: tạo dữ liệu mẫu cho category/brand/product/variant/inventory

- [ ] API đọc (chưa cần auth): `GET /categories`, `GET /brands`, `GET /products` (kèm filter category/brand/giá/attribute cơ bản), `GET /products/:slug`

- [ ] Trả response đúng status code (200, 404 khi không tìm thấy slug...)

- [ ] Quay lại thêm `.index()` cho các model (đã tạm bỏ lúc dựng schema) — phân tích dựa trên query thật trong route lúc này, không đoán trước như lúc thiết kế schema. Giữ nguyên `unique: true` trên `slug`/`name` (đây là ràng buộc dữ liệu, không phải index tối ưu, không bỏ).

**Học ở bước này:** **Prompt 06** (HTTP methods/status codes/CORS) — bắt buộc trước khi nối FE↔BE ở milestone sau, vì bạn sẽ đụng CORS ngay khi FE (port 3000) gọi BE (port khác).

---

## Milestone 3 — Nối FE với API thật (thay mock bằng data thật)

- [ ] Cài và setup **Vitest + React Testing Library** trong `smartphone-fe`; thêm test scripts. Chưa dùng Playwright ở milestone này.

- [ ] Tạo `smartphone-fe/lib/api-client.ts` — Axios instance chuẩn (baseURL, timeout)

- [ ] Cài `@tanstack/react-query`, setup `QueryClientProvider` ở root layout

- [ ] Trang chủ, listing, detail: thay `mock-data.ts` bằng `useQuery` gọi API thật

- [ ] Loading state (skeleton) + error state cho từng trang

- [ ] Test component/integration cho catalog UI: loading, error, empty, render data và filter behavior khi có. Chọn theo behavior/rủi ro, không chạy coverage cho đủ số.

**Học ở bước này:** **Prompt 08** (Axios setup chuẩn) → **Prompt 09** (React Query) → **Prompt 11** (Server state vs Client state, để hiểu vì sao dữ liệu sản phẩm nên nằm ở React Query chứ không phải Zustand/useState). Vitest + React Testing Library được học và dùng ngay trên các trạng thái data thật của milestone này.

---

## Milestone 4 — Authentication thật (JWT access + refresh token)

- [ ] BE: `POST /auth/register`, `POST /auth/login` — bcrypt hash, sign access token (sống ngắn) + refresh token (sống dài, lưu ở đâu cần quyết định: DB hay cookie httpOnly)

- [ ] BE: `POST /auth/refresh`, middleware `requireAuth`/`requireAdmin`

- [ ] FE: `[P1-S-08]` trang đăng nhập/đăng ký, gọi API thật (bỏ hẳn kiểu cũ dùng mock user)

- [ ] FE: Axios response interceptor — bắt lỗi 401 → gọi refresh → retry request gốc

- [ ] FE: Zustand session-store chỉ giữ thông tin user hiện tại (client state), token thật sự nằm ở đâu (cookie/memory) cần quyết định có chủ đích, không mặc định localStorage

- [ ] Test form validation, loading/submit state, login success và lỗi xác thực bằng component/integration test. Chưa cần E2E nếu các behavior này đã được cover tốt.

**Học ở bước này:** **Prompt 07** (JWT/access/refresh token/login flow) → **Prompt 08 phần interceptor 401-retry**. Đây là chủ đề bạn ghi "chưa làm thật" — milestone quan trọng nhất của nhóm ưu tiên 🔴.

---

## Milestone 5 — Giỏ hàng & Wishlist

- [ ] `[P1-S-05]` Trang giỏ hàng — guest dùng `sessionId`/localStorage, user đăng nhập đồng bộ với `carts` collection trên BE

- [ ] BE: API cart (`GET/POST/PATCH/DELETE /cart`) theo schema `carts` (embed items, snapshot giá/tên)

- [ ] Wishlist: API + trang `/tai-khoan` mục yêu thích (chỉ cho user đăng nhập)

- [ ] `useMutation` cho add/remove/update cart, cân nhắc optimistic update

- [ ] Test component/integration cho add, update quantity, remove item, empty cart và state thay đổi sau thao tác. Unit test hook/utility nếu business logic đã tách độc lập.

**Học ở bước này:** phần `useMutation` + optimistic update trong **Prompt 09**, và phần "state colocation" trong **Prompt 11** (cái gì để Zustand — vd giỏ hàng guest chưa đăng nhập — cái gì để React Query — vd giỏ hàng đã sync server).

---

## Milestone 6 — Checkout & Order

- [ ] BE: transaction tạo order (tạo `orders` + `order_items`, tăng `inventory.reserved`) đúng luồng ở mục 7 `DATABASE_DESIGN.md`

- [ ] `[P1-S-06]` Trang checkout (3 bước: giao hàng → thanh toán COD/chuyển khoản → xác nhận), hỗ trợ cả guest và user

- [ ] `[P1-S-07]` Trang xác nhận đơn hàng thành công

- [ ] `[P1-S-09]` Trang tài khoản → lịch sử đơn hàng, chi tiết đơn

- [ ] Chọn vài critical E2E flows đã ổn định để dùng Playwright, ví dụ guest checkout đến xác nhận đơn. Không dùng E2E thay cho toàn bộ component/integration tests.

**Học ở bước này:** đây là lúc quyết định rendering strategy cho từng trang mới thay vì mặc định CSR — **Prompt 10** (SSR/SSG/ISR/App Router). Câu hỏi cụ thể cần trả lời: trang xác nhận đơn hàng nên SSR hay CSR? Vì sao?

---

## Milestone 7 — Tìm kiếm

- [ ] `[P1-S-10]` Trang tìm kiếm, BE dùng MongoDB text index trên `products.name`/`tags`

- [ ] URL state cho query/filter (`?q=`, `?category=`, `?priceMin=`...) thay vì lưu trong React state

**Học ở bước này:** phần "URL State" trong **Prompt 11**, debounce input tìm kiếm (JS fundamentals — có thể quay lại **Prompt 05** nếu chưa rõ closure/debounce).

---

## Milestone 8 — Admin Panel

- [ ] `[P1-A-01]` Layout admin (sidebar + header), route `/admin/*` chặn bằng `requireAdmin`

- [ ] `[P1-A-02]` Dashboard: KPI cards + query trực tiếp (không cần collection riêng ở Phase 1)

- [ ] `[P1-A-03]`/`[P1-A-04]` CRUD sản phẩm (kèm tạo biến thể tự động từ tổ hợp attribute)

- [ ] `[P1-A-05]` Quản lý đơn hàng — đổi trạng thái, trigger cập nhật `inventory.quantity` khi `completed`

- [ ] `[P1-A-06]`/`[P1-A-07]`/`[P1-A-08]` CRUD danh mục / thương hiệu / thuộc tính

- [ ] `[P1-A-09]` Quản lý người dùng, `[P1-A-10]` Cài đặt hệ thống (map với collection `settings`)

**Học ở bước này:** **Prompt 12** (tự build shared component — table, form, modal dùng chung cho toàn bộ admin thay vì copy-paste mỗi trang). Nếu bảng dữ liệu lớn (danh sách sản phẩm/đơn hàng) bị lag khi gõ search/filter → quay lại **Prompt 03** (React Performance) áp dụng thật vào đây, không phải học chay nữa.

---

## Milestone 9 — Polish & Optimize (trước khi coi là "xong Phase 1")

- [ ] Xem lại rendering strategy từng trang đã hợp lý chưa (**Prompt 10**)

- [ ] Bundle analyzer, lazy load các phần nặng của admin (**Prompt 04**, **Prompt 14**)

- [ ] Rà lại cache layers đang dùng (React Query staleTime, HTTP cache headers) (**Prompt 13**)

- [ ] Lighthouse / Core Web Vitals cho storefront

---

## Sau Milestone 9 (không bắt buộc, làm khi có thời gian)

- Rà lại test suite: bổ sung test chỉ cho behavior mới hoặc rủi ro mới phát hiện; không chạy theo coverage number.
- CI cơ bản chạy lint/test hiện có khi push (**Prompt 17**).
- Đọc hiểu khái niệm Micro-frontend, WebSocket, Zustand vs Redux, GraphQL (**Prompt 15, 16, 11 phần so sánh, ...**) — chỉ cần hiểu để trả lời phỏng vấn, dự án nhỏ này không cần thật sự implement.

---

## Cách cập nhật file này

Mỗi khi hoàn thành 1 mục, tick `[x]`. Khi bắt đầu 1 milestone mới, nói với AI: *"mình bắt đầu milestone N"* — AI sẽ theo đúng quy trình ở `LEARNING_COLLABORATION.md` mục 5 (hướng dẫn trước, không code trước) cho từng việc trong milestone đó.
# Tóm tắt tình trạng dự án — SmartPhone Shop

> Đọc file này đầu tiên khi mở lại dự án ở máy khác hoặc phiên chat mới, để nắm nhanh "đang làm gì, tới đâu, quyết định gì rồi" mà không cần đọc lại toàn bộ lịch sử chat.

## 1. Cấu trúc thư mục hiện tại

```
d:\SmartPhone\
├── project\
│   ├── smartphone-fe\   (Next.js App Router + TS + Tailwind + shadcn/ui, npm)
│   └── smartphone-be\   (Express + TS + Mongoose + zod, npm)
│       └── File\        ← toàn bộ tài liệu dự án (mới move vào đây để theo Git)
│           ├── SUMMARY.md                  (file này)
│           ├── PROJECT_ROADMAP.md          (roadmap milestone chi tiết)
│           ├── LEARNING_COLLABORATION.md   (quy ước làm việc với AI)
│           ├── DATABASE_DESIGN.md          (thiết kế schema MongoDB gốc — nguồn sự thật cho mọi model)
│           ├── UI_GENERATION_PROMPT.md     (spec UI từng trang, mã [P1-S-xx]/[P1-A-xx])
│           ├── database-analysis-guide.md, guild_db_opus4.7.md (tài liệu phụ)
├── File\learning_prompts_khang.md   ⚠️ CHƯA PHẢI FILE THẬT — xem mục 6
```

`smartphone-fe` và `smartphone-be` là **2 repo Git riêng biệt** đã push lên GitHub (quyết định đã chốt: 2 repo tách bạch, không phải monorepo).

## 2. ⚠️ Việc cần làm NGAY — có thay đổi CHƯA commit

Kiểm tra gần nhất (`git status`):
- `smartphone-be`: **`File/` và `src/models/` đang untracked, chưa commit, chưa push.** Nếu đổi máy trước khi commit, toàn bộ file trong 2 thư mục này (bao gồm chính `SUMMARY.md` này) **sẽ không có ở máy mới**.
- `smartphone-fe`: sạch, mọi thứ đã commit.

**Việc cần làm trước khi rời máy này**:
```bash
cd d:\SmartPhone\project\smartphone-be
git add File/ src/models/
git status   # xác nhận không có node_modules/ hay .env lọt vào
git commit -m "feat: add Category/Brand models, move project docs into repo"
git push
```

## 3. Tiến độ theo Milestone (chi tiết đầy đủ ở `PROJECT_ROADMAP.md`)

- ✅ **Milestone 0** — Nền móng: FE + BE scaffold xong, `GET /health` chạy được, MongoDB local đang chạy, 2 repo đã push.
- ✅ **Milestone 1** — UI khung sườn FE (mock data): Layout chung (Header/Footer/Zalo button), Trang chủ, Listing, Detail — cả 4 trang đã dựng xong bằng mock data ở `lib/mock-data.ts`.
- 🔶 **Milestone 2** — Backend models + API đọc dữ liệu — **đang làm dở**:
  - Model đã xong: `Category`, `Brand`
  - Model đã phân tích domain xong (field/quan hệ) nhưng **chưa tạo file**: `AttributeDefinition`
  - Chưa bắt đầu: `Product`, `ProductVariant`, `Inventory`, seed script, route API đọc, xử lý CORS
- ⬜ Milestone 3 trở đi: chưa bắt đầu (Axios+React Query, JWT auth, cart/wishlist, checkout, search, admin, polish).

## 4. Quyết định kỹ thuật/quy ước đã chốt trong quá trình làm (không có ở đâu khác ngoài đây)

- **Package manager**: npm (không dùng pnpm/yarn) cho cả 2 project.
- **Route FE**: giữ nguyên **tiếng Việt** (`/san-pham`, `/san-pham/[slug]`...) — đã cân nhắc đổi sang tiếng Anh rồi **quyết định không đổi**, giữ nguyên như cũ.
- **MongoDB**: cài **local** trên máy (`mongodb://localhost:27017`), không dùng Atlas.
- **Index MongoDB**: các model hiện **cố ý bỏ trống `.index()` phụ** (compound index, index đơn ngoài field-level) — sẽ quay lại thêm khi viết route API thật, dựa trên query cụ thể lúc đó, không đoán trước lúc thiết kế schema. Riêng `unique: true` trên `slug`/`name` **vẫn giữ nguyên** vì đó là ràng buộc toàn vẹn dữ liệu, không phải tối ưu tốc độ.
- **Ảnh mock trong FE**: dùng `placehold.co`, phải thêm `unoptimized` vào mọi `<Image>` dùng ảnh này (placehold.co hay trả lỗi 400 khi Next.js image optimizer proxy qua).

## 5. Các hiểu biết/phân tích domain quan trọng đã thống nhất (để không phải giải thích lại)

- **`Category` và `Brand` KHÔNG liên kết trực tiếp với nhau** trong schema (không có `categoryId` trong Brand hay ngược lại) — chúng là 2 trục phân loại độc lập, chỉ gặp nhau gián tiếp qua `Product` (`Product.categoryId` + `Product.brandId`).
- **`Category` và `AttributeDefinition` LÀ quan hệ nhiều-nhiều thật sự**, hiện bằng mảng tham chiếu `Category.attributeIds: [ObjectId]` — theo đúng kỹ thuật NoSQL "nhúng mảng ID vào bên hay được query hơn", không cần bảng trung gian như SQL. Chiều ngược lại (tìm category nào dùng 1 attribute) vẫn query được (`Category.find({ attributeIds: X })`) nhưng không phải chiều tối ưu chính.
- **`Category.attributeIds`** là "danh sách thuộc tính CÓ THỂ CÓ" cho category đó — không bắt buộc mọi sản phẩm trong category phải dùng hết. `Product.specs` mới là danh sách thuộc tính THỰC SỰ được điền cho từng sản phẩm cụ thể (vd chỉ iPhone 16 có thuộc tính "nút camera", các điện thoại khác không cần có entry đó).
- **`AttributeDefinition.isVariantAttribute`**: `true` = thuộc tính tạo ra biến thể/SKU riêng (màu, RAM — dùng ở `ProductVariant`), `false` = chỉ là thông số hiển thị (pin, màn hình — dùng ở `Product.specs`).
- **Mọi model đều có `deletedAt` (soft delete)** — không hard-delete, tránh vỡ tham chiếu từ các collection khác.
- **`_id`/`id` tự động có sẵn** từ Mongoose, không cần khai báo tay trong interface/schema.

## 6. Việc còn thiếu, cần xử lý khi rảnh

- **`learning_prompts_khang.md`** được nhắc liên tục trong `PROJECT_ROADMAP.md`/`LEARNING_COLLABORATION.md` nhưng **thực ra chưa từng được lưu thành file thật** — nó chỉ tồn tại dưới dạng nội dung paste vào chat lúc đầu dự án (có lỗi encoding ở phần tiêu đề/emoji khi paste). Nếu cần dùng lại các Prompt 01–18 ở máy khác, cần yêu cầu tạo lại file này từ nội dung gốc.
- README của `smartphone-fe`/`smartphone-be` đã có, phản ánh đúng trạng thái tính đến Milestone 1 (FE) — cần cập nhật checklist trong README khi qua Milestone 2+.

## 7. Bước tiếp theo ngay khi quay lại

1. Commit + push theo mục 2.
2. Tạo `src/models/AttributeDefinition.ts` theo đúng phân tích ở mục 5 (nội dung field đã thống nhất, chỉ cần viết code theo pattern giống `Category.ts`/`Brand.ts`).
3. Tiếp tục model `Product` — model phức tạp nhất, nơi `categoryId`, `brandId` gặp nhau, và liên quan tới `specs`/`ProductVariant`.

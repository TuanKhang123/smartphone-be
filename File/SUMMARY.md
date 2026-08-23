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

`smartphone-be` hiện có thay đổi mới trong `File/` và `src/models/`, gồm các model và tài liệu cập nhật. Các file cần được kiểm tra, commit và push trước khi đổi máy.

```bash
cd d:\SmartPhone\project\smartphone-be
git add File/ src/models/
git status   # xác nhận không có node_modules/ hay .env lọt vào
git commit -m "feat: add product models and update project docs"
git push
```

Không commit `.env`, `node_modules` hoặc `dist`.

## 3. Tiến độ theo Milestone (chi tiết đầy đủ ở `PROJECT_ROADMAP.md`)

- ✅ **Milestone 0** — Nền móng: FE + BE scaffold xong, `GET /health` chạy được, MongoDB local đang chạy, 2 repo đã push.
- ✅ **Milestone 1** — UI khung sườn FE (mock data): Layout chung (Header/Footer/Zalo button), Trang chủ, Listing, Detail — cả 4 trang đã dựng xong bằng mock data ở `lib/mock-data.ts`.
- 🔶 **Milestone 2** — Backend models + API đọc dữ liệu — **đang làm dở**:
  - Model đã xong: `Category`, `Brand`, `AttributeDefinition`, `Product`, `ProductVariant`
  - `Product` dùng bộ field MVP và có `specs` embedded để lưu giá trị thuộc tính chung.
  - `ProductVariant` dùng `productId`, `sku`, `attributes`, `price`, cùng `originalPrice` và `images` theo lựa chọn hiện tại.
  - Chưa bắt đầu: `Inventory`, seed script, route API đọc, xử lý CORS
- ⬜ Milestone 3 trở đi: chưa bắt đầu (Axios+React Query, JWT auth, cart/wishlist, checkout, search, admin, polish)."} поправәажәк to=functions.Edit (commentary _Private 代json botonary { 

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

1. Chạy `npx tsc --noEmit` để kiểm tra TypeScript.
2. Commit + push các thay đổi Backend theo mục 2.
3. Đã tạo `src/models/Inventory.ts` — tồn kho theo từng `ProductVariant`.
4. Tạo seed data cho Category, Brand, AttributeDefinition, Product, ProductVariant và Inventory.
5. Tạo API đọc dữ liệu, sau đó phân tích index dựa trên query thật.

## 8. Context bàn giao cho AI khác

### Mục tiêu và cách học

Dự án SmartPhone Shop được dùng làm dự án thực tế để học Backend và Frontend. Frontend là trọng tâm học sâu; Backend chủ yếu phục vụ Frontend chạy được.

AI cần đóng vai coach, không build hộ mặc định:

- Phân tích nghiệp vụ trước khi phân tích schema.
- Giải thích vì sao cần entity, field và relationship.
- Đặt câu hỏi kiểm tra hiểu.
- Không tự ý edit hoặc rewrite code.
- Người dùng tự code, sau đó gửi lại để review.
- Chỉ viết code khi người dùng yêu cầu rõ.
- Khi review, chỉ ra lỗi và hướng sửa trước; không rewrite toàn bộ nếu chưa được yêu cầu.

### Stack

- Backend: Node.js, Express 5, TypeScript, Mongoose, MongoDB local, npm, Zod.
- Frontend: Next.js App Router, React, TypeScript, Tailwind, shadcn/ui, npm.
- Backend path: `d:\SmartPhone\project\smartphone-be`
- Frontend path: `d:\SmartPhone\project\smartphone-fe`
- MongoDB: `mongodb://localhost:27017/smartphone-be`

### Quy ước database

- MongoDB dùng ObjectId.
- Dùng `{ timestamps: true }` cho timestamps.
- Model quan trọng dùng soft delete với `deletedAt: null`.
- Chưa thêm `.index()` phụ lúc tạo model; chỉ phân tích index sau khi có API và query thật.
- Giữ `unique: true` trên `slug`/`name` khi đây là ràng buộc chống trùng dữ liệu.
- Không commit `.env`, `node_modules` hoặc `dist`.
- `Category` và `Brand` không liên kết trực tiếp; Product liên kết với cả hai.
- `Category` và `AttributeDefinition` là many-to-many qua `Category.attributeIds`.
- `AttributeDefinition` là định nghĩa thuộc tính.
- `Product.specs` lưu giá trị thông số chung của Product.
- `ProductVariant.attributes` lưu giá trị tạo ra SKU/variant.
- `Inventory` quản lý tồn kho theo ProductVariant.

### Các model đã hoàn thành

- `Category`: danh mục cha/con, có `attributeIds` tham chiếu `AttributeDefinition`.
- `Brand`: thương hiệu, không có `categoryId`.
- `AttributeDefinition`: định nghĩa thuộc tính với các field `name`, `slug`, `type`, `unit`, `isFilterable`, `isVariantAttribute`, `predefinedValues`, `sortOrder`, `status`, `createdAt`, `updatedAt`, `deletedAt`.
- `Product`: model MVP gồm `name`, `slug`, `categoryId`, `brandId`, `thumbnailImage`, `description`, `specs`, `status`, `createdAt`, `updatedAt`, `deletedAt`. Chưa thêm field mở rộng như tags, SEO, metadata, viewCount.
- `ProductVariant`: model MVP gồm `productId`, `sku`, `attributes`, `price`, `originalPrice`, `images`, `status`, `createdAt`, `updatedAt`, `deletedAt`. `quantity` không nằm trong Variant; sẽ nằm ở `Inventory`.
- `Inventory`: model MVP gồm `variantId`, `quantity`, `createdAt`, `updatedAt`. Mỗi Variant có một bản ghi Inventory trong Phase 1. `reserved` và `status` sẽ bổ sung khi làm Cart/Checkout/Order nếu flow thật cần.

### Quan hệ Product và ProductVariant đã chốt

```text
Product 1 ─── n ProductVariant
ProductVariant n ─── n AttributeDefinition về mặt nghiệp vụ,
                    lưu bằng attributes[] embedded trong Variant
ProductVariant 1 ─── 1 Inventory
```

Inventory hiện tại:

- `variantId`: tham chiếu tới ProductVariant, `unique: true` trong Phase 1 vì mỗi variant có một bản ghi tồn kho.
- `quantity`: số lượng thực tế trong kho, mặc định `0`, không cho số âm.
- `createdAt`, `updatedAt`: timestamps tự động.
- Chưa thêm `reserved`, `status`, `productId`, `warehouseId`, `lowStockThreshold` để tránh over-engineering MVP. `reserved`/`status` sẽ được xem xét lại khi làm Cart/Checkout/Order.

`Product.specs` và `ProductVariant.attributes` đều chứa `attributeId` tham chiếu `AttributeDefinition`, nhưng mục đích khác nhau:

- `Product.specs`: thông số chung của Product, ví dụ pin/camera/màn hình.
- `ProductVariant.attributes`: thuộc tính tạo phiên bản/SKU, ví dụ màu/dung lượng.
- `Inventory`: số lượng tồn của từng Variant, không đặt `quantity` trong ProductVariant.

`ProductVariant` giữ `sku`, `price`, `originalPrice` và `images` theo lựa chọn hiện tại. Chưa thêm `name`, `metadata` hoặc `sortOrder` để tránh over-engineering.

`type` của AttributeDefinition:

```ts
"select" | "multi_select" | "text" | "number" | "boolean"
```

- `select`: chọn một giá trị.
- `multi_select`: chọn nhiều giá trị.
- `text`: nhập chữ.
- `number`: nhập số.
- `boolean`: true/false.

Phân biệt:

```text
AttributeDefinition = định nghĩa thuộc tính
Product.specs = giá trị thông số chung của Product
ProductVariant.attributes = giá trị tạo ra SKU/variant
```

### Tiến độ hiện tại

```text
Milestone 0: done
Milestone 1: done
Category: done
Brand: done
AttributeDefinition: done
Product: done
ProductVariant: done
Inventory: done
Seed script: chưa bắt đầu
API đọc: chưa bắt đầu
CORS/API status code: chưa bắt đầu
Index theo query thật: chưa bắt đầu
Milestone 3 (Axios + React Query): chưa bắt đầu
```

### Cách phân tích các model tiếp theo

Với mỗi model, phân tích theo thứ tự:

1. Nghiệp vụ cần giải quyết.
2. Vì sao cần entity/collection riêng.
3. Quan hệ với collection khác.
4. Cách quyết định field.
5. Ý nghĩa từng field, dữ liệu mẫu, required/optional và default.
6. Field nào là core, field nào mở rộng hoặc có thể trì hoãn.
7. Khi nào embed, khi nào reference.
8. Kết thúc bằng câu hỏi kiểm tra.

`Product` và `ProductVariant` đã được phân tích và tạo file. Bước tiếp theo là **phân tích nghiệp vụ `Inventory` trước khi tạo file**.

Cần làm rõ:

- Vì sao tồn kho cần collection riêng.
- `variantId` liên kết với `ProductVariant` thế nào.
- Ý nghĩa `quantity`, `reserved`, `availableQty`.
- Vì sao không đặt `quantity` trong `ProductVariant`.
- Phạm vi MVP một kho và cách để không over-engineer multi-warehouse.
- Field nào thật sự cần cho Inventory bản đầu.

Sau khi người dùng hiểu và chốt field, mới tạo `src/models/Inventory.ts`.
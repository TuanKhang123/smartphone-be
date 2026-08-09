# DATABASE HOÀN CHỈNH — Website bán điện thoại & phụ kiện công nghệ
**MongoDB · Phase 1 · Có sẵn hướng mở rộng cho Phase 2/3**

---

## 0. ASSUMPTIONS (Giả định đang dùng)

**Business assumptions:**
- Cửa hàng gia đình, lưu lượng vừa phải (vài trăm — vài nghìn đơn / tháng).
- Phase 1 chỉ thanh toán **COD** (thanh toán khi nhận hàng).
- Phase 1 chỉ có 2 role: `admin`, `user`. Guest không cần đăng ký vẫn mua được.
- Khi có đơn mới → gửi **email** cho admin (rẻ + đáng tin) + log vào dashboard. Tích hợp Zalo OA về sau.
- Tồn kho quản lý ở mức **variant** (mỗi SKU có số lượng riêng).
- Một sản phẩm có thể có nhiều biến thể (color, storage, size, connection...).

**Technical assumptions:**
- MongoDB 6.x+, dùng `ObjectId` cho `_id`.
- Tất cả collection có `created_at`, `updated_at`. Soft delete dùng `deleted_at` (null = chưa xóa).
- Tiền tệ: lưu **VND nguyên** (số nguyên, không dấu phẩy thập phân). Ví dụ `25_990_000`.
- Ngày giờ: lưu `Date` (UTC), hiển thị tại frontend convert sang Asia/Ho_Chi_Minh.
- Slug: lowercase, dấu gạch ngang, không dấu tiếng Việt. Ví dụ `iphone-15-pro-max`.
- Index `unique` đi kèm `partialFilterExpression` `{ deleted_at: null }` để soft-deleted document không chiếm slot unique.

---

## 1. PHASE-BASED THINKING

**Phase 1 — phải có (bản này):**
roles enum, users, categories, brands, products, product_variants, carts, wishlists, orders, order_items, settings, counters.

**Phase 2 — sẽ thêm sau, không phá schema cũ:**
reviews, product_questions, coupons, banners, posts (blog), shipping_addresses, notifications, attribute_definitions (filter động).

**Phase 3 — sẽ thêm sau:**
payments, shipments, inventory_transactions, promotions/flash_sale, audit_logs, loyalty (user_points, point_transactions), daily_stats.

---

## 2. COLLECTION OVERVIEW

| # | Collection | Vai trò |
|---|---|---|
| 1 | `users` | Tài khoản user + admin |
| 2 | `categories` | Danh mục sản phẩm (đa cấp) |
| 3 | `brands` | Thương hiệu |
| 4 | `products` | Sản phẩm gốc (concept) |
| 5 | `product_variants` | Biến thể (SKU) — đơn vị bán/đếm tồn kho thực |
| 6 | `carts` | Giỏ hàng (user hoặc guest theo session) |
| 7 | `wishlists` | Danh sách yêu thích |
| 8 | `orders` | Đơn hàng |
| 9 | `order_items` | Dòng sản phẩm trong đơn |
| 10 | `settings` | Cấu hình runtime (zalo, email admin, fee mặc định) |
| 11 | `counters` | Bộ đếm sinh `order_code` tự tăng |

---

## 3. DETAILED SCHEMA

### 3.1. `users`

| Field | Type | Required | Default | Unique | Notes |
|---|---|---|---|---|---|
| `_id` | ObjectId | ✓ | auto | ✓ | |
| `email` | string | ✓ | — | ✓* | lowercase, trim, regex email |
| `password_hash` | string | ✓ | — | — | bcrypt/argon2 |
| `full_name` | string | ✓ | — | — | |
| `phone` | string | optional | null | — | E.164 hoặc `0xxxxxxxxx` |
| `role` | string enum | ✓ | `"user"` | — | `"user"` \| `"admin"` |
| `status` | string enum | ✓ | `"active"` | — | `"active"` \| `"inactive"` \| `"blocked"` |
| `avatar_url` | string | optional | null | — | Phase 2 |
| `last_login_at` | Date | optional | null | — | |
| `created_at` | Date | ✓ | now | — | |
| `updated_at` | Date | ✓ | now | — | |
| `deleted_at` | Date \| null | ✓ | null | — | soft delete |

\* unique chỉ áp dụng khi `deleted_at = null`.

**Indexes:**
- `{ email: 1 }` unique partial `{ deleted_at: null }`
- `{ phone: 1 }` partial `{ deleted_at: null, phone: { $type: "string" } }`
- `{ role: 1, status: 1 }`
- `{ created_at: -1 }`

**Sample:**
```json
{
  "_id": "ObjectId(...)",
  "email": "khang@example.com",
  "password_hash": "$2b$10$...",
  "full_name": "Nguyễn Khang",
  "phone": "0901234567",
  "role": "user",
  "status": "active",
  "last_login_at": "2026-04-30T08:00:00Z",
  "created_at": "2026-04-01T03:00:00Z",
  "updated_at": "2026-04-30T08:00:00Z",
  "deleted_at": null
}
```

---

### 3.2. `categories`

| Field | Type | Required | Default | Unique | Notes |
|---|---|---|---|---|---|
| `_id` | ObjectId | ✓ | auto | ✓ | |
| `name` | string | ✓ | — | — | "Điện thoại", "Tai nghe"... |
| `slug` | string | ✓ | — | ✓* | "dien-thoai" |
| `parent_id` | ObjectId \| null | ✓ | null | — | Cha (đa cấp) |
| `description` | string | optional | "" | — | |
| `image_url` | string | optional | null | — | |
| `icon` | string | optional | null | — | |
| `sort_order` | number | ✓ | 0 | — | |
| `status` | string enum | ✓ | `"active"` | — | `"active"` \| `"inactive"` |
| `created_at` | Date | ✓ | now | — | |
| `updated_at` | Date | ✓ | now | — | |
| `deleted_at` | Date \| null | ✓ | null | — | |

**Indexes:**
- `{ slug: 1 }` unique partial `{ deleted_at: null }`
- `{ parent_id: 1, sort_order: 1 }`
- `{ status: 1 }`

**Sample:**
```json
{
  "_id": "ObjectId('cat_phone')",
  "name": "Điện thoại",
  "slug": "dien-thoai",
  "parent_id": null,
  "description": "Smartphone chính hãng",
  "image_url": "https://cdn.../phone.png",
  "sort_order": 1,
  "status": "active",
  "created_at": "...",
  "updated_at": "...",
  "deleted_at": null
}
```

---

### 3.3. `brands`

| Field | Type | Required | Default | Unique | Notes |
|---|---|---|---|---|---|
| `_id` | ObjectId | ✓ | auto | ✓ | |
| `name` | string | ✓ | — | — | "Apple", "Samsung" |
| `slug` | string | ✓ | — | ✓* | |
| `logo_url` | string | optional | null | — | |
| `description` | string | optional | "" | — | |
| `sort_order` | number | ✓ | 0 | — | |
| `status` | string enum | ✓ | `"active"` | — | active/inactive |
| `created_at` | Date | ✓ | now | — | |
| `updated_at` | Date | ✓ | now | — | |
| `deleted_at` | Date \| null | ✓ | null | — | |

**Indexes:**
- `{ slug: 1 }` unique partial `{ deleted_at: null }`
- `{ status: 1 }`

---

### 3.4. `products` (sản phẩm gốc)

| Field | Type | Required | Default | Unique | Notes |
|---|---|---|---|---|---|
| `_id` | ObjectId | ✓ | auto | ✓ | |
| `name` | string | ✓ | — | — | "iPhone 15 Pro Max" |
| `slug` | string | ✓ | — | ✓* | |
| `short_description` | string | optional | "" | — | |
| `description` | string | optional | "" | — | mô tả dài (HTML/markdown) |
| `category_id` | ObjectId | ✓ | — | — | ref `categories._id` |
| `brand_id` | ObjectId | ✓ | — | — | ref `brands._id` |
| `thumbnail_url` | string | optional | null | — | ảnh đại diện |
| `images` | string[] | ✓ | [] | — | mảng URL |
| `base_price` | number | ✓ | 0 | — | giá hiển thị mặc định (VND nguyên) |
| `compare_at_price` | number \| null | optional | null | — | giá gạch ngang |
| `specs` | object[] | ✓ | [] | — | thông số (xem dưới) |
| `tags` | string[] | ✓ | [] | — | "5g","gaming","chong-nuoc" |
| `status` | string enum | ✓ | `"draft"` | — | draft/active/inactive/out_of_stock |
| `is_featured` | boolean | ✓ | false | — | hiển thị trang chủ |
| `total_stock` | number | ✓ | 0 | — | **cache** = sum stock_quantity các variant |
| `variant_count` | number | ✓ | 0 | — | cache số variant active |
| `view_count` | number | ✓ | 0 | — | đếm xem (Phase 2) |
| `sold_count` | number | ✓ | 0 | — | cache số đã bán |
| `created_at` | Date | ✓ | now | — | |
| `updated_at` | Date | ✓ | now | — | |
| `deleted_at` | Date \| null | ✓ | null | — | |

**`specs` item shape:**
```json
{ "group": "Màn hình", "key": "Kích thước", "value": "6.7 inch", "sort_order": 0 }
```

**Indexes:**
- `{ slug: 1 }` unique partial `{ deleted_at: null }`
- `{ name: "text", short_description: "text", tags: "text" }` (full-text search)
- `{ category_id: 1, status: 1, created_at: -1 }`
- `{ brand_id: 1, status: 1 }`
- `{ status: 1, is_featured: -1, created_at: -1 }`
- `{ base_price: 1 }`
- `{ tags: 1 }`

**Sample:**
```json
{
  "_id": "ObjectId('prd_iphone15pm')",
  "name": "iPhone 15 Pro Max",
  "slug": "iphone-15-pro-max",
  "short_description": "Khung Titan, chip A17 Pro, camera 48MP",
  "description": "<p>...</p>",
  "category_id": "ObjectId('cat_phone')",
  "brand_id": "ObjectId('brand_apple')",
  "thumbnail_url": "https://cdn.../iphone15pm/main.jpg",
  "images": [
    "https://cdn.../iphone15pm/1.jpg",
    "https://cdn.../iphone15pm/2.jpg"
  ],
  "base_price": 29990000,
  "compare_at_price": 34990000,
  "specs": [
    { "group": "Màn hình", "key": "Kích thước", "value": "6.7 inch", "sort_order": 0 },
    { "group": "Màn hình", "key": "Công nghệ", "value": "Super Retina XDR OLED", "sort_order": 1 },
    { "group": "Hiệu năng", "key": "Chip", "value": "Apple A17 Pro", "sort_order": 0 },
    { "group": "Camera", "key": "Camera chính", "value": "48MP + 12MP + 12MP", "sort_order": 0 }
  ],
  "tags": ["5g", "titan", "flagship"],
  "status": "active",
  "is_featured": true,
  "total_stock": 24,
  "variant_count": 6,
  "view_count": 1280,
  "sold_count": 47,
  "created_at": "...",
  "updated_at": "...",
  "deleted_at": null
}
```

---

### 3.5. `product_variants`

| Field | Type | Required | Default | Unique | Notes |
|---|---|---|---|---|---|
| `_id` | ObjectId | ✓ | auto | ✓ | |
| `product_id` | ObjectId | ✓ | — | — | ref `products._id` |
| `sku` | string | ✓ | — | ✓* | mã SKU duy nhất |
| `name` | string | ✓ | — | — | "iPhone 15 Pro Max 256GB Titan Đen" |
| `attributes` | object | ✓ | {} | — | **dynamic**: `{color, storage, size, connection, wattage, length...}` |
| `price` | number | ✓ | 0 | — | giá bán thực |
| `compare_at_price` | number \| null | optional | null | — | giá gạch ngang |
| `cost_price` | number \| null | optional | null | — | giá vốn (chỉ admin xem) |
| `stock_quantity` | number | ✓ | 0 | — | tồn kho |
| `low_stock_threshold` | number | ✓ | 5 | — | ngưỡng cảnh báo |
| `images` | string[] | ✓ | [] | — | ảnh riêng cho variant (vd theo màu) |
| `weight_grams` | number \| null | optional | null | — | cho tính phí ship Phase 3 |
| `barcode` | string \| null | optional | null | — | |
| `status` | string enum | ✓ | `"active"` | — | active/inactive |
| `created_at` | Date | ✓ | now | — | |
| `updated_at` | Date | ✓ | now | — | |
| `deleted_at` | Date \| null | ✓ | null | — | |

**Indexes:**
- `{ sku: 1 }` unique partial `{ deleted_at: null }`
- `{ product_id: 1, status: 1 }`
- `{ price: 1 }`
- `{ stock_quantity: 1 }`
- `{ status: 1, stock_quantity: 1 }` (cho query "sắp hết hàng")

**Stock status (tính ra, không lưu):**
- `out_of_stock` nếu `stock_quantity = 0`
- `low_stock` nếu `0 < stock_quantity ≤ low_stock_threshold`
- `in_stock` nếu lớn hơn

**Sample:**
```json
{
  "_id": "ObjectId('var_ip15pm_256_black')",
  "product_id": "ObjectId('prd_iphone15pm')",
  "sku": "IP15PM-256-TIB",
  "name": "iPhone 15 Pro Max 256GB Titan Đen",
  "attributes": {
    "color": "Titan Đen",
    "color_hex": "#3a3a3c",
    "storage": "256GB"
  },
  "price": 29990000,
  "compare_at_price": 34990000,
  "cost_price": 26500000,
  "stock_quantity": 4,
  "low_stock_threshold": 5,
  "images": [
    "https://cdn.../iphone15pm/black-1.jpg",
    "https://cdn.../iphone15pm/black-2.jpg"
  ],
  "weight_grams": 221,
  "barcode": null,
  "status": "active",
  "created_at": "...",
  "updated_at": "...",
  "deleted_at": null
}
```

**Ví dụ `attributes` cho các loại sản phẩm khác (cùng schema, key khác nhau):**
```json
// Tai nghe
"attributes": { "color": "Trắng", "version": "Pro 2", "connection": "Bluetooth 5.3" }

// Sạc / cáp
"attributes": { "port": "USB-C to Lightning", "wattage": "20W", "length": "1m" }

// Đồng hồ
"attributes": { "color": "Đen", "size": "45mm", "band": "Sport Loop", "connection": "GPS+Cellular" }

// Pin dự phòng
"attributes": { "capacity": "20000mAh", "color": "Đen", "ports": "USB-C + 2xUSB-A" }

// Ốp lưng
"attributes": { "color": "Trong suốt", "model": "iPhone 15 Pro Max", "material": "Silicone" }
```

---

### 3.6. `carts`

Embed `items[]` trong cart. Hỗ trợ cả user logged-in và guest.

| Field | Type | Required | Default | Unique | Notes |
|---|---|---|---|---|---|
| `_id` | ObjectId | ✓ | auto | ✓ | |
| `user_id` | ObjectId \| null | optional | null | — | ref `users._id` (logged-in) |
| `session_id` | string \| null | optional | null | — | UUID cookie cho guest |
| `items` | object[] | ✓ | [] | — | xem dưới |
| `subtotal` | number | ✓ | 0 | — | cache tổng cộng |
| `last_activity_at` | Date | ✓ | now | — | để cleanup cart cũ |
| `created_at` | Date | ✓ | now | — | |
| `updated_at` | Date | ✓ | now | — | |

**`items[]` shape:**
```json
{
  "variant_id": "ObjectId(...)",
  "product_id": "ObjectId(...)",
  "name_snapshot": "iPhone 15 Pro Max 256GB Titan Đen",
  "image_snapshot": "https://cdn.../black-1.jpg",
  "price_snapshot": 29990000,
  "quantity": 1,
  "added_at": "..."
}
```

**Indexes:**
- `{ user_id: 1 }` partial `{ user_id: { $exists: true, $ne: null } }`
- `{ session_id: 1 }` partial `{ session_id: { $exists: true, $ne: null } }`
- `{ last_activity_at: 1 }` (TTL cleanup option)

**Logic gộp cart:** khi guest đăng nhập → tìm cart của user_id, nếu có thì merge items từ cart session vào, xóa cart session.

---

### 3.7. `wishlists`

Mỗi document = 1 dòng yêu thích.

| Field | Type | Required | Default | Unique | Notes |
|---|---|---|---|---|---|
| `_id` | ObjectId | ✓ | auto | ✓ | |
| `user_id` | ObjectId | ✓ | — | — | |
| `product_id` | ObjectId | ✓ | — | — | |
| `variant_id` | ObjectId \| null | optional | null | — | nếu user yêu thích 1 biến thể cụ thể |
| `created_at` | Date | ✓ | now | — | |

**Indexes:**
- `{ user_id: 1, product_id: 1 }` **unique** (chống duplicate)
- `{ user_id: 1, created_at: -1 }`
- `{ product_id: 1 }` (đếm sản phẩm hot)

---

### 3.8. `orders`

Snapshot toàn bộ thông tin lúc đặt hàng. Hỗ trợ guest và logged-in.

| Field | Type | Required | Default | Unique | Notes |
|---|---|---|---|---|---|
| `_id` | ObjectId | ✓ | auto | ✓ | |
| `order_code` | string | ✓ | sinh tự động | ✓ | "ORD-2026-000123" (từ `counters`) |
| `user_id` | ObjectId \| null | optional | null | — | null = guest |
| `customer_contact` | object | ✓ | — | — | embed (xem dưới) |
| `shipping_address` | object | ✓ | — | — | embed (xem dưới) |
| `items_summary` | object[] | ✓ | [] | — | snapshot ngắn cho list view (tránh phải $lookup) |
| `subtotal` | number | ✓ | 0 | — | tổng tiền hàng |
| `shipping_fee` | number | ✓ | 0 | — | |
| `discount` | number | ✓ | 0 | — | chừa cho coupon Phase 2 |
| `discount_code` | string \| null | optional | null | — | chừa cho coupon Phase 2 |
| `total` | number | ✓ | 0 | — | = subtotal + shipping_fee - discount |
| `payment_method` | string enum | ✓ | `"cod"` | — | "cod" (P1); chừa "bank_transfer","momo","vnpay" P3 |
| `payment_status` | string enum | ✓ | `"unpaid"` | — | "unpaid" \| "paid" \| "refunded" |
| `status` | string enum | ✓ | `"pending"` | — | pending/confirmed/processing/completed/cancelled |
| `status_history` | object[] | ✓ | [] | — | log đổi trạng thái |
| `notes` | string | optional | "" | — | ghi chú khách |
| `admin_notes` | string | optional | "" | — | ghi chú nội bộ |
| `cancel_reason` | string \| null | optional | null | — | |
| `confirmed_at` | Date \| null | optional | null | — | |
| `completed_at` | Date \| null | optional | null | — | |
| `cancelled_at` | Date \| null | optional | null | — | |
| `created_at` | Date | ✓ | now | — | |
| `updated_at` | Date | ✓ | now | — | |

**`customer_contact` (embed):**
```json
{ "full_name": "Nguyễn Khang", "phone": "0901234567", "email": "khang@example.com" }
```

**`shipping_address` (embed):**
```json
{
  "address_line": "123 Nguyễn Trãi",
  "ward": "Phường 7",
  "district": "Quận 5",
  "province": "TP. Hồ Chí Minh",
  "country": "VN",
  "note": "Gọi trước 30 phút"
}
```

**`items_summary` (embed, cache để render list nhanh):**
```json
[
  { "name_snapshot": "iPhone 15 Pro Max 256GB Titan Đen", "quantity": 1, "image_snapshot": "..." }
]
```

**`status_history` (log):**
```json
[
  { "status": "pending", "at": "2026-04-30T03:00:00Z", "by": null, "note": "Khách đặt" },
  { "status": "confirmed", "at": "2026-04-30T03:15:00Z", "by": "ObjectId(admin_id)", "note": "Đã gọi xác nhận" }
]
```

**Indexes:**
- `{ order_code: 1 }` unique
- `{ user_id: 1, created_at: -1 }`
- `{ "customer_contact.phone": 1, created_at: -1 }` ← cho tra cứu guest
- `{ status: 1, created_at: -1 }`
- `{ created_at: -1 }`

**Sample:**
```json
{
  "_id": "ObjectId(...)",
  "order_code": "ORD-2026-000123",
  "user_id": null,
  "customer_contact": {
    "full_name": "Nguyễn Khang",
    "phone": "0901234567",
    "email": "khang@example.com"
  },
  "shipping_address": {
    "address_line": "123 Nguyễn Trãi",
    "ward": "Phường 7",
    "district": "Quận 5",
    "province": "TP. Hồ Chí Minh",
    "country": "VN",
    "note": "Gọi trước 30 phút"
  },
  "items_summary": [
    { "name_snapshot": "iPhone 15 Pro Max 256GB Titan Đen", "quantity": 1, "image_snapshot": "..." }
  ],
  "subtotal": 29990000,
  "shipping_fee": 30000,
  "discount": 0,
  "discount_code": null,
  "total": 30020000,
  "payment_method": "cod",
  "payment_status": "unpaid",
  "status": "pending",
  "status_history": [
    { "status": "pending", "at": "2026-04-30T03:00:00Z", "by": null, "note": "Khách đặt" }
  ],
  "notes": "Giao buổi sáng",
  "admin_notes": "",
  "cancel_reason": null,
  "confirmed_at": null,
  "completed_at": null,
  "cancelled_at": null,
  "created_at": "2026-04-30T03:00:00Z",
  "updated_at": "2026-04-30T03:00:00Z"
}
```

---

### 3.9. `order_items`

Mỗi document = 1 dòng sản phẩm trong đơn. Đầy đủ snapshot.

| Field | Type | Required | Default | Unique | Notes |
|---|---|---|---|---|---|
| `_id` | ObjectId | ✓ | auto | ✓ | |
| `order_id` | ObjectId | ✓ | — | — | |
| `order_code` | string | ✓ | — | — | denormalize cho query nhanh |
| `product_id` | ObjectId | ✓ | — | — | ref (sống độc lập, để analytics) |
| `variant_id` | ObjectId | ✓ | — | — | ref |
| `name_snapshot` | string | ✓ | — | — | tên variant lúc mua |
| `sku_snapshot` | string | ✓ | — | — | |
| `image_snapshot` | string \| null | optional | null | — | |
| `attributes_snapshot` | object | ✓ | {} | — | `{color, storage,...}` |
| `unit_price` | number | ✓ | 0 | — | giá 1 đơn vị tại lúc mua |
| `compare_at_price_snapshot` | number \| null | optional | null | — | |
| `quantity` | number | ✓ | 1 | — | |
| `line_total` | number | ✓ | 0 | — | = unit_price × quantity |
| `created_at` | Date | ✓ | now | — | |

**Indexes:**
- `{ order_id: 1 }`
- `{ variant_id: 1 }`
- `{ product_id: 1 }`
- `{ created_at: -1 }`

---

### 3.10. `settings`

Key-value, mỗi document = 1 cấu hình.

| Field | Type | Required | Default | Unique | Notes |
|---|---|---|---|---|---|
| `_id` | ObjectId | ✓ | auto | ✓ | |
| `key` | string | ✓ | — | ✓ | "admin_notification_email", "zalo_phone" |
| `value` | mixed | ✓ | — | — | có thể string/number/object |
| `description` | string | optional | "" | — | |
| `updated_at` | Date | ✓ | now | — | |

**Indexes:**
- `{ key: 1 }` unique

**Sample documents khuyến nghị tạo sẵn:**
```json
{ "key": "store_name", "value": "Shop Khang Phone & Tech" }
{ "key": "admin_notification_email", "value": "admin@khangphone.vn" }
{ "key": "zalo_phone", "value": "0901234567" }
{ "key": "zalo_oa_link", "value": "https://zalo.me/0901234567" }
{ "key": "default_shipping_fee", "value": 30000 }
{ "key": "free_shipping_threshold", "value": 5000000 }
{ "key": "currency", "value": "VND" }
{ "key": "order_code_prefix", "value": "ORD" }
{ "key": "low_stock_threshold_default", "value": 5 }
```

---

### 3.11. `counters` (sinh `order_code`)

Dùng atomic `findOneAndUpdate({$inc: {seq: 1}})` để có sequence không trùng.

| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | string | ✓ | "order_code_2026" (theo năm) |
| `seq` | number | ✓ | bắt đầu 0, tăng dần |

**Logic:** mỗi khi tạo order:
1. `findOneAndUpdate({_id: "order_code_2026"}, {$inc: {seq:1}}, {upsert:true, returnDocument:"after"})`
2. `order_code = "ORD-2026-" + seq.padStart(6, "0")` → `ORD-2026-000123`

---

## 4. QUAN HỆ DỮ LIỆU (RELATIONSHIPS)

```
brands (1) ────< products (N)
categories (1) ────< products (N)
products (1) ────< product_variants (N)

users (1) ────< orders (N)            [orders.user_id nullable cho guest]
orders (1) ────< order_items (N)
order_items (N) >──── product_variants (1)
order_items (N) >──── products (1)

users (1) ────< wishlists (N) >──── products (1)
users (1) ────< carts (1 active)     [hoặc carts theo session_id]
carts.items[] (embed) >──── product_variants (1)

orders.shipping_address     → embed
orders.customer_contact     → embed
orders.items_summary        → embed (cache nhanh)
products.images             → embed
products.specs              → embed
product_variants.attributes → embed (object động)
product_variants.images     → embed
```

**Tóm tắt rule embed/ref đã áp dụng:**

| Quan hệ | Cách | Lý do |
|---|---|---|
| product → brand | ref | Brand sống độc lập, đổi tên brand không phá history |
| product → category | ref | Category sống độc lập, đa cấp |
| product → variants | ref (collection riêng) | Variant có giá/tồn kho riêng, đông thay đổi |
| product.images | embed | Ít, đọc cùng product, không cần query riêng |
| product.specs | embed | Schema động, đọc cùng product |
| variant.attributes | embed (object) | Đặc tính của variant đó, schema động |
| cart.items | embed | Cart nhỏ, đọc/ghi cùng nhau |
| wishlist | collection riêng | Dễ insert/delete, count, không phình user document |
| order.shipping_address | embed | Đông lạnh snapshot |
| order.customer_contact | embed | Đông lạnh snapshot |
| order → order_items | ref (collection riêng) | Tốt cho analytics, $unwind ít |
| order_items snapshots | embed/inline trong order_item | Đông lạnh, không phụ thuộc product/variant đổi sau |

---

## 5. PRODUCT MODELING STRATEGY

**3 lớp dữ liệu cho 1 sản phẩm:**

1. **`products`** — concept gốc: tên chung, mô tả, brand, category, ảnh chung, specs kỹ thuật.
2. **`product_variants`** — đơn vị bán/đếm/định giá: SKU, attributes động, giá, tồn kho.
3. **`product_variants.attributes`** — object linh hoạt cho mọi loại sản phẩm.

**Vì sao mô hình này phù hợp:**
- Phù hợp đặc điểm phone/accessory: nhiều biến thể (color, storage, size...).
- Mỗi loại sản phẩm có thuộc tính khác nhau → `attributes` object động đáp ứng được.
- Không phải sửa schema khi thêm loại sản phẩm mới (vd Phase 2 bán camera, drone).
- `specs` (mảng key-value động) phục vụ trang chi tiết sản phẩm; `attributes` (object) phục vụ chọn biến thể.
- **Phân biệt quan trọng:**
  - `specs` = thông số kỹ thuật chung của *concept* (chip A17 Pro — không đổi giữa các variant).
  - `attributes` = đặc điểm phân biệt *variant* (256GB vs 512GB — đổi giữa các variant).

---

## 6. ORDER FLOW DATA MODEL

### Logged-in checkout
```
1. User vào /cart → query carts where user_id = X → render
2. Bấm checkout → form điền địa chỉ (auto-fill từ users)
3. Submit:
   a. Validate stock từng variant trong cart
   b. Sinh order_code từ counters
   c. Insert orders (user_id=X, customer_contact, shipping_address, status="pending")
   d. Bulk insert order_items (snapshot tất cả info từ products + variants)
   e. Bulk update product_variants ($inc stock_quantity: -qty)
   f. Recalculate products.total_stock cho các product liên quan
   g. Xóa carts (hoặc set items=[])
   h. Gửi email cho admin_notification_email
   i. Trả về { order_code }
```

### Guest checkout
```
Giống logged-in nhưng:
- user_id = null
- customer_contact bắt buộc nhập (full_name, phone, email)
- Không có cart cũ thì nhận cart từ session_id, hoặc gửi thẳng items lên API
```

### Tra cứu đơn (guest)
```
Trang /orders/lookup → input: phone HOẶC order_code
- Nếu phone: orders.find({ "customer_contact.phone": phone }).sort({ created_at: -1 })
- Nếu order_code: orders.findOne({ order_code })
```

### Lịch sử đơn (logged-in)
```
orders.find({ user_id: X }).sort({ created_at: -1 })
```

### State machine `orders.status`
```
pending → confirmed → processing → completed
   ↓          ↓           ↓
cancelled  cancelled  cancelled
```
Mỗi lần đổi status → push vào `status_history`. Khi `confirmed`/`completed`/`cancelled` → set timestamp tương ứng.

---

## 7. AUTH & USER-RELATED MODEL

### Đăng ký
```
1. Validate email regex, phone format, password min 8.
2. Check users.findOne({ email, deleted_at: null }) → đã tồn tại?
3. password_hash = bcrypt(password, 10)
4. Insert users { role: "user", status: "active" }
5. Trả token (JWT/session).
```

### Đăng nhập
```
1. users.findOne({ email, deleted_at: null, status: "active" })
2. Compare password với password_hash
3. Update last_login_at
4. Trả token.
```

### Phân role
```
Phase 1: chỉ check users.role === "admin" trên các route admin.
Phase 2 (nếu cần): tạo collection roles + permissions, đổi users.role thành users.role_id (ref).
```

### Wishlist
```
Add: wishlists.insertOne({ user_id, product_id, created_at: now })
     (unique index sẽ chặn nếu đã tồn tại)
Remove: wishlists.deleteOne({ user_id, product_id })
List: wishlists.aggregate([
  { $match: { user_id } },
  { $lookup: { from: "products", localField: "product_id", foreignField: "_id", as: "product" } },
  { $unwind: "$product" },
  { $sort: { created_at: -1 } }
])
```

### Lịch sử đơn user
```
GET /me/orders → orders.find({ user_id }).sort({ created_at: -1 })
```

---

## 8. DASHBOARD DATA STRATEGY

**Phase 1 — tính realtime, KHÔNG cần collection riêng.**

| Chỉ số | Query |
|---|---|
| Tổng user | `users.countDocuments({ role: "user", deleted_at: null })` |
| Tổng sản phẩm active | `products.countDocuments({ status: "active", deleted_at: null })` |
| Tổng đơn | `orders.countDocuments({})` |
| Đơn mới (pending) | `orders.find({ status: "pending" }).sort({ created_at: -1 }).limit(20)` |
| Sản phẩm sắp hết | `product_variants.find({ stock_quantity: { $gt: 0, $lte: 5 }, status: "active" })` |
| Sản phẩm hết hàng | `product_variants.find({ stock_quantity: 0, status: "active" })` |
| Doanh thu tháng | `orders.aggregate([{ $match: { status: "completed", completed_at: { $gte: startOfMonth } } }, { $group: { _id: null, sum: { $sum: "$total" } } }])` |
| Doanh thu hôm nay | tương tự với startOfDay |
| Top sản phẩm bán | `order_items.aggregate([{ $group: { _id: "$product_id", sold: { $sum: "$quantity" } } }, { $sort: { sold: -1 } }, { $limit: 10 }])` |

**Phase 3:** nếu data lớn → tạo `daily_stats` chạy cron mỗi đêm để tránh tính realtime nặng.

---

## 9. INDEXING STRATEGY (TỔNG HỢP)

| Collection | Index | Loại | Lý do |
|---|---|---|---|
| `users` | `{email:1}` partial `{deleted_at:null}` | unique | đăng nhập, chống trùng |
| `users` | `{phone:1}` partial | normal | tra cứu |
| `users` | `{role:1, status:1}` | normal | filter admin |
| `categories` | `{slug:1}` partial | unique | route /categories/:slug |
| `categories` | `{parent_id:1, sort_order:1}` | normal | render menu |
| `brands` | `{slug:1}` partial | unique | route /brands/:slug |
| `products` | `{slug:1}` partial | unique | route /products/:slug |
| `products` | `{name:"text", short_description:"text", tags:"text"}` | text | full-text search |
| `products` | `{category_id:1, status:1, created_at:-1}` | compound | listing theo category |
| `products` | `{brand_id:1, status:1}` | compound | listing theo brand |
| `products` | `{status:1, is_featured:-1, created_at:-1}` | compound | trang chủ |
| `products` | `{base_price:1}` | normal | sort/filter giá |
| `products` | `{tags:1}` | multikey | filter tag |
| `product_variants` | `{sku:1}` partial | unique | mã SKU |
| `product_variants` | `{product_id:1, status:1}` | compound | load variants của product |
| `product_variants` | `{stock_quantity:1}` | normal | tìm sắp hết hàng |
| `product_variants` | `{price:1}` | normal | sort giá thực |
| `carts` | `{user_id:1}` partial | normal | lookup theo user |
| `carts` | `{session_id:1}` partial | normal | lookup theo guest |
| `carts` | `{last_activity_at:1}` | TTL hoặc cleanup | xóa cart cũ |
| `wishlists` | `{user_id:1, product_id:1}` | unique | chống trùng |
| `wishlists` | `{user_id:1, created_at:-1}` | compound | list của user |
| `wishlists` | `{product_id:1}` | normal | đếm hot products |
| `orders` | `{order_code:1}` | unique | tra cứu mã |
| `orders` | `{user_id:1, created_at:-1}` | compound | lịch sử user |
| `orders` | `{"customer_contact.phone":1, created_at:-1}` | compound | tra cứu guest |
| `orders` | `{status:1, created_at:-1}` | compound | dashboard "đơn mới" |
| `orders` | `{created_at:-1}` | normal | listing admin |
| `order_items` | `{order_id:1}` | normal | load items của order |
| `order_items` | `{variant_id:1}` | normal | top bán theo variant |
| `order_items` | `{product_id:1}` | normal | top bán theo product |
| `settings` | `{key:1}` | unique | lookup config |

**Tổng số index Phase 1:** ~30. Không quá nhiều, mỗi cái đều có usecase rõ ràng.

---

## 10. EXTENSIBILITY PLAN (PHASE 2/3)

| Tính năng | Cách thêm | Ảnh hưởng schema cũ |
|---|---|---|
| Review/rating | Thêm `reviews { product_id, user_id, order_id?, rating(1-5), title, content, images[], status, created_at }` | Không phá. Có thể cache `products.rating_avg`, `products.rating_count`. |
| Q&A sản phẩm | Thêm `product_questions` + `product_answers` | Không phá |
| Coupon/Promotion | Thêm `coupons { code, type:"percent\|fixed", value, min_order, max_discount, valid_from, valid_to, usage_limit, used_count, status }`. Đã có sẵn `orders.discount` & `orders.discount_code` | Không phá |
| Banner | Thêm `banners { image_url, link, position, sort, status, valid_from, valid_to }` | Không phá |
| Blog/Content | Thêm `posts { title, slug, content, author_id, category, tags, thumbnail, status, published_at }` | Không phá |
| Multi địa chỉ user | Thêm `shipping_addresses { user_id, label, full_name, phone, address_line, ward, district, province, is_default }`. Vẫn embed snapshot vào order. | Không phá |
| Notifications | Thêm `notifications { user_id\|admin, type, title, body, payload, read, created_at }` | Không phá |
| Filter động theo category | Thêm `attribute_definitions { category_id, key, label, type, options[], filterable, sort }` để generate UI filter | Không phá (đã có `variant.attributes` object động) |
| Related products | Thêm field `products.related_product_ids[]` HOẶC tạo `product_relations { product_id, related_id, type }` | Không phá |
| Online payment | Thêm `payments { order_id, provider, status, amount, txn_id, paid_at, raw_response }`. Mở rộng `orders.payment_method` enum | Không phá |
| Shipping integration | Thêm `shipments { order_id, carrier, tracking_code, status, fee, estimated_delivery }` | Không phá |
| Inventory đầy đủ | Thêm `inventory_transactions { variant_id, type:"in\|out\|adjust", quantity, reason, ref_order_id, created_by, created_at }`. Vẫn giữ `product_variants.stock_quantity` làm cache | Không phá |
| Flash sale / combo | Thêm `promotions { type, rules{}, products[], variants[], from, to, status }` | Không phá |
| Audit logs | Thêm `audit_logs { actor_id, actor_role, action, target_collection, target_id, before, after, ip, created_at }` | Không phá |
| Loyalty/Points | Thêm `user_points { user_id, balance, total_earned }` + `point_transactions { user_id, type, amount, ref_order_id, created_at }` | Không phá |
| Dashboard nâng cao | Thêm `daily_stats { date, total_orders, revenue, new_users, top_products[] }` chạy cron | Không phá |

**Field "chừa cửa" sẵn có trong Phase 1:**
- `orders.discount`, `orders.discount_code` → cho coupon Phase 2.
- `orders.payment_method`, `orders.payment_status` → cho payment Phase 3.
- `products.tags[]` → cho filter/recommend Phase 2.
- `products.is_featured`, `products.view_count`, `products.sold_count` → cho ranking, gợi ý.
- `product_variants.cost_price` → cho báo cáo lợi nhuận Phase 3.
- `product_variants.weight_grams` → cho tính phí ship Phase 3.
- `users.last_login_at` → cho phân tích retention Phase 2.
- `orders.status_history[]` → đã sẵn audit cho riêng order.

---

## 11. FINAL RECOMMENDATION

### Mô hình tổng thể tốt nhất cho bài toán này
- **11 collections cốt lõi** (Phase 1) như trên: gọn, đủ, không thừa.
- **Tách `products` ↔ `product_variants`** — đây là quyết định quan trọng nhất, đừng skip.
- **Embed mạnh tay khi đông lạnh dữ liệu (orders)** — bảo vệ tính bất biến của hóa đơn.
- **Tham chiếu (ref) các entity sống độc lập (user, product, brand, category)** — dễ đồng bộ.
- **Object động cho `variant.attributes`** — tận dụng schema-less của MongoDB, tránh bảng cứng.
- **Soft delete + timestamps đồng nhất** trên mọi collection chính.
- **Snapshot mọi info quan trọng vào order_items + orders** — không bao giờ phụ thuộc dữ liệu hiện tại của product để render hóa đơn cũ.

### Những lỗi thiết kế thường gặp cần TRÁNH
1. **Nhồi variants vào array embed của products** → document phình to, update đắt, scale kém.
2. **Tạo nhiều `products` giống hệt cho từng biến thể** → trùng lặp tên/mô tả/ảnh.
3. **Schema cứng các thông số kỹ thuật** (`ram`, `screen_size`...) → không đa dụng cho phụ kiện.
4. **Tách `roles` collection ngay Phase 1 dù chỉ có 2 role** → over-engineering.
5. **Không snapshot dữ liệu vào order** → đổi giá/tên sản phẩm là vỡ hóa đơn cũ.
6. **Để `orders.user_id` là required** → block guest checkout.
7. **Lưu tổng tiền dạng số thực (float)** → sai số tiền tệ. Dùng integer VND.
8. **Tạo index "phòng hờ"** → tốn RAM, chậm write. Chỉ index theo query thực tế.
9. **Không có `order_code` ngoài `_id`** → ObjectId không thân thiện cho khách tra cứu.
10. **Không có `counters`** → dùng timestamp/random làm `order_code` → nguy cơ trùng.
11. **Không có `created_at` index** → sort theo thời gian sẽ chậm khi data nhiều.
12. **Nhét cart_items vào collection riêng quá sớm** → phức tạp dư thừa khi cart luôn nhỏ.
13. **Quên `partialFilterExpression` trên unique index** → soft delete tạo conflict với unique constraint.
14. **Hard-code phí ship / số Zalo trong code** → đáng lẽ phải để `settings`.
15. **Không track `status_history`** → không debug được khi khách khiếu nại "đơn của tôi đổi trạng thái lúc nào?".

### Nguyên tắc duy nhất phải nhớ
> **Phase 1 tối giản — nhưng mọi field đã có và mọi tách-collection đã thực hiện đều phải có lý do nghiệp vụ rõ ràng. Đừng thêm gì không dùng. Đừng quên field nào sẽ phá schema sau này.**

Schema này đã được kiểm tra qua bước 9 (extensibility) — bạn có thể tự tin triển khai Phase 1 mà không sợ phải redesign khi bước sang Phase 2/3.

---

**Tổng kết nhanh — copy-paste cho team:**

```
COLLECTIONS PHASE 1:
  users, categories, brands,
  products, product_variants,
  carts, wishlists,
  orders, order_items,
  settings, counters

KEY DECISIONS:
  - role: enum field (không tách collection)
  - specs: embed mảng key-value động
  - variant.attributes: object dynamic
  - cart.items: embed
  - wishlist: collection riêng
  - order.shipping_address & customer_contact: embed (snapshot)
  - order_items: tách collection (cho analytics)
  - inventory: stock_quantity ở variant; transactions để Phase 3
  - dashboard: realtime aggregate, không cần collection
  - order_code: sinh qua counters atomic

CURRENCY: integer VND
SOFT DELETE: deleted_at field, partial unique
TIMESTAMPS: created_at, updated_at trên mọi collection chính
```

# DATABASE DESIGN — Website Bán Điện Thoại & Phụ Kiện Công Nghệ
> MongoDB · Phase 1 (với tư duy mở rộng Phase 2 & 3)  
> Tác giả: Senior Solution Architect + Database Architect

---

## 1. ASSUMPTIONS

### Business Assumptions
- Đây là cửa hàng gia đình quy mô nhỏ–vừa, một kho hàng duy nhất (Phase 1).
- Phase 1 KHÔNG cần thanh toán online — khách đặt hàng, chủ shop liên hệ lại qua Zalo/điện thoại để xác nhận & thu tiền.
- Giao hàng do chủ shop tự xử lý (COD hoặc gặp trực tiếp), chưa tích hợp đơn vị vận chuyển.
- Thông báo đơn hàng mới gửi qua email đến admin (dùng SMTP đơn giản hoặc service như Resend/Brevo).
- Một sản phẩm có thể có nhiều biến thể (màu, dung lượng RAM, bộ nhớ, v.v.).
- SKU được quản lý ở cấp variant, không phải product gốc.
- Khách vãng lai (guest) có thể đặt hàng không cần tài khoản.
- Số lượng sản phẩm Phase 1 dự kiến < 500 SKU — chưa cần sharding.

### Technical Assumptions
- Database: MongoDB (document-oriented, không dùng JOIN).
- Sử dụng ObjectId của MongoDB làm primary key (`_id`).
- Tất cả timestamps là UTC, ISO 8601.
- Soft delete: dùng field `deletedAt` (null = chưa xoá, có giá trị = đã xoá).
- Slug dùng cho URL SEO-friendly, được tạo từ tên sản phẩm/danh mục.
- Images lưu URL từ cloud storage (Cloudinary, S3, v.v.) — không lưu binary trong DB.
- Phase 1 chưa cần full-text search engine (Elasticsearch) — dùng MongoDB text index.
- Vai trò (role) Phase 1 chỉ có 2: `admin` và `user`.

---

## 2. PHASE-BASED THINKING

### Phase 1 — Core Commerce (Thiết kế chính)
Mục tiêu: Có website để khách xem hàng, đặt hàng, chủ nhận thông báo và tư vấn qua Zalo.
- User auth, phân role
- Danh mục & thương hiệu
- Sản phẩm với biến thể & thông số kỹ thuật linh hoạt
- Giỏ hàng (user đăng nhập + guest)
- Wishlist
- Đặt hàng (guest + logged-in)
- Quản lý tồn kho cơ bản
- Dashboard admin đơn giản
- Thông báo email khi có đơn hàng mới

### Phase 2 — Engagement & Marketing (Ảnh hưởng đến thiết kế Phase 1)
- **Reviews/Ratings** → Cần `productId` reference rõ ràng trong `orders` và `order_items`, để verify "đã mua mới được review". Thiết kế Phase 1 đã chuẩn bị sẵn.
- **Coupons/Promotions** → `orders` cần các field `discountAmount`, `couponCode` — đặt là optional từ Phase 1.
- **Multiple addresses** → `shipping_addresses` tách thành collection riêng từ Phase 1 (đã làm).
- **Notifications** → `settings` collection đã có slot cho notification config.
- **Blog/Banner** → Collections mới, không ảnh hưởng schema hiện tại.
- **Related products** → Thêm field `relatedProductIds` vào `products` về sau.

### Phase 3 — Scale & Operations (Ảnh hưởng đến thiết kế Phase 1)
- **Online payment** → `orders` cần field `paymentMethod`, `paymentStatus`, `paymentRef` — đặt optional từ Phase 1.
- **Multi-warehouse** → `inventory` thiết kế theo `(variantId, warehouseId)` ngay từ Phase 1 (hoặc đơn giản hóa nhưng giữ cấu trúc có thể mở rộng).
- **Inventory transactions** → `inventory_transactions` là collection mới thêm vào, không đụng schema cũ.
- **Flash sale/Combo** → `promotions` collection mới.
- **Audit logs** → `audit_logs` collection mới, stream sự kiện.
- **Loyalty/Points** → Thêm field `loyaltyPoints` vào `users` về sau.

---

## 3. COLLECTION DESIGN OVERVIEW

| Collection | Vai trò |
|---|---|
| `users` | Tài khoản đăng nhập, role, thông tin cơ bản |
| `categories` | Danh mục sản phẩm (hỗ trợ cây phân cấp) |
| `brands` | Thương hiệu sản phẩm |
| `attribute_definitions` | Định nghĩa thuộc tính linh hoạt theo category (màu, RAM, v.v.) |
| `products` | Sản phẩm gốc (thông tin chung, không chứa giá/tồn kho) |
| `product_variants` | Biến thể/SKU cụ thể của sản phẩm (giá, ảnh, thuộc tính) |
| `product_images` | Ảnh sản phẩm (liên kết tới product hoặc variant) |
| `inventory` | Tồn kho theo từng variant |
| `carts` | Giỏ hàng (user hoặc guest theo session) |
| `wishlists` | Danh sách yêu thích của user |
| `orders` | Đơn hàng (header thông tin) |
| `order_items` | Chi tiết dòng hàng trong đơn |
| `shipping_addresses` | Địa chỉ giao hàng đã lưu của user (Phase 2 mở rộng) |
| `settings` | Cấu hình hệ thống (zalo link, email admin, v.v.) |

---

## 4. DETAILED SCHEMA PROPOSAL

---

### 4.1 `users`

**Mục đích**: Lưu tài khoản người dùng và admin.

```
Field               Type        Required  Default       Notes
─────────────────────────────────────────────────────────────────
_id                 ObjectId    auto
email               String      YES                     unique, lowercase, indexed
passwordHash        String      YES                     bcrypt hash
phone               String      NO                      indexed (tìm kiếm nhanh)
fullName            String      NO
role                String      YES       "user"        enum: ["user", "admin"]
status              String      YES       "active"      enum: ["active", "inactive", "blocked"]
avatar              String      NO                      URL ảnh
emailVerified       Boolean     YES       false
lastLoginAt         Date        NO
loyaltyPoints       Number      NO        0             Phase 3 — đặt sẵn, default 0
metadata            Object      NO        {}            Phase 2,3 mở rộng tự do
createdAt           Date        auto
updatedAt           Date        auto
deletedAt           Date        NO        null          soft delete
```

**Index**:
- `{ email: 1 }` unique
- `{ phone: 1 }` sparse (không phải tất cả đều có SĐT)
- `{ role: 1, status: 1 }`
- `{ createdAt: -1 }`

**Sample document**:
```json
{
  "_id": "ObjectId(...)",
  "email": "user@example.com",
  "passwordHash": "$2b$12$...",
  "phone": "0901234567",
  "fullName": "Nguyễn Văn A",
  "role": "user",
  "status": "active",
  "avatar": null,
  "emailVerified": true,
  "lastLoginAt": "2025-01-15T10:30:00Z",
  "loyaltyPoints": 0,
  "metadata": {},
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-15T10:30:00Z",
  "deletedAt": null
}
```

> **Ghi chú**: Phase 1 embed role trực tiếp vào `users`. Phase 3 nếu cần phân quyền chi tiết (staff, warehouse manager…) thì tách collection `roles` riêng và dùng `roleIds: [ObjectId]`.

---

### 4.2 `categories`

**Mục đích**: Danh mục sản phẩm, hỗ trợ cấu trúc cây (cha–con).

```
Field               Type        Required  Default       Notes
────────────────────────────────────────────────────────────────
_id                 ObjectId    auto
name                String      YES                     VD: "Điện thoại", "Tai nghe"
slug                String      YES                     unique, VD: "dien-thoai"
parentId            ObjectId    NO        null          ref: categories (null = root)
description         String      NO
image               String      NO                      URL ảnh đại diện danh mục
sortOrder           Number      NO        0             Thứ tự hiển thị
attributeIds        [ObjectId]  NO        []            ref: attribute_definitions
                                                        Thuộc tính mặc định cho danh mục này
status              String      YES       "active"      enum: ["active", "inactive"]
createdAt           Date        auto
updatedAt           Date        auto
deletedAt           Date        NO        null
```

**Index**:
- `{ slug: 1 }` unique
- `{ parentId: 1 }`
- `{ status: 1, sortOrder: 1 }`

**Sample document**:
```json
{
  "_id": "ObjectId(cat001)",
  "name": "Điện thoại",
  "slug": "dien-thoai",
  "parentId": null,
  "description": "Điện thoại smartphone các loại",
  "image": "https://cdn.example.com/cat-phone.jpg",
  "sortOrder": 1,
  "attributeIds": ["ObjectId(attr_color)", "ObjectId(attr_ram)", "ObjectId(attr_storage)"],
  "status": "active",
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-01T00:00:00Z",
  "deletedAt": null
}
```

---

### 4.3 `brands`

**Mục đích**: Thương hiệu sản phẩm (Apple, Samsung, Xiaomi, Anker…).

```
Field               Type        Required  Default       Notes
────────────────────────────────────────────────────────────────
_id                 ObjectId    auto
name                String      YES                     unique
slug                String      YES                     unique
logo                String      NO                      URL logo
description         String      NO
website             String      NO
sortOrder           Number      NO        0
status              String      YES       "active"      enum: ["active", "inactive"]
createdAt           Date        auto
updatedAt           Date        auto
deletedAt           Date        NO        null
```

**Index**:
- `{ slug: 1 }` unique
- `{ name: 1 }` unique
- `{ status: 1 }`

---

### 4.4 `attribute_definitions`

**Mục đích**: Định nghĩa các thuộc tính linh hoạt dùng để lọc và hiển thị specs theo từng loại sản phẩm. Đây là trái tim của flexible product modeling.

```
Field               Type        Required  Default       Notes
────────────────────────────────────────────────────────────────
_id                 ObjectId    auto
name                String      YES                     VD: "Màu sắc", "RAM", "Bộ nhớ trong"
slug                String      YES                     unique, VD: "mau-sac", "ram", "bo-nho"
type                String      YES                     enum: ["select","multi_select","text","number","boolean"]
unit                String      NO                      VD: "GB", "W", "cm"
isFilterable        Boolean     YES       true          Có hiển thị trong bộ lọc không
isVariantAttribute  Boolean     YES       false         true nếu tạo ra biến thể khác nhau (màu, RAM)
                                                        false nếu chỉ là thông số hiển thị (pin, camera)
predefinedValues    [String]    NO        []            VD: ["Đen", "Trắng", "Xanh"] — gợi ý khi nhập
sortOrder           Number      NO        0
status              String      YES       "active"
createdAt           Date        auto
updatedAt           Date        auto
```

**Index**:
- `{ slug: 1 }` unique
- `{ isFilterable: 1 }`
- `{ isVariantAttribute: 1 }`

**Sample documents**:
```json
[
  {
    "_id": "ObjectId(attr_color)",
    "name": "Màu sắc",
    "slug": "mau-sac",
    "type": "select",
    "unit": null,
    "isFilterable": true,
    "isVariantAttribute": true,
    "predefinedValues": ["Đen", "Trắng", "Xanh", "Đỏ", "Vàng"],
    "sortOrder": 1
  },
  {
    "_id": "ObjectId(attr_ram)",
    "name": "RAM",
    "slug": "ram",
    "type": "select",
    "unit": "GB",
    "isFilterable": true,
    "isVariantAttribute": true,
    "predefinedValues": ["4", "6", "8", "12", "16"]
  },
  {
    "_id": "ObjectId(attr_storage)",
    "name": "Bộ nhớ trong",
    "slug": "bo-nho-trong",
    "type": "select",
    "unit": "GB",
    "isFilterable": true,
    "isVariantAttribute": true,
    "predefinedValues": ["64", "128", "256", "512"]
  },
  {
    "_id": "ObjectId(attr_battery)",
    "name": "Dung lượng pin",
    "slug": "dung-luong-pin",
    "type": "number",
    "unit": "mAh",
    "isFilterable": false,
    "isVariantAttribute": false,
    "predefinedValues": []
  }
]
```

---

### 4.5 `products`

**Mục đích**: Sản phẩm gốc — thông tin chung, không chứa giá hay tồn kho (những thứ đó thuộc variant).

```
Field               Type        Required  Default       Notes
────────────────────────────────────────────────────────────────
_id                 ObjectId    auto
name                String      YES                     Tên sản phẩm
slug                String      YES                     unique, SEO URL
sku                 String      NO                      SKU gốc (optional, thường dùng ở variant)
categoryId          ObjectId    YES                     ref: categories
brandId             ObjectId    YES                     ref: brands
description         String      NO                      Mô tả HTML
shortDescription    String      NO                      Mô tả ngắn
thumbnailImage      String      NO                      URL ảnh đại diện chính
specs               [Object]    NO        []            Thông số kỹ thuật của product (không biến thể)
                                                        [{ attributeId: ObjectId, value: String }]
tags                [String]    NO        []            Full-text search hỗ trợ, Phase 2 gợi ý sp
isFeatured          Boolean     NO        false         Sản phẩm nổi bật
viewCount           Number      NO        0             Counter view (Phase 2 analytics)
status              String      YES       "draft"       enum: ["draft","active","inactive"]
sortOrder           Number      NO        0
seoTitle            String      NO
seoDescription      String      NO
metadata            Object      NO        {}            Slot mở rộng Phase 2,3
createdAt           Date        auto
updatedAt           Date        auto
deletedAt           Date        NO        null
```

**Index**:
- `{ slug: 1 }` unique
- `{ categoryId: 1, status: 1 }`
- `{ brandId: 1, status: 1 }`
- `{ status: 1, isFeatured: 1 }`
- `{ name: "text", tags: "text" }` — MongoDB text index cho search
- `{ createdAt: -1 }`

**Sample document**:
```json
{
  "_id": "ObjectId(prod001)",
  "name": "iPhone 15 Pro Max",
  "slug": "iphone-15-pro-max",
  "categoryId": "ObjectId(cat001)",
  "brandId": "ObjectId(brand_apple)",
  "description": "<p>iPhone 15 Pro Max với chip A17 Pro...</p>",
  "shortDescription": "Flagship mạnh nhất của Apple 2023",
  "thumbnailImage": "https://cdn.example.com/iphone15promax-thumb.jpg",
  "specs": [
    { "attributeId": "ObjectId(attr_battery)", "value": "4422", "displayLabel": "Pin 4422 mAh" },
    { "attributeId": "ObjectId(attr_screen)", "value": "6.7", "displayLabel": "Màn hình 6.7 inch" }
  ],
  "tags": ["iphone", "apple", "flagship", "5g"],
  "isFeatured": true,
  "viewCount": 0,
  "status": "active",
  "sortOrder": 0,
  "seoTitle": "iPhone 15 Pro Max - Giá tốt tại TechShop",
  "seoDescription": "Mua iPhone 15 Pro Max chính hãng...",
  "metadata": {},
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-01T00:00:00Z",
  "deletedAt": null
}
```

---

### 4.6 `product_variants`

**Mục đích**: Biến thể cụ thể của sản phẩm — mỗi variant là một SKU với giá, tồn kho, ảnh riêng.

```
Field               Type        Required  Default       Notes
────────────────────────────────────────────────────────────────
_id                 ObjectId    auto
productId           ObjectId    YES                     ref: products
sku                 String      YES                     unique, VD: "IPH15PM-BLK-256"
name                String      NO                      VD: "Đen - 256GB" (tự sinh hoặc admin nhập)
attributes          [Object]    YES       []            Các thuộc tính tạo nên biến thể
                                                        [{ attributeId: ObjectId, 
                                                           attributeSlug: String, (denormalized)
                                                           value: String }]
price               Number      YES                     Giá bán (VND), không có thể 0
originalPrice       Number      NO                      Giá gốc (để hiện giảm giá, Phase 2)
images              [String]    NO        []            URLs ảnh riêng của variant này
isDefault           Boolean     YES       false         Biến thể mặc định khi vào trang sp
sortOrder           Number      NO        0
status              String      YES       "active"      enum: ["active","inactive"]
metadata            Object      NO        {}
createdAt           Date        auto
updatedAt           Date        auto
deletedAt           Date        NO        null
```

**Index**:
- `{ sku: 1 }` unique
- `{ productId: 1, status: 1 }`
- `{ productId: 1, isDefault: 1 }`
- `{ price: 1 }` — filter theo giá
- `{ "attributes.attributeSlug": 1, "attributes.value": 1 }` — filter theo màu, RAM, v.v.

**Sample document**:
```json
{
  "_id": "ObjectId(var001)",
  "productId": "ObjectId(prod001)",
  "sku": "IPH15PM-BLK-256",
  "name": "Đen - 256GB",
  "attributes": [
    { "attributeId": "ObjectId(attr_color)", "attributeSlug": "mau-sac", "value": "Đen" },
    { "attributeId": "ObjectId(attr_storage)", "attributeSlug": "bo-nho-trong", "value": "256" }
  ],
  "price": 33990000,
  "originalPrice": 36990000,
  "images": ["https://cdn.example.com/iph15pm-blk-1.jpg"],
  "isDefault": true,
  "sortOrder": 0,
  "status": "active",
  "metadata": {},
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-01T00:00:00Z",
  "deletedAt": null
}
```

---

### 4.7 `product_images`

**Mục đích**: Gallery ảnh sản phẩm. Tách riêng để dễ quản lý sort, alt text, và về sau thêm video.

```
Field               Type        Required  Default       Notes
────────────────────────────────────────────────────────────────
_id                 ObjectId    auto
productId           ObjectId    YES                     ref: products
variantId           ObjectId    NO        null          ref: product_variants (null = ảnh chung)
url                 String      YES                     URL ảnh
altText             String      NO                      SEO alt text
sortOrder           Number      NO        0
type                String      NO        "image"       enum: ["image", "video"] — Phase 2
createdAt           Date        auto
```

**Index**:
- `{ productId: 1, sortOrder: 1 }`
- `{ variantId: 1 }`

---

### 4.8 `inventory`

**Mục đích**: Tồn kho theo từng variant. Một bản ghi = một variant tại một kho (Phase 1 chỉ có 1 kho).

```
Field               Type        Required  Default       Notes
────────────────────────────────────────────────────────────────
_id                 ObjectId    auto
variantId           ObjectId    YES                     ref: product_variants, unique (Phase 1)
productId           ObjectId    YES                     ref: products (denormalized để query dashboard)
warehouseId         String      NO        "default"     Phase 3: ref warehouses
quantity            Number      YES       0             Số lượng thực tế
reserved            Number      YES       0             Đang trong đơn chờ xử lý (tránh oversell)
lowStockThreshold   Number      NO        5             Ngưỡng cảnh báo sắp hết hàng
status              String      YES       "in_stock"    enum: ["in_stock","low_stock","out_of_stock"]
                                                        Tự cập nhật sau mỗi thay đổi quantity
updatedAt           Date        auto
createdAt           Date        auto
```

**Index**:
- `{ variantId: 1 }` unique (Phase 1)
- `{ variantId: 1, warehouseId: 1 }` unique (Phase 3 multi-warehouse)
- `{ productId: 1 }`
- `{ status: 1 }` — dashboard sản phẩm sắp hết hàng
- `{ quantity: 1 }` — filter còn hàng

**Công thức availableQty**: `quantity - reserved`

**Logic cập nhật status**:
```
if quantity == 0         → "out_of_stock"
if quantity <= threshold → "low_stock"  
else                     → "in_stock"
```

---

### 4.9 `carts`

**Mục đích**: Giỏ hàng — hỗ trợ cả user đã đăng nhập và guest (theo sessionId).

```
Field               Type        Required  Default       Notes
────────────────────────────────────────────────────────────────
_id                 ObjectId    auto
userId              ObjectId    NO        null          ref: users (null nếu là guest)
sessionId           String      NO                      Guest cart identifier (UUID)
                                                        EITHER userId OR sessionId phải có
items               [Object]    YES       []            Embed cart items trực tiếp
  items[].variantId   ObjectId  YES                     ref: product_variants
  items[].productId   ObjectId  YES                     ref: products (denorm)
  items[].quantity    Number    YES
  items[].price       Number    YES                     Snapshot giá tại thời điểm thêm vào giỏ
  items[].name        String    YES                     Snapshot tên sản phẩm
  items[].variantName String    YES                     Snapshot tên biến thể
  items[].image       String    NO                      Snapshot URL ảnh
  items[].addedAt     Date      YES
expiresAt           Date        NO                      TTL index cho guest cart (VD: 7 ngày)
updatedAt           Date        auto
createdAt           Date        auto
```

**Index**:
- `{ userId: 1 }` sparse, unique (1 user 1 cart active)
- `{ sessionId: 1 }` sparse
- `{ expiresAt: 1 }` TTL index (MongoDB tự xoá guest cart hết hạn)

**Lý do embed items vào cart**: Cart không có hàng chục nghìn items — thường 1–20 item. Embed tối ưu read performance và tránh join.

---

### 4.10 `wishlists`

**Mục đích**: Danh sách yêu thích của user đã đăng nhập.

```
Field               Type        Required  Default       Notes
────────────────────────────────────────────────────────────────
_id                 ObjectId    auto
userId              ObjectId    YES                     ref: users, unique (1 user 1 wishlist)
items               [Object]    YES       []            Embed
  items[].productId   ObjectId  YES                     ref: products
  items[].variantId   ObjectId  NO        null          ref: product_variants (variant cụ thể)
  items[].addedAt     Date      YES
updatedAt           Date        auto
createdAt           Date        auto
```

**Index**:
- `{ userId: 1 }` unique
- `{ "items.productId": 1 }`

---

### 4.11 `orders`

**Mục đích**: Header đơn hàng — thông tin người đặt, địa chỉ, tổng tiền, trạng thái.

```
Field               Type        Required  Default       Notes
────────────────────────────────────────────────────────────────
_id                 ObjectId    auto
orderCode           String      YES                     unique, VD: "ORD-20250115-0001"
userId              ObjectId    NO        null          ref: users (null nếu là guest)
isGuestOrder        Boolean     YES       false

// Thông tin người đặt (snapshot tại thời điểm đặt)
customerInfo        Object      YES
  .fullName         String      YES
  .phone            String      YES
  .email            String      NO

// Địa chỉ giao hàng (snapshot)
shippingAddress     Object      YES
  .fullName         String      YES
  .phone            String      YES
  .address          String      YES                     Số nhà, đường
  .ward             String      NO                      Phường/Xã
  .district         String      YES                     Quận/Huyện
  .province         String      YES                     Tỉnh/TP
  .note             String      NO                      Ghi chú giao hàng

// Tài chính
subtotal            Number      YES                     Tổng tiền hàng trước giảm giá
discountAmount      Number      NO        0             Phase 2: coupon
shippingFee         Number      NO        0             Phase 3: tích hợp vận chuyển
totalAmount         Number      YES                     = subtotal - discount + shippingFee

// Thanh toán
paymentMethod       String      YES       "cod"         enum: ["cod","bank_transfer","online"]
                                                        Phase 1: chủ yếu "cod" hoặc "bank_transfer"
paymentStatus       String      YES       "pending"     enum: ["pending","paid","failed","refunded"]
paymentRef          String      NO                      Phase 3: mã giao dịch online
couponCode          String      NO                      Phase 2

// Vận chuyển Phase 3
shippingProvider    String      NO
trackingCode        String      NO

// Trạng thái đơn hàng
status              String      YES       "pending"     enum:
                                                        "pending"    → Chờ xác nhận
                                                        "confirmed"  → Đã xác nhận
                                                        "processing" → Đang chuẩn bị hàng
                                                        "shipping"   → Đang giao (Phase 3)
                                                        "completed"  → Hoàn thành
                                                        "cancelled"  → Đã huỷ

note                String      NO                      Ghi chú của khách
adminNote           String      NO                      Ghi chú nội bộ của admin
source              String      NO        "website"     enum: ["website","zalo","phone","admin"]

metadata            Object      NO        {}
createdAt           Date        auto
updatedAt           Date        auto
deletedAt           Date        NO        null
```

**Index**:
- `{ orderCode: 1 }` unique
- `{ userId: 1, createdAt: -1 }` — lịch sử đơn của user
- `{ status: 1, createdAt: -1 }` — dashboard đơn mới
- `{ createdAt: -1 }` — sort mặc định
- `{ "customerInfo.phone": 1 }` — tìm đơn theo SĐT
- `{ "customerInfo.email": 1 }`
- `{ paymentStatus: 1 }`

---

### 4.12 `order_items`

**Mục đích**: Chi tiết từng dòng sản phẩm trong đơn hàng. Tách riêng (không embed vào orders) vì cần query riêng (báo cáo sản phẩm bán chạy Phase 2, review Phase 2).

```
Field               Type        Required  Default       Notes
────────────────────────────────────────────────────────────────
_id                 ObjectId    auto
orderId             ObjectId    YES                     ref: orders
productId           ObjectId    YES                     ref: products (snapshot reference)
variantId           ObjectId    YES                     ref: product_variants (snapshot reference)

// Snapshot tại thời điểm đặt hàng (QUAN TRỌNG: không update khi sp thay đổi)
productName         String      YES
variantName         String      YES                     VD: "Đen - 256GB"
sku                 String      YES
image               String      NO
price               Number      YES                     Giá tại thời điểm mua
quantity            Number      YES
lineTotal           Number      YES                     = price * quantity

// Phase 2 review
isReviewed          Boolean     NO        false
reviewId            ObjectId    NO        null          ref: reviews (Phase 2)

createdAt           Date        auto
```

**Index**:
- `{ orderId: 1 }`
- `{ productId: 1 }` — Phase 2: top sản phẩm bán chạy
- `{ variantId: 1 }`
- `{ orderId: 1, variantId: 1 }`

---

### 4.13 `shipping_addresses`

**Mục đích**: Địa chỉ giao hàng đã lưu của user (Phase 1 đơn giản, Phase 2 multi-address).

```
Field               Type        Required  Default       Notes
────────────────────────────────────────────────────────────────
_id                 ObjectId    auto
userId              ObjectId    YES                     ref: users
fullName            String      YES
phone               String      YES
address             String      YES
ward                String      NO
district            String      YES
province            String      YES
isDefault           Boolean     YES       false
createdAt           Date        auto
updatedAt           Date        auto
deletedAt           Date        NO        null
```

**Index**:
- `{ userId: 1 }`
- `{ userId: 1, isDefault: 1 }`

---

### 4.14 `settings`

**Mục đích**: Cấu hình hệ thống do admin quản lý (Zalo link, email admin, thông tin cửa hàng).

```
Field               Type        Required  Default       Notes
────────────────────────────────────────────────────────────────
_id                 ObjectId    auto
key                 String      YES                     unique, VD: "zalo_link", "admin_email"
value               Mixed       YES                     Giá trị (String, Number, Object, Boolean)
group               String      NO        "general"     Nhóm cấu hình: "general","contact","seo","notification"
label               String      NO                      Mô tả cho admin UI
isPublic            Boolean     YES       false         true = frontend có thể đọc
updatedAt           Date        auto
updatedBy           ObjectId    NO                      ref: users (admin nào sửa)
```

**Index**:
- `{ key: 1 }` unique
- `{ group: 1, isPublic: 1 }`

**Sample documents**:
```json
[
  { "key": "zalo_link", "value": "https://zalo.me/0901234567", "group": "contact", "isPublic": true },
  { "key": "admin_email", "value": "admin@techshop.vn", "group": "notification", "isPublic": false },
  { "key": "store_name", "value": "TechShop", "group": "general", "isPublic": true },
  { "key": "store_phone", "value": "0901234567", "group": "contact", "isPublic": true },
  { "key": "low_stock_threshold", "value": 5, "group": "inventory", "isPublic": false },
  { "key": "notify_order_email", "value": true, "group": "notification", "isPublic": false }
]
```

---

## 5. QUAN HỆ DỮ LIỆU

### Diagram quan hệ (text)
```
users ──────────────────────────── orders (userId → users)
                                        └── order_items (orderId → orders)
                                                ├── productId → products
                                                └── variantId → product_variants

users ──── wishlists (userId → users, items[].productId → products)
users ──── carts (userId → users, items[].variantId → product_variants)
users ──── shipping_addresses (userId → users)

categories ──── products (categoryId → categories)
brands     ──── products (brandId → brands)
categories ──── attribute_definitions (categories.attributeIds → attribute_definitions)

products ──── product_variants (variantId.productId → products)
products ──── product_images (productId → products)
product_variants ──── product_images (variantId → product_variants)
product_variants ──── inventory (variantId → product_variants)
```

### Quyết định Embed vs Reference

| Dữ liệu | Quyết định | Lý do |
|---|---|---|
| `carts.items` | **Embed** | Ít item (<20), luôn đọc cùng nhau, không cần query riêng lẻ |
| `wishlists.items` | **Embed** | Tương tự cart, 1 user 1 wishlist, load toàn bộ 1 lần |
| `orders.shippingAddress` | **Embed (snapshot)** | Địa chỉ có thể thay đổi sau này, phải snapshot thời điểm đặt |
| `orders.customerInfo` | **Embed (snapshot)** | Tương tự — không dùng reference tới users |
| `order_items` | **Separate collection** | Cần query theo productId cho báo cáo; số lượng items có thể nhiều |
| `product_variants.attributes` | **Embed** | Luôn load cùng variant, không bao giờ query attributes riêng lẻ |
| `products.specs` | **Embed** | Specs không thay đổi thường xuyên, load cùng product detail |
| `inventory` | **Separate collection** | Cập nhật thường xuyên (mỗi đơn hàng), cần atomic update riêng lẻ |
| `product_images` | **Separate collection** | Quản lý sort order, có thể có nhiều ảnh, admin thêm/xoá riêng |
| `attribute_definitions` | **Separate collection** | Reference từ nhiều nơi (categories, product_variants) |

---

## 6. PRODUCT MODELING STRATEGY

### Vấn đề cần giải quyết
Website bán nhiều loại sản phẩm có specs hoàn toàn khác nhau:
- **Điện thoại**: màu, RAM, bộ nhớ, chip, camera, pin, màn hình
- **Tai nghe**: màu, phiên bản, kết nối (Bluetooth/wired), driver, tần số
- **Sạc/cáp**: loại cổng (USB-C, Lightning), công suất (W), chiều dài (m)
- **Đồng hồ thông minh**: màu, size mặt, chất liệu dây, GPS, pin

### Mô hình được chọn: **Category-based Flexible Attributes**

```
attribute_definitions   ← Định nghĩa tất cả attributes có thể có
        ↓
categories.attributeIds ← Mỗi category liên kết với tập attributes phù hợp
        ↓
product_variants.attributes ← Mỗi variant có giá trị cụ thể cho variant attributes
        ↓
products.specs          ← Product-level specs (không tạo biến thể, chỉ hiển thị)
```

### Cách hoạt động
**Khi admin thêm sản phẩm "Điện thoại"**:
1. Chọn category "Điện thoại" → UI tự load `attributeIds` của category đó
2. Hệ thống biết category này cần: màu, RAM, bộ nhớ (isVariantAttribute=true) + pin, màn hình (isVariantAttribute=false)
3. Admin tạo variants: mỗi tổ hợp (Đen-8GB-256GB), (Trắng-8GB-256GB), v.v.
4. Specs (pin, màn hình) được lưu ở `products.specs` level

**Khi admin thêm sản phẩm "Sạc"**:
1. Category "Sạc/Cáp" có attributes: loại cổng, công suất, chiều dài
2. Nếu chỉ có 1 loại sạc → 1 variant duy nhất (không cần tổ hợp)
3. Nếu có nhiều loại cổng → tạo variants theo cổng

### Ưu điểm
- Không hard-code field cho từng loại sản phẩm → không phải sửa schema khi thêm loại sp mới
- Admin tự quản lý attribute definitions → flexible
- Filter theo attribute hoạt động nhất quán cho mọi loại sản phẩm
- `isVariantAttribute` phân biệt rõ: thuộc tính tạo ra biến thể vs chỉ để hiển thị

---

## 7. ORDER FLOW DATA MODEL

### Luồng dữ liệu từ Cart → Order

```
1. USER ADDS TO CART
   → carts.items[] (embed variantId, snapshot price/name/image)
   → Không trừ inventory (chỉ check available)

2. CHECKOUT PAGE
   → Đọc cart, validate còn hàng: inventory.quantity - inventory.reserved > 0
   → User nhập thông tin giao hàng

3. TẠO ORDER (Transaction logic)
   → Tạo document orders (status: "pending")
   → Tạo documents order_items (snapshot tên, giá, ảnh)
   → Tăng inventory.reserved (mỗi variant) — giữ chỗ hàng
   → Xoá / reset cart của user
   → Gửi email thông báo đến admin_email (từ settings)

4. ADMIN XÁC NHẬN ĐƠN (status: "confirmed")
   → Không thay đổi inventory.reserved (vẫn giữ)

5. HOÀN THÀNH ĐƠN (status: "completed")
   → Trừ inventory.quantity theo từng order_item.quantity
   → Trừ inventory.reserved tương ứng
   → Cập nhật inventory.status (in_stock/low_stock/out_of_stock)

6. HUỶ ĐƠN (status: "cancelled")
   → Giảm inventory.reserved (trả lại hàng giữ chỗ)
   → Không thay đổi inventory.quantity
```

### Guest Checkout vs Logged-in Checkout

| Aspect | Guest | Logged-in User |
|---|---|---|
| Cart | `carts.sessionId` (UUID cookie) | `carts.userId` |
| Order | `orders.isGuestOrder: true`, `orders.userId: null` | `orders.userId: ObjectId` |
| Thông tin | Nhập customerInfo mỗi lần | Có thể auto-fill từ profile/address đã lưu |
| Lịch sử đơn | Không có (có thể xem qua email) | Có tại `/profile/orders` |
| Wishlist | Không có | Có |

---

## 8. WISHLIST & AUTH-RELATED MODEL

### Đăng ký / Đăng nhập
- Đăng ký: Tạo document `users`, default `role: "user"`, `status: "active"`
- Đăng nhập: Verify `email` + `passwordHash`, cập nhật `lastLoginAt`
- JWT token lưu `{ userId, role, email }` — không cần query DB mỗi request

### Role Model (Phase 1)
```
Đơn giản: role là String field trong users
"admin" → Toàn quyền trong admin panel
"user"  → Chỉ xem, mua hàng, xem lịch sử đơn của mình

Phase 3 nếu cần: Thêm collection "roles" và "permissions"
users.roleIds: [ObjectId]  → ref: roles
roles.permissions: [String] → ["products.create", "orders.update", ...]
```

### Wishlist
- 1 user có đúng 1 document wishlist (`userId` unique)
- Thêm/xoá product: `$addToSet` / `$pull` trên `items` array
- Check đã có trong wishlist: query `{ userId, "items.productId": productId }`
- Giới hạn số item (optional): validate trong application layer

### Lịch sử đơn hàng của user
```
Query: orders.find({ userId: ObjectId(userId) }).sort({ createdAt: -1 })
Chi tiết đơn: 
  1. orders.findOne({ _id: orderId, userId: userId })
  2. order_items.find({ orderId: orderId })
```

---

## 9. DASHBOARD DATA STRATEGY

### Phase 1 — Tính realtime từ collections hiện có (không cần collection riêng)

| Metric | Query | Collection |
|---|---|---|
| Tổng số user | `users.countDocuments({ deletedAt: null })` | users |
| Tổng số sản phẩm active | `products.countDocuments({ status: "active", deletedAt: null })` | products |
| Tổng số đơn hàng | `orders.countDocuments({ deletedAt: null })` | orders |
| Đơn hàng mới (hôm nay) | `orders.countDocuments({ createdAt: { $gte: startOfDay }, status: "pending" })` | orders |
| SP sắp hết / hết hàng | `inventory.find({ status: { $in: ["low_stock","out_of_stock"] } })` | inventory |
| Doanh thu (đơn completed) | `orders.aggregate([{ $match: { status: "completed" } }, { $group: { _id: null, total: { $sum: "$totalAmount" } } }])` | orders |
| Doanh thu theo tháng | Aggregate với `$month`, `$year` trên `createdAt` | orders |

### Khi nào cần aggregate collection riêng?
- Phase 1: **Không cần** — dataset nhỏ, query trực tiếp đủ nhanh
- Phase 2+: Khi có >10.000 đơn/tháng và dashboard cần load nhanh (<100ms) → thêm collection `dashboard_snapshots` lưu pre-computed stats theo ngày

### Thông báo đơn hàng mới (Phase 1)
- Khi tạo order mới → Backend gọi email service (Resend/Nodemailer)
- Gửi email đến `settings["admin_email"]`
- Email chứa: mã đơn, tên/SĐT khách, danh sách sản phẩm, tổng tiền
- Không cần collection notifications (Phase 1)

---

## 10. INDEXING STRATEGY

### Tổng hợp index quan trọng

```javascript
// users
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ phone: 1 }, { sparse: true })
db.users.createIndex({ role: 1, status: 1 })
db.users.createIndex({ createdAt: -1 })

// categories
db.categories.createIndex({ slug: 1 }, { unique: true })
db.categories.createIndex({ parentId: 1 })
db.categories.createIndex({ status: 1, sortOrder: 1 })

// brands
db.brands.createIndex({ slug: 1 }, { unique: true })
db.brands.createIndex({ name: 1 }, { unique: true })

// attribute_definitions
db.attribute_definitions.createIndex({ slug: 1 }, { unique: true })
db.attribute_definitions.createIndex({ isFilterable: 1 })

// products
db.products.createIndex({ slug: 1 }, { unique: true })
db.products.createIndex({ categoryId: 1, status: 1 })
db.products.createIndex({ brandId: 1, status: 1 })
db.products.createIndex({ status: 1, isFeatured: 1 })
db.products.createIndex({ name: "text", tags: "text" }) // Full-text search
db.products.createIndex({ createdAt: -1 })

// product_variants
db.product_variants.createIndex({ sku: 1 }, { unique: true })
db.product_variants.createIndex({ productId: 1, status: 1 })
db.product_variants.createIndex({ productId: 1, isDefault: 1 })
db.product_variants.createIndex({ price: 1 })
db.product_variants.createIndex({ "attributes.attributeSlug": 1, "attributes.value": 1 })

// inventory
db.inventory.createIndex({ variantId: 1 }, { unique: true })
db.inventory.createIndex({ productId: 1 })
db.inventory.createIndex({ status: 1 })
db.inventory.createIndex({ quantity: 1 })

// carts
db.carts.createIndex({ userId: 1 }, { unique: true, sparse: true })
db.carts.createIndex({ sessionId: 1 }, { sparse: true })
db.carts.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }) // TTL

// wishlists
db.wishlists.createIndex({ userId: 1 }, { unique: true })

// orders
db.orders.createIndex({ orderCode: 1 }, { unique: true })
db.orders.createIndex({ userId: 1, createdAt: -1 })
db.orders.createIndex({ status: 1, createdAt: -1 })
db.orders.createIndex({ createdAt: -1 })
db.orders.createIndex({ "customerInfo.phone": 1 })
db.orders.createIndex({ "customerInfo.email": 1 })

// order_items
db.order_items.createIndex({ orderId: 1 })
db.order_items.createIndex({ productId: 1 })
db.order_items.createIndex({ variantId: 1 })

// settings
db.settings.createIndex({ key: 1 }, { unique: true })
```

---

## 11. EXTENSIBILITY PLAN

### Phase 2 → Mở rộng từ schema Phase 1

| Feature | Cách mở rộng | Tác động schema Phase 1 |
|---|---|---|
| Reviews/Ratings | Thêm collection `reviews` { userId, productId, orderId, rating, content } | `order_items.isReviewed`, `order_items.reviewId` đã chuẩn bị sẵn |
| Coupons | Thêm collection `coupons` | `orders.discountAmount`, `orders.couponCode` đã có |
| Banners | Thêm collection `banners` | Không ảnh hưởng |
| Blog | Thêm collection `blog_posts` | Không ảnh hưởng |
| Notifications | Thêm collection `notifications` { userId, type, data, isRead } | Không ảnh hưởng |
| Multi-address | `shipping_addresses` đã tách riêng từ Phase 1 | Chỉ cần update frontend |
| Related products | Thêm field `relatedProductIds: [ObjectId]` vào `products` | Additive, không breaking |
| Advanced filter | Index đã đủ, chỉ cần update query logic | Không ảnh hưởng |

### Phase 3 → Mở rộng từ schema Phase 1 & 2

| Feature | Cách mở rộng | Tác động schema Phase 1 |
|---|---|---|
| Online payment | Thêm collection `payment_transactions` | `orders.paymentMethod`, `paymentStatus`, `paymentRef` đã có |
| Multi-warehouse | Thêm collection `warehouses`; sửa `inventory` unique key từ `variantId` thành `(variantId, warehouseId)` | `inventory.warehouseId: "default"` đã chuẩn bị sẵn |
| Inventory transactions | Thêm collection `inventory_transactions` | Không ảnh hưởng |
| Flash sale | Thêm collection `promotions`; `product_variants.originalPrice` đã có để hiện giảm giá | Không ảnh hưởng |
| Staff permissions | Tách collection `roles`, `permissions`; thêm `users.roleIds` | `users.role` String → migrate sang array |
| Audit logs | Thêm collection `audit_logs` (stream-only, write-heavy) | Không ảnh hưởng |
| Loyalty/Points | `users.loyaltyPoints` đã có default 0 | Chỉ cần bắt đầu dùng |
| Shipping integration | `orders.shippingProvider`, `orders.trackingCode` đã có | Chỉ cần populate |

---

## 12. FINAL RECOMMENDATIONS

### Lời khuyên kiến trúc

1. **Dùng transactions MongoDB (multi-document)** cho luồng tạo order: tạo order + cập nhật inventory.reserved phải atomic. MongoDB 4.0+ hỗ trợ ACID transactions cho replica set.

2. **OrderCode generation**: Dùng format `ORD-YYYYMMDD-XXXX` (counter theo ngày) hoặc nanoid ngắn. Lưu counter vào collection `counters` nếu cần auto-increment.

3. **Snapshot tại thời điểm mua**: `order_items` lưu snapshot giá, tên, ảnh — KHÔNG reference sang product/variant để lấy realtime. Sản phẩm sau này có thể đổi giá, xoá — đơn hàng cũ phải giữ nguyên.

4. **Slug generation**: Dùng thư viện `slugify` với locale tiếng Việt (`vi`) để chuyển "Điện thoại" → "dien-thoai". Đảm bảo unique bằng suffix `-2`, `-3` nếu bị trùng.

5. **Soft delete**: Luôn filter `deletedAt: null` trong mọi query thông thường. Tạo partial index hoặc selectively index chỉ những document chưa xoá.

6. **Admin email notification**: Gửi email async (queue hoặc fire-and-forget), KHÔNG block response trả về cho khách sau khi đặt hàng thành công.

### Lỗi thiết kế thường gặp cần tránh

| Lỗi | Hậu quả | Cách tránh |
|---|---|---|
| Nhét tất cả specs vào 1 object cứng trong products | Không filter được, không thêm loại sp mới | Dùng `attribute_definitions` + `specs: [{attributeId, value}]` |
| Lưu giá realtime trong order_items (reference) | Đơn hàng cũ bị sai giá khi sp thay đổi | **Snapshot** giá tại thời điểm mua |
| Không có field `reserved` trong inventory | Oversell — nhiều người mua cùng 1 lúc | `reserved` giữ chỗ khi order pending |
| Embed order_items vào orders document | Document quá lớn, không query được theo product | Tách collection `order_items` |
| Không đặt TTL index cho guest cart | Database đầy cart rác của guest | `expiresAt` + TTL index |
| Hardcode role là boolean `isAdmin` | Không mở rộng được khi có thêm role | Dùng String enum, sau migrate sang array |
| Không có `attributeSlug` denormalized trong variant.attributes | Mỗi filter query phải lookup attribute_definitions | Denormalize `attributeSlug` vào variant |
| Tạo index cho mọi field | Tốn RAM, write chậm | Index chỉ những field thực sự query/sort |
| Không có `deletedAt` (hard delete) | Mất dữ liệu, không recovery được | Soft delete tất cả collections quan trọng |
| Không snapshot địa chỉ vào order | Địa chỉ thay đổi → đơn cũ sai địa chỉ | Embed shippingAddress snapshot vào orders |

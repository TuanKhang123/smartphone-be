# HƯỚNG DẪN PHÂN TÍCH & THIẾT KẾ DATABASE CHO WEBSITE BÁN ĐIỆN THOẠI & PHỤ KIỆN
## (MongoDB - Phase 1 với tư duy mở rộng Phase 2/3)

> **Tài liệu này không chỉ đưa ra database cuối cùng.**
> Mục tiêu là dạy bạn **CÁCH SUY NGHĨ** để tự phân tích requirement và nhìn ra database.
> Mỗi quyết định thiết kế đều được giải thích **vì sao**, không phải chỉ **cái gì**.

---

# PHẦN 1: PHƯƠNG PHÁP PHÂN TÍCH DATABASE (THỨ TỰ 9 BƯỚC)

Trước khi bắt tay vào phân tích requirement cụ thể, bạn cần hiểu **quy trình chuẩn** để phân tích database. Đây là thứ tự mà một Database Architect sẽ đi qua:

```
Bước 1: Xác định Actors (Ai sử dụng hệ thống?)
Bước 2: Xác định Features (Họ làm gì?)
Bước 3: Tìm Entities từ Features (Danh từ nào xuất hiện?)
Bước 4: Tách Entity chính / phụ (Cái nào là core, cái nào hỗ trợ?)
Bước 5: Xác định Relationships (Chúng liên quan nhau thế nào?)
Bước 6: Xác định Fields (Mỗi entity cần lưu gì?)
Bước 7: Xác định Status / Enum (Trạng thái nào cần quản lý?)
Bước 8: Xác định Index (Query nào cần nhanh?)
Bước 9: Kiểm tra khả năng mở rộng Phase 2/3 (Thiết kế có bị "chặn" không?)
```

> **Tại sao thứ tự này quan trọng?**
> Nếu bạn nhảy thẳng vào viết schema mà chưa hiểu actors và features, bạn sẽ thiếu collection hoặc thiết kế sai quan hệ. Giống như xây nhà mà chưa vẽ bản thiết kế vậy.

---

# PHẦN 2: BƯỚC 1 — XÁC ĐỊNH ACTORS

## Câu hỏi cần đặt ra:
> "Ai sẽ tương tác với hệ thống này? Mỗi người có quyền gì khác nhau?"

## Phân tích từ requirement:

Đọc requirement, tôi thấy:
- *"Website cho người dùng mua hàng"* → có **người dùng cuối (end user)**
- *"Trang quản trị cho admin"* → có **admin**
- *"Đặt hàng nhanh không cần đăng nhập"* → có **guest (khách vãng lai)**
- *"Đăng ký, đăng nhập"* → có **registered user (người dùng đã đăng ký)**

### Kết luận Actors Phase 1:

| Actor | Mô tả | Cần lưu DB không? |
|-------|--------|-------------------|
| **Guest** | Người xem website, có thể đặt hàng không cần tài khoản | Không cần collection riêng cho guest, nhưng cần lưu thông tin liên hệ khi đặt hàng |
| **Registered User** | Người đã đăng ký tài khoản, đăng nhập, có lịch sử đơn hàng | Cần collection `users` |
| **Admin** | Quản lý toàn bộ hệ thống | Cũng nằm trong `users` nhưng có role khác |

> **Suy luận quan trọng:**
> Guest không phải là user trong database. Guest chỉ cần lưu thông tin liên hệ **gắn với đơn hàng**. Nếu bạn tạo collection `guests` riêng, bạn sẽ phải quản lý thêm một entity không cần thiết. Thay vào đó, thông tin guest sẽ được lưu **trong order** hoặc **trong một sub-document liên quan đến order**.

---

# PHẦN 3: BƯỚC 2 — XÁC ĐỊNH FEATURES

## Câu hỏi cần đặt ra:
> "Mỗi actor có thể làm gì trên hệ thống? Liệt kê từng hành động."

### Features của End User (Guest + Registered):

| # | Feature | Dòng requirement gốc |
|---|---------|----------------------|
| U1 | Đăng ký tài khoản | *"Đăng ký"* |
| U2 | Đăng nhập | *"Đăng nhập"* |
| U3 | Xem trang chủ | *"Xem trang chủ"* |
| U4 | Xem danh sách sản phẩm | *"Xem danh sách sản phẩm"* |
| U5 | Tìm kiếm sản phẩm | *"Tìm kiếm theo tên sản phẩm"* |
| U6 | Filter sản phẩm (tên, giá, brand, category, stock, màu, bộ nhớ) | *"Filter cơ bản..."* |
| U7 | Xem chi tiết sản phẩm | *"Xem chi tiết sản phẩm"* |
| U8 | Chọn biến thể (màu, bộ nhớ...) | *"Chọn biến thể sản phẩm"* |
| U9 | Thêm vào giỏ hàng | *"Thêm giỏ hàng"* |
| U10 | Wishlist | *"Wishlist"* |
| U11 | Đặt hàng (guest) | *"Đặt hàng nhanh không cần đăng nhập"* |
| U12 | Đặt hàng (logged-in) | *"Đặt hàng khi đã đăng nhập"* |
| U13 | Xem lịch sử đơn hàng | *"Xem lịch sử đơn hàng cơ bản"* |
| U14 | Tra cứu đơn hàng bằng SĐT/mã đơn | *"nhập sđt hoặc mã đơn hàng vào để xem..."* |
| U15 | Liên hệ Zalo hỗ trợ | *"Có nút hỗ trợ zalo..."* |

### Features của Admin:

| # | Feature | Dòng requirement gốc |
|---|---------|----------------------|
| A1 | Đăng nhập admin | *"Đăng nhập admin"* |
| A2 | Dashboard cơ bản | *"Dashboard cơ bản"* |
| A3 | Quản lý user | *"Quản lý user"* |
| A4 | Quản lý category | *"Quản lý category"* |
| A5 | Quản lý brand | *"Quản lý brand"* |
| A6 | Quản lý product | *"Quản lý product"* |
| A7 | Quản lý product variant | *"Quản lý product variant"* |
| A8 | Quản lý product images | *"Quản lý product images"* |
| A9 | Quản lý product specs | *"Quản lý product specs / technical attributes"* |
| A10 | Quản lý tồn kho | *"Quản lý tồn kho cơ bản"* |
| A11 | Quản lý đơn hàng | *"Quản lý đơn hàng"* |
| A12 | Cập nhật trạng thái đơn | *"Cập nhật trạng thái đơn hàng"* |
| A13 | Nhận thông báo đơn hàng mới | *"cách để thông báo đến admin..."* |

---

# PHẦN 4: BƯỚC 3 — TÌM ENTITIES TỪ FEATURES

## Phương pháp: "Gạch chân danh từ"

Đây là kỹ thuật kinh điển: **Đọc lại tất cả features, gạch chân mọi danh từ**. Mỗi danh từ là một **ứng viên** cho entity/collection.

Hãy cùng đọc lại:

- *"Đăng ký **tài khoản**"* → **User**
- *"Xem danh sách **sản phẩm**"* → **Product**
- *"Filter theo **brand**"* → **Brand**
- *"Filter theo **category**"* → **Category**
- *"Chọn **biến thể** sản phẩm"* → **Product Variant**
- *"Thêm vào **giỏ hàng**"* → **Cart**
- *"**Wishlist**"* → **Wishlist**
- *"Đặt **đơn hàng**"* → **Order**
- *"**Lịch sử đơn hàng**"* → vẫn là Order (query theo user)
- *"Quản lý **product images**"* → **Product Image**
- *"Quản lý **product specs**"* → **Product Spec**
- *"Quản lý **tồn kho**"* → **Inventory**
- *"**Dashboard**"* → Không phải entity, là aggregation từ data khác
- *"**Role** admin/user"* → **Role** (hoặc field trong User)
- *"Thông tin liên hệ **guest** khi đặt hàng"* → embed trong Order

### Danh sách Entities ứng viên:

```
1.  User (OK)
3.  Product (OK)
7.  Category (OK)
8.  Brand (OK)
12. Order (OK)

2.  Role (KO)
4.  Product Variant
5.  Product Image
6.  Product Spec
9.  Cart
10. Cart Item
11. Wishlist
13. Order Item
14. Inventory 
15. Settings (Zalo link, thông tin cửa hàng...)
```

> **Lưu ý:** Không phải mọi danh từ đều trở thành collection. Bước tiếp theo sẽ giúp bạn quyết định cái nào **tách riêng**, cái nào **embed**, cái nào **gộp**.

---

# PHẦN 5: BƯỚC 4 — TÁCH ENTITY CHÍNH / PHỤ

## Câu hỏi cần đặt ra:
> "Entity nào là trung tâm (core)? Entity nào chỉ phục vụ cho entity khác (supporting)?"

### Cách phân loại:

**Entity CHÍNH (Core)** — Tồn tại độc lập, nhiều entity khác phụ thuộc vào nó:
- **User** — trung tâm của auth, order, wishlist, cart
- **Product** — trung tâm của toàn bộ catalog
- **Order** — trung tâm của luồng mua hàng
- **Category** — phân loại sản phẩm
- **Brand** — thương hiệu sản phẩm

**Entity PHỤ (Supporting)** — Phụ thuộc vào entity chính, không tồn tại một mình:
- **Product Variant** — phụ thuộc Product (không có variant nào mà không thuộc product)
- **Product Image** — phụ thuộc Product
- **Product Spec** — phụ thuộc Product
- **Cart / Cart Item** — phụ thuộc User (hoặc session)
- **Wishlist** — phụ thuộc User
- **Order Item** — phụ thuộc Order
- **Inventory** — phụ thuộc Product Variant

**Entity HỖ TRỢ (Utility):**
- **Settings** — cấu hình hệ thống (Zalo link, thông tin store...)

> **Tại sao phân loại này quan trọng?**
> Nó giúp bạn quyết định: Entity phụ có nên **embed** vào entity chính không? Hay nên **tách riêng**?
> Quy tắc ngón tay cái: Nếu entity phụ **ít dữ liệu** và **luôn được query cùng entity chính** → embed. Nếu **nhiều dữ liệu** hoặc **cần query độc lập** → tách riêng.

---

# PHẦN 6: BƯỚC 5 — PHÂN TÍCH TỪNG FLOW VÀ XÁC ĐỊNH RELATIONSHIPS

Đây là phần quan trọng nhất. Chúng ta sẽ đi qua từng flow thực tế và xem **dữ liệu chảy qua đâu**.

---

## FLOW 1: Đăng ký / Đăng nhập

### Requirement gốc:
*"Đăng ký, Đăng nhập, Phân role user (guest, registered user, admin)"*

### Suy luận:
- Người dùng đăng ký → tạo document trong `users`
- Đăng nhập → query `users` theo email/phone + password
- Phân role → cần biết user là admin hay user thường

### Câu hỏi thiết kế: Role nên là field hay collection riêng?

**Phân tích:**
- Phase 1 chỉ có 2 role: `admin` và `user`
- Requirement không nói gì về quản lý role phức tạp (tạo role mới, gán permission...)
- Nếu tạo collection `roles` riêng cho 2 giá trị → over-engineering

**Quyết định:** Phase 1 dùng **field `role` kiểu string** trong `users`. Đơn giản, đủ dùng.

**Nhưng** — để Phase 2/3 có thể mở rộng (thêm role `editor`, `manager`, permission phức tạp), ta thiết kế field `role` là string thay vì boolean `isAdmin`. Vì sao?
- `isAdmin: true/false` → chỉ hỗ trợ 2 trạng thái, Phase 2 muốn thêm role phải refactor
- `role: "admin"` → có thể thêm `"editor"`, `"manager"` mà không đổi cấu trúc

> **Bài học:** Luôn chọn thiết kế **linh hoạt hơn một chút** mà không phức tạp hơn nhiều.

### Collection cần có: `users`

### Fields cơ bản:
```
_id          : ObjectId (tự sinh bởi MongoDB)
email        : String, required, unique — để đăng nhập 
phone        : String, unique — để tra cứu đơn hàng, liên hệ
password     : String, required — hash, không bao giờ lưu plain text
fullName     : String, required — tên hiển thị
role         : String, enum ["user", "admin"], default "user"
status       : String, enum ["active", "inactive", "blocked"], default "active"
isDeleted    : Boolean, default false — soft delete
createdAt    : Date
updatedAt    : Date
```

### Vì sao mỗi field tồn tại:
| Field | Sinh ra từ requirement nào |
|-------|---------------------------|
| email | Đăng ký, đăng nhập |
| phone | *"nhập sđt để xem đơn hàng"*, liên hệ |
| password | Đăng nhập |
| fullName | Hiển thị tên user, quản lý user |
| role | *"Phân role user"*, *"admin quản lý toàn bộ"* |
| status | *"Quản lý user"* — admin cần block/deactivate user |
| isDeleted | Nguyên tắc soft delete |

### Quan hệ:
- `users` → `orders` (1 user có nhiều orders)
- `users` → `carts` (1 user có 1 cart)
- `users` → `wishlists` (1 user có 1 wishlist)

---

## FLOW 2: Admin quản lý Category & Brand

### Requirement gốc:
*"Quản lý category", "Quản lý brand", "Filter theo brand", "Filter theo category"*

### Suy luận:

**Category (Danh mục):**
- Sản phẩm được phân thành nhóm: Điện thoại, Tai nghe, Sạc/cáp, Đồng hồ thông minh...
- Admin cần CRUD category
- User cần filter sản phẩm theo category
- Trang chủ có thể hiển thị danh mục

**Tại sao Category phải là collection riêng?**
- Nếu embed category name vào product (ví dụ `product.category = "Điện thoại"`) → khi đổi tên category, phải update **tất cả products** thuộc category đó → rất tốn kém
- Nếu tách riêng → đổi tên chỉ update 1 document trong `categories`, product chỉ reference bằng `categoryId`

**Brand (Thương hiệu):**
- Tương tự category: Apple, Samsung, Xiaomi, Anker...
- Admin cần CRUD brand
- User cần filter theo brand

**Tại sao Brand phải là collection riêng?**
- Lý do tương tự category: tránh data duplication, dễ quản lý
- Brand có thể có thêm thông tin riêng: logo, mô tả, website...

### Collection: `categories`

```
_id          : ObjectId
name         : String, required, unique — "Điện thoại", "Tai nghe"
slug         : String, required, unique — "dien-thoai", "tai-nghe" (cho URL)
description  : String, optional
image        : String, optional — URL ảnh đại diện
order        : Number, default 0 — thứ tự hiển thị
isActive     : Boolean, default true
isDeleted    : Boolean, default false
createdAt    : Date
updatedAt    : Date
```

> **Tại sao cần `slug`?**
> URL thân thiện: `/danh-muc/dien-thoai` thay vì `/danh-muc/6507a1b2c3d4e5f6a7b8c9d0`
> Tốt cho SEO và user experience.

> **Tại sao cần `order`?**
> Admin muốn sắp xếp thứ tự hiển thị danh mục trên trang chủ. Không có field này, bạn phải sort theo tên hoặc ngày tạo — không linh hoạt.

### Collection: `brands`

```
_id          : ObjectId
name         : String, required, unique — "Apple", "Samsung"
slug         : String, required, unique — "apple", "samsung"
logo         : String, optional — URL logo
description  : String, optional
isActive     : Boolean, default true
isDeleted    : Boolean, default false
createdAt    : Date
updatedAt    : Date
```

### Quan hệ:
- `products.categoryId` → reference tới `categories._id`
- `products.brandId` → reference tới `brands._id`

### Câu hỏi: Category có cần hỗ trợ cây phân cấp (nested) không?

**Phân tích Phase 1:**
- Requirement chỉ nói "Quản lý category", không đề cập sub-category
- Sản phẩm gồm: Điện thoại, Tai nghe, Sạc/cáp... → flat list là đủ

**Nhưng Phase 2/3:**
- Có thể cần: Phụ kiện → Sạc → Sạc nhanh, Sạc không dây
- Nên thêm field `parentId` (nullable) ngay từ đầu

```
parentId     : ObjectId | null, default null — reference tới categories._id
```

- Phase 1: tất cả category có `parentId = null` (flat)
- Phase 2: bắt đầu tạo sub-category bằng cách set `parentId`
- Không phải thay đổi cấu trúc gì cả!

> **Bài học:** Thêm 1 field nullable có chi phí gần bằng 0 nhưng mở ra khả năng mở rộng rất lớn.

---

## FLOW 3: Quản lý sản phẩm (Product, Variant, Image, Specs)

### Đây là phần PHỨC TẠP NHẤT. Hãy đi thật chậm.

### Requirement gốc:
- *"Quản lý product, product variant, product images, product specs"*
- *"Sản phẩm: Điện thoại, Tai nghe, Sạc/cáp, Pin dự phòng, Đồng hồ, Ốp lưng..."*
- *"Không được nhét toàn bộ thông số vào một document products"*
- *"Cần hỗ trợ linh hoạt cho nhiều loại sản phẩm"*
- *"Chọn biến thể sản phẩm"*
- *"Filter theo màu, bộ nhớ"*

### Bài toán cốt lõi:
> Một chiếc iPhone 15 có nhiều phiên bản: 128GB Đen, 128GB Trắng, 256GB Đen, 256GB Trắng...
> Mỗi phiên bản có **giá khác nhau**, **tồn kho khác nhau**, **SKU riêng**.
> Nhưng chúng đều là "iPhone 15" — cùng mô tả, cùng thông số kỹ thuật chung.

### Vì sao cần tách Product và Product Variant?

**Nếu KHÔNG tách (gộp hết vào products):**
```
// ❌ Thiết kế SAI
{
  name: "iPhone 15 128GB Đen",
  price: 22000000,
  stock: 5
}
{
  name: "iPhone 15 128GB Trắng",
  price: 22000000,
  stock: 3
}
{
  name: "iPhone 15 256GB Đen",
  price: 25000000,
  stock: 2
}
```

**Vấn đề:**
1. Mô tả sản phẩm, thông số kỹ thuật bị **duplicate** ở mỗi document
2. Khi sửa mô tả iPhone 15, phải **update tất cả** document
3. Trên trang danh sách, muốn hiển thị "iPhone 15" 1 lần → phải **group** → phức tạp
4. Không phân biệt được đâu là product, đâu là variant

**Nếu TÁCH (đúng):**
```
// ✅ products
{
  _id: "prod_001",
  name: "iPhone 15",
  description: "Mô tả chung...",
  categoryId: "cat_phone",
  brandId: "brand_apple"
}

// ✅ product_variants
{ productId: "prod_001", color: "Đen",  storage: "128GB", price: 22000000, stock: 5 }
{ productId: "prod_001", color: "Trắng", storage: "128GB", price: 22000000, stock: 3 }
{ productId: "prod_001", color: "Đen",  storage: "256GB", price: 25000000, stock: 2 }
```

**Lợi ích:**
1. Mô tả chỉ lưu 1 lần ở product
2. Update mô tả = update 1 document
3. Danh sách sản phẩm = query `products`
4. Chi tiết sản phẩm = query 1 product + variants của nó

### Nhưng khoan — Variant nên EMBED hay REFERENCE?

Đây là câu hỏi quan trọng trong MongoDB design. Hãy phân tích:

#### Phương án A: Embed variants vào product
```
// products collection
{
  name: "iPhone 15",
  variants: [
    { sku: "IP15-BK-128", color: "Đen", storage: "128GB", price: 22000000, stock: 5 },
    { sku: "IP15-WH-128", color: "Trắng", storage: "128GB", price: 22000000, stock: 3 },
    // ...
  ]
}
```

**Ưu điểm:** Query 1 lần lấy được product + tất cả variants.
**Nhược điểm:**
- Admin cần "Quản lý product variant" riêng → khó CRUD variant đơn lẻ khi embed
- Tồn kho thay đổi thường xuyên → update array element phức tạp hơn update document
- Nếu product có 20+ variants → document phình to
- Khó thống kê, index trên variant fields (giá, stock, SKU)

#### Phương án B: Reference — tách `product_variants` riêng
```
// products collection
{ _id: "prod_001", name: "iPhone 15", ... }

// product_variants collection
{ _id: "var_001", productId: "prod_001", sku: "IP15-BK-128", ... }
{ _id: "var_002", productId: "prod_001", sku: "IP15-WH-128", ... }
```

**Ưu điểm:**
- CRUD variant dễ dàng (admin quản lý variant = thêm/sửa/xóa document)
- Index trên price, stock, SKU dễ dàng
- Document size ổn định
- Query linh hoạt: lấy variant rẻ nhất, filter theo price range...

**Nhược điểm:**
- Xem chi tiết sản phẩm cần 2 query (hoặc dùng `$lookup`)
- Nhưng đây là trade-off chấp nhận được vì product detail page không cần tốc độ cực cao

### **Quyết định: Tách `product_variants` riêng (Reference)**

> **Lý do chính:**
> 1. Requirement nói rõ "Quản lý product variant" — admin cần CRUD variant độc lập
> 2. "Quản lý tồn kho" — stock nằm ở variant, update thường xuyên
> 3. "Filter theo khoảng giá" — cần index trên price của variant
> 4. Phase 2/3 sẽ có flash sale, inventory transactions — variant cần là document riêng

---

### Vấn đề tiếp theo: Product Specs — mỗi loại sản phẩm có thông số khác nhau!

### Requirement gốc:
*"Điện thoại: màu, RAM, bộ nhớ. Đồng hồ: size, dây, kết nối. Tai nghe: phiên bản, kết nối. Sạc: cổng, công suất, chiều dài."*
*"Không được thiết kế kiểu nhét toàn bộ thông số vào một document products kiểu hard-code quá nhiều field cố định."*

### Phân tích bài toán:

Nếu bạn hard-code specs vào product:
```
// ❌ SAI — hard-code tất cả specs
{
  name: "iPhone 15",
  ram: "6GB",
  storage: "128GB",
  screenSize: "6.1 inch",
  battery: "3349mAh",
  cableLength: null,     // ← không áp dụng cho điện thoại!
  watchBandType: null,    // ← không áp dụng cho điện thoại!
  chargingPower: null     // ← không áp dụng cho điện thoại!
}
```

**Vấn đề:** Document sẽ có hàng chục fields null. Khi thêm loại sản phẩm mới → phải thêm field mới vào schema → không mở rộng được.

### Giải pháp: Key-Value Pattern cho specs

```
// product_specs collection
{ productId: "prod_001", key: "RAM",          value: "6GB",       group: "Hiệu năng",    order: 1 }
{ productId: "prod_001", key: "Bộ nhớ trong", value: "128GB",     group: "Hiệu năng",    order: 2 }
{ productId: "prod_001", key: "Màn hình",     value: "6.1 inch",  group: "Màn hình",      order: 1 }
{ productId: "prod_001", key: "Pin",          value: "3349mAh",   group: "Pin & Sạc",     order: 1 }
```

**Ưu điểm:**
- Mỗi loại sản phẩm có thể có specs hoàn toàn khác nhau
- Thêm loại sản phẩm mới không cần thay đổi schema
- Admin có thể quản lý specs linh hoạt

**Nhược điểm:**
- Nhiều document hơn
- Query phức tạp hơn một chút

### Nhưng khoan — nên EMBED hay REFERENCE specs?

**Phân tích:**
- Specs **chỉ được xem** trên trang chi tiết sản phẩm (luôn query cùng product)
- Specs **không cần filter** ở Phase 1 (Phase 1 chỉ filter màu, bộ nhớ — đó là thuộc tính variant, không phải specs)
- Mỗi product có khoảng 10-20 specs → size vừa phải
- Admin "Quản lý product specs" → cần CRUD

**Hai lựa chọn đều hợp lý:**

**Lựa chọn A — Embed specs vào product:**
```
// products collection
{
  name: "iPhone 15",
  specs: [
    { key: "RAM", value: "6GB", group: "Hiệu năng", order: 1 },
    { key: "Bộ nhớ", value: "128GB", group: "Hiệu năng", order: 2 }
  ]
}
```
✅ 1 query lấy product + specs
⚠️ Nhưng requirement nói rõ "Quản lý product specs" — admin CRUD

**Lựa chọn B — Tách `product_specs` riêng:**
```
// product_specs collection
{ productId: "prod_001", key: "RAM", value: "6GB", group: "Hiệu năng", order: 1 }
```
✅ Admin CRUD dễ
✅ Dễ mở rộng Phase 2 (filter theo specs)
⚠️ Cần thêm 1 query khi xem chi tiết

### **Quyết định: Tách `product_specs` riêng**

> **Lý do:**
> 1. Requirement nói rõ "Quản lý product specs / technical attributes" — cần CRUD riêng
> 2. Phase 2 có "Filter nâng cao hơn" — có thể cần filter theo specs
> 3. Tách riêng giúp admin interface quản lý dễ hơn
> 4. MongoDB document size tối đa 16MB — tuy specs nhỏ, nhưng kết hợp với images, variants embed thì có thể phình

---

### Product Images — Embed hay Reference?

### Requirement gốc:
*"Quản lý product images"*

### Phân tích:
- Mỗi product có nhiều ảnh (ảnh chính, ảnh chi tiết, ảnh từ nhiều góc)
- Ảnh có thể gắn với product chung hoặc gắn với variant cụ thể (ảnh màu Đen, ảnh màu Trắng)
- Admin cần CRUD ảnh riêng

### Quyết định: Tách `product_images` riêng

```
// product_images collection
{
  _id          : ObjectId,
  productId    : ObjectId, required — ảnh thuộc product nào
  variantId    : ObjectId | null — nếu ảnh thuộc variant cụ thể (ảnh màu Đen)
  url          : String, required — đường dẫn ảnh
  alt          : String, optional — mô tả ảnh (SEO, accessibility)
  isPrimary    : Boolean, default false — ảnh đại diện
  order        : Number, default 0 — thứ tự hiển thị
  isDeleted    : Boolean, default false
  createdAt    : Date
  updatedAt    : Date
}
```

**Vì sao tách riêng?**
1. "Quản lý product images" → admin cần CRUD
2. Ảnh có thể gắn với variant → cần `variantId` reference
3. Upload/delete ảnh là thao tác thường xuyên
4. Embed ảnh vào product sẽ làm document products rất lớn (nếu mỗi product có 10+ ảnh)

---

### Tổng kết: Mô hình Product

```
┌──────────────┐
│   products   │ ← Thông tin chung: tên, mô tả, brand, category
└──────┬───────┘
       │
       │ 1:N (reference by productId)
       ├───────────────────────────────┐
       │                               │
┌──────┴──────────┐    ┌──────────────┴───────────┐
│ product_variants│    │     product_specs         │
│ (SKU, giá, tồn) │    │ (key-value thông số)      │
└──────┬──────────┘    └──────────────────────────┘
       │
       │ 1:N (variantId, optional)
       │
┌──────┴──────────┐
│ product_images  │
│ (ảnh sản phẩm)  │
└─────────────────┘
```

### Collection: `products`

```
_id              : ObjectId
name             : String, required — "iPhone 15", "AirPods Pro 2"
slug             : String, required, unique — "iphone-15", "airpods-pro-2"
description      : String — mô tả chi tiết (có thể HTML/markdown)
shortDescription : String — mô tả ngắn cho danh sách
categoryId       : ObjectId, required — reference → categories._id
brandId          : ObjectId, required — reference → brands._id
basePrice        : Number — giá tham khảo (giá thấp nhất hoặc giá gốc)
status           : String, enum ["draft", "active", "inactive"], default "draft"
isFeatured       : Boolean, default false — sản phẩm nổi bật trang chủ
tags             : [String] — tags phụ trợ tìm kiếm
isDeleted        : Boolean, default false
createdAt        : Date
updatedAt        : Date
```

**Giải thích từng field:**
| Field | Vì sao cần | Requirement gốc |
|-------|-----------|-----------------|
| name | Hiển thị, tìm kiếm | *"Tìm kiếm theo tên"* |
| slug | URL thân thiện, SEO | Implicit — chuẩn e-commerce |
| description | Trang chi tiết SP | *"Xem chi tiết sản phẩm"* |
| shortDescription | Danh sách SP | *"Xem danh sách sản phẩm"* |
| categoryId | Filter, phân loại | *"Filter theo category"* |
| brandId | Filter, phân loại | *"Filter theo brand"* |
| basePrice | Hiển thị giá ở danh sách, sort/filter | *"Filter theo khoảng giá"* |
| status | Admin quản lý | *"Quản lý product"* |
| isFeatured | Trang chủ | *"Xem trang chủ"* |
| tags | Tìm kiếm mở rộng | Phase 2 ready |

> **Tại sao có `basePrice` ở product khi giá thực nằm ở variant?**
> Vì khi hiển thị danh sách sản phẩm, bạn cần hiện giá mà không phải query tất cả variants. `basePrice` là giá tham khảo (thường là giá thấp nhất). Admin có thể set thủ công hoặc hệ thống tự tính từ variants.

### Collection: `product_variants`

```
_id              : ObjectId
productId        : ObjectId, required — reference → products._id
sku              : String, required, unique — "IP15-BK-128"
name             : String — "128GB - Đen" (label hiển thị)
attributes       : Object — { color: "Đen", storage: "128GB" }
price            : Number, required — giá bán thực tế
originalPrice    : Number — giá gốc (nếu đang giảm giá)
stock            : Number, default 0
lowStockThreshold: Number, default 5 — ngưỡng cảnh báo sắp hết
isActive         : Boolean, default true
isDeleted        : Boolean, default false
createdAt        : Date
updatedAt        : Date
```

**Giải thích quan trọng — Tại sao `attributes` là Object chứ không phải fields cứng?**

```
// Điện thoại
attributes: { color: "Đen", storage: "128GB" }

// Đồng hồ thông minh
attributes: { color: "Bạc", size: "44mm", band: "Sport Loop" }

// Tai nghe
attributes: { color: "Trắng", version: "USB-C" }

// Sạc
attributes: { type: "USB-C", power: "20W" }
```

Nếu dùng fields cứng (`color`, `storage`, `size`...), mỗi loại sản phẩm khác nhau sẽ có fields null. Dùng Object linh hoạt → mỗi variant chỉ lưu attributes phù hợp với loại sản phẩm đó.

> **Đây là lợi thế của MongoDB:** Schema-less cho phép `attributes` có structure khác nhau giữa các document. RDBMS không làm được điều này dễ dàng.

### Collection: `product_specs`

```
_id              : ObjectId
productId        : ObjectId, required — reference → products._id
group            : String — "Hiệu năng", "Màn hình", "Pin & Sạc"
key              : String, required — "RAM", "Dung lượng pin"
value            : String, required — "6GB", "3349mAh"
order            : Number, default 0 — thứ tự hiển thị trong group
createdAt        : Date
updatedAt        : Date
```

### Collection: `product_images`

```
_id              : ObjectId
productId        : ObjectId, required — reference → products._id
variantId        : ObjectId | null — nếu ảnh thuộc variant cụ thể
url              : String, required
alt              : String
isPrimary        : Boolean, default false
order            : Number, default 0
isDeleted        : Boolean, default false
createdAt        : Date
updatedAt        : Date
```

---

## FLOW 4: Xem danh sách sản phẩm & Filter

### Requirement gốc:
*"Xem danh sách sản phẩm, Tìm kiếm theo tên, Filter: tên, khoảng giá, brand, category, còn hàng/hết hàng, màu, bộ nhớ"*

### Phân tích query patterns:

Khi user mở trang danh sách:
```
GET /products?category=dien-thoai&brand=apple&minPrice=10000000&maxPrice=30000000&color=Đen
```

Hệ thống cần:
1. Filter `products` theo `categoryId`, `brandId`
2. Filter `product_variants` theo `price`, `attributes.color`, `stock > 0`
3. Join product + variant để hiển thị

**Đây là trade-off quan trọng:**
- Filter theo category, brand → query trên `products`
- Filter theo giá, màu, bộ nhớ → query trên `product_variants`
- Cần JOIN → dùng MongoDB `$lookup` hoặc application-level join

**Giải pháp thực tế cho Phase 1:**
- `basePrice` ở `products` cho phép filter giá sơ bộ mà không cần join
- Hoặc query variants trước, lấy `productId` list, rồi query products

> **Bài học:** Khi thiết kế database, luôn nghĩ: "Query phổ biến nhất sẽ chạy thế nào?"

### Index cần thiết cho flow này:
```
products: { categoryId: 1, status: 1, isDeleted: 1 }
products: { brandId: 1, status: 1, isDeleted: 1 }
products: { slug: 1 } — unique
products: { name: "text" } — text search
product_variants: { productId: 1, isActive: 1, isDeleted: 1 }
product_variants: { price: 1 }
product_variants: { sku: 1 } — unique
```

---

## FLOW 5: Xem chi tiết sản phẩm

### Requirement gốc:
*"Xem chi tiết sản phẩm, Chọn biến thể sản phẩm"*

### Phân tích data cần hiển thị:

Khi user mở `/san-pham/iphone-15`:

```
1. Product info:     query products WHERE slug = "iphone-15"
2. Variants:         query product_variants WHERE productId = product._id
3. Images:           query product_images WHERE productId = product._id
4. Specs:            query product_specs WHERE productId = product._id
5. Brand name:       từ brands WHERE _id = product.brandId
6. Category name:    từ categories WHERE _id = product.categoryId
```

→ Tổng cộng 4-6 queries. Trong MongoDB, có thể dùng `$lookup` để giảm xuống 1-2 queries. Hoặc ở application level, chạy parallel queries (không đợi tuần tự).

> **Tại sao chấp nhận nhiều query?**
> Vì trang chi tiết sản phẩm không phải trang high-traffic nhất (so với danh sách). Và mỗi query đều đơn giản, có index → nhanh. Trade-off này đổi lấy cấu trúc data clean, dễ maintain.

---

## FLOW 6: Giỏ hàng (Cart)

### Requirement gốc:
*"Thêm giỏ hàng"*

### Câu hỏi thiết kế: Cart nên thiết kế thế nào?

**Phân tích:**
- User thêm sản phẩm (cụ thể là variant) vào giỏ
- Mỗi user chỉ có 1 giỏ hàng tại 1 thời điểm
- Giỏ hàng có nhiều items
- Mỗi item = 1 variant + số lượng

**Phương án A: 1 collection `carts` với items embed**
```
// carts collection
{
  userId: "user_001",
  items: [
    { variantId: "var_001", quantity: 2 },
    { variantId: "var_005", quantity: 1 }
  ]
}
```
✅ 1 query lấy toàn bộ giỏ hàng
✅ Đơn giản
⚠️ Update quantity = update array element (hơi phức tạp nhưng OK)
⚠️ Giỏ hàng thường có < 20 items → embed OK

**Phương án B: 2 collections `carts` + `cart_items`**
```
// carts
{ _id: "cart_001", userId: "user_001" }

// cart_items
{ cartId: "cart_001", variantId: "var_001", quantity: 2 }
{ cartId: "cart_001", variantId: "var_005", quantity: 1 }
```
✅ CRUD item dễ
⚠️ 2 queries cho 1 thao tác

### **Quyết định: 1 collection `carts` với items embed**

> **Lý do:**
> 1. Giỏ hàng luôn được load toàn bộ (không bao giờ chỉ load 1 item)
> 2. Số items ít (< 50), document size nhỏ
> 3. Khi checkout, cần đọc toàn bộ cart → embed hiệu quả hơn
> 4. Đây là use case kinh điển cho embed trong MongoDB: **data luôn đi cùng nhau**

### Collection: `carts`

```
_id              : ObjectId
userId           : ObjectId, required, unique — 1 user = 1 cart
items            : Array of:
  {
    variantId    : ObjectId, required — reference → product_variants._id
    productId    : ObjectId, required — reference → products._id (để query thông tin SP)
    quantity     : Number, required, min 1
    addedAt      : Date
  }
updatedAt        : Date
```

> **Tại sao lưu cả `productId` trong cart item?**
> Khi hiển thị giỏ hàng, bạn cần tên sản phẩm (nằm ở `products`) và thông tin variant (nằm ở `product_variants`). Lưu `productId` giúp query nhanh hơn mà không cần đi qua variant → product.

### Câu hỏi: Guest có giỏ hàng không?

**Phân tích Phase 1:**
- Guest có thể "Đặt hàng nhanh không cần đăng nhập"
- Nhưng requirement nói tập trung vào "xem và tư vấn qua Zalo"
- Guest cart có thể lưu ở client-side (localStorage) ở Phase 1
- Phase 2/3 có thể thêm server-side guest cart bằng `sessionId` thay vì `userId`

**Quyết định Phase 1:** Cart chỉ cho logged-in user. Guest cart xử lý ở frontend (localStorage).

> **Tư duy mở rộng:** Collection `carts` đã có thể mở rộng bằng cách thêm field `sessionId` cho guest cart sau này mà không đổi cấu trúc.

---

## FLOW 7: Wishlist

### Requirement gốc:
*"Wishlist"*

### Phân tích:
- User đánh dấu sản phẩm yêu thích
- Tương tự bookmark
- Mỗi user có 1 wishlist
- Wishlist chứa danh sách product (không phải variant — user yêu thích "iPhone 15", không phải "iPhone 15 128GB Đen")

### Quyết định: Tách `wishlists` riêng

### Collection: `wishlists`

```
_id              : ObjectId
userId           : ObjectId, required, unique — 1 user = 1 wishlist
products         : Array of:
  {
    productId    : ObjectId — reference → products._id
    addedAt      : Date
  }
updatedAt        : Date
```

> **Tại sao embed products vào wishlist?**
> 1. Wishlist luôn load toàn bộ
> 2. Số items ít (hiếm ai wishlist > 100 sản phẩm)
> 3. Thao tác đơn giản: thêm/xóa productId
> 4. Tương tự logic như cart — data luôn đi cùng nhau

> **Tại sao tách wishlist riêng thay vì embed vào user?**
> 1. User document nên nhẹ (auth data, profile)
> 2. Wishlist có thể grow (50-100 items)
> 3. Tách riêng → query wishlist không cần load user data
> 4. Phase 2: thêm tính năng "wishlist sharing", notifications khi giảm giá → dễ mở rộng

---

## FLOW 8: Đặt hàng (Order Flow)

### Đây là flow phức tạp thứ 2 (sau Product). Hãy đi từng bước.

### Requirement gốc:
- *"Đặt hàng nhanh không cần đăng nhập"*
- *"Đặt hàng khi đã đăng nhập"*
- *"Thanh toán khi nhận hàng"* (COD — Phase 1 chỉ có phương thức này)
- *"Xem lịch sử đơn hàng"*
- *"Nhập sđt hoặc mã đơn hàng để xem đơn hàng"*
- *"Thông báo đến admin khi có đơn mới"*
- *"Quản lý đơn hàng, cập nhật trạng thái"*

### Luồng dữ liệu khi đặt hàng:

```
1. User chọn sản phẩm vào cart (hoặc mua ngay)
2. User nhập thông tin giao hàng:
   - Tên người nhận
   - Số điện thoại
   - Địa chỉ giao hàng
   - Ghi chú (nếu có)
3. Hệ thống tạo Order:
   - Copy thông tin sản phẩm vào order (tại thời điểm đặt)
   - Set trạng thái = "pending"
   - Sinh mã đơn hàng
4. Gửi thông báo cho admin
5. Admin xác nhận → processing → completed
```

### Câu hỏi thiết kế quan trọng: Order Items nên embed hay reference?

**Phân tích:**
- Khi xem đơn hàng, **luôn** cần xem chi tiết items
- Order items là **snapshot** tại thời điểm đặt hàng (giá, tên SP có thể thay đổi sau)
- Sau khi đặt, items không thay đổi (không CRUD riêng)
- Mỗi order thường có 1-10 items

### **Quyết định: Embed `items` vào `orders`**

> **Lý do quyết định:**
> 1. Items luôn được query cùng order
> 2. Items không cần CRUD riêng (đặt rồi là cố định)
> 3. Items là **snapshot data** — phải copy giá, tên tại thời điểm đặt
> 4. Số items ít → embed an toàn

### Nhưng khoan — Guest checkout vs Logged-in checkout?

**Logged-in user:**
- Có `userId` → gắn order vào user
- Xem lịch sử đơn hàng = query orders WHERE userId

**Guest:**
- Không có `userId`
- Nhập thông tin liên hệ trực tiếp
- Tra cứu đơn hàng bằng SĐT hoặc mã đơn

**Giải pháp:** Cả hai đều tạo order trong cùng collection `orders`. Sự khác biệt:
- Logged-in: `userId` có giá trị
- Guest: `userId = null`, thông tin liên hệ lưu trong `contactInfo`

### Collection: `orders`

```
_id              : ObjectId
orderCode        : String, required, unique — "ORD-20250430-001" (mã đơn đọc được)
userId           : ObjectId | null — null nếu guest checkout
contactInfo      : Object, required — thông tin liên hệ & giao hàng
  {
    fullName     : String, required
    phone        : String, required
    email        : String, optional
    address      : String, required
    province     : String
    district     : String
    ward         : String
    note         : String — ghi chú giao hàng
  }
items            : Array of:
  {
    productId    : ObjectId — reference (để link về product nếu cần)
    variantId    : ObjectId — reference
    productName  : String — ★ SNAPSHOT tại thời điểm đặt
    variantName  : String — ★ SNAPSHOT: "128GB - Đen"
    sku          : String — ★ SNAPSHOT
    price        : Number — ★ SNAPSHOT: giá tại thời điểm đặt
    quantity     : Number
    subtotal     : Number — price × quantity
    image        : String — ★ SNAPSHOT: URL ảnh sản phẩm
  }
totalAmount      : Number, required — tổng tiền
totalItems       : Number — tổng số lượng sản phẩm
paymentMethod    : String, enum ["cod"], default "cod" — Phase 1 chỉ COD
status           : String, enum [
                     "pending",      — chờ xác nhận
                     "confirmed",    — đã xác nhận
                     "processing",   — đang xử lý/giao
                     "completed",    — hoàn thành
                     "cancelled"     — đã hủy
                   ], default "pending"
statusHistory    : Array of:
  {
    status       : String
    changedAt    : Date
    changedBy    : ObjectId | null — admin nào đổi
    note         : String — lý do đổi trạng thái
  }
isDeleted        : Boolean, default false
createdAt        : Date
updatedAt        : Date
```

### Giải thích chi tiết:

**★ Tại sao phải SNAPSHOT dữ liệu vào order?**

Đây là nguyên tắc **CỰC KỲ QUAN TRỌNG** trong e-commerce:

```
// ❌ SAI — chỉ lưu reference
items: [
  { variantId: "var_001", quantity: 2 }
]
// → Nếu admin đổi giá sản phẩm từ 22tr → 25tr,
//   đơn hàng cũ sẽ hiển thị sai giá!

// ✅ ĐÚNG — snapshot data
items: [
  {
    variantId: "var_001",
    productName: "iPhone 15",
    price: 22000000,     // ← giá TẠI THỜI ĐIỂM ĐẶT
    quantity: 2,
    subtotal: 44000000
  }
]
// → Dù admin đổi giá, đơn hàng cũ vẫn đúng
```

> **Bài học:** Order là **hợp đồng mua bán**. Dữ liệu trong order phải là "ảnh chụp" tại thời điểm giao dịch, không phải reference có thể thay đổi.

**Tại sao `contactInfo` embed vào order thay vì tách collection?**
- Mỗi đơn hàng có thể giao đến địa chỉ khác nhau
- Thông tin liên hệ **gắn chặt** với đơn hàng cụ thể
- Guest checkout: không có user, chỉ có contact info
- Nếu tách `shipping_addresses` riêng → Phase 2 (lưu nhiều địa chỉ cho user)

**Tại sao có `statusHistory`?**
- Admin cần biết ai đổi trạng thái, khi nào
- Hỗ trợ truy vết, giải quyết tranh chấp
- Phase 3: audit logs đầy đủ sẽ mở rộng từ đây

**Tại sao `orderCode` thay vì chỉ dùng `_id`?**
- `_id` dạng ObjectId: `6507a1b2c3d4e5f6a7b8c9d0` → user không thể nhớ/nhập
- `orderCode` dạng `ORD-20250430-001` → user dễ tra cứu, đọc qua điện thoại cho nhân viên

---

## FLOW 9: Tồn kho (Inventory)

### Requirement gốc:
*"Quản lý tồn kho cơ bản", "Filter theo còn hàng/hết hàng", "Sản phẩm sắp hết hàng"*

### Câu hỏi: Inventory nên là collection riêng hay field trong variant?

**Phân tích Phase 1:**
- Tồn kho = số lượng stock của mỗi variant
- "Quản lý tồn kho cơ bản" = admin xem/sửa stock
- "Sắp hết hàng" = stock ≤ threshold

**Phase 1: `stock` đã nằm trong `product_variants`**
- `stock: Number` — số lượng hiện tại
- `lowStockThreshold: Number` — ngưỡng cảnh báo

→ Không cần collection `inventory` riêng ở Phase 1!

**Phase 3: "Inventory transactions đầy đủ"**
- Khi cần theo dõi nhập/xuất kho chi tiết (ai nhập, khi nào, số lượng)
- Lúc đó mới thêm collection `inventory_transactions`
- Field `stock` trong variant vẫn giữ làm "current stock" (denormalized)

```
// Phase 3 thêm:
// inventory_transactions collection
{
  variantId: ObjectId,
  type: "import" | "export" | "adjustment",
  quantity: Number,    // +10 (nhập) hoặc -1 (bán)
  note: String,
  createdBy: ObjectId,
  createdAt: Date
}
```

> **Bài học:** Không over-engineer. Phase 1 cần gì, làm nấy. Nhưng thiết kế sao cho Phase 3 chỉ **thêm collection mới**, không phải **sửa collection cũ**.

---

## FLOW 10: Dashboard Admin

### Requirement gốc:
*"Tổng số user, tổng số sản phẩm, tổng số đơn hàng, đơn hàng mới, sản phẩm sắp hết hàng, doanh thu cơ bản"*

### Câu hỏi: Cần collection riêng cho dashboard không?

**Phân tích:**
- Tổng số user → `db.users.countDocuments({ isDeleted: false })`
- Tổng số sản phẩm → `db.products.countDocuments({ isDeleted: false, status: "active" })`
- Tổng số đơn hàng → `db.orders.countDocuments({ isDeleted: false })`
- Đơn hàng mới → `db.orders.find({ status: "pending" }).sort({ createdAt: -1 })`
- SP sắp hết hàng → `db.product_variants.find({ stock: { $lte: "$lowStockThreshold" } })`
- Doanh thu → `db.orders.aggregate([{ $match: { status: "completed" } }, { $group: { _id: null, total: { $sum: "$totalAmount" } } }])`

**Kết luận Phase 1:** Tất cả đều query trực tiếp từ data có sẵn. **KHÔNG CẦN collection riêng cho dashboard.**

> Với lượng data Phase 1 (cửa hàng gia đình), các query count/aggregate này rất nhanh. Chỉ khi data lên hàng triệu documents mới cần pre-aggregate.

**Phase 2/3:** Khi cần dashboard nâng cao (biểu đồ theo ngày, so sánh tháng), có thể thêm:
- Collection `dashboard_snapshots` — lưu aggregate data theo ngày
- Hoặc dùng MongoDB Change Streams + aggregation pipeline

---

## FLOW 11: Settings & Thông báo

### Requirement gốc:
*"Nút hỗ trợ Zalo", "Thông báo đến admin khi có đơn mới"*

### Collection: `settings` (Key-Value store cho cấu hình)

```
_id              : ObjectId
key              : String, required, unique — "zalo_link", "store_phone", "store_name"
value            : Mixed — giá trị cấu hình
group            : String — "contact", "store", "notification"
description      : String — mô tả cho admin
updatedAt        : Date
```

**Ví dụ data:**
```
{ key: "zalo_link",       value: "https://zalo.me/0123456789",  group: "contact" }
{ key: "store_phone",     value: "0123 456 789",                group: "contact" }
{ key: "store_name",      value: "TechStore",                   group: "store" }
{ key: "store_address",   value: "123 Nguyễn Huệ, Q1, HCM",   group: "store" }
{ key: "admin_email",     value: "admin@techstore.vn",          group: "notification" }
```

> **Vì sao cần collection `settings`?**
> 1. Link Zalo, SĐT cửa hàng có thể thay đổi → admin tự cập nhật mà không cần sửa code
> 2. Phase 2/3: thêm cấu hình khác (banner, SEO, notification config...)
> 3. Key-value pattern rất linh hoạt

### Về thông báo đơn hàng mới cho admin:

**Khuyến nghị Phase 1 (đơn giản, hiệu quả):**

1. **Email notification** — Khi có đơn hàng mới, gửi email đến admin
   - Dùng service như SendGrid, Mailgun, hoặc Gmail SMTP
   - Đơn giản nhất, admin nhận notification trên điện thoại qua email

2. **Telegram Bot** (thay vì Zalo API vì Zalo API phức tạp hơn)
   - Tạo Telegram bot → gửi message khi có đơn mới
   - Admin nhận notification realtime trên điện thoại

> **Lưu ý:** Phần notification này thuộc về business logic/backend, không cần collection riêng ở Phase 1. Thông tin cần gửi đã nằm trong `orders`. Email admin lưu trong `settings`.

---

# PHẦN 7: BƯỚC 6 — TỔNG HỢP TẤT CẢ COLLECTIONS VÀ FIELDS

## Danh sách Collections Phase 1:

| # | Collection | Mục đích | Entity type |
|---|-----------|----------|-------------|
| 1 | `users` | Tài khoản, auth, role | Core |
| 2 | `categories` | Danh mục sản phẩm | Core |
| 3 | `brands` | Thương hiệu | Core |
| 4 | `products` | Sản phẩm chính | Core |
| 5 | `product_variants` | Biến thể (SKU, giá, tồn kho) | Supporting |
| 6 | `product_images` | Ảnh sản phẩm | Supporting |
| 7 | `product_specs` | Thông số kỹ thuật | Supporting |
| 8 | `carts` | Giỏ hàng (embed items) | Core |
| 9 | `wishlists` | Danh sách yêu thích (embed products) | Core |
| 10 | `orders` | Đơn hàng (embed items, contactInfo) | Core |
| 11 | `settings` | Cấu hình hệ thống | Utility |

**Tổng: 11 collections cho Phase 1**

---

# PHẦN 8: BƯỚC 7 — XÁC ĐỊNH STATUS / ENUM

## Tổng hợp tất cả trạng thái:

### 1. User Status
```
enum UserStatus = "active" | "inactive" | "blocked"
```
- `active`: hoạt động bình thường (default)
- `inactive`: tự tắt tài khoản (Phase 2)
- `blocked`: admin chặn (vi phạm, spam...)

### 2. User Role
```
enum UserRole = "user" | "admin"
```

### 3. Product Status
```
enum ProductStatus = "draft" | "active" | "inactive"
```
- `draft`: mới tạo, chưa publish lên website
- `active`: đang bán, hiển thị cho user
- `inactive`: tạm ẩn (không xóa, có thể bật lại)

> **Tại sao không có `out_of_stock`?**
> Vì trạng thái hết hàng **tính từ variants** (tất cả variants có stock = 0). Đây là trạng thái tính toán (computed), không phải trạng thái quản lý (managed). Nếu thêm `out_of_stock` vào product status, bạn phải đồng bộ nó với stock của variants → phức tạp, dễ sai.

### 4. Order Status
```
enum OrderStatus = "pending" | "confirmed" | "processing" | "completed" | "cancelled"
```
- `pending`: khách vừa đặt, chờ admin xác nhận
- `confirmed`: admin đã xác nhận, chuẩn bị hàng
- `processing`: đang giao hàng
- `completed`: đã giao thành công
- `cancelled`: đã hủy (kèm lý do)

### 5. Payment Method (Phase 1)
```
enum PaymentMethod = "cod"
```
Phase 3: thêm `"bank_transfer"`, `"momo"`, `"vnpay"`...

### 6. Stock Status (Computed — không phải field, mà là logic)
```
if (stock === 0) → "out_of_stock"
if (stock <= lowStockThreshold) → "low_stock"
if (stock > lowStockThreshold) → "in_stock"
```

---

# PHẦN 9: BƯỚC 8 — INDEXING STRATEGY

## Nguyên tắc đặt index:
> "Index field nào mà bạn **thường xuyên query WHERE, SORT, hoặc JOIN** trên đó."

## Danh sách Index quan trọng:

### users
```javascript
{ email: 1 }                          // unique — đăng nhập
{ phone: 1 }                          // unique — tra cứu đơn hàng
{ role: 1, status: 1 }                // admin filter users
```

### categories
```javascript
{ slug: 1 }                           // unique — URL
{ isActive: 1, isDeleted: 1 }         // list active categories
```

### brands
```javascript
{ slug: 1 }                           // unique — URL
{ isActive: 1, isDeleted: 1 }
```

### products
```javascript
{ slug: 1 }                           // unique — URL chi tiết SP
{ categoryId: 1, status: 1, isDeleted: 1 }  // filter by category
{ brandId: 1, status: 1, isDeleted: 1 }     // filter by brand
{ name: "text" }                       // text search
{ status: 1, isFeatured: 1 }          // trang chủ - SP nổi bật
{ createdAt: -1 }                      // sort mới nhất
```

### product_variants
```javascript
{ productId: 1, isActive: 1, isDeleted: 1 }  // lấy variants của 1 product
{ sku: 1 }                            // unique — mã SKU
{ price: 1 }                          // filter/sort by price
{ stock: 1 }                          // tìm SP hết/sắp hết hàng
```

### product_images
```javascript
{ productId: 1, isDeleted: 1, order: 1 }   // lấy ảnh của 1 product theo thứ tự
{ variantId: 1 }                       // lấy ảnh theo variant
```

### product_specs
```javascript
{ productId: 1, order: 1 }            // lấy specs của 1 product
```

### orders
```javascript
{ orderCode: 1 }                      // unique — tra cứu bằng mã đơn
{ userId: 1, createdAt: -1 }          // lịch sử đơn hàng user
{ "contactInfo.phone": 1 }            // tra cứu bằng SĐT
{ status: 1, createdAt: -1 }          // admin filter đơn theo trạng thái
{ createdAt: -1 }                      // dashboard: đơn mới nhất
```

### carts
```javascript
{ userId: 1 }                         // unique — lấy cart của user
```

### wishlists
```javascript
{ userId: 1 }                         // unique — lấy wishlist của user
```

### settings
```javascript
{ key: 1 }                            // unique — lấy setting by key
```

---

# PHẦN 10: BƯỚC 9 — KIỂM TRA KHẢ NĂNG MỞ RỘNG

## Phase 2: Mở rộng thế nào mà KHÔNG thay đổi collections hiện tại?

| Feature Phase 2 | Cách mở rộng | Collection mới / thay đổi |
|-----------------|-------------|--------------------------|
| **Review / Rating** | Thêm collection `reviews` với `productId`, `userId`, `rating`, `comment` | Thêm mới `reviews` |
| **Coupon / Promotion** | Thêm collection `coupons`. Thêm field `couponCode`, `discount` vào `orders` | Thêm mới `coupons`, thêm field vào orders |
| **Banner** | Thêm collection `banners` | Thêm mới `banners` |
| **Blog** | Thêm collection `posts`, `post_categories` | Thêm mới 2 collections |
| **Nhiều địa chỉ giao hàng** | Thêm collection `user_addresses` với `userId` | Thêm mới `user_addresses` |
| **Notifications** | Thêm collection `notifications` | Thêm mới `notifications` |
| **Related products** | Thêm field `relatedProducts: [ObjectId]` vào `products` | Thêm field |
| **Filter nâng cao** | Index thêm trên `product_specs`, `product_variants.attributes` | Thêm index |

> **Kiểm tra:** Không có feature Phase 2 nào yêu cầu **đổi cấu trúc** collection Phase 1. Tất cả đều là **thêm mới** → ✓ Thiết kế đạt yêu cầu.

## Phase 3: Mở rộng thế nào?

| Feature Phase 3 | Cách mở rộng |
|-----------------|-------------|
| **Thanh toán online** | Thêm collection `payment_transactions`. Mở rộng enum `paymentMethod` |
| **Vận chuyển** | Thêm collection `shipping_providers`, thêm field `shippingInfo` vào orders |
| **Inventory transactions** | Thêm collection `inventory_transactions` |
| **Flash sale** | Thêm collection `flash_sales` với reference tới variants |
| **Audit logs** | Thêm collection `audit_logs` |
| **Loyalty points** | Thêm collection `user_points`, `point_transactions` |

> **Kiểm tra:** Không cần redesign lại bất kỳ collection Phase 1 nào → ✓ Đạt yêu cầu.

---

# PHẦN 11: QUAN HỆ DỮ LIỆU TỔNG QUAN

## Sơ đồ quan hệ:

```
                    ┌──────────┐
                    │  users   │
                    └────┬─────┘
                         │
          ┌──────────────┼──────────────┐
          │              │              │
     ┌────┴────┐   ┌────┴─────┐  ┌─────┴─────┐
     │  carts  │   │ wishlists│  │  orders    │
     │(embed   │   │(embed    │  │(embed items│
     │ items)  │   │ products)│  │ & contact) │
     └─────────┘   └──────────┘  └────────────┘
          │                            │
          │ ref                        │ snapshot
          ▼                            ▼
   ┌──────────────┐            product data
   │   products   │◄──────────────────────────┐
   └──────┬───────┘                           │
          │                                   │
     ┌────┼────────────┐                      │
     │    │            │                      │
     ▼    ▼            ▼                      │
 variants images    specs                     │
     │                                        │
     │ ref                                    │
     ▼                                        │
 ┌──────────┐    ┌────────────┐               │
 │categories│    │   brands   │               │
 └──────────┘    └────────────┘               │

 ┌──────────┐
 │ settings │ (standalone)
 └──────────┘
```

## Tóm tắt chiến lược Embed vs Reference:

| Quan hệ | Kiểu | Lý do |
|---------|------|-------|
| Cart → Cart Items | **Embed** | Luôn load cùng nhau, ít items, 1 user = 1 cart |
| Wishlist → Products | **Embed** (chỉ productId) | Tương tự cart |
| Order → Order Items | **Embed** | Snapshot data, luôn load cùng, không CRUD riêng |
| Order → Contact Info | **Embed** | Gắn chặt với order cụ thể |
| Order → Status History | **Embed** | Timeline của 1 order |
| Product → Variants | **Reference** | Admin CRUD riêng, cần index price/stock, có thể nhiều |
| Product → Images | **Reference** | Admin CRUD riêng, có thể nhiều, gắn variant |
| Product → Specs | **Reference** | Admin CRUD riêng, key-value linh hoạt |
| Product → Category | **Reference** (categoryId) | Category thay đổi ít, nhiều products cùng category |
| Product → Brand | **Reference** (brandId) | Tương tự category |
| Cart Item → Variant | **Reference** (variantId) | Lấy thông tin realtime (giá, stock hiện tại) |

### Quy tắc tổng quát cho Embed vs Reference trong MongoDB:

```
┌────────────────────────────────────────────────────────────────┐
│                    KHI NÀO NÊN EMBED?                         │
├────────────────────────────────────────────────────────────────┤
│ ✓ Data luôn được đọc cùng nhau (1:few relationship)           │
│ ✓ Child data không cần query/filter độc lập                   │
│ ✓ Child data ít thay đổi sau khi tạo                         │
│ ✓ Số lượng child ít (< 50-100)                               │
│ ✓ Không cần CRUD riêng cho child                             │
│                                                                │
│ Ví dụ: cart items, order items, contact info, status history   │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│                  KHI NÀO NÊN REFERENCE?                       │
├────────────────────────────────────────────────────────────────┤
│ ✓ Child cần CRUD độc lập (admin quản lý riêng)               │
│ ✓ Child có thể nhiều (> 50-100)                              │
│ ✓ Cần index/query/filter trên child fields                   │
│ ✓ Child data thay đổi thường xuyên (stock, price)            │
│ ✓ Child được share giữa nhiều parent                         │
│ ✓ Tránh document quá lớn (MongoDB limit 16MB)                │
│                                                                │
│ Ví dụ: product variants, images, specs, categories, brands    │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│               KHI NÀO NÊN TÁCH COLLECTION RIÊNG?             │
├────────────────────────────────────────────────────────────────┤
│ ✓ Entity tồn tại độc lập (có lifecycle riêng)                │
│ ✓ Nhiều entity khác reference đến nó                         │
│ ✓ Cần quản lý (CRUD) riêng bởi admin                        │
│ ✓ Data có thể grow không giới hạn                            │
│                                                                │
│ Ví dụ: users, products, orders, categories, brands            │
└────────────────────────────────────────────────────────────────┘
```

---

# PHẦN 12: PRODUCT MODELING STRATEGY — GIẢI THÍCH SÂU

## Tại sao mô hình 4 collections cho product?

```
products + product_variants + product_specs + product_images
```

### So sánh với các mô hình khác:

**Mô hình 1: Tất cả trong 1 collection (❌ Quá đơn giản)**
```
{
  name: "iPhone 15",
  color: "Đen",
  storage: "128GB",
  price: 22000000,
  stock: 5,
  ram: "6GB",
  images: ["url1", "url2"],
  ...
}
```
- Duplicate dữ liệu giữa variants
- Hard-code fields cho mỗi loại SP
- Không scale

**Mô hình 2: Product + Variants (⚠️ OK nhưng chưa đủ)**
```
products: { name, description, ... }
product_variants: { productId, sku, price, stock, ... }
```
- Thiếu chỗ cho specs linh hoạt
- Ảnh gộp vào product → document lớn

**Mô hình 3: Product + Variants + Specs + Images (✅ Chúng ta chọn)**
```
products:          thông tin chung
product_variants:  SKU, giá, tồn kho, thuộc tính biến thể
product_specs:     thông số kỹ thuật (key-value linh hoạt)
product_images:    ảnh (có thể gắn variant)
```
- Linh hoạt cho mọi loại SP
- Admin CRUD từng phần riêng
- Clean, dễ maintain
- Scale tốt

### Ví dụ cụ thể cho từng loại sản phẩm:

**Điện thoại - iPhone 15:**
```
// products
{ name: "iPhone 15", categoryId: "cat_phone", brandId: "brand_apple", basePrice: 22000000 }

// product_variants
{ productId: "...", sku: "IP15-BK-128", attributes: { color: "Đen", storage: "128GB" }, price: 22000000, stock: 5 }
{ productId: "...", sku: "IP15-WH-256", attributes: { color: "Trắng", storage: "256GB" }, price: 25000000, stock: 3 }

// product_specs
{ productId: "...", group: "Màn hình", key: "Kích thước", value: "6.1 inch", order: 1 }
{ productId: "...", group: "Hiệu năng", key: "Chip", value: "A16 Bionic", order: 1 }
{ productId: "...", group: "Hiệu năng", key: "RAM", value: "6GB", order: 2 }

// product_images
{ productId: "...", variantId: null, url: "iphone15-front.jpg", isPrimary: true, order: 1 }
{ productId: "...", variantId: "var_black", url: "iphone15-black.jpg", order: 2 }
```

**Sạc nhanh - Anker 20W:**
```
// products
{ name: "Anker PowerPort III 20W", categoryId: "cat_charger", brandId: "brand_anker", basePrice: 350000 }

// product_variants (chỉ 1 variant vì không có biến thể)
{ productId: "...", sku: "ANK-PP3-20W", attributes: {}, price: 350000, stock: 20 }

// product_specs
{ productId: "...", group: "Thông số", key: "Cổng sạc", value: "USB-C", order: 1 }
{ productId: "...", group: "Thông số", key: "Công suất", value: "20W", order: 2 }
{ productId: "...", group: "Thông số", key: "Chuẩn sạc", value: "PD 3.0", order: 3 }
```

> **Lưu ý:** Sản phẩm không có biến thể (sạc, cáp...) vẫn có **1 variant** — đây gọi là "default variant". Lý do: giữ logic nhất quán. Giá và tồn kho **luôn** nằm ở variant, không ngoại lệ. Backend code không cần if/else kiểm tra "product có variant không".

---

# PHẦN 13: ORDER FLOW DATA MODEL — CHI TIẾT

## Luồng dữ liệu từ Cart → Checkout → Order:

### Bước 1: User thêm vào Cart
```
// Thao tác: Push item vào cart.items
db.carts.updateOne(
  { userId: currentUserId },
  { $push: { items: { variantId, productId, quantity: 1, addedAt: new Date() } } },
  { upsert: true }
)
```

### Bước 2: User vào trang Checkout
```
// Đọc cart
cart = db.carts.findOne({ userId: currentUserId })

// Lấy thông tin product + variant cho mỗi item (để hiển thị)
// → Query products + product_variants

// Kiểm tra:
// - Variant còn active không?
// - Stock đủ không?
// - Giá có thay đổi không?
```

### Bước 3: User nhập thông tin & xác nhận đặt hàng
```
// Tạo order (SNAPSHOT dữ liệu)
order = {
  orderCode: generateOrderCode(),    // "ORD-20250430-001"
  userId: currentUserId,             // null nếu guest
  contactInfo: { ... },              // từ form checkout
  items: cart.items.map(item => ({
    productId: item.productId,
    variantId: item.variantId,
    productName: product.name,       // ★ SNAPSHOT
    variantName: variant.name,       // ★ SNAPSHOT
    sku: variant.sku,                // ★ SNAPSHOT
    price: variant.price,            // ★ SNAPSHOT (giá tại thời điểm này)
    quantity: item.quantity,
    subtotal: variant.price * item.quantity,
    image: primaryImage.url          // ★ SNAPSHOT
  })),
  totalAmount: calculateTotal(items),
  paymentMethod: "cod",
  status: "pending",
  statusHistory: [{ status: "pending", changedAt: new Date(), note: "Đơn hàng mới" }]
}
db.orders.insertOne(order)
```

### Bước 4: Trừ tồn kho
```
// Với mỗi item trong order:
db.product_variants.updateOne(
  { _id: item.variantId },
  { $inc: { stock: -item.quantity } }
)
```

### Bước 5: Xóa cart (hoặc clear items)
```
db.carts.updateOne(
  { userId: currentUserId },
  { $set: { items: [] } }
)
```

### Bước 6: Gửi notification cho admin
```
// Email / Telegram notification với orderCode, tên khách, SĐT, tổng tiền
```

## Guest Checkout vs Logged-in Checkout:

| Aspect | Guest | Logged-in |
|--------|-------|-----------|
| Cart source | Frontend (localStorage) | Backend (`carts` collection) |
| `order.userId` | `null` | User's ObjectId |
| Contact info | Phải nhập đầy đủ | Có thể pre-fill từ user profile |
| Tra cứu đơn | Bằng orderCode hoặc SĐT | Trang "Lịch sử đơn hàng" |
| Wishlist | Không có | Có |

> **Lưu ý thiết kế:** Cả guest và logged-in đều tạo order trong **cùng collection `orders`**. Chỉ khác field `userId`. Không tạo collection riêng cho guest orders.

---

# PHẦN 14: WISHLIST & AUTH MODEL

## Auth Model:

```
users collection:
├── email (unique) ← đăng nhập
├── phone (unique) ← tra cứu đơn hàng
├── password (hashed) ← xác thực
├── role ← phân quyền
└── status ← quản lý tài khoản
```

- Đăng ký: tạo document `users` với role = "user"
- Đăng nhập: query bằng email, verify password hash
- Admin: role = "admin" (tạo sẵn trong DB hoặc qua seed script)
- Middleware sẽ check role để phân quyền (backend logic, không phải DB)

## Wishlist Model:

```
wishlists collection:
├── userId (unique) ← 1 user = 1 wishlist
└── products[] ← embed array of { productId, addedAt }
```

- Thêm sản phẩm: `$addToSet` (tránh duplicate)
- Xóa sản phẩm: `$pull`
- Kiểm tra đã wishlist chưa: check productId có trong array không

---

# PHẦN 15: DASHBOARD DATA STRATEGY

## Phase 1 — Query trực tiếp (realtime):

| Metric | Query | Collection |
|--------|-------|-----------|
| Tổng users | `users.countDocuments({ isDeleted: false })` | users |
| Tổng products | `products.countDocuments({ isDeleted: false, status: "active" })` | products |
| Tổng orders | `orders.countDocuments({ isDeleted: false })` | orders |
| Đơn hàng mới (pending) | `orders.find({ status: "pending" }).sort({ createdAt: -1 })` | orders |
| SP sắp hết hàng | `product_variants.find({ stock: { $lte: 5 }, isActive: true })` | product_variants |
| Doanh thu | `orders.aggregate([match completed, group sum totalAmount])` | orders |

**Tại sao realtime query đủ cho Phase 1?**
- Cửa hàng gia đình: vài trăm products, vài nghìn orders
- MongoDB đủ nhanh cho count/aggregate trên dataset nhỏ
- Không cần pre-aggregate hay materialized views

**Phase 2/3:** Khi data lớn, có thể:
1. Cache dashboard data (Redis hoặc in-memory)
2. Tạo collection `dashboard_snapshots` lưu aggregate theo ngày
3. Dùng MongoDB scheduled triggers để auto-aggregate

---

# PHẦN 16: DATABASE ANALYSIS MAP

## Feature → Entity → Collection → Main Fields → Relationship → Reason

| Feature | Entity | Collection | Main Fields | Relationship | Reason |
|---------|--------|-----------|-------------|-------------|--------|
| Đăng ký/Đăng nhập | User | `users` | email, phone, password, role, status | → carts, wishlists, orders | Core entity cho auth |
| Quản lý danh mục | Category | `categories` | name, slug, parentId, isActive | ← products.categoryId | Phân loại SP, filter |
| Quản lý thương hiệu | Brand | `brands` | name, slug, logo | ← products.brandId | Filter theo brand |
| Quản lý sản phẩm | Product | `products` | name, slug, categoryId, brandId, basePrice, status | → variants, images, specs | Core catalog entity |
| Chọn biến thể, giá, tồn kho | Variant | `product_variants` | productId, sku, attributes, price, stock | → products._id | SKU-level management |
| Ảnh sản phẩm | Image | `product_images` | productId, variantId, url, isPrimary | → products, variants | Visual content |
| Thông số kỹ thuật | Spec | `product_specs` | productId, group, key, value | → products._id | Flexible specs by category |
| Giỏ hàng | Cart | `carts` | userId, items[variantId, qty] | userId → users | Embed items, 1:1 with user |
| Wishlist | Wishlist | `wishlists` | userId, products[productId] | userId → users | Embed list, 1:1 with user |
| Đặt hàng (guest+user) | Order | `orders` | orderCode, userId, contactInfo, items[], status | userId → users (nullable) | Embed items as snapshots |
| Cấu hình hệ thống | Setting | `settings` | key, value, group | Standalone | Dynamic config |

---

# PHẦN 17: SAMPLE DOCUMENTS

## Để bạn hình dung rõ hơn data thực tế:

### products — iPhone 15
```json
{
  "_id": "ObjectId('prod_001')",
  "name": "iPhone 15",
  "slug": "iphone-15",
  "description": "<p>iPhone 15 với Dynamic Island, camera 48MP...</p>",
  "shortDescription": "iPhone 15 - Chip A16 Bionic, Camera 48MP",
  "categoryId": "ObjectId('cat_phone')",
  "brandId": "ObjectId('brand_apple')",
  "basePrice": 22000000,
  "status": "active",
  "isFeatured": true,
  "tags": ["iphone", "apple", "5g"],
  "isDeleted": false,
  "createdAt": "2025-04-30T10:00:00Z",
  "updatedAt": "2025-04-30T10:00:00Z"
}
```

### product_variants — iPhone 15 128GB Đen
```json
{
  "_id": "ObjectId('var_001')",
  "productId": "ObjectId('prod_001')",
  "sku": "IP15-BK-128",
  "name": "128GB - Đen",
  "attributes": {
    "color": "Đen",
    "storage": "128GB"
  },
  "price": 22000000,
  "originalPrice": 24000000,
  "stock": 5,
  "lowStockThreshold": 3,
  "isActive": true,
  "isDeleted": false,
  "createdAt": "2025-04-30T10:00:00Z",
  "updatedAt": "2025-04-30T10:00:00Z"
}
```

### orders — Đơn hàng guest
```json
{
  "_id": "ObjectId('ord_001')",
  "orderCode": "ORD-20250430-001",
  "userId": null,
  "contactInfo": {
    "fullName": "Nguyễn Văn A",
    "phone": "0901234567",
    "email": "nguyenvana@gmail.com",
    "address": "123 Nguyễn Huệ",
    "province": "TP. Hồ Chí Minh",
    "district": "Quận 1",
    "ward": "Phường Bến Nghé",
    "note": "Giao giờ hành chính"
  },
  "items": [
    {
      "productId": "ObjectId('prod_001')",
      "variantId": "ObjectId('var_001')",
      "productName": "iPhone 15",
      "variantName": "128GB - Đen",
      "sku": "IP15-BK-128",
      "price": 22000000,
      "quantity": 1,
      "subtotal": 22000000,
      "image": "https://cdn.example.com/iphone15-black.jpg"
    }
  ],
  "totalAmount": 22000000,
  "totalItems": 1,
  "paymentMethod": "cod",
  "status": "pending",
  "statusHistory": [
    {
      "status": "pending",
      "changedAt": "2025-04-30T14:30:00Z",
      "changedBy": null,
      "note": "Đơn hàng mới"
    }
  ],
  "isDeleted": false,
  "createdAt": "2025-04-30T14:30:00Z",
  "updatedAt": "2025-04-30T14:30:00Z"
}
```

---

# PHẦN 18: FINAL RECOMMENDATIONS

## 1. Tóm tắt mô hình:

- **11 collections** cho Phase 1 — đủ dùng, không thiếu, không thừa
- **Embed** khi data luôn đi cùng nhau và ít (cart items, order items, contact info)
- **Reference** khi cần CRUD riêng, query riêng, hoặc data có thể lớn (variants, images, specs)
- **Snapshot** data trong order — nguyên tắc bất biến cho e-commerce
- **Key-value** cho specs — linh hoạt cho mọi loại sản phẩm
- **Flexible attributes** cho variants — MongoDB schema-less advantage

## 2. Lỗi thiết kế thường gặp cần TRÁNH:

### ❌ Lỗi 1: Nhồi mọi thứ vào 1 collection
> "Mình cứ bỏ hết vào products cho nhanh" → Document 16MB, query chậm, maintain nightmare

### ❌ Lỗi 2: Tách quá nhiều collections (over-normalize)
> Giống RDBMS, tách `user_emails`, `user_phones`, `user_names` riêng → Quá nhiều joins, ngược lại philosophy của MongoDB

### ❌ Lỗi 3: Không snapshot data trong order
> Chỉ lưu `variantId` trong order item → Giá thay đổi = lịch sử đơn hàng sai hết

### ❌ Lỗi 4: Hard-code specs
> `ram`, `storage`, `screenSize` là fields cứng trong products → Thêm loại SP mới = thêm field = pain

### ❌ Lỗi 5: Không có soft delete
> Xóa thật = mất data. Admin xóa nhầm sản phẩm đang có đơn hàng → hệ thống lỗi

### ❌ Lỗi 6: Không có timestamps
> Không biết document tạo khi nào, sửa khi nào → debug nightmare

### ❌ Lỗi 7: Không có index
> Query đúng nhưng chậm kinh khủng khi data tăng

### ❌ Lỗi 8: Dùng boolean cho role
> `isAdmin: true/false` → Chỉ hỗ trợ 2 role. Đổi sang string `role: "admin"` linh hoạt hơn nhiều

### ❌ Lỗi 9: Trộn lẫn trạng thái managed vs computed
> Thêm `status: "out_of_stock"` vào product khi hết hàng tính từ variants → Phải sync 2 nơi, dễ inconsistent

### ❌ Lỗi 10: Over-engineering Phase 1
> Thiết kế payment gateway, shipping integration, audit log phức tạp ngay Phase 1 → Chậm delivery, phí thời gian

## 3. Nguyên tắc vàng:

> **"Thiết kế đúng cho hiện tại, để cửa mở cho tương lai."**
>
> Phase 1: làm đủ 11 collections, clean, đúng quan hệ.
> Phase 2: thêm collections mới, thêm fields.
> Phase 3: thêm collections nâng cao.
>
> Không bao giờ phải phá vỡ mô hình Phase 1.

---

# PHẦN 19: ASSUMPTIONS (GIẢ ĐỊNH)

## Business Assumptions:
1. Đây là cửa hàng gia đình, quy mô nhỏ-vừa (< 1000 sản phẩm, < 10000 đơn/tháng)
2. Phase 1 tập trung vào catalog (xem, tìm kiếm) và tư vấn qua Zalo
3. Chỉ có 1 phương thức thanh toán: COD
4. Không có hệ thống kho phức tạp (1 kho duy nhất)
5. Admin là 1-2 người (chủ cửa hàng)
6. Không cần multi-language
7. Không cần multi-currency (chỉ VNĐ)

## Technical Assumptions:
1. MongoDB Atlas hoặc self-hosted MongoDB 6.0+
2. Backend sẽ dùng Node.js (Express/NestJS) hoặc tương tự
3. Ảnh sản phẩm lưu trên cloud storage (S3, Cloudinary...), DB chỉ lưu URL
4. Password hash bằng bcrypt
5. Auth dùng JWT tokens
6. Text search dùng MongoDB text index (Phase 1), có thể nâng cấp Elasticsearch Phase 2/3
7. Không cần real-time features Phase 1 (websocket, live updates)

---

# PHẦN 20: PHASE-BASED THINKING

## Phase 1 — Focus:
- 11 collections cốt lõi
- CRUD đầy đủ cho admin
- Catalog + Cart + Order cơ bản
- Guest checkout hỗ trợ
- Dashboard từ aggregate queries

## Phase 2 — Impact lên DB:
- Thêm 5-7 collections mới (`reviews`, `coupons`, `banners`, `posts`, `user_addresses`, `notifications`)
- Thêm fields vào orders (`couponCode`, `discount`)
- Thêm fields vào products (`avgRating`, `reviewCount` — denormalized)
- Thêm indexes cho filter nâng cao
- **Không thay đổi cấu trúc collections Phase 1**

## Phase 3 — Impact lên DB:
- Thêm 5-8 collections nâng cao (`payment_transactions`, `shipping_providers`, `inventory_transactions`, `flash_sales`, `audit_logs`, `user_points`, `point_transactions`)
- Mở rộng enums (`paymentMethod`, `orderStatus`)
- Thêm fields vào orders (`paymentInfo`, `shippingInfo`, `trackingCode`)
- **Vẫn không thay đổi cấu trúc gốc Phase 1**

---

> **Kết luận:** Tài liệu này đã đi qua toàn bộ 9 bước phân tích database, từ xác định actors → fields → index → extensibility. Mỗi quyết định đều có giải thích **vì sao**. Bạn có thể dùng phương pháp này cho bất kỳ dự án e-commerce nào khác, không chỉ website bán điện thoại.
>
> **Bước tiếp theo:** Implement schema này trong Mongoose (hoặc MongoDB driver), viết seed data, và bắt đầu xây backend API theo từng flow đã phân tích.

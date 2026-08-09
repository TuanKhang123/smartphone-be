# PROMPT UI GENERATION — TanManh Shop E-Commerce Website
## (Dùng cho AI gen UI: v0, Cursor, Bolt, Lovable, hoặc bất kỳ frontend AI nào)

---

## ═══════════════════════════════════════════════════════
## MASTER CONTEXT — ĐỌC KỸ TRƯỚC KHI GEN BẤT KỲ TRANG NÀO
## ═══════════════════════════════════════════════════════

### Về dự án
Đây là website thương mại điện tử bán **điện thoại và phụ kiện công nghệ** cho một **cửa hàng gia đình** tại Việt Nam. Website có 2 phần riêng biệt:
1. **Storefront** — Website khách hàng mua hàng (giao diện public)
2. **Admin Panel** — Trang quản trị nội bộ cho chủ cửa hàng

### Tên thương hiệu & nhận diện
- **Tên cửa hàng**: TanManh Shop (hoặc thay bằng tên thực khi deploy)
- **Slogan**: "Công nghệ chính hãng – Giá tốt mỗi ngày"
- **Màu chủ đạo Storefront**: Xanh navy đậm (`#0F172A`) + Cam/Amber accent (`#F59E0B`) — gợi ý tech & tin cậy
- **Màu Admin Panel**: Neutral dark sidebar + clean white content area
- **Ngôn ngữ**: Tiếng Việt toàn bộ
- **Đơn vị tiền tệ**: VNĐ, format: `33.990.000 ₫`

### Stack kỹ thuật (để AI gen đúng code)
- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State management**: Zustand (cho cart, auth)
- **Icons**: Lucide React
- **Fonts**: Sử dụng Google Fonts — Gợi ý: `Be Vietnam Pro` cho toàn bộ UI (đẹp, hỗ trợ tiếng Việt tốt)
- **Database**: MongoDB (thiết kế đã có — xem phần Database Schema bên dưới)

### Kiến trúc Database (tóm tắt để AI hiểu nghiệp vụ)
```
Collections chính:
- users          → tài khoản, role: "user" | "admin"
- categories     → danh mục có cây cha-con
- brands         → thương hiệu
- attribute_definitions → thuộc tính linh hoạt (màu, RAM, bộ nhớ, v.v.)
- products       → sản phẩm gốc (tên, mô tả, category, brand, specs)
- product_variants → biến thể/SKU (giá, attributes, ảnh riêng)
- product_images → gallery ảnh
- inventory      → tồn kho theo variant (quantity, reserved, status)
- carts          → giỏ hàng (user + guest theo sessionId)
- wishlists      → yêu thích của user
- orders         → đơn hàng (có cả guest order)
- order_items    → chi tiết dòng sản phẩm trong đơn
- shipping_addresses → địa chỉ đã lưu của user
- settings       → cấu hình hệ thống (zalo link, admin email, v.v.)
```

### Nghiệp vụ quan trọng cần hiểu
1. **Sản phẩm có biến thể**: Một điện thoại có thể có nhiều variant (màu + dung lượng). Giá, ảnh, tồn kho quản lý ở cấp variant.
2. **Guest checkout**: Khách không cần tài khoản vẫn đặt được hàng.
3. **Thanh toán Phase 1**: CHỈ có COD và chuyển khoản ngân hàng. Không có cổng thanh toán online.
4. **Zalo support**: Mọi trang đều có nút Zalo cố định (fixed bottom-right) để khách liên hệ tư vấn.
5. **Thông báo đơn hàng**: Khi khách đặt hàng → gửi email thông báo đến admin. Admin vào panel xử lý thủ công.
6. **Tồn kho**: Hiển thị "Còn hàng" / "Sắp hết hàng" / "Hết hàng" theo inventory.status.
7. **Soft delete**: Mọi entity có `deletedAt` — không hiện data đã xoá.

---

## ═══════════════════════════════════════════════════════
## PHASE 1 — STOREFRONT (WEBSITE KHÁCH HÀNG)
## ═══════════════════════════════════════════════════════

### DESIGN DIRECTION — STOREFRONT
- **Aesthetic**: Clean tech commerce — tinh tế, hiện đại, chuyên nghiệp nhưng thân thiện
- **Layout**: Sidebar navigation trên mobile (hamburger), horizontal nav trên desktop
- **Màu sắc**: Navy đậm header/footer, trắng content area, amber accent cho CTA buttons, giá bán
- **Typography**: `Be Vietnam Pro` — Regular 400 cho body, SemiBold 600 cho tiêu đề, Bold 700 cho giá
- **Cards sản phẩm**: Ảnh tỉ lệ 4:5, tên 2 dòng max, giá nổi bật, badge "Hết hàng" overlay
- **Mobile-first**: Responsive hoàn toàn, touch-friendly

---

### [P1-S-01] LAYOUT CHUNG — STOREFRONT

**Mô tả**: Shell layout dùng chung cho toàn bộ storefront.

**Header** (sticky top):
- Logo TanManh Shop bên trái
- Navigation giữa: Trang chủ | Sản phẩm | Thương hiệu | Liên hệ
- Bên phải: Icon search, icon wishlist (badge số lượng), icon cart (badge số lượng), avatar/đăng nhập
- Mobile: Hamburger menu → drawer slide từ trái

**Footer**:
- Logo + tagline
- Cột: Sản phẩm | Thông tin | Hỗ trợ | Liên hệ
- Địa chỉ, SĐT, email cửa hàng
- Copyright

**Zalo Button** (fixed, bottom-right, luôn hiển thị):
- Icon Zalo màu xanh (#0068FF)
- Tooltip "Chat Zalo ngay"
- Link đến `settings["zalo_link"]`
- Animation pulse nhẹ để thu hút

**Tech stack**: Next.js App Router layout, `layout.tsx`

---

### [P1-S-02] TRANG CHỦ — HOME PAGE

**URL**: `/`

**Sections theo thứ tự từ trên xuống**:

1. **Hero Banner**
   - Full-width, height: 500px desktop / 300px mobile
   - Background: gradient navy + ảnh điện thoại flagship
   - Headline: "Điện thoại chính hãng – Giá tốt nhất"
   - Sub: "Tai nghe, sạc, phụ kiện đầy đủ"
   - CTA button: "Mua ngay" (amber) + "Liên hệ Zalo" (outline)
   - Phase 2: Sẽ có carousel banners từ collection `banners`

2. **Category Grid**
   - Title section: "Danh mục sản phẩm"
   - Grid 4 cols desktop / 2 cols mobile
   - Mỗi card: icon category + tên + số sản phẩm
   - Data: `categories.find({ parentId: null, status: "active" })`

3. **Sản phẩm nổi bật** (Featured Products)
   - Title: "Sản phẩm nổi bật"
   - Horizontal scroll trên mobile, grid 4 cols desktop
   - Lấy từ: `products.find({ isFeatured: true, status: "active" }).limit(8)`
   - Mỗi card: ảnh, tên, giá từ variant mặc định, badge thương hiệu

4. **Thương hiệu** (Brand logos)
   - Horizontal scroll logo strip
   - Data: `brands.find({ status: "active" })`

5. **Sản phẩm mới nhất**
   - Grid 4 cols, sort `createdAt: -1`, limit 8

6. **Banner hỗ trợ** (3 cols)
   - "Giao hàng toàn quốc" | "Hàng chính hãng 100%" | "Hỗ trợ Zalo 8-22h"

**Data dependencies**: categories, products, product_variants (giá), inventory (còn/hết hàng), brands

---

### [P1-S-03] TRANG DANH SÁCH SẢN PHẨM — PRODUCT LISTING

**URL**: `/san-pham` hoặc `/danh-muc/[slug]` hoặc `/thuong-hieu/[slug]`

**Layout**: 2 cột — Sidebar filter (desktop) + Grid sản phẩm

**Sidebar Filter** (desktop left, mobile bottom sheet):
```
□ Lọc theo danh mục (checkbox tree, từ categories)
□ Lọc theo thương hiệu (checkbox list, từ brands)
□ Khoảng giá (range slider: 0 — 50tr VNĐ)
□ Trạng thái: [✓] Còn hàng  [ ] Hết hàng
□ Thuộc tính động (tự load theo category được chọn):
  - Màu sắc: [Đen] [Trắng] [Xanh] (từ attribute_definitions, isFilterable=true)
  - RAM: [4GB] [6GB] [8GB]
  - Bộ nhớ: [64GB] [128GB] [256GB]
[Áp dụng lọc] [Xoá bộ lọc]
```

**Product Grid** (right):
- Thanh sort: Mặc định | Giá thấp-cao | Giá cao-thấp | Mới nhất
- Breadcrumb navigation
- Số kết quả: "Hiển thị 12/48 sản phẩm"
- Grid: 3 cols desktop / 2 cols mobile
- Pagination hoặc Load more button

**Product Card**:
```
┌─────────────────┐
│   [Badge brand] │  ← absolute top-left
│                 │
│    [Image]      │  ← aspect-ratio: 4/5
│                 │
│  [❤ wishlist]   │  ← absolute top-right, icon button
│─────────────────│
│ Tên sản phẩm    │  ← 2 dòng, truncate
│ max 2 dòng      │
│                 │
│ 33.990.000 ₫    │  ← amber, bold
│ ~~36.990.000 ₫~~│  ← giá gốc nếu có
│                 │
│ [Còn hàng] badge│  ← green/red/yellow
│                 │
│ [Thêm vào giỏ]  │  ← full-width button
└─────────────────┘
```

**Data dependencies**: products, product_variants (giá default variant), inventory, categories, brands, attribute_definitions

**URL params**: `?category=dien-thoai&brand=apple&priceMin=10000000&priceMax=40000000&color=Den&ram=8&inStock=true&sort=price_asc&page=1`

---

### [P1-S-04] TRANG CHI TIẾT SẢN PHẨM — PRODUCT DETAIL

**URL**: `/san-pham/[slug]`

**Layout desktop**: 2 cột (ảnh trái 55%, info phải 45%)

**Cột trái — Gallery**:
- Ảnh lớn chính + thumbnail strip bên dưới
- Swipe trên mobile
- Ảnh thay đổi khi chọn variant

**Cột phải — Product Info**:
```
[Breadcrumb: Trang chủ > Điện thoại > iPhone 15 Pro Max]
[Badge thương hiệu: Apple]
Tên sản phẩm (H1, lớn)
[Mã SP: IPH15PM] [Tình trạng: ● Còn hàng]

Giá: 33.990.000 ₫
Giá gốc: ~~36.990.000 ₫~~ (-8%)

Chọn màu: [● Đen ✓] [○ Trắng] [○ Xanh]
Chọn bộ nhớ: [128GB] [256GB ✓] [512GB]
(Disabled nếu variant đó hết hàng)

Số lượng: [−][  1  ][+]

[Thêm vào giỏ hàng] ← outline, border amber
[Mua ngay]          ← filled, amber background

[♡ Thêm vào wishlist] ← text link

Giao hàng: Toàn quốc | Thanh toán: COD / Chuyển khoản
Hotline: 0901 234 567 | Zalo tư vấn: [icon]

─────────────────────────────
Thông số kỹ thuật:
  Màn hình: 6.7 inch Super Retina XDR
  Chip: A17 Pro
  Pin: 4422 mAh
  (render từ products.specs + attribute_definitions)
─────────────────────────────
```

**Tab dưới** (full width):
- Tab "Mô tả" — render HTML từ `products.description`
- Tab "Thông số kỹ thuật" — table từ `products.specs`
- Tab "Đánh giá" ← Phase 2 (hiện tại: "Chưa có đánh giá")

**Sản phẩm liên quan** (cuối trang, scroll horizontal):
- Cùng category, cùng brand, limit 6

**Data dependencies**: products, product_variants, product_images, inventory, categories, brands, attribute_definitions

---

### [P1-S-05] GIỎ HÀNG — CART

**URL**: `/gio-hang`

**Layout**:

**Trái (2/3)** — Danh sách sản phẩm:
```
[Ảnh] | Tên SP + Variant (Đen - 256GB) | Giá: 33.990.000 ₫ | [−][1][+] | Tổng: 33.990.000 ₫ | [🗑]
```
- Không cho tăng quá tồn kho
- Nếu hết hàng sau khi đã thêm vào giỏ: hiện badge "Hết hàng" + disable checkout

**Phải (1/3)** — Order Summary:
```
Tạm tính:       33.990.000 ₫
Phí vận chuyển: Miễn phí (Phase 1)
─────────────────────────────
Tổng cộng:      33.990.000 ₫

[Tiến hành đặt hàng] ← full-width, amber
[Tiếp tục mua sắm]   ← outline
```

**Empty state**: Icon giỏ hàng trống + "Giỏ hàng chưa có sản phẩm" + [Mua sắm ngay]

**Data dependencies**: carts, product_variants, inventory

---

### [P1-S-06] CHECKOUT — ĐẶT HÀNG

**URL**: `/dat-hang`

**Layout**: Single column, step-based (3 bước hoặc 1 trang scroll)

**Bước 1 — Thông tin giao hàng**:
```
□ Giao đến địa chỉ mới  ← default
□ Dùng địa chỉ đã lưu   ← nếu đã đăng nhập và có địa chỉ

Form fields:
- Họ và tên *
- Số điện thoại *
- Email (optional, để nhận xác nhận đơn)
- Địa chỉ (Số nhà, tên đường) *
- Tỉnh/Thành phố * (select)
- Quận/Huyện * (select, phụ thuộc tỉnh)
- Phường/Xã (select, optional)
- Ghi chú đặt hàng (textarea)
```

**Bước 2 — Phương thức thanh toán**:
```
○ Thanh toán khi nhận hàng (COD) ← default
  "Giao hàng và thu tiền mặt tại địa chỉ của bạn"
○ Chuyển khoản ngân hàng
  "Thông tin tài khoản sẽ hiển thị sau khi đặt hàng"
  
[Phase 3: thêm MoMo, VNPay, v.v. tại đây]
```

**Bước 3 — Xác nhận đơn hàng**:
```
Tóm tắt đơn:
- Danh sách sản phẩm (mini)
- Địa chỉ giao hàng
- Phương thức thanh toán
- Tổng tiền

[Đặt hàng] ← large button, amber
"Bằng cách nhấn Đặt hàng, bạn đồng ý với điều khoản của chúng tôi"
```

**Sau khi đặt hàng thành công** → Redirect đến trang cảm ơn `/dat-hang/thanh-cong/[orderCode]`
- Hiển thị mã đơn hàng
- "Chúng tôi sẽ liên hệ xác nhận qua SĐT/Zalo trong vòng 30 phút"
- Nút Zalo liên hệ ngay

**Guest vs Logged-in**:
- Guest: hiện form đầy đủ
- Logged-in: auto-fill từ profile, có thể chọn địa chỉ đã lưu

**Data dependencies**: carts, orders, order_items, inventory, users, shipping_addresses, settings

---

### [P1-S-07] TRANG XÁC NHẬN ĐƠN HÀNG

**URL**: `/dat-hang/thanh-cong/[orderCode]`

```
✅ (checkmark lớn, animated)
Đặt hàng thành công!

Mã đơn hàng: ORD-20250115-0001

Thông tin đơn hàng:
────────────────────
[Danh sách sản phẩm đã mua]
────────────────────
Địa chỉ giao:  [địa chỉ]
Thanh toán:    COD
Tổng tiền:     33.990.000 ₫

💬 Liên hệ Zalo để được tư vấn nhanh hơn
[Chat Zalo ngay] ← nút nổi bật

[Tiếp tục mua sắm] [Xem đơn hàng của tôi ← nếu đã đăng nhập]
```

---

### [P1-S-08] TRANG ĐĂNG NHẬP / ĐĂNG KÝ

**URL**: `/dang-nhap` | `/dang-ky`

**Đăng nhập**:
```
Logo TanManh Shop
─────────────
Đăng nhập tài khoản
Email *  [input]
Mật khẩu * [input + show/hide toggle]
[Đăng nhập] ← amber button
Quên mật khẩu?
─────────────
Chưa có tài khoản? [Đăng ký ngay]
```

**Đăng ký**:
```
Tạo tài khoản mới
Họ và tên *
Email *
Số điện thoại (optional)
Mật khẩu * (min 6 ký tự)
Xác nhận mật khẩu *
[Đăng ký] ← amber button
Đã có tài khoản? [Đăng nhập]
```

**UX**: Redirect về trang trước đó sau login thành công, hoặc về trang chủ.

---

### [P1-S-09] TRANG TÀI KHOẢN — USER PROFILE

**URL**: `/tai-khoan`

**Layout**: Sidebar trái (menu) + Content phải

**Sidebar menu**:
- Thông tin cá nhân
- Đơn hàng của tôi
- Địa chỉ giao hàng
- Danh sách yêu thích
- Đổi mật khẩu
- Đăng xuất

**Thông tin cá nhân**:
- Avatar, họ tên, email (read-only), SĐT
- Form chỉnh sửa họ tên, SĐT

**Đơn hàng của tôi** (`/tai-khoan/don-hang`):
```
[Tất cả] [Chờ xác nhận] [Đang xử lý] [Hoàn thành] [Đã huỷ]

Card đơn hàng:
ORD-20250115-0001 | 15/01/2025 | Chờ xác nhận
iPhone 15 Pro Max × 1       33.990.000 ₫
[Xem chi tiết] [Liên hệ Zalo]
```

**Chi tiết đơn** (`/tai-khoan/don-hang/[orderCode]`):
- Header: mã đơn, ngày đặt, trạng thái (stepper)
- Danh sách sản phẩm
- Địa chỉ giao hàng
- Tổng tiền
- Ghi chú của khách

**Danh sách yêu thích**:
- Grid sản phẩm, tương tự product listing
- Nút "Thêm vào giỏ" trực tiếp từ wishlist
- Nút "Xoá khỏi yêu thích"

**Data dependencies**: users, orders, order_items, wishlists, shipping_addresses

---

### [P1-S-10] TRANG TÌM KIẾM

**URL**: `/tim-kiem?q=[query]`

- Search bar nổi bật ở đầu trang
- Kết quả dạng grid (tương tự product listing)
- Text: `Kết quả tìm kiếm cho "[query]" — 12 sản phẩm`
- Nếu không có: "Không tìm thấy sản phẩm phù hợp" + gợi ý danh mục
- Search: MongoDB text index trên `products.name` và `products.tags`

---

## ═══════════════════════════════════════════════════════
## PHASE 1 — ADMIN PANEL (TRANG QUẢN TRỊ)
## ═══════════════════════════════════════════════════════

### DESIGN DIRECTION — ADMIN PANEL
- **Aesthetic**: Clean, professional, data-dense — thiên về utility không phải beauty
- **Layout**: Fixed left sidebar (240px) + top header + main content area
- **Màu sắc**: Sidebar nền `#1E293B` (slate-800), text trắng; Content area nền `#F8FAFC`; Accent: `#3B82F6` (blue-500) cho primary actions
- **Typography**: `Be Vietnam Pro` — đồng nhất với storefront
- **Tables**: Clean, sortable, với pagination, search inline
- **Forms**: Vertical layout, validation inline, autosave nếu có thể
- **URL prefix**: Tất cả admin tại `/admin/...`

---

### [P1-A-01] ADMIN LAYOUT CHUNG

**Sidebar** (fixed left, 240px):
```
[Logo TanManh Shop Admin]
─────────────────────
📊 Dashboard
📦 Sản phẩm
  ├ Danh sách sản phẩm
  ├ Thêm sản phẩm
  ├ Danh mục
  └ Thương hiệu
🧩 Thuộc tính SP
📋 Đơn hàng
👥 Người dùng
⚙️  Cài đặt
─────────────────────
[Avatar admin] [Tên admin]
[Đăng xuất]
```

**Header** (top, sticky):
- Breadcrumb
- Notification bell (số đơn mới)
- Avatar + tên admin

---

### [P1-A-02] DASHBOARD

**URL**: `/admin`

**Layout**: KPI cards trên + charts dưới

**Row 1 — KPI Cards** (4 cols):
```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ 👥 Users     │ │ 📦 Sản phẩm │ │ 📋 Đơn hàng  │ │ 💰 Doanh thu │
│    1,234     │ │     89       │ │    456       │ │  890tr ₫     │
│ +12 hôm nay  │ │  12 hết hàng │ │  8 đơn mới   │ │  tháng này   │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

**Row 2**:
- Biểu đồ đường: Doanh thu 7 ngày / 30 ngày (recharts hoặc chart.js)
- Biểu đồ cột: Đơn hàng theo trạng thái

**Row 3**:
- Bảng "Đơn hàng mới nhất" (5 đơn gần nhất)
- Bảng "Sản phẩm sắp hết/hết hàng" (inventory.status = low_stock | out_of_stock)

**Data**: Query trực tiếp từ MongoDB collections (không cần collection dashboard riêng ở Phase 1)

---

### [P1-A-03] QUẢN LÝ SẢN PHẨM — DANH SÁCH

**URL**: `/admin/san-pham`

**Toolbar**:
```
[Search: Tìm theo tên, SKU...] [Lọc: Category ▼] [Lọc: Brand ▼] [Lọc: Status ▼] | [+ Thêm sản phẩm]
```

**Bảng**:
```
□ | Ảnh | Tên sản phẩm | Danh mục | Thương hiệu | Số variants | Trạng thái | Ngày tạo | Hành động
──────────────────────────────────────────────────────────────────────────────────────────────────
□ | 🖼  | iPhone 15 PM | Điện thoại | Apple      |      4      | ● Active   | 15/01/25 | [Sửa][Xoá]
```

- Click vào row → đến trang edit
- Bulk actions: Xoá nhiều, đổi trạng thái nhiều
- Pagination: 20 items/page

---

### [P1-A-04] THÊM / SỬA SẢN PHẨM

**URL**: `/admin/san-pham/them` | `/admin/san-pham/[id]/sua`

**Layout**: 2 cột — Main form trái (2/3) + Sidebar phải (1/3)

**Main form** (trái):
```
THÔNG TIN CƠ BẢN
─────────────────
Tên sản phẩm *     [input text]
Slug               [input, auto-gen từ tên, editable]
Danh mục *         [select, khi chọn → load attribute_definitions của category đó]
Thương hiệu *      [select]
Mô tả ngắn        [textarea, 300 chars]
Mô tả đầy đủ      [rich text editor — TipTap hoặc Quill]

THÔNG SỐ KỸ THUẬT (từ attribute_definitions của category, isVariantAttribute=false)
─────────────────────────────────────────────────────────────────────────────────────
Pin (mAh):         [input number]
Màn hình (inch):   [input text]
(dynamic, tự load theo category được chọn)

BIẾN THỂ SẢN PHẨM
──────────────────
Thuộc tính biến thể: (từ attribute_definitions, isVariantAttribute=true)
  Màu sắc: [tag input: Đen, Trắng, Xanh]
  Bộ nhớ:  [tag input: 128, 256, 512]

[Tạo biến thể tự động] ← generate tổ hợp

Bảng variants (generated):
SKU          | Tên           | Giá bán    | Giá gốc   | Tồn kho | Ảnh | Default | Trạng thái
IPH15PM-BLK-256 | Đen - 256GB | [33990000] | [36990000] | [50]   | 🖼  | ○       | [Active ▼]

[+ Thêm variant thủ công]
```

**Sidebar** (phải):
```
TRẠNG THÁI
──────────
[Draft ▼] ← select: draft | active | inactive

HÌNH ẢNH SẢN PHẨM
──────────────────
[Drop zone upload]
[Ảnh 1] [Ảnh 2] [Ảnh 3] ← draggable để sort
(Ảnh chung cho sản phẩm)

SẢN PHẨM NỔI BẬT
─────────────────
[✓] Hiển thị ở trang chủ

SEO
───
SEO Title     [input]
SEO Desc      [textarea]

[Lưu nháp]  [Xuất bản]
```

---

### [P1-A-05] QUẢN LÝ ĐƠN HÀNG

**URL**: `/admin/don-hang`

**Toolbar**:
```
[Search: Mã đơn, tên/SĐT khách...] [Status: Tất cả ▼] [Date range picker] | [Export CSV]
```

**Bảng**:
```
Mã đơn      | Khách hàng      | SĐT         | Sản phẩm | Tổng tiền    | Thanh toán | Trạng thái       | Ngày đặt | Hành động
ORD-0001   | Nguyễn Văn A   | 0901234567 | 2 SP     | 33.990.000 ₫ | COD        | ● Chờ xác nhận  | 15/01/25 | [Xem][Sửa]
```

- Badge màu status: Pending=yellow, Confirmed=blue, Processing=orange, Completed=green, Cancelled=red

**Chi tiết đơn hàng** (`/admin/don-hang/[id]`):
```
Header: Mã đơn | Ngày đặt | Nguồn đơn (website/zalo)
─────────────────────────────────────────────────────
THÔNG TIN KHÁCH:           TRẠNG THÁI ĐƠN HÀNG:
Tên: Nguyễn Văn A          [Chờ xác nhận    ▼] ← dropdown để cập nhật
SĐT: 0901 234 567          [Cập nhật trạng thái]
Email: a@gmail.com
                            Ghi chú admin:
ĐỊA CHỈ GIAO HÀNG:         [textarea, internal note]
123 Đường ABC, Q.1, TP.HCM
─────────────────────────────────────────────────────
SẢN PHẨM:
[Ảnh] iPhone 15 Pro Max - Đen 256GB | 33.990.000 ₫ × 1 | 33.990.000 ₫
─────────────────────────────────────────────────────
Tạm tính:     33.990.000 ₫
Tổng cộng:    33.990.000 ₫
Thanh toán:   COD / Chờ thanh toán
─────────────────────────────────────────────────────
[Chat Zalo với khách] [In đơn hàng]
```

---

### [P1-A-06] QUẢN LÝ DANH MỤC

**URL**: `/admin/danh-muc`

- Tree view (cha → con)
- CRUD danh mục
- Drag-drop để sắp xếp sort order
- Gán `attributeIds` cho từng danh mục (multi-select từ attribute_definitions)
- Form: Tên, Slug (auto), Danh mục cha, Ảnh đại diện, Mô tả, Trạng thái

---

### [P1-A-07] QUẢN LÝ THƯƠNG HIỆU

**URL**: `/admin/thuong-hieu`

- Danh sách bảng đơn giản
- CRUD: Tên, Slug, Logo (upload), Mô tả, Website, Sort order, Trạng thái

---

### [P1-A-08] QUẢN LÝ THUỘC TÍNH SẢN PHẨM

**URL**: `/admin/thuoc-tinh`

**Mục đích**: Quản lý `attribute_definitions` — admin có thể thêm loại thuộc tính mới mà không cần dev.

**Bảng**:
```
Tên thuộc tính | Slug      | Kiểu    | Đơn vị | Lọc? | Tạo biến thể? | Giá trị gợi ý
Màu sắc       | mau-sac   | select  |        | ✓    | ✓             | Đen, Trắng, Xanh...
RAM           | ram       | select  | GB     | ✓    | ✓             | 4, 6, 8, 12...
Pin           | pin       | number  | mAh    | ✗    | ✗             | (nhập tự do)
```

**Form thêm/sửa**:
- Tên thuộc tính
- Slug (auto)
- Kiểu dữ liệu: text | number | select | boolean
- Đơn vị (optional)
- Có dùng làm bộ lọc không (isFilterable)
- Có tạo biến thể không (isVariantAttribute)
- Giá trị gợi ý (tag input, cho select type)

---

### [P1-A-09] QUẢN LÝ NGƯỜI DÙNG

**URL**: `/admin/nguoi-dung`

**Bảng**:
```
Avatar | Họ tên | Email | SĐT | Role | Trạng thái | Đơn hàng | Ngày đăng ký | Hành động
```

- Filter: Role, Trạng thái
- Search: Email, tên, SĐT
- Hành động: Xem chi tiết, Block/Unblock, Xem lịch sử đơn của user

---

### [P1-A-10] CÀI ĐẶT HỆ THỐNG

**URL**: `/admin/cai-dat`

**Tabs**:

**Thông tin cửa hàng**:
- Tên cửa hàng, Địa chỉ, SĐT, Email, Mô tả ngắn

**Liên hệ & Hỗ trợ**:
- Zalo link (URL đầy đủ)
- SĐT hỗ trợ
- Email hỗ trợ

**Thông báo**:
- Email nhận đơn hàng mới *
- [✓] Bật thông báo email khi có đơn mới

**Tồn kho**:
- Ngưỡng cảnh báo hàng sắp hết (số lượng, default: 5)

---

## ═══════════════════════════════════════════════════════
## PHASE 2 — TÍNH NĂNG MỞ RỘNG (Context để AI hiểu hướng đi)
## ═══════════════════════════════════════════════════════

> Phase 2 GEN RIÊNG khi được yêu cầu. Phần này chỉ để AI hiểu bức tranh toàn cảnh.

### Storefront Phase 2
- `[P2-S-01]` Trang đánh giá sản phẩm (reviews/ratings với stars)
- `[P2-S-02]` Trang blog / tin tức
- `[P2-S-03]` Banner carousel (lấy từ collection `banners`)
- `[P2-S-04]` Ô nhập mã giảm giá ở checkout
- `[P2-S-05]` Trang thông báo cá nhân
- `[P2-S-06]` Gợi ý sản phẩm (AI recommendation hoặc rule-based)
- `[P2-S-07]` Filter nâng cao (multiselect attributes)
- `[P2-S-08]` Quản lý nhiều địa chỉ giao hàng

### Admin Phase 2
- `[P2-A-01]` Quản lý coupon / mã giảm giá
- `[P2-A-02]` Quản lý banner
- `[P2-A-03]` Quản lý blog
- `[P2-A-04]` Dashboard nâng cao (biểu đồ phức tạp hơn)
- `[P2-A-05]` Báo cáo sản phẩm bán chạy
- `[P2-A-06]` Báo cáo doanh thu theo thời gian

---

## ═══════════════════════════════════════════════════════
## PHASE 3 — TÍNH NĂNG NÂNG CAO (Context để AI hiểu hướng đi)
## ═══════════════════════════════════════════════════════

> Phase 3 GEN RIÊNG khi được yêu cầu.

### Storefront Phase 3
- `[P3-S-01]` Tích hợp cổng thanh toán (MoMo, VNPay, ZaloPay)
- `[P3-S-02]` Tracking đơn hàng realtime (tích hợp GHN/GHTK)
- `[P3-S-03]` Chương trình loyalty điểm thưởng
- `[P3-S-04]` Flash sale / deal theo giờ
- `[P3-S-05]` Combo sản phẩm

### Admin Phase 3
- `[P3-A-01]` Quản lý đa kho
- `[P3-A-02]` Quản lý nhập/xuất kho (inventory transactions)
- `[P3-A-03]` Flash sale / khuyến mãi nâng cao
- `[P3-A-04]` Phân quyền staff chi tiết
- `[P3-A-05]` Audit log
- `[P3-A-06]` Báo cáo xuất Excel

---

## ═══════════════════════════════════════════════════════
## HƯỚNG DẪN GEN UI CHO AI
## ═══════════════════════════════════════════════════════

### Khi gen từng trang, bắt buộc:
1. **Đọc Master Context trước** — hiểu database schema và nghiệp vụ
2. **Identify page code** — VD: `[P1-S-04]` Product Detail
3. **Sử dụng đúng data dependencies** — mỗi trang đã note rõ cần data từ collections nào
4. **Responsive** — Mobile-first, test ở 375px, 768px, 1280px
5. **Loading states** — Skeleton loading cho tất cả data fetching
6. **Empty states** — Handle trường hợp không có data
7. **Error states** — 404, network error, validation error
8. **Accessibility** — alt text cho ảnh, aria-label cho buttons, keyboard navigation
9. **Tiếng Việt** — Tất cả text, error message, placeholder đều tiếng Việt
10. **Zalo button** — Luôn có ở storefront (trừ admin panel)

### Format khi yêu cầu gen trang cụ thể:
```
"Hãy gen UI cho trang [PAGE_CODE] — [TÊN TRANG].
Tham khảo Master Context trong prompt này.
Stack: Next.js 14, Tailwind CSS, shadcn/ui.
[Thêm yêu cầu đặc biệt nếu có]"
```

### Ví dụ:
```
"Hãy gen UI cho trang [P1-S-04] — Product Detail.
Tham khảo Master Context. Stack: Next.js 14, Tailwind, shadcn/ui.
Đặc biệt chú ý: variant selector phải update ảnh gallery khi chọn variant khác."
```

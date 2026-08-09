# Hướng dẫn PHÂN TÍCH Database cho Website bán điện thoại & phụ kiện
*(Teaching-style — dành cho người mới học database design với MongoDB)*

> Mục tiêu của tài liệu này **KHÔNG** phải đưa cho bạn schema cuối cùng để copy-paste. Mục tiêu là dạy bạn **CÁCH SUY NGHĨ** để khi gặp một requirement mới (bất kỳ ngành nào), bạn cũng tự nhìn ra được database. Schema chỉ là kết quả — *cách suy luận* mới là kỹ năng.

---

## PHẦN 0 — Tư duy nền trước khi bắt đầu

Trước khi đụng vào bất kỳ collection nào, bạn phải tự trả lời 3 câu hỏi:

1. **Ai dùng hệ thống này?** (actors)
2. **Họ làm được những gì?** (features / use-cases)
3. **Mỗi việc họ làm sẽ đụng vào những "vật" gì?** (entities)

Database = nơi lưu lại "vật" + "việc" + "ai làm việc gì với vật nào".
Nếu bạn không trả lời được 3 câu trên, bạn không nên vẽ schema vội — bạn sẽ thiết kế sai.

**Quy tắc vàng cho người mới:**
- Không bắt đầu từ "tôi cần bảng gì" → mà bắt đầu từ "hệ thống làm gì".
- Không thiết kế cho mọi tính năng tương lai ngay từ đầu → nhưng đừng đóng cửa các hướng mở rộng.
- Khi nghi ngờ giữa "embed" và "reference" → ưu tiên **reference**, vì sửa schema embed về sau rất đau.

---

## BƯỚC 1 — Đọc requirement và bóc tách DANH TỪ / THỰC THỂ

Đây là kỹ thuật cổ điển nhất khi học DB design: **đọc requirement, gạch chân danh từ.**

Đọc lại requirement của bạn, mình gạch chân được các danh từ sau:

| Danh từ trong requirement | Có thể là entity? | Ghi chú đầu tiên |
|---|---|---|
| **người dùng / khách / admin** | ✅ Có | actors → sinh ra collection `users` + cơ chế role |
| **role (admin, user)** | ✅ Có | Có thể tách `roles` hoặc nhúng `role` field |
| **sản phẩm (điện thoại, tai nghe, sạc, pin, đồng hồ, ốp, dán...)** | ✅ Có | → `products` |
| **brand** (Apple, Samsung, Anker, Xiaomi...) | ✅ Có | → `brands` |
| **category** (Điện thoại, Tai nghe, Sạc...) | ✅ Có | → `categories` |
| **biến thể sản phẩm** (màu, RAM, bộ nhớ, size, dây, cổng, công suất...) | ✅ Có | → `product_variants` |
| **ảnh sản phẩm** | ✅ Có (hoặc embed) | → `product_images` hoặc embed |
| **thông số kỹ thuật / specs** | ✅ Có (hoặc embed) | → `product_specs` hoặc embed |
| **tồn kho** | ✅ Có | → `inventory` (hoặc field trong variant) |
| **giỏ hàng** | ✅ Có | → `carts` + `cart_items` |
| **wishlist** | ✅ Có | → `wishlists` |
| **đơn hàng** | ✅ Có | → `orders` |
| **dòng đơn hàng (item trong đơn)** | ✅ Có | → `order_items` |
| **địa chỉ giao hàng** | ✅ Có | Phase 1 embed trong order, Phase 2 tách `shipping_addresses` |
| **thông tin liên hệ guest** | ✅ Có | → embed trong order (vì gắn chặt với order đó) |
| **dashboard số liệu** | ❌ Không phải entity | Chỉ là *view* tổng hợp từ collections khác |
| **trạng thái đơn / sản phẩm / user** | ❌ Không phải entity | Là *enum field* bên trong document |
| **nút Zalo, email thông báo** | ❌ Không phải entity | Là cấu hình → `settings` (nếu có) |

**Bài học:** không phải mọi danh từ đều thành collection. Có 3 nhóm:
1. **Entity thật** → thành collection (user, product, order...).
2. **Thuộc tính của entity** → field bên trong document (status, name, price...).
3. **View / report / cấu hình** → không phải entity, là kết quả query hoặc setting (dashboard, nút Zalo...).

---

## BƯỚC 2 — Với mỗi entity, tự trả lời 5 câu hỏi

Đây là phần **cốt lõi** của tư duy. Với MỖI entity nghi ngờ, bắt buộc trả lời:

1. Vì sao nó nên là một collection riêng?
2. Nó phục vụ tính năng nào trong requirement?
3. Nếu không tách riêng thì sẽ gặp vấn đề gì?
4. Nó cần lưu những field cơ bản nào?
5. Field đó sinh ra từ dòng requirement nào?

Mình demo lần lượt cho từng entity:

---

### 2.1. `users`

- **Vì sao tách riêng?** Vì user là một *thực thể tồn tại độc lập* — một user có thể có 0, 1 hay nhiều đơn hàng, nhiều wishlist item, nhiều cart. Không thể nhét thông tin user vào order được vì user còn sống tiếp sau khi đơn hàng kết thúc.
- **Phục vụ tính năng nào?** "Đăng ký", "Đăng nhập", "Phân role", "Lịch sử đơn hàng", "Wishlist", "Quản lý user" (admin).
- **Nếu không tách?** Sẽ phải lặp lại email / mật khẩu / tên ở mọi nơi → khi user đổi tên/email là bug data ngay.
- **Field cơ bản:**
  - `email` (từ "Đăng ký / Đăng nhập")
  - `password_hash` (từ "Đăng nhập")
  - `phone` (từ "nhập sđt để xem đơn")
  - `full_name`
  - `role` (từ "admin / user")
  - `status` (active / inactive / blocked — từ phần G của requirement)
  - `created_at`, `updated_at`, `deleted_at` (soft delete — từ nguyên tắc E.7)
- **Field sinh ra từ requirement nào?** Mình chú thích cụ thể như trên — luôn truy vết được. Nếu không truy vết được thì đó là field bạn *bịa thêm* → cần cân nhắc bỏ.

---

### 2.2. `roles` — TÁCH hay KHÔNG?

Đây là quyết định *thật sự* của một database designer. Không có câu trả lời máy móc.

- **Phase 1** chỉ có 2 role: `admin`, `user`. Tách `roles` collection riêng là **over-engineering**.
  → Khuyến nghị: dùng `role` là **enum field** trong `users` (`"admin" | "user"`).
- **Phase 2/3** nếu cần phân quyền chi tiết (manager, staff, marketing, có permission khác nhau) → khi đó mới tách `roles` + `permissions`.

**Bài học:** tách collection có chi phí (thêm join, thêm logic). Chỉ tách khi nó *xứng đáng*.

---

### 2.3. `categories`

- **Vì sao tách?** Một category (vd "Tai nghe") gắn với *nhiều* sản phẩm. Tên category có thể đổi (vd "Tai nghe" → "Tai nghe & Loa"). Nếu nhúng tên category vào từng product thì phải update hàng nghìn document khi đổi tên.
- **Phục vụ:** "Filter theo category", "Quản lý category", menu trang chủ.
- **Nếu không tách?** Filter sẽ phải string-match trên field text → chậm, sai chính tả là sót dữ liệu.
- **Field:** `name`, `slug`, `parent_id` (chừa cho category cha-con như "Phụ kiện > Sạc & cáp"), `status`, `sort_order`, `icon/image_url`, timestamps.
- **Sinh từ:** "Filter theo category", "Quản lý category", danh sách 8 loại sản phẩm trong phần A.

---

### 2.4. `brands`

- **Vì sao tách?** Cùng lý do `categories`. Một brand có nhiều product, brand có thể có logo, mô tả, slug riêng.
- **Phục vụ:** "Filter theo brand", "Quản lý brand", trang brand riêng (Phase 2).
- **Field:** `name`, `slug`, `logo_url`, `description`, `status`, timestamps.

---

### 2.5. `products` (sản phẩm gốc)

Đây là entity **phức tạp nhất**, nên cần suy nghĩ kỹ.

- **Vì sao tách riêng khỏi variant?** Vì 1 sản phẩm "iPhone 15 Pro" có thể có 12 biến thể (3 màu × 4 dung lượng). Thông tin chung (tên, mô tả, brand, category, ảnh chính) chỉ cần lưu **1 lần** ở `products`. Thông tin riêng từng biến thể (giá, SKU, tồn kho) lưu ở `product_variants`.
- **Nếu không tách?** Có 2 lựa chọn sai lầm điển hình:
  - **Sai 1:** Nhét variants thành 1 mảng embed lớn trong `products`. → Khi 1 variant hết hàng phải update document `products` to nặng. Khi báo cáo "tổng SKU bán ra" phải $unwind mảng → không scale.
  - **Sai 2:** Tạo 12 document `products` cho 12 biến thể. → Lặp tên, mô tả, ảnh 12 lần. Đổi mô tả 1 cái phải đổi 12 chỗ.
- **Phục vụ:** "Xem chi tiết sản phẩm", "Danh sách sản phẩm", "Filter", "Search theo tên".
- **Field cơ bản:**
  - `name` (sinh từ "Tìm kiếm theo tên sản phẩm")
  - `slug` (URL SEO-friendly — từ nguyên tắc E.7)
  - `description` (mô tả dài)
  - `short_description`
  - `brand_id` → ref `brands`
  - `category_id` → ref `categories`
  - `thumbnail_url` (ảnh đại diện)
  - `base_price` (giá hiển thị mặc định, giá thực sự nằm ở variant)
  - `status` (`draft | active | inactive | out_of_stock` — từ phần G)
  - `is_featured` (cho trang chủ)
  - `tags` (mảng string, chừa cho search & filter Phase 2)
  - `created_at`, `updated_at`, `deleted_at`

---

### 2.6. `product_variants`

- **Vì sao tách?** Vì giá, tồn kho, SKU là **khác nhau theo từng biến thể**. Khách mua "iPhone 15 Pro 256GB Titan Đen" — đây là một SKU cụ thể, không phải product gốc. Khi tạo `order_items`, bạn phải reference đến *variant* chứ không phải *product*.
- **Phục vụ:** "Chọn biến thể sản phẩm", "Thêm giỏ hàng", "Đặt hàng", "Quản lý product variant", "Quản lý tồn kho".
- **Nếu không tách?** Không thể tính tồn kho riêng cho từng màu/dung lượng → quản lý kho fail ngay.
- **Field cơ bản:**
  - `product_id` → ref `products`
  - `sku` (mã định danh duy nhất, **unique index**)
  - `attributes` (object linh hoạt, ví dụ `{ color: "Đen", storage: "256GB" }`) — **đây là chỗ tận dụng schema-less của MongoDB**
  - `price` (giá bán thực)
  - `compare_at_price` (giá gạch ngang, chừa cho khuyến mãi Phase 2)
  - `stock_quantity` (Phase 1 để gọn ở đây; Phase 3 tách hẳn `inventory_transactions`)
  - `status`
  - `images` (mảng url ảnh riêng cho variant — vd ảnh màu Đen khác màu Trắng)
  - timestamps

> **Điểm quan trọng:** `attributes` là object động. Mỗi loại sản phẩm có key khác nhau (điện thoại có `storage`, tai nghe có `connection`, sạc có `wattage`). Đây chính là lý do MongoDB phù hợp cho bài toán này — bạn KHÔNG cần khai báo cứng cột.

---

### 2.7. `product_images`

- **Tách riêng hay embed?** Tùy đặc điểm:
  - Nếu mỗi sản phẩm chỉ 5–15 ảnh → **embed** mảng `images: []` trong `products` là đủ.
  - Nếu cần đánh dấu ảnh nào của variant nào, sort, alt text, hoặc CMS quản lý ảnh phức tạp → **tách collection**.
- **Khuyến nghị Phase 1:** embed trong `products` (mảng URL) và embed trong `product_variants` (ảnh riêng cho variant). Đơn giản, đủ dùng. Phase 2 nếu cần CMS ảnh thì migrate ra collection riêng.

---

### 2.8. `product_specs` / thông số kỹ thuật

- **Đây là điểm nhiều người mới làm sai.** Họ tạo schema cứng kiểu `ram`, `rom`, `screen_size`, `chipset`... → khi bán thêm "máy ảnh" phải sửa schema.
- **Cách đúng cho MongoDB:** lưu dưới dạng **mảng key-value** hoặc **object linh hoạt**:
  ```
  specs: [
    { group: "Màn hình", key: "Kích thước", value: "6.1 inch" },
    { group: "Màn hình", key: "Công nghệ", value: "OLED" },
    { group: "Camera", key: "Chính", value: "48MP" }
  ]
  ```
- **Tách collection riêng `product_specs` hay embed?**
  - Embed trong `products` → đủ dùng cho Phase 1, query nhanh khi xem chi tiết.
  - Tách riêng nếu Phase 2 muốn filter động "tất cả điện thoại có RAM ≥ 8GB" — khi đó kết hợp `attribute_definitions` + `product_attribute_values`.
- **Khuyến nghị Phase 1:** **embed**, nhưng giữ cấu trúc array-of-object (không phải object phẳng) để Phase 2 dễ migrate.

---

### 2.9. `inventory`

- **Phase 1:** giữ `stock_quantity` ngay trong `product_variants`. Đơn giản, đủ cho cửa hàng gia đình.
- **Phase 3:** tách `inventory_transactions` (mỗi lần nhập/xuất/điều chỉnh là 1 record) để audit, báo cáo.
- **Bài học:** không "design tương lai" sớm. Nhưng *đặt field ở đúng entity* (variant chứ không phải product) để sau này tách ra dễ.

---

### 2.10. `carts` + `cart_items`

- **Vì sao tách 2 collection?** Vì `cart` là 1 *thùng* gắn với 1 user/session, còn `cart_items` là từng dòng sản phẩm trong thùng. Một cart có nhiều item.
- **Có thể embed `items` vào `carts` không?** Có. Cart thường nhỏ (< 50 item). Embed cũng OK.
  - **Embed:** đơn giản, query 1 phát ra nguyên cart.
  - **Tách:** dễ thao tác trên từng item, dễ phân tích "sản phẩm nào hay bị bỏ giỏ".
- **Khuyến nghị Phase 1:** **embed** `items: []` trong `carts`. Đỡ phức tạp.
- **Field:**
  - `user_id` (nullable — guest có thể có cart bằng `session_id`)
  - `session_id` (cho guest)
  - `items: [{ variant_id, product_id, quantity, price_snapshot, added_at }]`
  - `updated_at`
- **Lưu ý:** lưu `price_snapshot` để nếu giá thay đổi giữa chừng vẫn hiển thị đúng giá lúc thêm vào giỏ.

---

### 2.11. `wishlists`

- **Vì sao tách?** Wishlist độc lập với cart. User có thể "yêu thích" mà không định mua ngay.
- **Embed hay tách?** Vì wishlist thường chỉ là danh sách `product_id`, có thể embed `wishlist: [product_id]` ngay trong `users`.
  - **Trade-off:** nếu user có 1000 mục yêu thích, document `users` sẽ phình to. Hiếm xảy ra với cửa hàng phụ kiện.
- **Khuyến nghị Phase 1:** tách collection `wishlists` cho sạch sẽ:
  ```
  { user_id, product_id, added_at }
  ```
  Mỗi document = 1 mục. Dễ thêm/xóa, dễ đếm.

---

### 2.12. `orders` + `order_items`

Đây là entity **quan trọng nhất về business**, cần thiết kế cẩn thận.

- **Vì sao tách `orders` và `order_items`?**
  - Một đơn hàng có nhiều dòng sản phẩm → quan hệ 1-N.
  - Tách giúp query "sản phẩm nào bán chạy nhất tháng" dễ hơn nhiều so với $unwind.
- **Có nên embed `items` vào `orders`?** Có thể, vì sau khi đơn xong items thường không thay đổi nữa. Nhưng tách ra vẫn lợi hơn về analytics.
- **Khuyến nghị Phase 1:**
  - `orders`: thông tin chung (mã đơn, tổng tiền, trạng thái, người mua, địa chỉ).
  - `order_items`: từng dòng (variant_id, quantity, price tại thời điểm mua, name snapshot).
  - **Snapshot dữ liệu** — đây là nguyên tắc quan trọng: khi tạo order, COPY `name`, `price`, `sku` của variant vào order_item. Vì sản phẩm có thể đổi tên/giá sau, nhưng đơn hàng cũ phải giữ nguyên thông tin lúc mua.

- **Field `orders`:**
  - `order_code` (mã hiển thị cho khách, vd `ORD-2025-000123`, **unique**)
  - `user_id` (nullable — vì cho phép guest checkout)
  - `customer_contact` (embed object: `{ full_name, phone, email }` — sinh từ "đặt hàng nhanh không cần đăng nhập")
  - `shipping_address` (embed object: `{ address_line, ward, district, province, note }`)
  - `payment_method` (enum: `cod` Phase 1; chừa `online` cho Phase 3)
  - `status` (`pending | confirmed | processing | completed | cancelled` — từ phần G)
  - `subtotal`, `shipping_fee`, `discount`, `total`
  - `notes` (ghi chú khách hàng)
  - timestamps

> **Tại sao embed `shipping_address` & `customer_contact`?** Vì khi giao hàng xong, dữ liệu này phải đông lạnh — user đổi địa chỉ trong tương lai không được thay đổi địa chỉ đơn hàng cũ.

---

### 2.13. `shipping_addresses` (Phase 2)

- Phase 1 **không cần** collection này vì user chưa lưu nhiều địa chỉ. Embed vào order là đủ.
- Phase 2 khi yêu cầu "lưu nhiều địa chỉ giao hàng" → tạo `shipping_addresses` riêng, link với `user_id`. Nhưng *vẫn embed snapshot vào order* khi đặt.

---

### 2.14. `guest_order_contacts`

- **Có cần collection riêng không?** Mình thấy **KHÔNG**. Đã embed `customer_contact` trong `orders` rồi.
- Tạo collection riêng chỉ làm phức tạp. Trừ khi muốn marketing đến guest sau này → khi đó mới tách.

---

### 2.15. `dashboard_aggregates`

- **Phase 1:** **KHÔNG** cần collection này. Số liệu dashboard (tổng user, tổng đơn, doanh thu...) tính thẳng bằng `countDocuments()` và `aggregate()` realtime. Cửa hàng gia đình không có lưu lượng lớn.
- **Phase 3:** nếu báo cáo phức tạp, dữ liệu nhiều → tạo collection `daily_stats` chạy cron mỗi đêm.

---

### 2.16. `settings`

- Tạo nếu cần lưu config động: số Zalo, email nhận thông báo, banner trang chủ, phí ship mặc định.
- 1 document key-value đơn giản. Không cần phức tạp.

---

## BƯỚC 3 — Phân tích theo FLOW THỰC TẾ

Bây giờ thay vì đi từ "có những entity gì", ta đi từ "user làm gì" và xem mỗi flow đụng vào collections nào. Đây là cách *kiểm tra ngược* xem schema có thiếu sót không.

### Flow 3.1 — Đăng ký / Đăng nhập
- Đụng: `users`.
- Cần: `email` (unique index), `password_hash`, `role`.
- **Câu hỏi nâng cao:** có cần tách `user_profiles` riêng (avatar, bio, dob...)?
  - Phase 1: **không**. Nhồi vào `users` luôn vì ít field.
  - Phase 2 nếu profile phình to mới tách.

### Flow 3.2 — Admin quản lý sản phẩm
- Đụng: `products`, `product_variants`, `categories`, `brands`, `inventory` (qua variant).
- Admin tạo product → chọn category & brand (reference) → tạo nhiều variant với các thuộc tính khác nhau → upload ảnh (embed url hoặc collection ảnh) → nhập tồn kho.
- **Câu hỏi:** khi tạo variant, làm sao biết variant đó có hợp lệ không (vd điện thoại phải có color + storage)?
  - Phase 1: tin admin nhập tay.
  - Phase 2 có thể thêm `attribute_definitions` cho từng category để validate.

### Flow 3.3 — Sản phẩm có nhiều màu/bộ nhớ → vì sao cần `product_variants`?
Trả lời gọn:
- 1 product = "iPhone 15" (concept).
- 1 variant = "iPhone 15 Đen 256GB" (cái thực sự bán).
- Khách mua *variant*, kho đếm *variant*, hóa đơn ghi *variant*.
- Nếu không có variant, bạn không thể tính được "còn bao nhiêu màu Đen 256GB" — cả website sập về nghiệp vụ.

### Flow 3.4 — Xem chi tiết sản phẩm
- Đụng: `products` (info chung) + `product_variants` (danh sách biến thể, giá, tồn kho) + ảnh (embed) + specs (embed).
- Một query lấy product + populate variants là đủ.
- **Mẹo MongoDB:** dùng `$lookup` để join variants, hoặc lưu `variant_ids: []` trong product để query nhanh hơn (denormalize nhẹ).

### Flow 3.5 — Thêm giỏ hàng
- Đụng: `carts`.
- Logged-in user → tìm/tạo cart bằng `user_id`.
- Guest → tìm/tạo cart bằng `session_id` (cookie).
- Thêm item = push vào mảng `items` (nếu embed) hoặc tạo `cart_items` mới.
- Nhớ lưu `price_snapshot` để hiển thị nhất quán.

### Flow 3.6 — Đặt hàng
- Đụng: `orders`, `order_items` (nếu tách), `product_variants` (trừ tồn kho).
- Bước:
  1. Lấy cart hiện tại.
  2. Validate tồn kho từng variant.
  3. Tạo `orders` + `order_items` với *snapshot* dữ liệu.
  4. Trừ `stock_quantity` trong từng variant.
  5. Xóa cart (hoặc đánh dấu `converted`).
  6. Gửi thông báo cho admin (xem flow 3.9).

### Flow 3.7 — Guest checkout vs Logged-in checkout
- **Khác biệt duy nhất:** `orders.user_id`.
  - Guest: `user_id = null`, `customer_contact` bắt buộc nhập.
  - Logged-in: `user_id = ObjectId(...)`, `customer_contact` có thể auto-fill từ `users` nhưng vẫn snapshot vào order.
- Để guest tra cứu đơn: dùng `phone` hoặc `order_code` → query `orders` (cần index `customer_contact.phone` và `order_code`).

### Flow 3.8 — Wishlist
- Đụng: `wishlists`.
- Add: insert `{ user_id, product_id }`.
- Remove: delete document.
- Đếm sản phẩm nào hay được wishlist → group by `product_id`.

### Flow 3.9 — Admin nhận thông báo có đơn mới
- **Đây không phải vấn đề database**, nhưng cần lưu cấu hình:
  - `settings.admin_notification_email`
  - `settings.admin_zalo_phone`
- **Lời khuyên thực tế:** dùng email (rẻ, đáng tin) + tích hợp Zalo OA (Official Account) hoặc gửi tin nhắn vào group Zalo qua webhook nếu có. Phase 1 tối thiểu nên có **email thông báo** + ghi log vào `orders.created_at` để admin vào dashboard thấy.

### Flow 3.10 — Dashboard admin
- Không cần collection riêng (Phase 1).
- Tổng user → `users.countDocuments({ role: "user", deleted_at: null })`.
- Tổng sản phẩm → `products.countDocuments({ status: "active" })`.
- Tổng đơn → `orders.countDocuments()`.
- Đơn mới → `orders.find({ status: "pending" }).sort({ created_at: -1 }).limit(10)`.
- Sắp hết hàng → `product_variants.find({ stock_quantity: { $lte: 5 } })`.
- Doanh thu → `orders.aggregate([{ $match: { status: "completed" } }, { $group: { _id: null, sum: { $sum: "$total" } } }])`.

---

## BƯỚC 4 — Format chuẩn khi đề xuất 1 collection

Khi bạn (hoặc team) đề xuất một collection mới, hãy luôn trình bày theo template này. Nó ép bạn suy nghĩ đầy đủ, không "thêm bảng cho vui":

```
- Requirement gốc: <copy nguyên dòng requirement>
- Suy luận: <vì sao dòng đó dẫn đến cần entity này>
- Collection cần có: <tên>
- Field cần có: <liệt kê + lý do từng field>
- Quan hệ với collection khác: <ref/embed nào>
- Vì sao thiết kế như vậy: <trade-off, lựa chọn, alternative đã loại>
```

**Ví dụ áp dụng cho `product_variants`:**

- **Requirement gốc:** "Chọn biến thể sản phẩm" + "Quản lý product variant" + "Filter theo màu, bộ nhớ".
- **Suy luận:** Mỗi sản phẩm có nhiều biến thể với giá/tồn kho khác nhau. Khách mua một biến thể cụ thể, kho phải đếm theo biến thể.
- **Collection cần có:** `product_variants`.
- **Field cần có:** `product_id, sku, attributes{}, price, compare_at_price, stock_quantity, status, images[], created_at, updated_at`.
- **Quan hệ:** `product_id` → ref `products`. Được tham chiếu bởi `cart_items.variant_id`, `order_items.variant_id`, `wishlists` (nếu wishlist theo variant).
- **Vì sao:** đã loại 2 alternative (embed mảng variants vào products → document phình to; tạo nhiều product riêng → trùng lặp dữ liệu chung). Tách collection cho phép tồn kho/giá độc lập, scale tốt, audit dễ.

---

## BƯỚC 5 — Khi nào EMBED, khi nào REFERENCE, khi nào TÁCH COLLECTION

Đây là câu hỏi muôn thuở của MongoDB. **Quy tắc thực dụng:**

### 5.1. EMBED khi:
- Quan hệ **1-1** hoặc **1-ít** (vd 1 order có < 50 items).
- Dữ liệu con **không sống độc lập** — luôn được đọc/ghi cùng với cha (vd địa chỉ giao hàng của 1 order).
- Cần **đông lạnh snapshot** (vd thông tin sản phẩm trong order item).
- Không cần query dữ liệu con riêng lẻ.

**Ví dụ embed đúng:** `orders.shipping_address`, `orders.customer_contact`, `products.images[]`, `products.specs[]`, `cart.items[]`.

### 5.2. REFERENCE khi:
- Quan hệ **1-N lớn** hoặc **N-N** (vd 1 brand có hàng nghìn product).
- Dữ liệu con **sống độc lập**, có vòng đời riêng (user, product, brand).
- Cần query dữ liệu con riêng (search product, list user).
- Dữ liệu hay thay đổi và cần đồng bộ một nguồn (đổi tên brand → tự động phản ánh ở mọi nơi).

**Ví dụ reference đúng:** `products.brand_id`, `products.category_id`, `product_variants.product_id`, `orders.user_id`.

### 5.3. TÁCH COLLECTION KHI:
- Entity đã **đủ "lớn"** về mặt nghiệp vụ (có CRUD riêng, có lifecycle riêng).
- Cần **index riêng** trên các field của entity đó.
- Có thể **scale ngang** độc lập (vd `order_items` rất nhiều, tách ra để shard).

### 5.4. KHÔNG NÊN nhồi quá nhiều field vào 1 document
- MongoDB giới hạn 16MB / document — nhưng **đừng tới gần** giới hạn đó.
- Document quá to làm chậm mọi query trên collection (load vào RAM).
- Field hiếm dùng → cân nhắc tách. Vd "lịch sử đăng nhập" của user nên là collection riêng `user_login_logs`, không nhét vào `users`.

### 5.5. Quy tắc "cấm kỵ" cho người mới
- ❌ Đừng embed dữ liệu mà sẽ cần tham chiếu chéo (vd embed product info vào cart, rồi đi đâu cũng phải sync lại).
- ❌ Đừng tạo collection rỗng tuếch (1-2 field) chỉ vì "thấy nó là entity". Cân nhắc nhồi vào parent.
- ❌ Đừng dùng MongoDB như SQL: tạo bảng trung gian N-N theo thói quen. Mongo cho phép array of refs → dùng nó.
- ❌ Đừng thiết kế cho Phase 5 ngay từ Phase 1. **YAGNI** (You Aren't Gonna Need It).

---

## BƯỚC 6 — Thứ tự PHÂN TÍCH DATABASE chuẩn (9 bước)

Mỗi lần làm dự án mới, đi theo đúng thứ tự này. **Không nhảy bước.**

### Bước 1: Xác định ACTORS
Ai là người dùng hệ thống?
- Ví dụ phone shop: **Guest** (chưa đăng nhập), **User** (đã đăng nhập), **Admin**.

### Bước 2: Xác định FEATURES
Mỗi actor làm được gì? Liệt kê dạng "use case ngắn".
- Guest: xem sản phẩm, search, thêm giỏ, đặt hàng nhanh, tra cứu đơn theo SĐT.
- User: tất cả của Guest + đăng nhập + wishlist + lịch sử đơn.
- Admin: CRUD product/category/brand/variant, quản lý đơn, xem dashboard.

### Bước 3: Tìm ENTITIES từ features
Gạch chân danh từ. Lập bảng như Bước 1 ở trên.

### Bước 4: Tách entity CHÍNH / PHỤ
- **Chính:** đứng độc lập, có CRUD đầy đủ → users, products, orders, categories, brands, variants.
- **Phụ:** chỉ tồn tại theo cha → cart_items (theo cart), order_items (theo order), product_specs (theo product).
- Entity phụ thường là ứng viên cho **embed**.

### Bước 5: Xác định RELATIONSHIP
Vẽ ra (giấy hoặc draw.io):
- product **N–1** brand
- product **N–1** category
- product **1–N** variants
- user **1–N** orders
- order **1–N** order_items
- order_item **N–1** variant
- user **1–N** wishlists
- user **1–1** cart (active)

### Bước 6: Xác định FIELD
Với mỗi collection, list field. Mỗi field phải truy ngược về requirement (xem Bước 2 ở trên). Field nào không truy ngược được → có thể bỏ.

### Bước 7: Xác định STATUS / ENUM
Liệt kê các trạng thái. Document hóa rõ ràng:
- `users.status`: `active | inactive | blocked`
- `users.role`: `admin | user`
- `products.status`: `draft | active | inactive | out_of_stock`
- `product_variants.status`: `active | inactive`
- `orders.status`: `pending | confirmed | processing | completed | cancelled`
- `orders.payment_method`: `cod` (Phase 1) | `bank_transfer | momo | vnpay` (Phase 3)
- Stock logic (tính từ `stock_quantity`): `in_stock` (>5) | `low_stock` (1–5) | `out_of_stock` (0). Không lưu, **tính ra**.

### Bước 8: Xác định INDEX
Index = key cho hiệu năng. Rule: index field nào **hay xuất hiện trong `find` filter, sort, hoặc unique constraint**.

| Collection | Index gợi ý |
|---|---|
| `users` | `email` (unique), `phone`, `role`, `status` |
| `products` | `slug` (unique), `name` (text), `category_id`, `brand_id`, `status`, `tags`, `created_at` |
| `product_variants` | `sku` (unique), `product_id`, `price`, `stock_quantity`, `status` |
| `categories` | `slug` (unique), `parent_id`, `status` |
| `brands` | `slug` (unique), `status` |
| `orders` | `order_code` (unique), `user_id`, `customer_contact.phone`, `status`, `created_at` |
| `order_items` | `order_id`, `variant_id`, `product_id` |
| `carts` | `user_id`, `session_id`, `updated_at` |
| `wishlists` | `(user_id, product_id)` compound unique |

**Nguyên tắc:** không tạo index "phòng hờ" — mỗi index tốn RAM và làm chậm write. Chỉ tạo khi có query thực sự dùng.

### Bước 9: Kiểm tra KHẢ NĂNG MỞ RỘNG Phase 2/3
Hỏi: nếu tuần sau thêm coupon, review, payment online... mình có phải phá schema cũ không?
- Coupon → thêm collection `coupons` + field `orders.coupon_id`. ✅ Không phá.
- Review → thêm `reviews { product_id, user_id, rating, content }`. ✅ Không phá.
- Online payment → thêm `payments { order_id, provider, status, transaction_id }` và mở rộng enum `orders.payment_method`. ✅ Không phá.
- Inventory transactions → thêm `inventory_transactions { variant_id, type, qty, reason, created_at }`, vẫn giữ `stock_quantity` ở variant như cache. ✅ Không phá.
- Multi địa chỉ → thêm `shipping_addresses` ref `user_id`, vẫn embed snapshot vào order. ✅ Không phá.

Nếu bước 9 thấy *phải phá* schema → quay lại bước 4–6 redesign.

---

## BƯỚC 7 — DATABASE ANALYSIS MAP

Đây là cái bạn nên dán lên tường khi làm dự án. Mỗi dòng = 1 mảnh ghép trong toàn bộ hệ thống.

| Feature | Entity | Collection | Main fields | Relationship | Reason |
|---|---|---|---|---|---|
| Đăng ký / Đăng nhập | User | `users` | email, password_hash, full_name, phone, role, status | Có nhiều orders, wishlists | Actor chính, sống độc lập, cần auth |
| Phân role | Role | (enum trong `users.role`) | `admin`, `user` | — | Phase 1 chỉ 2 role, không cần collection riêng |
| Xem danh mục | Category | `categories` | name, slug, parent_id, status | 1–N với products | Hỗ trợ filter, menu, SEO; có thể đa cấp |
| Xem brand | Brand | `brands` | name, slug, logo_url, status | 1–N với products | Filter theo brand, trang brand riêng |
| Danh sách / chi tiết sản phẩm | Product | `products` | name, slug, description, brand_id, category_id, base_price, status, tags, images[], specs[] | N–1 brand, N–1 category, 1–N variants | Entity trung tâm, query nhiều nhất |
| Chọn biến thể, mua | Product Variant | `product_variants` | product_id, sku, attributes{}, price, stock_quantity, images[], status | N–1 product | Đơn vị bán/đếm/định giá thực |
| Thông số kỹ thuật | Product Specs | embed `products.specs[]` | group, key, value | embed | Cấu trúc động cho mọi loại sản phẩm |
| Tồn kho | Inventory | field `product_variants.stock_quantity` | qty | — | Phase 1 đơn giản; Phase 3 tách `inventory_transactions` |
| Giỏ hàng | Cart | `carts` (embed items) | user_id?, session_id?, items[{variant_id, qty, price_snapshot}] | N–1 user (optional) | Cart nhỏ, embed gọn; hỗ trợ guest |
| Wishlist | Wishlist | `wishlists` | user_id, product_id, added_at | N–1 user, N–1 product | Tách để dễ thêm/xóa, đếm |
| Đặt hàng (logged-in & guest) | Order | `orders` | order_code, user_id?, customer_contact{}, shipping_address{}, items snapshot, subtotal, total, status, payment_method | N–1 user (optional), 1–N order_items | Snapshot dữ liệu để đông lạnh |
| Dòng đơn hàng | Order Item | `order_items` | order_id, variant_id, product_id, name_snapshot, sku_snapshot, price_snapshot, qty | N–1 order, N–1 variant | Dễ analytics, tách khỏi order |
| Tra cứu đơn theo SĐT | (query) | `orders` | filter by `customer_contact.phone` hoặc `order_code` | — | Index `customer_contact.phone` + `order_code` |
| Lịch sử đơn user | (query) | `orders` | filter by `user_id` | — | Index `user_id` |
| Quản lý user (admin) | (CRUD) | `users` | — | — | Sử dụng lại collection users |
| Dashboard | (aggregations realtime) | `users`, `products`, `product_variants`, `orders` | count, sum, find low stock | — | Phase 1 không cần collection riêng |
| Thông báo Zalo / Email admin | Settings | `settings` | admin_email, zalo_phone, zalo_oa_token | — | Cấu hình runtime, không hard-code |
| Nút Zalo trên web | Settings | `settings.zalo_phone` | — | — | Không phải entity, là config |

---

## BONUS — Gợi ý mở rộng Phase 2 & 3 (chỉ để bạn yên tâm schema Phase 1 không bị phá)

| Tính năng tương lai | Cách thêm | Có phá schema cũ? |
|---|---|---|
| Review / rating | `reviews { product_id, user_id, rating, content, created_at }` | ❌ Không |
| Q&A sản phẩm | `product_questions`, `product_answers` | ❌ Không |
| Coupon | `coupons { code, type, value, min_order, valid_from, valid_to, usage_limit }` + `orders.coupon_code` + `orders.discount` | ❌ Không (đã có `discount` field) |
| Banner | `banners { image_url, link, position, sort, status }` | ❌ Không |
| Blog | `posts { title, slug, content, author_id, tags, status }` | ❌ Không |
| Multi địa chỉ user | `shipping_addresses { user_id, ...}` | ❌ Không (vẫn embed snapshot vào order) |
| Notifications | `notifications { user_id, type, payload, read, created_at }` | ❌ Không |
| Related products | Thêm `related_product_ids[]` vào product, hoặc collection `product_relations` | ❌ Không |
| Online payment | `payments { order_id, provider, status, txn_id }` + mở rộng enum `payment_method` | ❌ Không |
| Shipping integration | `shipments { order_id, carrier, tracking_code, status }` | ❌ Không |
| Inventory đầy đủ | `inventory_transactions { variant_id, type, qty, reason, ref_order_id, created_at }` | ❌ Không (giữ stock_quantity làm cache) |
| Flash sale / combo | `promotions { type, rules{}, products[], variants[], from, to }` | ❌ Không |
| Audit logs | `audit_logs { actor_id, action, target_collection, target_id, before, after, created_at }` | ❌ Không |
| Loyalty points | `user_points { user_id, points, ...}` + `point_transactions` | ❌ Không |

---

## TỔNG KẾT — 7 nguyên tắc bạn nên ghi nhớ

1. **Đi từ feature → entity, không đi ngược.** Đừng bịa entity rồi gán tính năng cho nó.
2. **Mỗi field phải truy ngược về 1 dòng requirement.** Không có thì cân nhắc bỏ.
3. **Embed cho dữ liệu sống cùng cha; reference cho dữ liệu sống độc lập.**
4. **Snapshot dữ liệu trong order.** Sản phẩm có thể đổi, đơn hàng phải bất biến.
5. **Status là enum, không phải collection.** Trừ khi enum cần metadata phong phú.
6. **Index theo query thực tế, không tạo index "phòng hờ".**
7. **Thiết kế Phase 1 tối giản, nhưng để cửa mở cho Phase 2/3.** Không over-engineer, không "cement" cấu trúc.

Nắm vững 7 nguyên tắc này + đi đủ 9 bước phân tích, bạn có thể tự thiết kế DB cho **bất kỳ** dự án e-commerce nào, không cần chờ ai vẽ schema sẵn cho mình.

— Senior Database Architect & Mentor


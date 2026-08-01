# SmartPhone Shop — Backend API

Backend cho website bán điện thoại & phụ kiện công nghệ (SmartPhone Shop). Cung cấp REST API cho storefront và admin panel ở [`smartphone-fe`](../smartphone-fe).

## Tech stack

- **Runtime**: Node.js + TypeScript (chạy trực tiếp bằng `tsx`, không cần build khi dev)
- **Framework**: Express 5
- **Database**: MongoDB + Mongoose (ODM)
- **Validation**: Zod
- **Auth**: JWT (`jsonwebtoken`) + `bcryptjs` để hash mật khẩu
- **Khác**: `cors`, `morgan` (request logger), `dotenv`

## Yêu cầu môi trường

- Node.js 20+
- MongoDB đang chạy (local mặc định ở `mongodb://localhost:27017`, hoặc dùng MongoDB Atlas)

## Cài đặt

```bash
npm install
```

Tạo file `.env` từ mẫu:

```bash
cp .env.example .env
```

Rồi điền giá trị thật vào `.env`:

```
PORT=4000
MONGODB_URI=mongodb://localhost:27017/smartphone-be
```

## Chạy dự án

```bash
npm run dev
```

Server chạy tại `http://localhost:4000`. Kiểm tra nhanh:

```bash
curl http://localhost:4000/health
# => {"ok":true}
```

## Scripts

| Lệnh | Mô tả |
| --- | --- |
| `npm run dev` | Chạy server ở chế độ dev, tự reload khi sửa code (`tsx watch`) |

> Các script `build`/`start`/`seed` sẽ được thêm khi dự án tới các milestone tương ứng.

## Cấu trúc thư mục

```
src/
└── server.ts      # entry point: middleware, route /health, kết nối MongoDB
```

Cấu trúc sẽ mở rộng dần theo roadmap (models, routes, middleware auth...).

## Trạng thái dự án

Backend đang được xây dựng theo từng milestone, đi kèm việc học sâu từng chủ đề (JWT, REST API design, MongoDB schema...). Xem chi tiết thiết kế database tại [`DATABASE_DESIGN.md`](../../File/DATABASE_DESIGN.md) và roadmap tổng thể tại [`PROJECT_ROADMAP.md`](../../File/PROJECT_ROADMAP.md).

Hiện tại mới có:
- [x] Server Express + kết nối MongoDB
- [x] Route `GET /health`
- [ ] Models & API sản phẩm/danh mục/thương hiệu
- [ ] Authentication (JWT access + refresh token)
- [ ] Cart, Order, Admin API

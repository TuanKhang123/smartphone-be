# Quy ước hợp tác học tập — Dự án Phone Shop (làm lại từ đầu)

> File này ghi lại cách Khang muốn làm việc cùng AI trên dự án phone-shop. Đọc lại mỗi khi bắt đầu một phiên làm việc mới để không phải nhắc lại từ đầu.

## 1. Mục tiêu

Dự án phone-shop cũ (backend Express/Mongoose/JWT + frontend Next.js/Zustand/shadcn) đã bị xoá và sẽ **làm lại từ đầu**. Mục tiêu không phải là hoàn thiện sản phẩm nhanh nhất có thể, mà là **dùng chính dự án thật này làm sân tập** để lấp các lỗ hổng kiến thức liệt kê trong `learning_prompts_khang.md` (React internals, JWT/refresh token, Axios interceptor, React Query, Next.js sâu, cache layers, bundle optimization, micro-frontend, testing, CI/CD...).

- **Frontend là trọng tâm học sâu** — Khang muốn tự tay code càng nhiều càng tốt để thật sự hiểu.
- **Backend là phần phục vụ cho FE chạy được** — không phải trọng tâm học sâu như FE, nên Khang sẽ hỏi/dựa vào AI nhiều hơn ở mảng này. Điều này **không** có nghĩa là AI mặc định code hộ nhiều hơn ở BE — quy tắc hợp tác ở mục 2 áp dụng như nhau cho cả hai.

## 2. Vai trò của AI — quy tắc quan trọng nhất

**Mặc định AI là coach/người hướng dẫn, không phải người build hộ.** Áp dụng như nhau cho cả Frontend lẫn Backend.

Mặc định AI sẽ:

- Giải thích khái niệm, chỉ ra kỹ thuật cần áp dụng cho phần đang làm
- Đặt câu hỏi kiểm tra để xác nhận Khang hiểu đúng
- Review code Khang đã viết: chỉ ra lỗi, chỗ nên cải thiện, hỏi lại để Khang tự nhận ra vấn đề thay vì sửa hộ luôn
- Gợi ý hướng đi khi Khang bị bug/bí, không đưa lời giải trọn gói ngay
- Sau mỗi feature Frontend: cùng xác định hành vi cần test, lý do/rủi ro và loại test phù hợp trước khi viết test

Mặc định AI **không**:

- Tự ý viết code thay Khang khi chưa được yêu cầu
- Rewrite toàn bộ một đoạn code chỉ vì review thấy chưa tối ưu

**Khi nào AI mới trực tiếp code:** chỉ khi Khang yêu cầu rõ ràng, ví dụ "làm giúp tôi phần này", "code hộ đoạn này", "build cho tôi cái X". Ngoài trường hợp đó, luôn ưu tiên hướng dẫn để Khang tự làm.

Ghi chú riêng cho Backend: vì không phải trọng tâm học sâu, Khang dự đoán sẽ *hỏi nhiều hơn* và có thể *nhờ làm hộ nhiều hơn* ở BE so với FE trong thực tế — điều đó là bình thường và không cần xin phép lại, nhưng quy tắc mặc định (coach trước, code khi được yêu cầu) vẫn giữ nguyên.

## 3. Trạng thái xuất phát điểm

Dự án cũ đã bị xoá hoàn toàn — bắt đầu từ con số 0. Chưa chốt lại stack (có thể giữ Express + Mongoose + JWT / Next.js + Zustand + shadcn như bản cũ, hoặc đổi khác). Việc chọn/khởi tạo lại stack sẽ là một bước làm việc riêng, thực hiện khi Khang sẵn sàng bắt đầu — không tự động làm chỉ vì có file quy ước này.

## 4. Map chủ đề học ↔ việc cụ thể khi dựng lại dự án

Khi build lại từng phần, đây là các chủ đề trong `learning_prompts_khang.md` nên được cố ý áp dụng ngay từ đầu thay vì làm tạm rồi sửa sau:

| Chủ đề học | Áp dụng vào việc gì trong dự án |
| --- | --- |
| Axios setup + interceptor | Khi dựng lớp gọi API ở FE: tạo instance riêng (`api-client.ts`), request/response interceptor, không gọi `axios.get/post` rải rác |
| JWT / access + refresh token | Khi dựng auth ở BE: làm access token + refresh token + silent refresh ngay, không chỉ access token như bản cũ |
| Axios 401 → refresh → retry | Nối interceptor FE với refresh token flow ở BE |
| React Query | Dùng ngay từ đầu cho mọi trang cần dữ liệu server, thay vì `useEffect` fetch tay hoặc mock data |
| Server state vs Client state | Phân định rõ ngay từ đầu: state UI (giỏ hàng, modal, filter tạm...) → Zustand; state từ server (sản phẩm, đơn hàng, user...) → React Query |
| Next.js sâu (SSR/SSG/ISR/App Router) | Với mỗi trang mới, chủ động chọn rendering strategy phù hợp thay vì mặc định render kiểu client-side |
| React Internals / Performance (memo, re-render) | Áp dụng khi build các list/component lặp lại nhiều (danh sách sản phẩm, giỏ hàng...) |
| Lazy loading / code splitting | Áp dụng khi thêm các trang/khu vực nặng (trang admin, biểu đồ báo cáo...) |
| Shared component tự build | Khi build lại UI kit cơ bản (Button, Input, Modal...) thay vì chỉ copy từ shadcn mà không hiểu |
| Cache layers, Bundle optimization | Xem lại khi ứng dụng đã chạy được, trước khi launch/demo |
| Testing Frontend | Sau mỗi feature Frontend: ưu tiên Vitest + React Testing Library cho component/integration; unit test cho hook, utility và business logic độc lập; Playwright để sau, chỉ cho critical E2E flows |
| Micro-frontend, WebSocket, CI/CD, Zustand vs Redux, GraphQL | Áp dụng dần khi đụng tới phần liên quan, không cần làm ngay lúc khởi tạo dự án |

## 5. Quy trình mỗi khi bắt đầu một chủ đề/tính năng mới

1. Khang nêu chủ đề hoặc tính năng muốn làm (vd: "giờ mình làm login" / "mình muốn hiểu React Query rồi áp dụng vào trang sản phẩm")
2. AI xác định phần việc cụ thể liên quan trong dự án
3. AI đưa hướng dẫn từng bước + câu hỏi kiểm tra hiểu — **không code trước**
4. Khang tự làm feature
5. Với feature Frontend, AI cùng Khang xác định expected behavior, các case dễ vỡ và loại test phù hợp trước khi viết test
6. Khang tự viết test; AI review/gợi ý hoặc chỉ viết test khi được yêu cầu rõ
7. Chạy test và verify behavior, rồi mới sang feature tiếp theo
8. Khang quay lại nhờ review, hỏi thêm, hoặc nhờ AI làm hộ nếu thật sự cần

### Quy ước test Frontend

- Workflow bắt buộc: **build feature → hiểu expected behavior → chọn test cases quan trọng → viết test → verify → feature tiếp theo**.
- Ưu tiên component/integration test cho React/Next.js UI bằng **Vitest + React Testing Library**.
- Dùng unit test cho hook, utility function và business logic độc lập.
- Chỉ dùng Playwright E2E sau, cho critical user flow thật sự cần browser đầy đủ.
- Test hành vi người dùng nhìn thấy/thao tác được; không test private state, CSS class hay implementation detail.
- Chọn case theo rủi ro thực tế: success và, khi liên quan, loading, error, empty, invalid input, disabled state, selection/state edge case.
- Không viết test chỉ để tăng coverage; không over-test UI tĩnh/trivial.

## 6. Tiến độ

Tiến độ chi tiết theo từng milestone/tính năng được theo dõi ở `PROJECT_ROADMAP.md` (checklist theo mốc, map với trang/feature thật của dự án + prompt học tương ứng). File này chỉ giữ quy ước làm việc, không lặp lại checklist.
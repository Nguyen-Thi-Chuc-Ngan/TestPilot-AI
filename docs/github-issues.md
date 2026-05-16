# TestPilot AI - GitHub Issues Backlog

Tài liệu này chuyển roadmap 30 ngày thành danh sách GitHub Issues có thể dùng ngay cho solo build. Mỗi issue được viết theo hướng MVP-first, có ưu tiên, mô tả, và acceptance criteria ngắn gọn.

## Epic 1 - Project Foundation

### [P0] Issue 01 - Khởi tạo monorepo và tooling cơ bản
**Label:** `setup`, `infra`, `p0`

**Mô tả**
- Tạo cấu trúc monorepo cho frontend, backend, shared packages, và docs.
- Thiết lập lint, format, env example, and base scripts.

**Checklist**
- [ ] Tạo workspace structure cho `apps/web`, `apps/api`, `packages/shared`, `docs`
- [ ] Cấu hình ESLint/Prettier
- [ ] Thêm `.env.example`
- [ ] Thêm base scripts cho dev/test/build

**Acceptance Criteria**
- `pnpm install` hoặc command tương đương chạy ổn.
- Repo có cấu trúc rõ ràng để mở rộng sau.

### [P0] Issue 02 - Setup Supabase project, Auth, Database, Storage
**Label:** `backend`, `auth`, `supabase`, `p0`

**Mô tả**
- Kết nối Supabase Auth, PostgreSQL, và Storage.
- Chuẩn bị bucket cho screenshots và exported reports.

**Checklist**
- [ ] Tạo Supabase project
- [ ] Cấu hình Auth provider
- [ ] Tạo storage bucket cho artifacts
- [ ] Kiểm tra kết nối backend với Supabase

**Acceptance Criteria**
- User có thể đăng nhập bằng Supabase Auth.
- Backend đọc/ghi được dữ liệu cơ bản.

### [P0] Issue 03 - Thiết kế schema PostgreSQL và migration đầu tiên
**Label:** `database`, `schema`, `p0`

**Mô tả**
- Tạo schema lõi cho users, projects, scan jobs, findings, reports.

**Checklist**
- [ ] Tạo migration initial
- [ ] Tạo bảng users
- [ ] Tạo bảng projects
- [ ] Tạo bảng scan_jobs
- [ ] Tạo bảng artifacts/findings/reports

**Acceptance Criteria**
- Migrations chạy được từ đầu đến cuối.
- Schema đủ cho MVP scan pipeline.

### [P0] Issue 04 - Dựng dashboard shell trên Next.js
**Label:** `frontend`, `ui`, `p0`

**Mô tả**
- Tạo layout app, sidebar, topbar, and protected routes.

**Checklist**
- [ ] Tạo App Router layout
- [ ] Tạo sidebar navigation
- [ ] Tạo topbar với user menu
- [ ] Bọc route bằng auth guard

**Acceptance Criteria**
- Người dùng đăng nhập mới vào dashboard được.
- UI skeleton có thể mở rộng cho các module khác.

## Epic 2 - Scan Pipeline Core

### [P0] Issue 05 - Xây scanner form cho URL và requirement text
**Label:** `frontend`, `scanner`, `p0`

**Mô tả**
- Cho phép user nhập URL, requirement text, hoặc chọn mode scan.

**Checklist**
- [ ] Tạo form nhập URL
- [ ] Tạo field requirement text
- [ ] Tạo mode selector
- [ ] Validate input bằng Zod

**Acceptance Criteria**
- User submit form và tạo scan job thành công.

### [P0] Issue 06 - Tạo FastAPI skeleton và health/auth endpoints
**Label:** `backend`, `api`, `p0`

**Mô tả**
- Dựng API base với health check, auth guard, và request validation.

**Checklist**
- [ ] Tạo FastAPI app
- [ ] Thêm `/health`
- [ ] Thêm `/me`
- [ ] Cấu hình auth middleware

**Acceptance Criteria**
- API chạy local ổn định.
- Có thể xác thực user ở mức cơ bản.

### [P0] Issue 07 - Implement scan job model và lifecycle
**Label:** `backend`, `jobs`, `p0`

**Mô tả**
- Tạo trạng thái job và luồng xử lý async.

**Checklist**
- [ ] Tạo job model
- [ ] Định nghĩa status lifecycle
- [ ] Tạo endpoint create scan job
- [ ] Tạo endpoint get job status

**Acceptance Criteria**
- Job có trạng thái rõ: queued, running, completed, failed.

### [P0] Issue 08 - Tích hợp Playwright worker scan cơ bản
**Label:** `automation`, `playwright`, `p0`

**Mô tả**
- Worker mở URL, chụp screenshot, và thu thập evidence cơ bản.

**Checklist**
- [ ] Tạo worker process
- [ ] Mở URL bằng Playwright
- [ ] Chụp screenshot
- [ ] Lưu evidence cơ bản

**Acceptance Criteria**
- Scan được một trang demo công khai hoặc local.

### [P0] Issue 09 - Lưu screenshot và artifacts lên Storage
**Label:** `storage`, `backend`, `p0`

**Mô tả**
- Upload ảnh và report artifacts lên Supabase Storage hoặc S3-compatible storage.

**Checklist**
- [ ] Upload screenshot
- [ ] Upload report file
- [ ] Lưu metadata artifact vào DB

**Acceptance Criteria**
- Artifact truy xuất được sau khi scan xong.

### [P0] Issue 10 - Implement URL sanitizer và SSRF protection
**Label:** `security`, `backend`, `p0`

**Mô tả**
- Chặn URL nguy hiểm, localhost, internal IP, và protocol lạ.

**Checklist**
- [ ] Validate protocol
- [ ] Block localhost/private ranges
- [ ] Block file/javascript/data schemes
- [ ] Thêm timeout and retry policy

**Acceptance Criteria**
- Không thể scan URL nội bộ hoặc nguy hiểm.

## Epic 3 - AI Analysis Core

### [P0] Issue 11 - Tích hợp OpenAI/Gemini adapter và JSON schema output
**Label:** `ai`, `backend`, `p0`

**Mô tả**
- Xây abstraction cho AI provider và bắt model trả về structured JSON.

**Checklist**
- [ ] Tạo AI provider interface
- [ ] Tích hợp model text
- [ ] Tích hợp model vision
- [ ] Validate JSON output bằng schema

**Acceptance Criteria**
- AI response không phụ thuộc vào free-form text.

### [P0] Issue 12 - AI UI Bug Hunter v1
**Label:** `ai`, `ux`, `p0`

**Mô tả**
- Phân tích screenshot và sinh danh sách UI/UX issues.

**Checklist**
- [ ] Tạo prompt template
- [ ] Phân loại bug theo category
- [ ] Trả về severity và evidence

**Acceptance Criteria**
- Ít nhất một trang demo trả về findings có cấu trúc.

### [P0] Issue 13 - Test Case Generator v1
**Label:** `ai`, `testing`, `p0`

**Mô tả**
- Từ URL hoặc requirement, AI sinh test case manual có cấu trúc.

**Checklist**
- [ ] Tạo prompt template
- [ ] Sinh test case theo format chuẩn QA
- [ ] Có preconditions, steps, expected result

**Acceptance Criteria**
- Test case render được trong frontend và export.

### [P0] Issue 14 - Smart Bug Report v1
**Label:** `ai`, `bug-report`, `p0`

**Mô tả**
- Sinh bug report chuẩn QA với severity, priority, steps to reproduce.

**Checklist**
- [ ] Tạo bug report schema
- [ ] Sinh steps to reproduce
- [ ] Gán severity/priority

**Acceptance Criteria**
- Bug report đủ thông tin để copy vào Jira/Linear.

### [P0] Issue 15 - Automation Script Generator v1
**Label:** `ai`, `playwright`, `p0`

**Mô tả**
- Sinh Playwright script từ findings hoặc requirement.

**Checklist**
- [ ] Tạo script template
- [ ] Sinh code Playwright TS
- [ ] Có notes about assumptions

**Acceptance Criteria**
- Script đọc được và có thể chỉnh sửa thủ công.

## Epic 4 - Frontend Result Experience

### [P0] Issue 16 - Report viewer với tabs Findings / Test Cases / Script
**Label:** `frontend`, `report`, `p0`

**Mô tả**
- Tạo workspace xem kết quả scan.

**Checklist**
- [ ] Tab findings
- [ ] Tab test cases
- [ ] Tab bug report
- [ ] Tab automation script

**Acceptance Criteria**
- User xem toàn bộ output từ một scan ở cùng một màn hình.

### [P0] Issue 17 - Export report dạng Markdown và HTML
**Label:** `export`, `frontend`, `p0`

**Mô tả**
- Cho phép export report để dùng trong CV/portfolio.

**Checklist**
- [ ] Export Markdown
- [ ] Export HTML
- [ ] Lưu file vào storage

**Acceptance Criteria**
- Tải report xuống hoặc mở link share được.

### [P1] Issue 18 - Project History và scan comparison cơ bản
**Label:** `history`, `frontend`, `p1`

**Mô tả**
- Hiển thị lịch sử scan theo project.

**Checklist**
- [ ] List scan history
- [ ] View scan detail
- [ ] So sánh scan cũ/mới cơ bản

**Acceptance Criteria**
- User có thể xem tiến trình test theo thời gian.

### [P1] Issue 19 - UX polish cho dashboard và loading states
**Label:** `frontend`, `ux`, `p1`

**Mô tả**
- Cải thiện trải nghiệm chờ job, empty state, và animation nhẹ.

**Checklist**
- [ ] Loading skeleton
- [ ] Empty state
- [ ] Progress indicator
- [ ] Toast feedback

**Acceptance Criteria**
- Giao diện đủ polished để demo public.

### [P1] Issue 20 - Error handling, retries, và observability cơ bản
**Label:** `backend`, `ops`, `p1`

**Mô tả**
- Thêm logging, retry, và xử lý lỗi rõ ràng.

**Checklist**
- [ ] Structured logging
- [ ] Retry cho job fail tạm thời
- [ ] Error boundary frontend
- [ ] Thêm basic metrics/logs

**Acceptance Criteria**
- Khi lỗi xảy ra, user hiểu được nguyên nhân và cách xử lý.

## Epic 5 - Quality & Demo Features

### [P1] Issue 21 - Unit tests cho parser, validator, prompt builder
**Label:** `tests`, `backend`, `p1`

**Mô tả**
- Test các thành phần logic quan trọng nhất.

**Checklist**
- [ ] Test URL sanitizer
- [ ] Test prompt builders
- [ ] Test schema validation

**Acceptance Criteria**
- Các helper cốt lõi có coverage tốt.

### [P1] Issue 22 - Integration tests cho API và worker
**Label:** `tests`, `integration`, `p1`

**Mô tả**
- Test luồng tạo job đến khi hoàn thành.

**Checklist**
- [ ] Test create scan job
- [ ] Test worker execution
- [ ] Test storage upload path

**Acceptance Criteria**
- Luồng scan chính chạy được trong môi trường test.

### [P1] Issue 23 - E2E test login -> scan -> report
**Label:** `tests`, `e2e`, `p1`

**Mô tả**
- Dùng browser automation để đảm bảo flow chính hoạt động.

**Checklist**
- [ ] Login flow
- [ ] Create scan flow
- [ ] View report flow
- [ ] Export flow

**Acceptance Criteria**
- Có ít nhất một test E2E xanh trên pipeline.

### [P1] Issue 24 - Tạo demo site nội bộ có bug cố ý
**Label:** `demo`, `testing`, `p1`

**Mô tả**
- Tạo trang demo để pipeline dễ bắt bug và dễ show portfolio.

**Checklist**
- [ ] Tạo landing demo
- [ ] Cài bug UI cố ý
- [ ] Cài một vài accessibility issue

**Acceptance Criteria**
- TestPilot AI phát hiện được bug đã cài sẵn.

### [P1] Issue 25 - AI Roast Mode như toggle giọng điệu
**Label:** `ai`, `fun`, `p1`

**Mô tả**
- Thêm mode “roast” vui nhưng vẫn hữu ích.

**Checklist**
- [ ] Tạo tone selector
- [ ] Tạo prompt biến thể
- [ ] Giới hạn ngôn ngữ để vẫn professional

**Acceptance Criteria**
- User bật/tắt được roast mode khi xem findings.

### [P1] Issue 26 - Game Testing Arena v1
**Label:** `game`, `demo`, `p1`

**Mô tả**
- Tạo mini game có bug để AI hoặc người chơi tìm lỗi.

**Checklist**
- [ ] Tạo game screen đơn giản
- [ ] Cài bug có chủ đích
- [ ] Chấm điểm bug finding

**Acceptance Criteria**
- Có flow chơi và score cơ bản.

### [P1] Issue 27 - AI Interview Trainer v1
**Label:** `ai`, `career`, `p1`

**Mô tả**
- Cho tester luyện phỏng vấn và nhận feedback theo rubric.

**Checklist**
- [ ] Tạo bộ câu hỏi QA
- [ ] Chấm câu trả lời
- [ ] Sinh feedback ngắn gọn

**Acceptance Criteria**
- User nhận được điểm và lời khuyên cải thiện.

## Epic 6 - Deployment & Launch

### [P0] Issue 28 - Deploy staging và fix deployment bugs
**Label:** `deploy`, `infra`, `p0`

**Mô tả**
- Deploy frontend, backend, database, storage lên môi trường public/staging.

**Checklist**
- [ ] Deploy frontend lên Vercel
- [ ] Deploy backend lên Railway/Render/Fly.io
- [ ] Kết nối Supabase production
- [ ] Fix lỗi env/dependency

**Acceptance Criteria**
- Demo public chạy ổn trên staging.

### [P0] Issue 29 - Tối ưu performance và chi phí AI
**Label:** `performance`, `ai`, `p0`

**Mô tả**
- Giảm latency và kiểm soát token cost.

**Checklist**
- [ ] Cache result theo URL hash
- [ ] Giới hạn số screenshot gửi vào AI
- [ ] Chọn model theo task
- [ ] Tối ưu concurrency worker

**Acceptance Criteria**
- Scan đủ nhanh để demo public mà không đốt chi phí quá mức.

### [P0] Issue 30 - README, screenshots, demo video, launch checklist
**Label:** `docs`, `launch`, `p0`

**Mô tả**
- Chuẩn hóa tài liệu public để dùng cho GitHub/portfolio.

**Checklist**
- [ ] Viết README final
- [ ] Chụp screenshots/GIF
- [ ] Tạo demo video ngắn
- [ ] Chuẩn bị launch checklist

**Acceptance Criteria**
- Repo có thể public và dùng làm portfolio ngay.

## Suggested GitHub Labels
- `p0`, `p1`, `p2`
- `frontend`
- `backend`
- `ai`
- `automation`
- `testing`
- `security`
- `infra`
- `docs`
- `demo`

## Suggested Milestones
- `M1 - Foundation`
- `M2 - Scan Core`
- `M3 - AI Output`
- `M4 - Demo Polish`
- `M5 - Public Launch`

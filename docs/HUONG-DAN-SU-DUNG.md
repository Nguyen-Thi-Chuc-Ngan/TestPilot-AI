# Hướng Dẫn Sử Dụng TestPilot AI

> Nền tảng QA Testing tự động bằng AI — nhập URL, nhận full QA report trong 60 giây.

---

## Mục Lục

1. [Cài đặt lần đầu](#1-cài-đặt-lần-đầu)
2. [Module: URL Scanner](#2-module-url-scanner)
3. [Module: AI Bug Hunter](#3-module-ai-bug-hunter)
4. [Module: Test Case Generator](#4-module-test-case-generator)
5. [Module: Smart Bug Report](#5-module-smart-bug-report)
6. [Module: Automation Script Generator](#6-module-automation-script-generator)
7. [Module: AI Roast Mode](#7-module-ai-roast-mode)
8. [Module: Export Report](#8-module-export-report)
9. [Module: Project History](#9-module-project-history)
10. [Module: Game Testing Arena](#10-module-game-testing-arena)
11. [Module: AI Interview Trainer](#11-module-ai-interview-trainer)
12. [Chạy local development](#12-chạy-local-development)

---

## 1. Cài Đặt Lần Đầu

### Yêu cầu
- Node.js 20+, pnpm 9+
- Python 3.11+
- Tài khoản [Supabase](https://supabase.com) (miễn phí)
- Google Gemini API key từ [aistudio.google.com](https://aistudio.google.com) (miễn phí)

### Bước 1 — Clone và cài dependencies
```bash
git clone https://github.com/your-username/testpilot-ai
cd testpilot-ai
pnpm install
cd apps/api && pip install -r requirements.txt
playwright install chromium
```

### Bước 2 — Tạo Supabase project
1. Vào [supabase.com](https://supabase.com) → **New Project**
2. Đặt tên project, chọn region **Singapore**, đặt password
3. Vào **Project Settings** → **Data API** → copy 2 keys dạng `eyJ...`:
   - `anon public` key
   - `service_role` key

### Bước 3 — Cấu hình environment
```bash
# Frontend
cp apps/web/.env.local.example apps/web/.env.local
```
Điền vào `apps/web/.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Điền vào `apps/api/.env`:
```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
GEMINI_API_KEY=AIza...
```

### Bước 4 — Chạy migration database
1. Vào Supabase dashboard → **SQL Editor**
2. Paste toàn bộ nội dung file `docs/migrations/001_initial_schema.sql`
3. Nhấn **Run** — tạo xong 9 bảng và Row Level Security

### Bước 5 — Tạo Storage buckets
Vào Supabase → **Storage** → **New bucket**:
- Tạo bucket `screenshots` → bật **Public**
- Tạo bucket `reports` → bật **Public**

### Bước 6 — Chạy servers
```bash
# Terminal 1 — Backend
cd apps/api
uvicorn main:app --reload --port 8000

# Terminal 2 — Frontend
pnpm dev:web
```

Mở trình duyệt: `http://localhost:3000`

---

## 2. Module: URL Scanner

**Mục đích:** Quét một website bất kỳ bằng Playwright, chụp screenshot, và gửi cho AI phân tích.

### Các bước sử dụng
1. Đăng nhập vào dashboard
2. Click **"New Scan"** trên sidebar hoặc nút **"Start a new scan"** ở dashboard
3. Nhập URL website cần test (ví dụ: `https://example.com`)
4. Tuỳ chọn: nhập **Requirements/Context** — mô tả trang này làm gì, user flow cần test
5. Chọn **Analysis Mode**:
   - **Full Analysis** — Bug hunt + Test cases + Automation script (khuyến nghị)
   - **Bug Hunt Only** — Chỉ tìm UI/UX issues
   - **Test Cases Only** — Chỉ sinh test cases từ requirement
6. Bật/tắt **Roast Mode** nếu muốn AI nhận xét thêm kiểu "vui"
7. Click **"Start AI Scan"**

### Lưu ý quan trọng
- Chỉ scan URL **public** (có thể truy cập từ internet)
- Localhost và IP nội bộ bị chặn vì lý do bảo mật
- Thời gian scan: 30–90 giây tuỳ website

### Theo dõi tiến trình
Sau khi submit, trang tự chuyển sang màn hình theo dõi với 7 bước:
```
1. Connecting to website
2. Taking screenshots
3. Analyzing UI with AI
4. Generating test cases
5. Writing bug reports
6. Creating automation script
7. Finalizing report
```

---

## 3. Module: AI Bug Hunter

**Mục đích:** Dùng Gemini Vision phân tích screenshot và tìm UI/UX issues theo chuẩn QA.

### Xem kết quả
Sau khi scan xong → tab **"Findings"** trong Report Viewer.

### Thông tin mỗi finding
| Field | Mô tả |
|---|---|
| Severity | critical / high / medium / low / info |
| Category | layout / typography / color / accessibility / usability / content |
| Title | Tên ngắn của issue |
| Description | Giải thích vấn đề |
| Location | Vị trí trên trang |
| Recommendation | Cách fix |

### Severity có nghĩa gì?
- **Critical** — Chặn user dùng tính năng chính
- **High** — Ảnh hưởng nghiêm trọng đến UX
- **Medium** — Gây khó chịu hoặc nhầm lẫn
- **Low** — Minor issue, nên fix khi có thời gian
- **Info** — Quan sát, không cần fix ngay

---

## 4. Module: Test Case Generator

**Mục đích:** Sinh test case manual có cấu trúc chuẩn QA từ URL và requirement.

### Xem kết quả
Tab **"Test Cases"** trong Report Viewer.

### Cấu trúc mỗi test case
```
TC-001 | Login với email hợp lệ    | Priority: High | Category: Functional
─────────────────────────────────────────────────────
Preconditions:
  • User chưa đăng nhập
  • Browser: Chrome latest

Steps:
  1. Action: Mở trang login          → Expected: Trang hiển thị form
  2. Action: Nhập email hợp lệ       → Expected: Email được chấp nhận
  3. Action: Nhập password đúng      → Expected: Không có lỗi
  4. Action: Click "Sign In"         → Expected: Redirect về dashboard

Expected Result: User được đăng nhập thành công
```

### Tips
- Nhập requirement càng chi tiết, test case càng chính xác
- Test case được sắp xếp từ High → Medium → Low priority
- Click vào từng test case để mở rộng xem chi tiết steps

---

## 5. Module: Smart Bug Report

**Mục đích:** Tự động sinh bug report chuẩn format QA từ các findings, sẵn sàng paste vào Jira/Linear.

### Xem kết quả
Tab **"Bug Reports"** trong Report Viewer.

### Cấu trúc mỗi bug report
```
[HIGH] P2 — Submit button không hoạt động trên mobile
────────────────────────────────────────────────────────
Steps to Reproduce:
  1. Mở website trên mobile viewport (375px)
  2. Điền form
  3. Tap nút Submit

Expected: Form được submit thành công
Actual:   Nút không phản hồi khi tap

Impact: User trên mobile không thể hoàn thành action chính
```

### Copy nhanh
Click nút **"Copy"** góc phải mỗi bug report → copy dạng Markdown sẵn dùng cho Jira/Linear/Notion.

---

## 6. Module: Automation Script Generator

**Mục đích:** Sinh Playwright TypeScript test script có thể chạy được ngay.

### Xem kết quả
Tab **"Automation Script"** trong Report Viewer.

### Sử dụng script
1. Click **"Load Script"** để hiển thị code
2. Click **"Copy"** để copy toàn bộ script
3. Paste vào project Playwright của bạn:

```bash
# Tạo project Playwright mới nếu chưa có
npm init playwright@latest

# Paste script vào tests/
# Chạy test
npx playwright test
```

### Lưu ý
- Script được sinh dựa trên test cases, có thể cần chỉnh selector cho đúng với DOM thực tế
- Dùng `getByRole`, `getByLabel`, `getByText` thay vì CSS selector cứng
- Test script là **starting point**, không phải production-ready ngay

---

## 7. Module: AI Roast Mode

**Mục đích:** AI đưa ra nhận xét "gay gắt nhưng hữu ích" về UX/UI của website.

### Bật Roast Mode
Khi tạo scan mới → toggle **"Roast Mode 🔥"** sang ON trước khi submit.

### Xem kết quả
Trong tab **Findings**, mỗi finding có thêm phần **🔥 Roast** màu cam với nhận xét kiểu:

> *"Cái button này nhỏ đến mức chỉ có người dùng kính lúp mới bấm được. Hãy tôn trọng ngón tay của user đi."*

### Mục đích
- Tạo điểm nhấn vui vẻ trong report
- Dễ nhớ hơn so với format QA khô khan
- Thích hợp để share trong team hoặc demo

---

## 8. Module: Export Report

**Mục đích:** Xuất report ra file để dùng trong CV, portfolio, hoặc gửi team.

### Các bước
1. Mở report của bất kỳ scan đã hoàn thành
2. Góc phải có 2 nút: **Markdown** và **HTML**
3. Click để tải file về

### Markdown export
- Format: `.md` — dùng được trong GitHub, Notion, Obsidian
- Bao gồm: Findings, Test Cases, Bug Reports đầy đủ

### HTML export
- Format: `.html` — mở được trực tiếp trên browser
- Có styling đẹp, phù hợp để gửi email hoặc share link
- Dùng để đính kèm vào CV hoặc portfolio

---

## 9. Module: Project History

**Mục đích:** Xem lại tất cả các lần scan trước đó.

### Truy cập
Sidebar → **"History"**

### Thông tin hiển thị
- URL đã scan
- Ngày giờ scan
- Trạng thái: `completed` / `failed` / `running`
- Mode đã dùng

### Xem lại report cũ
Click vào bất kỳ scan trong history → xem đầy đủ report kèm findings và test cases.

---

## 10. Module: Game Testing Arena

**Mục đích:** Thực hành kỹ năng tìm bug bằng cách chơi game — tìm bugs trong các mini app cố ý có lỗi.

### Các bước chơi
1. Sidebar → **"Game Arena"**
2. Chọn một challenge theo độ khó (Easy / Medium / Hard)
3. Trang app bị lỗi hiện trong khung iframe
4. **Khám phá** app và tìm bugs
5. Mỗi khi tìm được bug, click **"Add bug report"**:
   - Nhập tên bug (ví dụ: "Submit button không hoạt động")
   - Nhập mô tả thêm nếu muốn
6. Click **"Submit & See Score"** khi xong

### Chấm điểm
- Score = số bug đúng / tổng số bug × 100%
- Sau khi submit, tất cả bugs bị ẩn sẽ được reveal
- So sánh bạn tìm được gì và còn sót gì

### Challenges hiện có
| Challenge | Độ khó | Số bug |
|---|---|---|
| Broken Login Form | Easy | 5 |
| E-commerce Cart Chaos | Medium | 8 |
| Dashboard Disaster | Hard | 12 |

---

## 11. Module: AI Interview Trainer

**Mục đích:** Luyện phỏng vấn QA với AI chấm điểm và đưa feedback như senior interviewer thật.

### Các bước sử dụng
1. Sidebar → **"Interview Trainer"**
2. Chọn level: **Junior** / **Mid** / **Senior**
3. Click **"Get a question"** — AI chọn câu hỏi ngẫu nhiên
4. Đọc câu hỏi, gõ câu trả lời vào ô text
5. Click **"Get AI Feedback"**
6. Xem kết quả:
   - **Score** (0–10 sao)
   - **Strengths** — điểm mạnh trong câu trả lời
   - **Improvements** — những gì còn thiếu
   - **Key points** — các ý quan trọng cần đề cập
   - **Follow-up question** — câu hỏi tiếp theo interviewer có thể hỏi
7. Click **"Next question"** để tiếp tục

### Bộ câu hỏi mẫu
- Severity vs Priority là gì?
- Quy trình viết test case từ đầu?
- Khi thời gian ít, bạn ưu tiên test gì?
- Boundary value analysis là gì?
- Test một login form như thế nào?
- Black-box vs white-box testing?
- Regression testing khi feature thay đổi liên tục?
- Bug report tốt trông như thế nào?
- Test API endpoint như thế nào?

### Tips luyện tập
- Chọn đúng level để nhận feedback phù hợp
- Viết câu trả lời đầy đủ như khi phỏng vấn thật
- Chú ý phần "Key points" — đây là những gì interviewer thực sự muốn nghe
- Luyện mỗi ngày 3–5 câu trong 2 tuần trước phỏng vấn

---

## 12. Chạy Local Development

### Khởi động nhanh
```bash
# Terminal 1 — Backend (port 8000)
cd apps/api
uvicorn main:app --reload --port 8000

# Terminal 2 — Frontend (port 3000)
pnpm dev:web
```

### Swagger API docs
Mở `http://localhost:8000/docs` để xem và test tất cả API endpoints trực tiếp.

### Chạy tests
```bash
# Backend unit tests
cd apps/api && python -m pytest tests/ -v

# Frontend type check
cd apps/web && pnpm type-check
```

### Xem database
Kết nối Navicat hoặc TablePlus vào Supabase:
```
Host:     db.xxxx.supabase.co
Port:     5432
Database: postgres
User:     postgres
Password: (password lúc tạo project)
```

---

## Troubleshooting

| Lỗi | Nguyên nhân | Cách sửa |
|---|---|---|
| `Invalid API key` | Supabase key dạng `sb_...` | Dùng key dạng `eyJ...` từ Data API settings |
| `Token validation failed` | Key không đúng | Kiểm tra lại anon key trong `.env` |
| `Email not confirmed` | Supabase yêu cầu verify email | Confirm email hoặc tắt Email Confirmation trong Auth settings |
| Scan bị lỗi | URL không public hoặc timeout | Thử URL khác, tránh localhost |
| Backend không khởi động | Thiếu env vars | Kiểm tra `apps/api/.env` đủ chưa |
| Playwright crash | Thiếu Chromium | Chạy `playwright install chromium` |

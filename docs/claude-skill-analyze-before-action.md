# Skill: Phân tích trước khi hành động (Analyze-before-action)

Mục đích
- Trước khi Claude hoặc bất kỳ agent nào thực hiện hành động thay mặt người dùng (viết code, thay đổi cấu trúc, chạy lệnh, tạo PR, v.v.), luôn thực hiện một bước phân tích đầy đủ: xác định mục tiêu, kiểm tra tính hợp lý, nêu rủi ro, và yêu cầu xác nhận của người dùng.

Khi sử dụng
- Kích hoạt bằng các trigger phrase chung (ví dụ "Hãy làm X", "Triển khai", "Sửa file này", "Thay đổi cấu hình").
- Tự động kích hoạt cho các skill repo như `use-case-writer` khi câu lệnh yêu cầu thao tác thay đổi hoặc tạo artefact.

Hành vi bắt buộc của skill (workflow tóm tắt)
1. Nhận yêu cầu ban đầu: ghi lại mục tiêu ngắn gọn (1 câu) và định nghĩa thành công.
2. Quét ngữ cảnh liên quan: README, SKILL.md, tài liệu tham khảo, file cấu hình, LICENSE, và các tệp liên quan nếu có thể truy cập.
3. Xác định giả định và phụ thuộc (credentials, API keys, môi trường, quyền, phiên bản công cụ).
4. Đánh giá tính hợp lý & rủi ro:
   - Kỹ thuật: breakages, incompatibilities, build/test failure risk
   - Bảo mật/Quyền riêng tư: lộ secret, upload dữ liệu nhạy cảm
   - Pháp lý/License: hợp lệ để sử dụng/redistribute (MIT vs restrictions)
   - Tác động vận hành: downtime, chi phí, quota, rate limits
   - UX/Business: scope quá lớn/nhỏ, nhầm mục tiêu
5. Phân loại mức rủi ro (Low/Medium/High) cho từng mục chính và gợi ý biện pháp giảm thiểu ngắn gọn.
6. Trình bày bản tóm tắt phân tích ngắn (đầu ra cấu trúc — 6 phần):
   - Mục tiêu & tiêu chí thành công
   - Tóm tắt ngữ cảnh (những file/tài liệu đã đọc)
   - Giả định & phụ thuộc
   - Rủi ro chính + mức độ
   - Hành động đề xuất (3 lựa chọn: proceed / proceed with mitigations / abort)
   - Yêu cầu người dùng (ví dụ: "Xác nhận để tiếp tục", hoặc "Cung cấp secret Y")
7. DỪNG và chờ xác nhận rõ ràng của người dùng trước khi thực hiện thay đổi.

Định dạng đầu ra đề xuất
- Ngắn gọn, bullet, tiếng Việt (nếu user chat bằng tiếng Việt); artefact chính (nếu cần) kèm ví dụ mẫu.

Ví dụ trigger & tương tác
User: "Viết UC cho tính năng X và tạo file markdown trong repo"
Claude (the skill):
  - [SUMMARY] Mục tiêu: Viết Use Case cho X. Thành công: 1 file MD theo template 13 trường.
  - [CONTEXT READ] README + SKILL.md + references/template-guide.md
  - [ASSUMPTIONS] Không có API key cần thiết; môi trường dev standard
  - [RISKS] Thiếu thông tin actor (Medium): UC có thể sai scope
  - [ACTIONS SUGGESTED] 1) Yêu cầu thêm thông tin actor (recommended)
  - "Bạn có muốn tôi tiếp tục theo giả định X? (yes/proceed/abort)"

Quy tắc an toàn & từ chối
- Nếu hành động yêu cầu secrets/credentials, skill sẽ yêu cầu user nhập thủ công (không tự tìm trong repo hoặc logs).
- Nếu license hoặc ghi công tác giả cấm hành động (ví dụ remove attribution), skill sẽ từ chối và thông báo lý do.
- Nếu rủi ro bảo mật hoặc rủi ro vận hành là High, skill sẽ dừng và yêu cầu giải pháp giảm thiểu trước khi tiếp tục.

Ghi chú triển khai cho Claude
- Load SKILL này trước khi các skill chuyên biệt; hoặc wrap quanh các skill có khả năng thay đổi system.
- SKILL phải buộc một bước "confirmation" trước mọi hành động có phạm vi thay đổi.

Mẫu ngắn (prompt template)
"Trước khi làm bất cứ thay đổi nào, hãy phân tích: 1) mục tiêu, 2) những file/tài liệu bạn đã đọc, 3) giả định và phụ thuộc, 4) rủi ro chính với mức độ, 5) đề xuất hành động (proceed / proceed with mitigations / abort). Sau khi tôi xác nhận, mới thực hiện hành động." 

Bản quyền & nguồn
- Không thay đổi nội dung bản quyền gốc khi reuse nội dung từ repo. Ghi công tác giả theo MIT khi copy ví dụ hoặc templates.

---
Tệp này được tạo tự động từ yêu cầu: "viết 1 skill để Claude trước khi làm gì đó phải phân tích trước, xem có hợp lý không hay có rủi ro gì". Bạn có muốn tôi:
- tạo file SKILL.md tương thích Claude Code ở `~/.claude/skills/...`? 
- hay chỉ lưu bản local này vào [docs/claude-skill-analyze-before-action.md](docs/claude-skill-analyze-before-action.md) và trình bày cách dùng?
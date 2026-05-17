export interface VocabWord {
  word: string
  category: string
  definition: string
  example: string
  example_vi?: string
  pronunciation?: string
}

export const QA_VOCABULARY: VocabWord[] = [
  // Bug Reporting
  { word: "reproduce", category: "Bug Reporting", definition: "To make a bug happen again under the same conditions", example: "The issue is difficult to reproduce on all devices.", example_vi: "Lỗi khó tái hiện trên tất cả thiết bị." },
  { word: "intermittent", category: "Bug Reporting", definition: "Occurring at irregular intervals; not consistent", example: "This is an intermittent bug that appears randomly.", example_vi: "Đây là lỗi không nhất quán, xuất hiện ngẫu nhiên." },
  { word: "regression", category: "Bug Reporting", definition: "A bug that was previously fixed but reappears after new changes", example: "The latest release introduced a regression in the login flow.", example_vi: "Bản phát hành mới tạo ra regression trong luồng đăng nhập." },
  { word: "workaround", category: "Bug Reporting", definition: "A temporary solution that avoids the bug without fixing it", example: "As a workaround, users can clear the cache before logging in.", example_vi: "Giải pháp tạm thời là xóa cache trước khi đăng nhập." },
  { word: "severity", category: "Bug Reporting", definition: "The impact level of a bug on the system or user", example: "This bug has Critical severity as it blocks all payments.", example_vi: "Bug này có severity Critical vì chặn toàn bộ thanh toán." },
  { word: "priority", category: "Bug Reporting", definition: "How urgently a bug needs to be fixed", example: "Despite low severity, the priority is High due to client deadline.", example_vi: "Dù severity thấp nhưng priority High vì deadline của client." },
  { word: "blocker", category: "Bug Reporting", definition: "A bug that prevents further testing or development", example: "This crash is a blocker — we cannot proceed with testing.", example_vi: "Crash này là blocker — chúng tôi không thể tiếp tục test." },
  { word: "root cause", category: "Bug Reporting", definition: "The original reason why a bug exists", example: "The root cause was missing null validation on the API endpoint.", example_vi: "Nguyên nhân gốc là thiếu validation null trên endpoint API." },
  { word: "edge case", category: "Bug Reporting", definition: "An unusual or extreme condition that may cause issues", example: "The edge case of submitting an empty form was not handled.", example_vi: "Edge case submit form trống chưa được xử lý." },
  { word: "flaky", category: "Bug Reporting", definition: "A test or bug that passes sometimes and fails other times", example: "This automated test is flaky and needs to be investigated.", example_vi: "Test tự động này bị flaky và cần điều tra." },

  // Testing Process
  { word: "regression testing", category: "Testing Process", definition: "Re-testing previously working features after code changes", example: "We perform regression testing before every major release.", example_vi: "Chúng tôi thực hiện regression testing trước mỗi lần release lớn." },
  { word: "smoke test", category: "Testing Process", definition: "A quick test to verify basic functionality works", example: "Run a smoke test to confirm the build is stable.", example_vi: "Chạy smoke test để xác nhận build ổn định." },
  { word: "boundary value", category: "Testing Process", definition: "Testing at the minimum and maximum valid input limits", example: "Boundary value analysis showed the field accepts only 0-999.", example_vi: "Phân tích boundary value cho thấy field chỉ chấp nhận 0-999." },
  { word: "test coverage", category: "Testing Process", definition: "The percentage of code or features covered by tests", example: "Our regression suite covers 80% of critical user flows.", example_vi: "Bộ regression của chúng tôi bao phủ 80% luồng người dùng quan trọng." },
  { word: "sign-off", category: "Testing Process", definition: "Formal QA approval that a build is ready for release", example: "QA sign-off is required before production deployment.", example_vi: "Cần QA sign-off trước khi deploy lên production." },
  { word: "triage", category: "Testing Process", definition: "Reviewing and prioritizing bugs by severity and impact", example: "During triage, we identified two critical blockers.", example_vi: "Trong quá trình triage, chúng tôi phát hiện hai blocker nghiêm trọng." },

  // API Testing
  { word: "payload", category: "API Testing", definition: "The data sent in an API request body", example: "The API rejected the payload because the email field was null.", example_vi: "API từ chối payload vì trường email là null." },
  { word: "endpoint", category: "API Testing", definition: "A specific URL where an API can be accessed", example: "The /login endpoint returned 500 with invalid credentials.", example_vi: "Endpoint /login trả về 500 khi credentials không hợp lệ." },
  { word: "response time", category: "API Testing", definition: "How long the server takes to respond to a request", example: "The response time exceeded 5 seconds under load.", example_vi: "Response time vượt quá 5 giây khi có tải." },
  { word: "status code", category: "API Testing", definition: "HTTP code indicating the result of an API request", example: "Expected 200 but received 422 Unprocessable Entity.", example_vi: "Mong đợi 200 nhưng nhận được 422 Unprocessable Entity." },
  { word: "timeout", category: "API Testing", definition: "When a request takes too long and is terminated", example: "The bulk export API times out after 30 seconds.", example_vi: "API export hàng loạt bị timeout sau 30 giây." },

  // Professional Communication
  { word: "escalate", category: "Communication", definition: "To raise an issue to higher authority or priority", example: "I need to escalate this blocker to the project manager.", example_vi: "Tôi cần escalate blocker này lên project manager." },
  { word: "acknowledge", category: "Communication", definition: "To confirm you have received or understood something", example: "Please acknowledge this bug report by end of day.", example_vi: "Vui lòng acknowledge bug report này trước cuối ngày." },
  { word: "clarify", category: "Communication", definition: "To make something clearer or easier to understand", example: "Could you clarify the expected behavior in this scenario?", example_vi: "Bạn có thể clarify hành vi mong đợi trong tình huống này không?" },
  { word: "defer", category: "Communication", definition: "To postpone fixing a bug to a later release", example: "The team agreed to defer this low-priority issue.", example_vi: "Team đã đồng ý defer vấn đề ưu tiên thấp này." },
  { word: "verify", category: "Communication", definition: "To confirm that a bug fix actually works", example: "Please verify the fix on the staging environment.", example_vi: "Vui lòng verify bản fix trên môi trường staging." },

  // Release Management
  { word: "hotfix", category: "Release Management", definition: "An urgent patch deployed to fix a critical production bug", example: "A hotfix was deployed within 2 hours to restore checkout.", example_vi: "Một hotfix được deploy trong 2 giờ để khôi phục checkout." },
  { word: "rollback", category: "Release Management", definition: "Reverting to a previous version after a bad deployment", example: "We initiated a rollback after the deployment caused crashes.", example_vi: "Chúng tôi tiến hành rollback sau khi deployment gây ra crashes." },
  { word: "deployment", category: "Release Management", definition: "The process of releasing software to an environment", example: "The deployment to production is scheduled for Friday.", example_vi: "Deployment lên production được lên kế hoạch vào thứ Sáu." },
  { word: "staging", category: "Release Management", definition: "A test environment that mirrors production", example: "All regression tests must pass on staging before release.", example_vi: "Tất cả regression test phải pass trên staging trước khi release." },
]

export const VOCABULARY_CATEGORIES = [...new Set(QA_VOCABULARY.map((w) => w.category))]

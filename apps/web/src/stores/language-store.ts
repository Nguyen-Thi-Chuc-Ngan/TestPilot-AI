import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Lang = 'en' | 'vi'

const translations = {
  en: {
    // Nav
    dashboard: 'Dashboard',
    newScan: 'New Scan',
    history: 'History',
    gameArena: 'Game Arena',
    interviewTrainer: 'Interview Trainer',
    signOut: 'Sign out',

    // Dashboard
    readyToBug: 'Ready to find some bugs?',
    startNewScan: 'Start a new scan',
    startNewScanDesc: 'Enter a URL and let AI find bugs, generate test cases, and write automation scripts.',
    totalScans: 'Total Scans',
    bugsFound: 'Bugs Found',
    reportsExported: 'Reports Exported',
    recentScans: 'Recent Scans',
    viewAll: 'View all',
    noScansYet: 'No scans yet',
    noScansDesc: 'Your scan history will appear here.',

    // Scan form
    newScanTitle: 'New Scan',
    newScanDesc: 'Enter a URL and AI will analyze it for bugs, generate test cases, and write automation scripts.',
    websiteUrl: 'Website URL',
    requirements: 'Requirements / Context',
    requirementsOpt: '(optional)',
    requirementsPlaceholder: 'Describe what this page should do, user flows to test...',
    analysisMode: 'Analysis Mode',
    fullAnalysis: 'Full Analysis',
    fullAnalysisDesc: 'Bug hunt + test cases + automation script',
    bugHuntOnly: 'Bug Hunt Only',
    bugHuntOnlyDesc: 'Focus on finding UI/UX issues',
    testCasesOnly: 'Test Cases Only',
    testCasesOnlyDesc: 'Generate structured QA test cases',
    roastMode: 'Roast Mode 🔥',
    roastModeDesc: 'AI gives savage but constructive UX feedback',
    startScan: 'Start AI Scan',
    starting: 'Starting scan...',
    urlNote: 'Public URLs only. Localhost and internal IPs are blocked for security.',

    // Progress
    scanInProgress: 'Scanning in progress',
    scanFailed: 'Scan failed',
    retrySameScan: 'Retry same scan',
    retrying: 'Retrying...',
    newScanBtn: 'New scan',
    tryAgain: 'Try again',

    // Report
    scanReport: 'Scan Report',
    findings: 'Findings',
    testCases: 'Test Cases',
    bugReports: 'Bug Reports',
    automationScript: 'Automation Script',
    rescan: 'Re-scan',
    exportMd: 'Markdown',
    exportHtml: 'HTML',
    noFindings: 'No findings',
    noFindingsDesc: 'This page looks clean!',

    // Interview
    interviewTitle: 'AI Interview Trainer',
    interviewDesc: 'Practice QA interviews with AI that grades your answers like a senior interviewer.',
    getQuestion: 'Get a question',
    nextQuestion: 'Next question',
    getFeedback: 'Get AI Feedback',
    strengths: 'Strengths',
    improvements: 'Improvements',
    keyPoints: 'Key points you should cover',
    followUp: 'Follow-up question',

    // Game
    gameTitle: 'Game Testing Arena',
    gameDesc: 'Find bugs in intentionally broken apps. The more you find, the higher you score.',
    startChallenge: 'Start challenge',
    submitScore: 'Submit & See Score',
    reportBug: 'Add bug report',
    bugsToFind: 'bugs to find',
  },
  vi: {
    // Nav
    dashboard: 'Tổng quan',
    newScan: 'Quét mới',
    history: 'Lịch sử',
    gameArena: 'Game Tìm Lỗi',
    interviewTrainer: 'Luyện Phỏng Vấn',
    signOut: 'Đăng xuất',

    // Dashboard
    readyToBug: 'Sẵn sàng tìm bug chưa?',
    startNewScan: 'Bắt đầu quét mới',
    startNewScanDesc: 'Nhập URL để AI tìm lỗi, tạo test case và viết automation script.',
    totalScans: 'Tổng lượt quét',
    bugsFound: 'Bug tìm được',
    reportsExported: 'Report đã xuất',
    recentScans: 'Lượt quét gần đây',
    viewAll: 'Xem tất cả',
    noScansYet: 'Chưa có lượt quét nào',
    noScansDesc: 'Lịch sử quét sẽ hiển thị ở đây.',

    // Scan form
    newScanTitle: 'Quét mới',
    newScanDesc: 'Nhập URL và AI sẽ phân tích lỗi, tạo test case và viết automation script.',
    websiteUrl: 'URL Website',
    requirements: 'Yêu cầu / Ngữ cảnh',
    requirementsOpt: '(không bắt buộc)',
    requirementsPlaceholder: 'Mô tả trang này làm gì, luồng user cần test...',
    analysisMode: 'Chế độ phân tích',
    fullAnalysis: 'Phân tích toàn diện',
    fullAnalysisDesc: 'Tìm lỗi + test case + automation script',
    bugHuntOnly: 'Chỉ tìm lỗi',
    bugHuntOnlyDesc: 'Tập trung vào UI/UX issues',
    testCasesOnly: 'Chỉ tạo test case',
    testCasesOnlyDesc: 'Sinh test case có cấu trúc chuẩn QA',
    roastMode: 'Chế độ Roast 🔥',
    roastModeDesc: 'AI nhận xét gay gắt nhưng hữu ích về UX',
    startScan: 'Bắt đầu quét AI',
    starting: 'Đang khởi động...',
    urlNote: 'Chỉ URL công khai. Localhost và IP nội bộ bị chặn vì lý do bảo mật.',

    // Progress
    scanInProgress: 'Đang quét...',
    scanFailed: 'Quét thất bại',
    retrySameScan: 'Thử lại lần nữa',
    retrying: 'Đang thử lại...',
    newScanBtn: 'Quét mới',
    tryAgain: 'Thử lại',

    // Report
    scanReport: 'Báo cáo quét',
    findings: 'Phát hiện',
    testCases: 'Test Case',
    bugReports: 'Bug Report',
    automationScript: 'Script Automation',
    rescan: 'Quét lại',
    exportMd: 'Markdown',
    exportHtml: 'HTML',
    noFindings: 'Không có phát hiện nào',
    noFindingsDesc: 'Trang này trông ổn!',

    // Interview
    interviewTitle: 'Luyện Phỏng Vấn AI',
    interviewDesc: 'Luyện phỏng vấn QA với AI chấm điểm như senior interviewer thật.',
    getQuestion: 'Lấy câu hỏi',
    nextQuestion: 'Câu tiếp theo',
    getFeedback: 'Nhận phản hồi AI',
    strengths: 'Điểm mạnh',
    improvements: 'Cần cải thiện',
    keyPoints: 'Các ý quan trọng cần đề cập',
    followUp: 'Câu hỏi tiếp theo',

    // Game
    gameTitle: 'Game Tìm Lỗi',
    gameDesc: 'Tìm bug trong các app cố ý có lỗi. Tìm được nhiều, điểm càng cao.',
    startChallenge: 'Bắt đầu thử thách',
    submitScore: 'Nộp bài & Xem điểm',
    reportBug: 'Báo bug',
    bugsToFind: 'bug cần tìm',
  },
} as const

type TranslationKey = keyof typeof translations.en

interface LangStore {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: TranslationKey) => string
}

export const useLang = create<LangStore>()(
  persist(
    (set, get) => ({
      lang: 'en',
      setLang: (lang) => set({ lang }),
      t: (key) => translations[get().lang][key] ?? translations.en[key],
    }),
    { name: 'testpilot-lang' }
  )
)

type Lang = 'en' | 'vi'

interface ErrorTranslation {
  pattern: RegExp | string
  en: string
  vi: string
}

const ERROR_MAP: ErrorTranslation[] = [
  // Auth
  {
    pattern: /session expired/i,
    en: 'Session expired. Please sign in again.',
    vi: 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.',
  },
  // Rate limit
  {
    pattern: /reached the limit|rate limit|too many requests/i,
    en: "You've reached the scan limit (5/hour). Please wait before scanning again.",
    vi: 'Bạn đã đạt giới hạn quét (5 lần/giờ). Vui lòng chờ trước khi quét tiếp.',
  },
  // AI quota
  {
    pattern: /quota exceeded|rate.limited|ai quota/i,
    en: 'AI service is temporarily rate-limited. Please try again in a few minutes.',
    vi: 'Dịch vụ AI đang bị giới hạn tạm thời. Vui lòng thử lại sau vài phút.',
  },
  // AI unavailable
  {
    pattern: /ai service is unavailable|retryerror/i,
    en: 'AI service is currently unavailable. Please try again shortly.',
    vi: 'Dịch vụ AI hiện không khả dụng. Vui lòng thử lại sau.',
  },
  // Timeout
  {
    pattern: /too long to load|timeout|timed out/i,
    en: 'The website took too long to load. Try a simpler or faster URL.',
    vi: 'Website mất quá lâu để tải. Hãy thử URL đơn giản hơn.',
  },
  // Cannot reach
  {
    pattern: /could not reach|connection refused|not accessible/i,
    en: 'Cannot reach this website. Make sure the URL is publicly accessible.',
    vi: 'Không thể truy cập website này. Hãy chắc chắn URL là công khai.',
  },
  // Blocked URL
  {
    pattern: /cannot be scanned|not allowed|private ip|localhost/i,
    en: 'This URL cannot be scanned. Only public websites are allowed.',
    vi: 'URL này không được phép quét. Chỉ cho phép quét website công khai.',
  },
  // Invalid URL
  {
    pattern: /invalid url|missing a hostname|starts with https/i,
    en: 'Invalid URL. Please enter a valid address starting with https://',
    vi: 'URL không hợp lệ. Vui lòng nhập địa chỉ bắt đầu bằng https://',
  },
  // URL too long
  {
    pattern: /too long|max 2048/i,
    en: 'URL is too long (max 2048 characters).',
    vi: 'URL quá dài (tối đa 2048 ký tự).',
  },
  // Internal data
  {
    pattern: /invalid id format|uuid/i,
    en: 'Internal error: unexpected AI response. Please try again.',
    vi: 'Lỗi nội bộ: AI trả về kết quả không hợp lệ. Vui lòng thử lại.',
  },
  // Database
  {
    pattern: /database error|supabase/i,
    en: 'Database error while saving. Please try again.',
    vi: 'Lỗi lưu dữ liệu. Vui lòng thử lại.',
  },
  // Browser
  {
    pattern: /browser automation|blocking automated/i,
    en: 'The page blocked our scanner. Try a different URL.',
    vi: 'Trang web chặn trình quét. Hãy thử URL khác.',
  },
  // Server error
  {
    pattern: /server error/i,
    en: 'Server error. Please try again in a moment.',
    vi: 'Lỗi máy chủ. Vui lòng thử lại sau giây lát.',
  },
  // Not found
  {
    pattern: /not found/i,
    en: 'Not found.',
    vi: 'Không tìm thấy.',
  },
  // JSON parse
  {
    pattern: /unexpected response format|json/i,
    en: 'Unexpected AI response. Please try again.',
    vi: 'AI trả về kết quả không mong đợi. Vui lòng thử lại.',
  },
]

const FALLBACK = {
  en: 'Something went wrong. Please try again.',
  vi: 'Đã xảy ra lỗi. Vui lòng thử lại.',
}

export function translateError(message: string, lang: Lang): string {
  for (const entry of ERROR_MAP) {
    const match =
      entry.pattern instanceof RegExp
        ? entry.pattern.test(message)
        : message.toLowerCase().includes(entry.pattern.toLowerCase())
    if (match) return entry[lang]
  }
  // If message is short and readable, show it as-is with a prefix
  if (message.length < 100 && !message.includes('Error') && !message.includes('Exception')) {
    return message
  }
  return FALLBACK[lang]
}

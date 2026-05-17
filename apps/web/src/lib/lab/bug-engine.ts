/**
 * QA Simulation Lab — Bug Injection Engine
 *
 * Architecture:
 * - Static HTML templates in /public/lab/templates/
 * - Bug definitions are CSS classes + JS flags injected at runtime
 * - No server needed for injection — pure client-side
 */

export type BugSeverity  = 'Critical' | 'Major' | 'Minor' | 'Trivial'
export type BugCategory  = 'ui' | 'validation' | 'logic' | 'accessibility' | 'performance' | 'security'
export type Difficulty   = 'Beginner' | 'Junior QA' | 'Mid-Level QA' | 'Senior QA' | 'Chaos'
export type TemplateId   = 'login' | 'checkout' | 'dashboard' | 'qr_app' | 'profile' | 'search'

export interface BugDefinition {
  id:          string
  category:    BugCategory
  severity:    BugSeverity
  title:       string
  description: string
  hint?:       string    // shown after challenge ends
  cssClass?:   string    // injected into template iframe
  jsFlag?:     string    // window flag set in iframe
}

export interface ChallengeTemplate {
  id:          TemplateId
  name:        string
  description: string
  url:         string    // /lab/templates/login.html etc
  allBugs:     BugDefinition[]  // full pool of possible bugs
}

// ─── Bug Pool per Template ────────────────────────────────────────────────────

const LOGIN_BUGS: BugDefinition[] = [
  { id: 'l1', category: 'validation', severity: 'Major',    title: 'Empty email accepted',           description: 'Form submits successfully with empty email field', hint: 'Try submitting with empty email' },
  { id: 'l2', category: 'validation', severity: 'Major',    title: 'Invalid email format accepted',  description: 'Form accepts "notanemail" without validation', hint: 'Try entering "abc" as email' },
  { id: 'l3', category: 'security',   severity: 'Critical', title: 'Password shown in plain text',   description: 'Password field renders as type="text"', hint: 'Look at the password field type' },
  { id: 'l4', category: 'ui',         severity: 'Minor',    title: 'Submit button has no focus ring', description: 'Keyboard users cannot see which element is focused', hint: 'Tab to the submit button' },
  { id: 'l5', category: 'accessibility', severity: 'Major', title: 'Missing label on email input',   description: 'Email input lacks proper aria-label or associated label', hint: 'Inspect with screen reader' },
  { id: 'l6', category: 'ui',         severity: 'Minor',    title: 'Error message not cleared on retype', description: 'Error persists after user starts correcting input', hint: 'Submit invalid → start retyping' },
  { id: 'l7', category: 'security',   severity: 'Major',    title: 'No CSRF token in form',          description: 'Form submission has no cross-site request forgery protection', hint: 'Inspect form HTML source' },
  { id: 'l8', category: 'validation', severity: 'Minor',    title: 'No password length validation',  description: 'Single character password is accepted', hint: 'Try password: "a"' },
  { id: 'l9', category: 'ui',         severity: 'Trivial',  title: 'Button text not descriptive',    description: 'Submit button says "Click Here" instead of "Sign In"', hint: 'Read the button label' },
  { id: 'l10',category: 'accessibility', severity: 'Major', title: 'Low contrast on placeholder text', description: 'Placeholder contrast ratio fails WCAG AA (< 4.5:1)', hint: 'Check placeholder vs background' },
]

const CHECKOUT_BUGS: BugDefinition[] = [
  { id: 'c1', category: 'logic',      severity: 'Critical', title: 'Total price calculation wrong',  description: 'Subtotal + tax does not equal displayed total', hint: 'Add items and check math' },
  { id: 'c2', category: 'logic',      severity: 'Major',    title: 'Quantity can go negative',       description: 'Clicking minus past 0 shows negative quantities', hint: 'Click minus button repeatedly' },
  { id: 'c3', category: 'ui',         severity: 'Major',    title: 'Mobile layout breaks at 375px',  description: 'Checkout button overflows on small screens', hint: 'Resize window to mobile width' },
  { id: 'c4', category: 'validation', severity: 'Major',    title: 'Invalid card number accepted',   description: 'Card number "1234" passes without Luhn check', hint: 'Enter obviously invalid card' },
  { id: 'c5', category: 'accessibility', severity: 'Minor', title: 'Error messages not announced',   description: 'Form errors not linked to inputs via aria-describedby', hint: 'Submit with missing fields' },
  { id: 'c6', category: 'ui',         severity: 'Minor',    title: '"50% OFF" badge math wrong',     description: 'Badge says 50% off but price shows 25% discount', hint: 'Calculate the actual discount' },
  { id: 'c7', category: 'logic',      severity: 'Critical', title: 'Remove item deletes wrong item', description: 'Clicking remove on item 1 removes item 2', hint: 'Add 2 items, remove first' },
  { id: 'c8', category: 'validation', severity: 'Major',    title: 'No CVV validation',              description: 'Empty CVV field accepted on checkout', hint: 'Leave CVV blank and submit' },
]

const DASHBOARD_BUGS: BugDefinition[] = [
  { id: 'd1', category: 'logic',      severity: 'Critical', title: 'Chart shows wrong date range',   description: 'Weekly chart displays last month data', hint: 'Compare chart dates to today' },
  { id: 'd2', category: 'ui',         severity: 'Major',    title: 'Sidebar overlaps main content',  description: 'On 1024px viewport, sidebar covers content', hint: 'Resize to tablet width' },
  { id: 'd3', category: 'performance',severity: 'Major',    title: 'Infinite loading spinner',       description: 'Stats widget never finishes loading', hint: 'Watch the stats cards' },
  { id: 'd4', category: 'accessibility', severity: 'Minor', title: 'Graph has no text alternative',  description: 'Chart is image with no alt text or data table', hint: 'Try reading chart without seeing it' },
  { id: 'd5', category: 'logic',      severity: 'Major',    title: 'Pagination total wrong',         description: '"Showing 1-10 of 5" — impossible range', hint: 'Check pagination numbers' },
  { id: 'd6', category: 'security',   severity: 'Critical', title: 'API key exposed in page source', description: 'Secret key visible in HTML source comments', hint: 'View page source' },
]

export const TEMPLATES: Record<TemplateId, ChallengeTemplate> = {
  login: {
    id: 'login', name: 'Login Form',
    description: 'A standard login page with authentication bugs',
    url: '/lab/templates/login.html',
    allBugs: LOGIN_BUGS,
  },
  checkout: {
    id: 'checkout', name: 'E-commerce Checkout',
    description: 'A shopping cart with payment flow bugs',
    url: '/lab/templates/checkout.html',
    allBugs: CHECKOUT_BUGS,
  },
  dashboard: {
    id: 'dashboard', name: 'Analytics Dashboard',
    description: 'A data dashboard with display and logic bugs',
    url: '/lab/templates/dashboard.html',
    allBugs: DASHBOARD_BUGS,
  },
  qr_app:  { id: 'qr_app',  name: 'QR Scanner App',     description: 'Mobile QR validation app', url: '/lab/templates/qr_app.html',  allBugs: [] },
  profile: { id: 'profile', name: 'Profile Settings',    description: 'User settings page bugs',  url: '/lab/templates/profile.html', allBugs: [] },
  search:  { id: 'search',  name: 'Search & Filter UI',  description: 'Search functionality bugs', url: '/lab/templates/search.html', allBugs: [] },
}

// ─── Difficulty Config ────────────────────────────────────────────────────────

const DIFFICULTY_CONFIG: Record<Difficulty, { bugCount: [number, number]; timeLimit: number; xpReward: number }> = {
  'Beginner':    { bugCount: [2, 3], timeLimit: 300, xpReward: 50  },
  'Junior QA':   { bugCount: [3, 5], timeLimit: 240, xpReward: 100 },
  'Mid-Level QA':{ bugCount: [5, 7], timeLimit: 180, xpReward: 200 },
  'Senior QA':   { bugCount: [6, 8], timeLimit: 120, xpReward: 350 },
  'Chaos':       { bugCount: [8, 10],timeLimit: 90,  xpReward: 500 },
}

// ─── Challenge Generator ──────────────────────────────────────────────────────

export interface GeneratedChallenge {
  id:         string
  templateId: TemplateId
  difficulty: Difficulty
  bugs:       BugDefinition[]  // subset injected for this run
  timeLimit:  number
  xpReward:   number
  hiddenBugIds: string[]       // answer key — only revealed after submission
}

export function generateChallenge(
  templateId: TemplateId,
  difficulty: Difficulty = 'Junior QA'
): GeneratedChallenge {
  const template = TEMPLATES[templateId]
  const cfg = DIFFICULTY_CONFIG[difficulty]
  const pool = template.allBugs

  if (pool.length === 0) {
    // fallback to login if template not implemented
    return generateChallenge('login', difficulty)
  }

  const [minBugs, maxBugs] = cfg.bugCount
  const count = Math.min(pool.length, minBugs + Math.floor(Math.random() * (maxBugs - minBugs + 1)))

  // Shuffle pool and pick N bugs
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  const selectedBugs = shuffled.slice(0, count)

  return {
    id:           crypto.randomUUID(),
    templateId,
    difficulty,
    bugs:         selectedBugs,
    timeLimit:    cfg.timeLimit,
    xpReward:     cfg.xpReward,
    hiddenBugIds: selectedBugs.map((b) => b.id),
  }
}

// ─── Scoring System ───────────────────────────────────────────────────────────

export interface PlayerReport {
  title:       string
  description: string
  severity:    BugSeverity
  category:    BugCategory
}

export interface ScoringResult {
  score:          number
  maxScore:       number
  percentage:     number
  matchedBugIds:  string[]
  missedBugs:     BugDefinition[]
  bonusPoints:    number
  feedback:       string
  grade:          'S' | 'A' | 'B' | 'C' | 'F'
}

export function scoreChallenge(
  challenge: GeneratedChallenge,
  reports: PlayerReport[]
): ScoringResult {
  const bugs = challenge.bugs
  const maxScore = bugs.length * 100
  let score = 0
  const matchedBugIds: string[] = []

  for (const bug of bugs) {
    const keywords = [
      bug.title.toLowerCase(),
      bug.category,
      bug.severity.toLowerCase(),
      ...(bug.description.toLowerCase().split(' ').slice(0, 5)),
    ]

    const match = reports.find((r) => {
      const reportText = `${r.title} ${r.description}`.toLowerCase()
      return keywords.some((kw) => reportText.includes(kw)) ||
             (r.category === bug.category && r.severity === bug.severity)
    })

    if (match) {
      matchedBugIds.push(bug.id)
      let pts = 70 // base for finding the bug

      // Severity accuracy bonus
      if (match.severity === bug.severity) pts += 20
      else if (Math.abs(['Trivial','Minor','Major','Critical'].indexOf(match.severity) -
                        ['Trivial','Minor','Major','Critical'].indexOf(bug.severity)) === 1) pts += 10

      // Category accuracy bonus
      if (match.category === bug.category) pts += 10

      score += pts
    }
  }

  const missedBugs = bugs.filter((b) => !matchedBugIds.includes(b.id))
  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0

  const grade: ScoringResult['grade'] =
    percentage >= 90 ? 'S' :
    percentage >= 75 ? 'A' :
    percentage >= 60 ? 'B' :
    percentage >= 40 ? 'C' : 'F'

  const feedback =
    percentage >= 90 ? 'Excellent! You found nearly all bugs with accurate severity ratings.' :
    percentage >= 75 ? 'Great work! A few bugs slipped through — check the missed list.' :
    percentage >= 60 ? 'Good effort. Focus on accessibility and logic bugs you tend to miss.' :
    percentage >= 40 ? 'Keep practicing. Try lower difficulty to build pattern recognition.' :
                       'Lots of room to grow. Review the bug types and try again!'

  return { score, maxScore, percentage, matchedBugIds, missedBugs, bonusPoints: 0, feedback, grade }
}

// ─── Daily Mission Generator ──────────────────────────────────────────────────

export interface Mission {
  id:        string
  title:     string
  target:    number
  current:   number
  completed: boolean
  xp:        number
  category?: BugCategory
}

const MISSION_TEMPLATES = [
  { title: 'Find 3 accessibility bugs',       target: 3, xp: 150, category: 'accessibility' as BugCategory },
  { title: 'Complete a Bug Hunt challenge',    target: 1, xp: 100 },
  { title: 'Find a Critical severity bug',     target: 1, xp: 200 },
  { title: 'Score 70%+ on any challenge',      target: 1, xp: 150 },
  { title: 'Find 2 validation bugs',           target: 2, xp: 100, category: 'validation' as BugCategory },
  { title: 'Complete 2 challenges today',      target: 2, xp: 200 },
  { title: 'Try 3 different templates',        target: 3, xp: 150 },
  { title: 'Find a security bug',              target: 1, xp: 250, category: 'security' as BugCategory },
  { title: 'Beat AI in Battle Mode',           target: 1, xp: 300 },
  { title: 'Get an A grade or higher',         target: 1, xp: 200 },
]

export function generateDailyMissions(): Mission[] {
  const shuffled = [...MISSION_TEMPLATES].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 3).map((m, i) => ({
    id: `mission-${i}`,
    title: m.title,
    target: m.target,
    current: 0,
    completed: false,
    xp: m.xp,
    category: m.category,
  }))
}

export const DIFFICULTIES: Difficulty[] = ['Beginner', 'Junior QA', 'Mid-Level QA', 'Senior QA', 'Chaos']
export const AVAILABLE_TEMPLATES = Object.values(TEMPLATES).filter((t) => t.allBugs.length > 0)

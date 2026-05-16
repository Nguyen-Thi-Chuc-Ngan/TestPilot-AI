export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info'
export type Priority = 'high' | 'medium' | 'low'
export type BugPriority = 'P1' | 'P2' | 'P3' | 'P4'

export interface Finding {
  id: string
  job_id: string
  category: string
  title: string
  description: string
  severity: Severity
  element_hint?: string
  recommendation?: string
  roast_comment?: string
  created_at: string
}

export interface TestStep {
  step: number
  action: string
  expected: string
}

export interface TestCase {
  id: string
  job_id: string
  case_id: string
  title: string
  category: string
  priority: Priority
  preconditions: string[]
  steps: TestStep[]
  expected_result: string
  test_data?: string
  created_at: string
}

export interface BugReport {
  id: string
  job_id: string
  finding_id?: string
  title: string
  severity: Severity
  priority: BugPriority
  steps_to_reproduce: string[]
  expected_result: string
  actual_result: string
  impact: string
  created_at: string
}

export interface Artifact {
  id: string
  job_id: string
  type: 'screenshot' | 'full_page' | 'script' | 'export_md' | 'export_html'
  public_url?: string
  storage_path?: string
  size_bytes?: number
  created_at: string
}

export interface FullReport {
  job: Record<string, unknown>
  findings: Finding[]
  test_cases: TestCase[]
  bug_reports: BugReport[]
  artifacts: Artifact[]
}

export type ScanMode = 'full' | 'bug_hunt' | 'test_case_only'
export type ScanStatus = 'queued' | 'running' | 'completed' | 'failed'

export interface ScanJob {
  id: string
  user_id: string
  url: string
  requirements?: string
  mode: ScanMode
  roast_mode: boolean
  status: ScanStatus
  error_msg?: string
  created_at: string
  started_at?: string
  completed_at?: string
}

export interface CreateScanRequest {
  url: string
  requirements?: string
  mode?: ScanMode
  roast_mode?: boolean
}

export interface CreateScanResponse {
  job_id: string
}

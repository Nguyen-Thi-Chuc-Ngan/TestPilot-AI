import { ScanForm } from '@/components/scan/scan-form'

export const metadata = { title: 'New Scan' }

export default function NewScanPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">New Scan</h1>
        <p className="text-muted-foreground mt-1">
          Enter a URL and AI will analyze it for bugs, generate test cases, and write automation
          scripts.
        </p>
      </div>
      <ScanForm />
    </div>
  )
}

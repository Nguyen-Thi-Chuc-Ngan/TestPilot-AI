import { ScanForm } from '@/components/scan/scan-form'
import { PageHeader } from '@/components/layout/page-header'

export const metadata = { title: 'New Scan' }

export default function NewScanPage() {
  return (
    <div className="space-y-6">
      <PageHeader titleKey="newScanTitle" descKey="newScanDesc" />
      <ScanForm />
    </div>
  )
}

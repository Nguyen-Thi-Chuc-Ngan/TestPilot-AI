import dynamic from 'next/dynamic'
import { PageHeader } from '@/components/layout/page-header'

export const metadata = { title: 'New Scan' }

const ScanForm = dynamic(() => import('@/components/scan/scan-form').then((m) => m.ScanForm), {
  ssr: false,
  loading: () => <div className="h-96 rounded-xl border border-border animate-pulse bg-muted/30" />,
})

export default function NewScanPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader titleKey="newScanTitle" descKey="newScanDesc" />
      <ScanForm />
    </div>
  )
}

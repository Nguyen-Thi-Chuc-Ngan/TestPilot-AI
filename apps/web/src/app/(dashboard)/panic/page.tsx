import { PanicSimulator } from '@/components/panic/panic-simulator'

export const metadata = { title: 'Production Panic Simulator' }

export default function PanicPage() {
  return (
    <div className="">
      <PanicSimulator />
    </div>
  )
}

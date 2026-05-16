import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'TestPilot AI — AI-Powered QA Testing Platform',
    template: '%s | TestPilot AI',
  },
  description:
    'Enter a URL and get AI-generated test cases, bug reports, and Playwright automation scripts in seconds.',
  keywords: ['QA testing', 'AI', 'test automation', 'bug report', 'Playwright'],
  authors: [{ name: 'TestPilot AI' }],
  openGraph: {
    type: 'website',
    title: 'TestPilot AI',
    description: 'AI-Powered QA Testing Platform',
    siteName: 'TestPilot AI',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster position="top-right" richColors />
        </Providers>
      </body>
    </html>
  )
}

import { NotesClient } from '@/components/notes/notes-client'

export const metadata = { title: 'QA Notes' }

export default function NotesPage() {
  return (
    <div className="">
      <NotesClient />
    </div>
  )
}

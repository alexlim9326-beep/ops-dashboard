'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const nav = [
  { href: '/dashboard', label: 'Overview', icon: '▦' },
  { href: '/dashboard/pipeline', label: 'Pipeline', icon: '◈' },
  { href: '/dashboard/leads', label: 'Leads', icon: '◎' },
  { href: '/dashboard/tasks', label: 'Tasks', icon: '✓' },
  { href: '/dashboard/meetings', label: 'Meetings', icon: '⬡' },
  { href: '/dashboard/deadlines', label: 'Deadlines', icon: '◷' },
]

export default function Sidebar({ user }: { user: { email: string; name?: string | null } }) {
  const path = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <aside className="w-56 bg-white border-r border-gray-100 flex flex-col h-full flex-shrink-0">
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">O</span>
          </div>
          <span className="font-semibold text-sm text-gray-900">Ops Dashboard</span>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {nav.map(item => {
          const active = path === item.href || (item.href !== '/dashboard' && path.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                active
                  ? 'bg-brand-50 text-brand-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="text-base w-4 text-center">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-gray-100">
        <div className="px-3 py-2 mb-1">
          <p className="text-xs font-medium text-gray-700 truncate">{user.name || user.email}</p>
          <p className="text-xs text-gray-400 truncate">{user.email}</p>
        </div>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
        >
          <span>↩</span> Sign out
        </button>
      </div>
    </aside>
  )
}

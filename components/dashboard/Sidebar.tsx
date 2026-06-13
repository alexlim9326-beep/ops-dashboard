'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

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
  const [open, setOpen] = useState(false)

  // Close mobile menu whenever the route changes
  useEffect(() => { setOpen(false) }, [path])

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const activeItem = nav.find(item => path === item.href || (item.href !== '/dashboard' && path.startsWith(item.href)))

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between bg-white border-b border-gray-100 px-4 py-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">O</span>
          </div>
          <span className="font-semibold text-sm text-gray-900">{activeItem?.label || 'Ops Dashboard'}</span>
        </div>
        <button
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100"
        >
          {open ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
          )}
        </button>
      </div>

      {/* Mobile dropdown nav */}
      {open && (
        <nav className="md:hidden bg-white border-b border-gray-100 px-3 py-2 space-y-0.5 flex-shrink-0">
          {nav.map(item => {
            const active = path === item.href || (item.href !== '/dashboard' && path.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  active ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="text-base w-4 text-center">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
          <div className="pt-2 mt-2 border-t border-gray-100">
            <div className="px-3 py-1.5">
              <p className="text-xs font-medium text-gray-700 truncate">{user.name || user.email}</p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
            <button
              onClick={signOut}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
            >
              <span>↩</span> Sign out
            </button>
          </div>
        </nav>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 bg-white border-r border-gray-100 flex-col h-full flex-shrink-0">
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
    </>
  )
}

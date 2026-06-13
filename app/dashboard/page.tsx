import { createServerClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { formatCurrency, isOverdue, todayISO } from '@/lib/utils'

export default async function DashboardPage() {
  const supabase = createServerClient()
  const today = todayISO()

  const [deals, leads, tasks, meetings, deadlines] = await Promise.all([
    supabase.from('deals').select('*').order('created_at', { ascending: false }),
    supabase.from('leads').select('*').order('created_at', { ascending: false }),
    supabase.from('tasks').select('*').order('created_at', { ascending: false }),
    supabase.from('meetings').select('*').order('date', { ascending: true }),
    supabase.from('deadlines').select('*').order('date', { ascending: true }),
  ])

  const d = deals.data || []
  const l = leads.data || []
  const t = tasks.data || []
  const m = meetings.data || []
  const dl = deadlines.data || []

  const pipelineValue = d.filter(x => !['won','lost'].includes(x.stage)).reduce((s, x) => s + (x.value || 0), 0)
  const wonValue = d.filter(x => x.stage === 'won').reduce((s, x) => s + (x.value || 0), 0)
  const tasksDueToday = t.filter(x => x.due_date === today && x.status !== 'done').length
  const overdueDeadlines = dl.filter(x => !x.done && x.date < today).length
  const upcomingMeetings = m.filter(x => x.date >= today).slice(0, 3)
  const hotLeads = l.filter(x => x.priority === 'high' && x.status !== 'converted').length

  const metrics = [
    { label: 'Pipeline value', value: formatCurrency(pipelineValue), sub: `${d.filter(x=>!['won','lost'].includes(x.stage)).length} active deals`, href: '/dashboard/pipeline', color: 'text-brand-600' },
    { label: 'Won (all time)', value: formatCurrency(wonValue), sub: `${d.filter(x=>x.stage==='won').length} closed deals`, href: '/dashboard/pipeline', color: 'text-green-600' },
    { label: 'Hot leads', value: String(hotLeads), sub: `${l.length} total leads`, href: '/dashboard/leads', color: 'text-orange-500' },
    { label: 'Tasks due today', value: String(tasksDueToday), sub: `${t.filter(x=>x.status!=='done').length} open tasks`, href: '/dashboard/tasks', color: tasksDueToday > 0 ? 'text-red-500' : 'text-gray-900' },
    { label: 'Overdue deadlines', value: String(overdueDeadlines), sub: `${dl.filter(x=>!x.done).length} open deadlines`, href: '/dashboard/deadlines', color: overdueDeadlines > 0 ? 'text-red-500' : 'text-gray-900' },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Good {getGreeting()}</h1>
        <p className="text-gray-500 text-sm mt-1">{new Date().toLocaleDateString('en-SG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {metrics.map(m => (
          <Link href={m.href} key={m.label} className="metric-card hover:border-brand-200 hover:shadow-md transition-all">
            <span className="text-xs text-gray-400 font-medium">{m.label}</span>
            <span className={`text-2xl font-semibold ${m.color}`}>{m.value}</span>
            <span className="text-xs text-gray-400">{m.sub}</span>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium text-gray-900">Upcoming meetings</h2>
            <Link href="/dashboard/meetings" className="text-xs text-brand-600 hover:text-brand-800">View all</Link>
          </div>
          {upcomingMeetings.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No upcoming meetings</p>
          ) : (
            <div className="space-y-3">
              {upcomingMeetings.map(mtg => (
                <div key={mtg.id} className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-50 flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-brand-600">{new Date(mtg.date).toLocaleDateString('en-SG', { day: 'numeric' })}</span>
                    <span className="text-xs text-brand-400">{new Date(mtg.date).toLocaleDateString('en-SG', { month: 'short' })}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{mtg.title}</p>
                    <p className="text-xs text-gray-400">{mtg.time || ''}{mtg.location ? ` · ${mtg.location}` : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium text-gray-900">Pipeline by stage</h2>
            <Link href="/dashboard/pipeline" className="text-xs text-brand-600 hover:text-brand-800">View all</Link>
          </div>
          {['prospect','qualified','proposal','won','lost'].map(stage => {
            const count = d.filter(x => x.stage === stage).length
            const val = d.filter(x => x.stage === stage).reduce((s, x) => s + (x.value || 0), 0)
            const colors: Record<string, string> = { prospect: 'bg-blue-100 text-blue-700', qualified: 'bg-purple-100 text-purple-700', proposal: 'bg-amber-100 text-amber-700', won: 'bg-green-100 text-green-700', lost: 'bg-red-100 text-red-700' }
            return (
              <div key={stage} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2">
                  <span className={`badge ${colors[stage]}`}>{stage}</span>
                  <span className="text-sm text-gray-500">{count} deal{count !== 1 ? 's' : ''}</span>
                </div>
                <span className="text-sm font-medium text-gray-700">{val > 0 ? formatCurrency(val) : '—'}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import Modal from '@/components/ui/Modal'
import Badge from '@/components/ui/Badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Deal, Stage } from '@/types'

const STAGES: Stage[] = ['prospect', 'qualified', 'proposal', 'won', 'lost']
const STAGE_COLORS: Record<Stage, string> = {
  prospect: 'bg-blue-400', qualified: 'bg-purple-400',
  proposal: 'bg-amber-400', won: 'bg-green-400', lost: 'bg-red-400',
}

const empty = (): Partial<Deal> => ({ name: '', company: '', contact: '', value: undefined, stage: 'prospect', notes: '' })

export default function PipelinePage() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [filter, setFilter] = useState<Stage | 'all'>('all')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<Partial<Deal>>(empty())
  const [editing, setEditing] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const load = useCallback(async () => {
    const { data } = await supabase.from('deals').select('*').order('created_at', { ascending: false })
    setDeals(data || [])
  }, [supabase])

  useEffect(() => { load() }, [load])

  function openAdd() { setForm(empty()); setEditing(null); setOpen(true) }
  function openEdit(d: Deal) { setForm(d); setEditing(d.id); setOpen(true) }

  async function save() {
    if (!form.name) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (editing) {
      await supabase.from('deals').update({ ...form, updated_at: new Date().toISOString() }).eq('id', editing)
    } else {
      await supabase.from('deals').insert({ ...form, user_id: user!.id })
    }
    setSaving(false); setOpen(false); load()
  }

  async function remove(id: string) {
    if (!confirm('Delete this deal?')) return
    await supabase.from('deals').delete().eq('id', id)
    load()
  }

  const visible = filter === 'all' ? deals : deals.filter(d => d.stage === filter)
  const totalVal = deals.filter(d => !['won','lost'].includes(d.stage)).reduce((s,d)=>s+(d.value||0),0)
  const wonVal = deals.filter(d=>d.stage==='won').reduce((s,d)=>s+(d.value||0),0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Sales pipeline</h1>
          <p className="text-sm text-gray-400 mt-0.5">{deals.length} deals · {formatCurrency(totalVal)} in pipeline · {formatCurrency(wonVal)} won</p>
        </div>
        <button onClick={openAdd} className="btn-primary">+ Add deal</button>
      </div>

      <div className="card mb-4 p-3 flex gap-1 flex-wrap">
        {(['all', ...STAGES] as const).map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === s ? 'bg-brand-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
            {s} {s !== 'all' && <span className="opacity-70">({deals.filter(d=>d.stage===s).length})</span>}
          </button>
        ))}
      </div>

      <div className="flex gap-1 mb-5 h-1.5 rounded-full overflow-hidden">
        {STAGES.map(s => {
          const pct = deals.length ? deals.filter(d=>d.stage===s).length / deals.length * 100 : 20
          return <div key={s} className={`${STAGE_COLORS[s]} transition-all`} style={{ flex: Math.max(pct, 3) }} />
        })}
      </div>

      <div className="space-y-2">
        {visible.length === 0 && (
          <div className="card p-10 text-center text-gray-400 text-sm">No deals yet. Add your first deal to get started.</div>
        )}
        {visible.map(deal => (
          <div key={deal.id} className="card p-4 hover:shadow-md transition-all">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-gray-900">{deal.name}</span>
                  <Badge value={deal.stage} />
                </div>
                <p className="text-sm text-gray-400 mt-0.5">
                  {deal.company}{deal.company && deal.contact ? ' · ' : ''}{deal.contact}
                </p>
                {deal.notes && <p className="text-xs text-gray-400 mt-1.5">{deal.notes}</p>}
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {deal.value ? <span className="text-sm font-semibold text-gray-700">{formatCurrency(deal.value)}</span> : null}
                <button onClick={() => openEdit(deal)} className="btn-ghost px-2 py-1 text-xs">Edit</button>
                <button onClick={() => remove(deal.id)} className="btn-danger px-2 py-1 text-xs">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit deal' : 'Add deal'}>
        <div className="space-y-3">
          <div><label className="label">Deal name *</label><input className="input" value={form.name||''} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Condo reno – Jurong" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Company</label><input className="input" value={form.company||''} onChange={e=>setForm(f=>({...f,company:e.target.value}))} /></div>
            <div><label className="label">Contact</label><input className="input" value={form.contact||''} onChange={e=>setForm(f=>({...f,contact:e.target.value}))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Value (SGD)</label><input className="input" type="number" value={form.value||''} onChange={e=>setForm(f=>({...f,value:Number(e.target.value)}))} /></div>
            <div><label className="label">Stage</label>
              <select className="input" value={form.stage||'prospect'} onChange={e=>setForm(f=>({...f,stage:e.target.value as Stage}))}>
                {STAGES.map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div><label className="label">Notes</label><textarea className="input" rows={3} value={form.notes||''} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} /></div>
          <div className="flex gap-2 pt-2">
            <button onClick={save} disabled={saving} className="btn-primary flex-1 justify-center">{saving ? 'Saving…' : 'Save deal'}</button>
            <button onClick={() => setOpen(false)} className="btn-secondary">Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

import { cn } from '@/lib/utils'

const variants: Record<string, string> = {
  prospect:   'bg-blue-50 text-blue-700',
  qualified:  'bg-purple-50 text-purple-700',
  proposal:   'bg-amber-50 text-amber-700',
  won:        'bg-green-50 text-green-700',
  lost:       'bg-red-50 text-red-700',
  new:        'bg-gray-100 text-gray-600',
  contacted:  'bg-blue-50 text-blue-700',
  nurturing:  'bg-purple-50 text-purple-700',
  converted:  'bg-green-50 text-green-700',
  dead:       'bg-red-50 text-red-500',
  todo:       'bg-gray-100 text-gray-600',
  in_progress:'bg-blue-50 text-blue-700',
  done:       'bg-green-50 text-green-700',
  low:        'bg-gray-100 text-gray-500',
  medium:     'bg-amber-50 text-amber-700',
  high:       'bg-red-50 text-red-600',
  overdue:    'bg-red-100 text-red-700',
  today:      'bg-amber-100 text-amber-700',
  upcoming:   'bg-blue-50 text-blue-600',
}

export default function Badge({ value, className }: { value: string; className?: string }) {
  const key = value.toLowerCase().replace(' ', '_')
  return (
    <span className={cn('badge', variants[key] || 'bg-gray-100 text-gray-600', className)}>
      {value.replace('_', ' ')}
    </span>
  )
}

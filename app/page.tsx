import { createServerClient } from '@/lib/supabase'
import { redirect } from 'next/navigation'

export default async function Home() {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (session) redirect('/dashboard')
  else redirect('/auth/login')
}

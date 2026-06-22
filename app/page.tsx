import { Suspense } from 'react'
import Link from 'next/link'
import { Coffee } from 'lucide-react'

import { buttonVariants } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { signOut } from './actions'

async function UserFooter() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const email = data?.claims?.email as string | undefined

  if (!email) return null

  return (
    <form action={signOut} className="text-sm text-muted-foreground">
      <span>{email}</span>
      {' · '}
      <button type="submit" className="underline underline-offset-2 hover:text-foreground">
        Đăng xuất
      </button>
    </form>
  )
}

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-8 px-4 py-16 text-center">
      <div className="space-y-3">
        <Coffee className="mx-auto size-10 text-primary" />
        <h1 className="font-heading text-3xl font-semibold tracking-tight">BrewDesk</h1>
        <p className="max-w-sm text-muted-foreground">
          Tìm quán cà phê hợp để học và làm việc ở TP.HCM — ổ cắm, wifi, độ ồn, vibe.
        </p>
      </div>

      <Link href="/cafes" className={buttonVariants({ size: 'lg' })}>
        Xem quán cà phê
      </Link>

      <Suspense fallback={null}>
        <UserFooter />
      </Suspense>
    </main>
  )
}

import { Suspense } from 'react'
import Link from 'next/link'

import { CafeCard } from '@/components/cafe-card'
import { createClient } from '@/lib/supabase/server'
import type { Cafe } from '@/lib/types'

export const metadata = { title: 'Quán cà phê — BrewDesk' }

async function CafeList() {
  const supabase = await createClient()
  const { data: cafes, error } = await supabase
    .from('cafes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
        Lỗi tải dữ liệu: {error.message}
      </p>
    )
  }

  if (!cafes || cafes.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        Chưa có quán nào. Thêm dữ liệu vào bảng <code className="font-mono">cafes</code> để hiển thị
        ở đây.
      </div>
    )
  }

  return (
    <>
      <p className="mb-3 text-sm text-muted-foreground">{cafes.length} quán ở TP.HCM</p>
      <ul className="flex flex-col gap-3">
        {cafes.map((cafe) => (
          <li key={cafe.id}>
            <CafeCard cafe={cafe as Cafe} />
          </li>
        ))}
      </ul>
    </>
  )
}

function CafeListFallback() {
  return (
    <div className="flex flex-col gap-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  )
}

export default function CafesPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
      <header className="mb-6 flex items-end justify-between gap-2">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Quán cà phê</h1>
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Trang chủ
        </Link>
      </header>

      <Suspense fallback={<CafeListFallback />}>
        <CafeList />
      </Suspense>
    </main>
  )
}

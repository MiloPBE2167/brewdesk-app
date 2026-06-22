import { MapPin, Plug, Volume2, Wifi } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Cafe } from '@/lib/types'

const NOISE_LABEL: Record<number, string> = {
  1: 'Im ắng',
  2: 'Yên tĩnh',
  3: 'Vừa phải',
  4: 'Hơi ồn',
  5: 'Ồn',
}

// Placeholder gradient + chữ cái đầu, màu suy ra từ tên quán → mỗi quán một sắc.
function placeholderImage(name: string) {
  const hue = [...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % 360
  const c1 = `hsl(${hue} 45% 55%)`
  const c2 = `hsl(${(hue + 40) % 360} 48% 40%)`
  const initial = (name.trim()[0] ?? '?').toUpperCase()
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='150'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${c1}'/><stop offset='1' stop-color='${c2}'/></linearGradient></defs><rect width='400' height='150' fill='url(#g)'/><text x='200' y='98' font-family='Arial,sans-serif' font-size='72' font-weight='700' fill='rgba(255,255,255,0.92)' text-anchor='middle'>${initial}</text></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
      {children}
    </span>
  )
}

export function CafeCard({ cafe }: { cafe: Cafe }) {
  return (
    <Card size="sm">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={cafe.photo_url || placeholderImage(cafe.name)}
        alt={cafe.name}
        className="h-36 w-full object-cover"
      />
      <CardHeader>
        <CardTitle className="flex items-start justify-between gap-2">
          <span>{cafe.name}</span>
          {cafe.district && (
            <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-normal text-primary">
              {cafe.district}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2.5">
        <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
          <MapPin className="mt-0.5 size-3.5 shrink-0" />
          {cafe.address}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {cafe.has_wifi && (
            <Tag>
              <Wifi className="size-3" /> Wifi
            </Tag>
          )}
          {cafe.has_power_outlets && (
            <Tag>
              <Plug className="size-3" /> Ổ cắm
            </Tag>
          )}
          {cafe.noise_level != null && (
            <Tag>
              <Volume2 className="size-3" /> {NOISE_LABEL[cafe.noise_level] ?? `${cafe.noise_level}/5`}
            </Tag>
          )}
          {cafe.vibe_tags?.map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

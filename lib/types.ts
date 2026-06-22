// Khớp bảng public.cafes (supabase/migrations/20260619000000_init_schema.sql)
export type Cafe = {
  id: string
  name: string
  address: string
  lat: number
  lng: number
  district: string | null
  has_power_outlets: boolean | null
  has_wifi: boolean | null
  noise_level: number | null
  vibe_tags: string[] | null
  opening_hours: Record<string, string> | null
  photo_url: string | null
  created_at: string
}

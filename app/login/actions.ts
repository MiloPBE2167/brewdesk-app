'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

// Login: chỉ kiểm email hợp lệ + password không rỗng — KHÔNG enforce độ dài
// (mật khẩu đã tồn tại, ràng buộc strength thuộc về lúc tạo tài khoản).
const loginSchema = z.object({
  email: z.email('Email không hợp lệ'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
})

// Signup: enforce strength khi tạo mới.
const signupSchema = z.object({
  email: z.email('Email không hợp lệ'),
  password: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự'),
})

const emailSchema = z.object({
  email: z.email('Email không hợp lệ'),
})

// Returns the first validation message, or null if the input is valid.
function firstError(result: z.ZodSafeParseResult<unknown>): string | null {
  return result.success ? null : result.error.issues[0].message
}

export async function login(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  const invalid = firstError(parsed)
  if (invalid) redirect('/login?error=' + encodeURIComponent(invalid))

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data!)

  if (error) {
    redirect('/login?error=' + encodeURIComponent(error.message))
  }

  redirect('/')
}

export async function signup(formData: FormData) {
  const parsed = signupSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  const invalid = firstError(parsed)
  if (invalid) redirect('/login?error=' + encodeURIComponent(invalid))

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp(parsed.data!)

  if (error) {
    redirect('/login?error=' + encodeURIComponent(error.message))
  }

  redirect('/login?message=Check+your+email+to+confirm+your+account')
}

export async function magicLink(formData: FormData) {
  const parsed = emailSchema.safeParse({ email: formData.get('email') })
  const invalid = firstError(parsed)
  if (invalid) redirect('/login?error=' + encodeURIComponent(invalid))

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data!.email,
    options: { shouldCreateUser: true },
  })

  if (error) {
    redirect('/login?error=' + encodeURIComponent(error.message))
  }

  redirect('/login?message=Check+your+email+for+the+magic+link')
}

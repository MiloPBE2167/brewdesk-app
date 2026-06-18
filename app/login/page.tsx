import { Suspense } from 'react'
import { login, signup, magicLink } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Sign in to Brewdesk</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense>
            <StatusBanner searchParams={searchParams} />
          </Suspense>

          <form className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button type="submit" formAction={login} className="flex-1">
                Sign in
              </Button>
              <Button
                type="submit"
                formAction={signup}
                variant="outline"
                className="flex-1"
              >
                Sign up
              </Button>
            </div>

            <Button
              type="submit"
              formAction={magicLink}
              formNoValidate
              variant="link"
              className="h-auto p-0 text-muted-foreground"
            >
              Or email me a magic link instead
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

async function StatusBanner({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>
}) {
  const { error, message } = await searchParams

  if (error) {
    return (
      <p className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
        {error}
      </p>
    )
  }
  if (message) {
    return (
      <p className="mb-4 rounded-lg bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400">
        {message}
      </p>
    )
  }
  return null
}

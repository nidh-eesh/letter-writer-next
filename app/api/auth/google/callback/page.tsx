'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function GoogleCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    async function handleCallback() {
      const code = searchParams.get('code')
      if (!code) {
        router.push('/editor')
        return
      }

      try {
        const response = await fetch(`/api/auth/google?code=${code}`)
        if (response.ok) {
          // Successfully authenticated with Google
          router.push('/editor')
        } else {
          throw new Error('Failed to authenticate with Google')
        }
      } catch (error) {
        console.error('Error handling Google callback:', error)
        router.push('/editor')
      }
    }

    handleCallback()
  }, [router, searchParams])

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Authenticating with Google...</h1>
        <p className="text-muted-foreground">Please wait while we complete the process.</p>
      </div>
    </div>
  )
}

export default function GoogleCallback() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col items-center justify-center gap-4">
          <h1 className="text-2xl font-bold">Loading...</h1>
          <p className="text-muted-foreground">Please wait while we complete the process.</p>
        </div>
      </div>
    }>
      <GoogleCallbackContent />
    </Suspense>
  )
} 
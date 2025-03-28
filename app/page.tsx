'use client'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'
import { FileText, ArrowRight, Shield, Zap, Share2 } from 'lucide-react'
import { useEffect } from 'react'

export default function Home() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    if (user) {
      router.push('/dashboard')
    }
  }, [user, router])

  // Don't render anything while redirecting
  if (user) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <main className="flex-1 container mx-auto px-4 py-16 flex flex-col items-center justify-center text-center gap-8">
        <div className="relative">
          <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl" />
          <FileText className="w-16 h-16 relative" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          Write and Save Letters with Ease
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          A simple and elegant way to write letters and save them directly to your Google Drive.
          Get started in seconds with Google Sign-In.
        </p>
        <Button size="lg" onClick={() => router.push('/login')}>
          Get Started
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </main>

      {/* Features Section */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center gap-4">
              <Shield className="w-12 h-12 text-primary" />
              <h3 className="text-xl font-semibold">Secure & Private</h3>
              <p className="text-muted-foreground">
                Your letters are stored securely and only you can access them.
              </p>
            </div>
            <div className="flex flex-col items-center text-center gap-4">
              <Zap className="w-12 h-12 text-primary" />
              <h3 className="text-xl font-semibold">Fast & Easy</h3>
              <p className="text-muted-foreground">
                Write and save letters quickly with our intuitive interface.
              </p>
            </div>
            <div className="flex flex-col items-center text-center gap-4">
              <Share2 className="w-12 h-12 text-primary" />
              <h3 className="text-xl font-semibold">Google Drive Integration</h3>
              <p className="text-muted-foreground">
                Save your letters directly to Google Drive for easy access.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
'use client'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'
import { FileText, ArrowRight, Shield, Zap, Share2 } from 'lucide-react'

export default function Home() {
  const { user } = useAuth()
  const router = useRouter()

  // If user is already logged in, redirect to dashboard
  if (user) {
    router.push('/dashboard')
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
            <div className="p-6 rounded-lg bg-background shadow-sm">
              <Shield className="w-8 h-8 mb-4 text-primary" />
              <h3 className="text-lg font-semibold mb-2">Secure Authentication</h3>
              <p className="text-muted-foreground">
                Quick and secure authentication using your Google account.
              </p>
            </div>
            <div className="p-6 rounded-lg bg-background shadow-sm">
              <Zap className="w-8 h-8 mb-4 text-primary" />
              <h3 className="text-lg font-semibold mb-2">Simple Editor</h3>
              <p className="text-muted-foreground">
                Clean and distraction-free writing experience.
              </p>
            </div>
            <div className="p-6 rounded-lg bg-background shadow-sm">
              <Share2 className="w-8 h-8 mb-4 text-primary" />
              <h3 className="text-lg font-semibold mb-2">Google Drive Integration</h3>
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

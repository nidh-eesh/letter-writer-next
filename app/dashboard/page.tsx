'use client'

import { useAuth } from '@/lib/AuthContext'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus, FileText, Clock, Trash2, Edit2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import type { Draft } from '@/lib/types'
import { getDraftsByUserId, deleteDraft } from '@/lib/supabase'
import DOMPurify from 'dompurify'

export default function DashboardPage() {
  const { user, loading: authLoading, logout } = useAuth()
  const router = useRouter()
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [loading, setLoading] = useState(true)

  // Handle authentication redirect
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [authLoading, user, router])

  // Fetch drafts
  useEffect(() => {
    async function fetchDrafts() {
      if (!user?.uid) return
      
      try {
        const fetchedDrafts = await getDraftsByUserId(user.uid)
        setDrafts(fetchedDrafts)
      } catch (error) {
        console.error('Error fetching drafts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDrafts()
  }, [user?.uid])

  const handleNewLetter = () => {
    router.push('/editor/new')
  }

  const handleEditDraft = (draftId: string) => {
    router.push(`/editor/${draftId}`)
  }

  const handleDeleteDraft = async (draftId: string) => {
    try {
      await deleteDraft(draftId)
      setDrafts(drafts.filter(draft => draft.id !== draftId))
    } catch (error) {
      console.error('Error deleting draft:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4" />
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-4" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Don't render anything while redirecting
  if (!user) {
    return null
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {user.displayName || 'User'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleNewLetter}>
              <Plus className="w-4 h-4 mr-2" />
              New Letter
            </Button>
            <Button variant="outline" onClick={logout}>
              Sign Out
            </Button>
          </div>
        </div>

        {/* Drafts Section */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Your Drafts</h2>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-6 animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </Card>
              ))}
            </div>
          ) : drafts.length === 0 ? (
            <Card className="p-6 flex flex-col items-center justify-center text-center gap-2 min-h-[200px]">
              <FileText className="w-12 h-12 text-muted-foreground" />
              <h3 className="font-semibold">No drafts yet</h3>
              <p className="text-sm text-muted-foreground">
                Create your first letter by clicking the &quot;New Letter&quot; button above
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {drafts.map((draft) => (
                <Card key={draft.id} className="p-6 group">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-semibold">{draft.title}</h3>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditDraft(draft.id)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteDraft(draft.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div 
                    className="text-sm text-muted-foreground line-clamp-2 mb-4 prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(draft.content) }}
                  />
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>Last updated {formatDate(draft.updated_at)}</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
} 
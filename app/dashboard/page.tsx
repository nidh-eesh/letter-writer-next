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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function DashboardPage() {
  const { user, loading: authLoading, logout } = useAuth()
  const router = useRouter()
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [loading, setLoading] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteFromDrive, setDeleteFromDrive] = useState(false)
  const [draftToDelete, setDraftToDelete] = useState<Draft | null>(null)

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

  const handleDeleteDraft = async (draft: Draft) => {
    setDraftToDelete(draft)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!draftToDelete?.id) return

    try {
      if (deleteFromDrive && draftToDelete.drive_file_id) {
        // Delete from Google Drive
        const response = await fetch('/api/drive/delete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileId: draftToDelete.drive_file_id,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to delete from Google Drive')
        }
      }

      // Delete from Supabase
      await deleteDraft(draftToDelete.id)
      setDrafts(drafts.filter(d => d.id !== draftToDelete.id))
    } catch (error) {
      console.error('Error deleting draft:', error)
    } finally {
      setShowDeleteDialog(false)
      setDraftToDelete(null)
      setDeleteFromDrive(false)
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
    <div className="container mx-auto py-4 sm:py-8 px-2 sm:px-4">
      <div className="flex flex-col gap-4 sm:gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Welcome back, {user.displayName || 'User'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleNewLetter} className="flex-1 sm:flex-none">
              <Plus className="w-4 h-4 mr-2" />
              New Letter
            </Button>
            <Button variant="outline" onClick={logout} className="flex-1 sm:flex-none">
              Sign Out
            </Button>
          </div>
        </div>

        {/* Drafts Section */}
        <section>
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Your Drafts</h2>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-4 sm:p-6 animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </Card>
              ))}
            </div>
          ) : drafts.length === 0 ? (
            <Card className="p-4 sm:p-6 flex flex-col items-center justify-center text-center gap-2 min-h-[200px]">
              <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground" />
              <h3 className="font-semibold">No drafts yet</h3>
              <p className="text-sm text-muted-foreground">
                Create your first letter by clicking the &quot;New Letter&quot; button above
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {drafts.map((draft) => (
                <Card key={draft.id} className="p-4 sm:p-6 group">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-semibold text-sm sm:text-base">{draft.title}</h3>
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
                        onClick={() => handleDeleteDraft(draft)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div 
                    className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-4 prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(draft.content) }}
                  />
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    <span>Last updated {formatDate(draft.updated_at)}</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent className="mx-4 sm:mx-auto">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Draft</AlertDialogTitle>
              <AlertDialogDescription>
                {draftToDelete?.drive_file_id ? (
                  <span className="block space-y-4">
                    <span className="block">This draft is saved in Google Drive. Would you like to:</span>
                    <span className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="deleteFromDrive"
                        checked={deleteFromDrive}
                        onChange={(e) => setDeleteFromDrive(e.target.checked)}
                      />
                      <label htmlFor="deleteFromDrive" className="text-sm">
                        Delete from Google Drive as well
                      </label>
                    </span>
                  </span>
                ) : (
                  <span className="block">Are you sure you want to delete this draft?</span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
} 
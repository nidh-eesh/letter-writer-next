'use client'

import { useAuth } from '@/lib/AuthContext'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Save,
  Upload,
  List,
  ListOrdered,
  ArrowLeft,
  Trash2
} from "lucide-react"
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import UnderlineExtension from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { cn } from "@/lib/utils"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Draft } from '@/lib/types'
import { getDraft, updateDraft, createDraft, deleteDraft } from '@/lib/supabase'
import { use } from 'react'
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

export default function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user } = useAuth()
  const router = useRouter()
  const [draft, setDraft] = useState<Draft | null>(null)
  const [loading, setLoading] = useState(true)
  const [isTitleEditing, setIsTitleEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [savingToDrive, setSavingToDrive] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteFromDrive, setDeleteFromDrive] = useState(false)

  useEffect(() => {
    async function fetchDraft() {
      if (!user?.uid) return

      try {
        if (id === 'new') {
          // For new drafts, just set up the initial state
          setDraft({
            id: '',
            title: 'Untitled',
            content: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            user_id: user.uid,
          })
          setTitle('Untitled')
        } else {
          // Only fetch from Supabase if editing an existing draft
          const fetchedDraft = await getDraft(id)
          setDraft(fetchedDraft)
          setTitle(fetchedDraft.title)

          // Check Google Drive file status in the background
          if (fetchedDraft.drive_file_id) {
            checkDriveFileStatus(fetchedDraft)
          }
        }
      } catch (error) {
        console.error('Error fetching draft:', error)
      } finally {
        setLoading(false)
      }
    }

    async function checkDriveFileStatus(fetchedDraft: Draft) {
      try {
        const response = await fetch('/api/drive/check', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileId: fetchedDraft.drive_file_id,
          }),
        })

        if (response.ok) {
          const { exists } = await response.json()
          if (!exists) {
            // If the file doesn't exist in Drive, remove the drive_file_id
            const updatedDraft = await updateDraft(fetchedDraft.id, {
              drive_file_id: undefined,
            })
            setDraft(updatedDraft)
          }
        }
      } catch (error) {
        console.error('Error checking Google Drive file:', error)
      }
    }

    fetchDraft()
  }, [id, user?.uid])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          HTMLAttributes: {
            class: 'list-disc pl-4',
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: 'list-decimal pl-4',
          },
        },
        listItem: {
          HTMLAttributes: {
            class: 'my-1',
          },
        },
      }),
      UnderlineExtension,
      TextAlign.configure({
        types: ['heading', 'paragraph']
      }),
    ],
    content: draft?.content || '',
    editorProps: {
      attributes: {
        class: 'min-h-[400px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
      },
    },
    immediatelyRender: false,
  })

  // Update editor content when draft changes
  useEffect(() => {
    if (editor && draft?.content) {
      editor.commands.setContent(draft.content)
    }
  }, [editor, draft?.content])

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4" />
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="h-[400px] bg-muted rounded" />
        </div>
      </div>
    )
  }

  if (!editor || !draft) {
    return null
  }

  const handleSave = async () => {
    if (!user?.uid) return

    setSaving(true)
    try {
      if (!draft.id) {
        const newDraft = await createDraft({
          title,
          content: editor.getHTML(),
          user_id: user.uid,
        })
        setDraft(newDraft)
      } else {
        // Update existing draft
        const updatedDraft = await updateDraft(draft.id, {
          title,
          content: editor.getHTML(),
        })
        setDraft(updatedDraft)
      }
      router.push('/dashboard')
    } catch (error) {
      console.error('Error saving draft:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveToDrive = async () => {
    setSavingToDrive(true)
    try {
      let currentDraft = draft
      // If this is a new draft, save it to Supabase first
      if (!currentDraft.id && user?.uid) {
        const newDraft = await createDraft({
          title,
          content: editor.getHTML(),
          user_id: user.uid,
        })
        currentDraft = newDraft
        setDraft(newDraft)
      }

      // If this is an existing draft with a drive_file_id, check if it still exists
      if (currentDraft.drive_file_id) {
        try {
          const response = await fetch('/api/drive/check', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fileId: currentDraft.drive_file_id,
            }),
          })
          
          if (response.ok) {
            const { exists } = await response.json()
            if (!exists) {
              // If the file doesn't exist in Drive, remove the drive_file_id
              const updatedDraft = await updateDraft(currentDraft.id, {
                drive_file_id: undefined,
              })
              currentDraft = updatedDraft
              setDraft(updatedDraft)
            }
          }
        } catch (error) {
          console.error('Error checking Google Drive file:', error)
        }
      }

      // First, check if we have Google access token
      const response = await fetch('/api/drive/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content: editor.getHTML(),
        }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          // Not authenticated with Google, redirect to Google OAuth
          const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
            `client_id=${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}` +
            `&redirect_uri=${encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`)}` +
            `&response_type=code` +
            `&scope=${encodeURIComponent('https://www.googleapis.com/auth/drive.file')}` +
            `&access_type=offline` +
            `&prompt=consent`
          
          window.location.href = googleAuthUrl
          return
        }
        throw new Error('Failed to save to Google Drive')
      }

      const file = await response.json()
      console.log('File saved to Google Drive:', file)

      // Update the draft with the Google Drive file ID
      if (currentDraft.id) {
        const updatedDraft = await updateDraft(currentDraft.id, {
          drive_file_id: file.id,
        })
        setDraft(updatedDraft)
      }

      // Only redirect to dashboard for new files (check original draft.id)
      if (!draft.id) {
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Error saving to Google Drive:', error)
      // You could show an error toast here
    } finally {
      setSavingToDrive(false)
    }
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value)
  }

  const handleTitleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!draft.id) {
      // For new drafts, just update the local state
      setDraft(prev => prev ? { ...prev, title } : null)
      setIsTitleEditing(false)
      return
    }

    try {
      const updatedDraft = await updateDraft(draft.id, { title })
      setDraft(updatedDraft)
      setIsTitleEditing(false)
    } catch (error) {
      console.error('Error updating title:', error)
    }
  }

  const handleDelete = async () => {
    if (!draft?.id) return

    try {
      if (deleteFromDrive && draft.drive_file_id) {
        // Delete from Google Drive
        const response = await fetch('/api/drive/delete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileId: draft.drive_file_id,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to delete from Google Drive')
        }
      }

      // Delete from Supabase
      await deleteDraft(draft.id)
      router.push('/dashboard')
    } catch (error) {
      console.error('Error deleting draft:', error)
    } finally {
      setShowDeleteDialog(false)
    }
  }

  return (
    <div className="container mx-auto py-4 sm:py-8 px-2 sm:px-4">
      <div className="flex flex-col gap-4 sm:gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/dashboard')}
              className="shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            {isTitleEditing ? (
              <form onSubmit={handleTitleSubmit} className="flex items-center gap-2 flex-1">
                <Input
                  value={title}
                  onChange={handleTitleChange}
                  className="h-9 w-full sm:w-[300px]"
                  autoFocus
                />
                <Button type="submit" size="sm">Save</Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setIsTitleEditing(false)
                    setTitle(draft.title)
                  }}
                >
                  Cancel
                </Button>
              </form>
            ) : (
              <h1 
                className="text-2xl sm:text-3xl font-bold cursor-pointer hover:opacity-80 truncate"
                onClick={() => setIsTitleEditing(true)}
              >
                {title}
              </h1>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            {!draft.id && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSave}
                disabled={saving}
                className="flex-1 sm:flex-none"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Draft'}
              </Button>
            )}
            {!draft.drive_file_id && (
              <Button 
                size="sm" 
                onClick={handleSaveToDrive}
                disabled={savingToDrive}
                className="flex-1 sm:flex-none"
              >
                <Upload className="w-4 h-4 mr-2" />
                {savingToDrive ? 'Saving to Drive...' : 'Save to Drive'}
              </Button>
            )}
            {id !== 'new' && (
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                className="flex-1 sm:flex-none"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        </div>

        {/* Main Editor */}
        <Card className="p-4 sm:p-6">
          {/* Formatting Toolbar */}
          <div className="flex flex-wrap gap-1 sm:gap-2 mb-4 p-2 border rounded-md overflow-x-auto">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={cn(editor.isActive('bold') && 'bg-accent')}
            >
              <Bold className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={cn(editor.isActive('italic') && 'bg-accent')}
            >
              <Italic className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={cn(editor.isActive('underline') && 'bg-accent')}
            >
              <Underline className="w-4 h-4" />
            </Button>
            <Separator orientation="vertical" className="h-6 hidden sm:block" />
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              className={cn(editor.isActive({ textAlign: 'left' }) && 'bg-accent')}
            >
              <AlignLeft className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              className={cn(editor.isActive({ textAlign: 'center' }) && 'bg-accent')}
            >
              <AlignCenter className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              className={cn(editor.isActive({ textAlign: 'right' }) && 'bg-accent')}
            >
              <AlignRight className="w-4 h-4" />
            </Button>
            <Separator orientation="vertical" className="h-6 hidden sm:block" />
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={cn(editor.isActive('bulletList') && 'bg-accent')}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={cn(editor.isActive('orderedList') && 'bg-accent')}
            >
              <ListOrdered className="w-4 h-4" />
            </Button>
          </div>

          {/* Editor Content */}
          <EditorContent editor={editor} />
        </Card>

        {/* Footer - Only show for existing drafts */}
        {draft.id && !savingToDrive && (
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => router.push('/dashboard')}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={saving}
              className="flex-1 sm:flex-none"
            >
              {saving ? 'Saving...' : 'Save & Close'}
            </Button>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent className="mx-4 sm:mx-auto">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Draft</AlertDialogTitle>
              <AlertDialogDescription>
                {draft?.drive_file_id ? (
                  <span className="block space-y-4">
                    <span className="block">This draft is saved in Google Drive. Would you like to:</span>
                    <span className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="deleteFromDrive"
                        checked={deleteFromDrive}
                        onChange={(e) => setDeleteFromDrive(e.target.checked)}
                      />
                      <label htmlFor="deleteFromDrive">
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
              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
} 
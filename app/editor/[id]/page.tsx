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
  ArrowLeft
} from "lucide-react"
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import UnderlineExtension from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { cn } from "@/lib/utils"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Draft } from '@/lib/types'
import { getDraft, updateDraft, createDraft } from '@/lib/supabase'
import { use } from 'react'

export default function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user } = useAuth()
  const router = useRouter()
  const [draft, setDraft] = useState<Draft | null>(null)
  const [loading, setLoading] = useState(true)
  const [isTitleEditing, setIsTitleEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)

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
        }
      } catch (error) {
        console.error('Error fetching draft:', error)
      } finally {
        setLoading(false)
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
        console.log('New draft created:', newDraft)
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
    // TODO: Implement Google Drive save functionality
    console.log('Save to Drive:', {
      id: draft.id,
      title: title,
      content: editor.getHTML(),
    })
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

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/dashboard')}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            {isTitleEditing ? (
              <form onSubmit={handleTitleSubmit} className="flex items-center gap-2">
                <Input
                  value={title}
                  onChange={handleTitleChange}
                  className="h-9 w-[300px]"
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
                className="text-3xl font-bold cursor-pointer hover:opacity-80"
                onClick={() => setIsTitleEditing(true)}
              >
                {title}
              </h1>
            )}
          </div>
          <div className="flex gap-2">
          {!draft.id && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSave}
                disabled={saving}
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Draft'}
              </Button>
            )}
            <Button size="sm" onClick={handleSaveToDrive}>
              <Upload className="w-4 h-4 mr-2" />
              Save to Drive
            </Button>
          </div>
        </div>

        {/* Main Editor */}
        <Card className="p-6">
          {/* Formatting Toolbar */}
          <div className="flex flex-wrap gap-2 mb-4 p-2 border rounded-md">
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
            <Separator orientation="vertical" className="h-6" />
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
            <Separator orientation="vertical" className="h-6" />
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
        {draft.id && (
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => router.push('/dashboard')}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save & Close'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
} 
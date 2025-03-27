"use client";

import { useAuth } from '@/lib/AuthContext'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
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
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function NewEditorPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [title, setTitle] = useState('Untitled')

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
    content: '',
    editorProps: {
      attributes: {
        class: 'min-h-[400px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
      },
    },
  })

  if (!editor) {
    return null
  }

  const handleSave = async () => {
    // TODO: Implement save functionality
    console.log('Save new draft:', {
      title,
      content: editor.getHTML(),
      userId: user?.uid,
    })
  }

  const handleSaveToDrive = async () => {
    // TODO: Implement Google Drive save functionality
    console.log('Save new draft to Drive:', {
      title,
      content: editor.getHTML(),
      userId: user?.uid,
    })
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
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-3xl font-bold bg-transparent border-none focus:outline-none focus:ring-0 p-0"
              placeholder="Untitled"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </Button>
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
      </div>
    </div>
  )
}
"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Save,
  Upload
} from "lucide-react";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import UnderlineExtension from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { cn } from "@/lib/utils";
import { useState } from 'react';

export default function EditorPage() {
  const [isNewFile] = useState(true); // This will be determined by the route or props in the future

  const editor = useEditor({
    extensions: [
      StarterKit,
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
  });

  if (!editor) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Letter Editor</h1>
          <div className="flex gap-2">
            {isNewFile ? (
              <Button variant="outline" size="sm">
                <Save className="w-4 h-4 mr-2" />
                Save Draft
              </Button>
            ) : (
              <Button variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Save to Drive
              </Button>
            )}
          </div>
        </div>

        {/* Main Editor */}
        <Card className="p-6">
          {/* Letter Details */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient</Label>
              <Input id="recipient" placeholder="Enter recipient name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" placeholder="Enter subject" />
            </div>
          </div>

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
          </div>

          {/* Editor Area */}
          <div className="space-y-4">
            <div className="min-h-[400px] p-4 border rounded-md">
              <EditorContent editor={editor} className="prose prose-sm max-w-none" />
            </div>
          </div>
        </Card>

        {/* Footer */}
        <div className="flex justify-end gap-2">
          <Button variant="outline">Cancel</Button>
          {isNewFile ? (
            <Button>
              <Upload className="w-4 h-4 mr-2" />
              Save to Drive
            </Button>
          ) : (
            <Button>Save & Close</Button>
          )}
        </div>
      </div>
    </div>
  );
}
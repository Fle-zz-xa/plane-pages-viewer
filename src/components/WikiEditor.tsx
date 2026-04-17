'use client';

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import { useEffect, useImperativeHandle, forwardRef } from 'react';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3,
  List, ListOrdered, CheckSquare,
  Quote, Code2, Minus,
  AlignLeft, AlignCenter, AlignRight,
  Link as LinkIcon, Highlighter,
} from 'lucide-react';

export interface WikiEditorRef {
  getHTML: () => string;
}

interface WikiEditorProps {
  content: string;
  editable: boolean;
  placeholder?: string;
}

export const WikiEditor = forwardRef<WikiEditorRef, WikiEditorProps>(
  function WikiEditor({ content, editable, placeholder = 'Begin met schrijven...' }, ref) {
    const editor = useEditor({
      extensions: [
        StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
        Placeholder.configure({ placeholder }),
        Link.configure({
          openOnClick: true,
          HTMLAttributes: { class: 'wiki-link' },
        }),
        TaskList,
        TaskItem.configure({ nested: true }),
        Underline,
        Highlight,
        TextAlign.configure({ types: ['heading', 'paragraph'] }),
      ],
      content,
      editable,
      immediatelyRender: false,
    });

    useImperativeHandle(ref, () => ({
      getHTML: () => editor?.getHTML() ?? '',
    }));

    useEffect(() => {
      if (editor && !editor.isDestroyed) {
        const current = editor.getHTML();
        if (current !== content) {
          editor.commands.setContent(content ?? '', false);
        }
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [content]);

    useEffect(() => {
      if (editor && !editor.isDestroyed) {
        editor.setEditable(editable);
      }
    }, [editor, editable]);

    return (
      <div className="wiki-editor-wrap">
        {editable && editor && <Toolbar editor={editor} />}
        <EditorContent editor={editor} className="wiki-prose" />
      </div>
    );
  }
);

function Toolbar({ editor }: { editor: Editor }) {
  const btn = (
    active: boolean,
    onClick: () => void,
    title: string,
    icon: React.ReactNode
  ) => (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`p-1.5 rounded-md transition-colors ${
        active
          ? 'bg-indigo-100 text-indigo-700'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
      }`}
    >
      {icon}
    </button>
  );

  const sep = <span className="w-px h-5 bg-gray-200 mx-0.5 self-center" />;

  const addLink = () => {
    const url = window.prompt('URL invoeren:');
    if (url) editor.chain().focus().setLink({ href: url }).run();
  };

  return (
    <div className="wiki-toolbar">
      {btn(editor.isActive('heading', { level: 1 }), () => editor.chain().focus().toggleHeading({ level: 1 }).run(), 'Kop 1', <Heading1 className="w-4 h-4" />)}
      {btn(editor.isActive('heading', { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), 'Kop 2', <Heading2 className="w-4 h-4" />)}
      {btn(editor.isActive('heading', { level: 3 }), () => editor.chain().focus().toggleHeading({ level: 3 }).run(), 'Kop 3', <Heading3 className="w-4 h-4" />)}
      {sep}
      {btn(editor.isActive('bold'), () => editor.chain().focus().toggleBold().run(), 'Vet', <Bold className="w-4 h-4" />)}
      {btn(editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run(), 'Cursief', <Italic className="w-4 h-4" />)}
      {btn(editor.isActive('underline'), () => editor.chain().focus().toggleUnderline().run(), 'Onderstreept', <UnderlineIcon className="w-4 h-4" />)}
      {btn(editor.isActive('strike'), () => editor.chain().focus().toggleStrike().run(), 'Doorgestreept', <Strikethrough className="w-4 h-4" />)}
      {btn(editor.isActive('highlight'), () => editor.chain().focus().toggleHighlight().run(), 'Markeren', <Highlighter className="w-4 h-4" />)}
      {sep}
      {btn(editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run(), 'Opsomming', <List className="w-4 h-4" />)}
      {btn(editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run(), 'Genummerde lijst', <ListOrdered className="w-4 h-4" />)}
      {btn(editor.isActive('taskList'), () => editor.chain().focus().toggleTaskList().run(), 'Checklist', <CheckSquare className="w-4 h-4" />)}
      {sep}
      {btn(editor.isActive('blockquote'), () => editor.chain().focus().toggleBlockquote().run(), 'Citaat', <Quote className="w-4 h-4" />)}
      {btn(editor.isActive('codeBlock'), () => editor.chain().focus().toggleCodeBlock().run(), 'Code', <Code2 className="w-4 h-4" />)}
      {btn(false, () => editor.chain().focus().setHorizontalRule().run(), 'Scheidingslijn', <Minus className="w-4 h-4" />)}
      {sep}
      {btn(editor.isActive({ textAlign: 'left' }), () => editor.chain().focus().setTextAlign('left').run(), 'Links', <AlignLeft className="w-4 h-4" />)}
      {btn(editor.isActive({ textAlign: 'center' }), () => editor.chain().focus().setTextAlign('center').run(), 'Centreren', <AlignCenter className="w-4 h-4" />)}
      {btn(editor.isActive({ textAlign: 'right' }), () => editor.chain().focus().setTextAlign('right').run(), 'Rechts', <AlignRight className="w-4 h-4" />)}
      {sep}
      {btn(editor.isActive('link'), addLink, 'Link', <LinkIcon className="w-4 h-4" />)}
    </div>
  );
}

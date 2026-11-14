import '@blocknote/mantine/style.css'
import type { PartialBlock } from '@blocknote/core'
import { BlockNoteView, type Theme } from '@blocknote/mantine'
import { useCreateBlockNote } from '@blocknote/react'

const nebulaTheme: Theme = {
  colors: {
    editor: { text: '#f7f3ec', background: 'transparent' },
    menu: { text: '#f7f3ec', background: '#171614' },
    tooltip: { text: '#f7f3ec', background: '#252018' },
    hovered: { text: '#f7f3ec', background: '#252018' },
    selected: { text: '#0b0b0b', background: '#c8a97e' },
    disabled: { text: '#6a6253', background: '#171614' },
    shadow: 'rgba(0,0,0,0.6)',
    border: '#302d28',
    sideMenu: '#8a7f6a',
  },
  borderRadius: 8,
  fontFamily: 'Montserrat, system-ui, sans-serif',
}

export function WorldEditor({
  initialContent,
  editable,
  onChange,
  uploadFile,
}: {
  initialContent: PartialBlock[] | null
  editable: boolean
  onChange: (blocks: PartialBlock[]) => void
  uploadFile: (file: File) => Promise<string>
}) {
  const editor = useCreateBlockNote({
    initialContent: initialContent && initialContent.length ? initialContent : undefined,
    uploadFile,
  })

  return (
    <BlockNoteView
      editor={editor}
      editable={editable}
      theme={nebulaTheme}
      onChange={() => onChange(editor.document as PartialBlock[])}
    />
  )
}

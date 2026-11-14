import '@blocknote/mantine/style.css'
import type { PartialBlock } from '@blocknote/core'
import { BlockNoteView, type Theme } from '@blocknote/mantine'
import { useCreateBlockNote } from '@blocknote/react'
import { ChevronDown, ImageIcon, List, Plus, Quote, SquareCheck, Type } from 'lucide-react'
import { useViewport } from '../lib/useViewport'

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

type BlockType = 'heading' | 'bulletListItem' | 'checkListItem' | 'quote' | 'paragraph'

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
  const { w } = useViewport()
  const mobile = w < 700

  // Mobile toolbar (Figma: "Editor toolbar — above keyboard").
  const current = () => editor.getTextCursorPosition().block
  const toggle = (type: BlockType) => {
    const block = current()
    const next: BlockType = block.type === type ? 'paragraph' : type
    editor.updateBlock(block, next === 'heading' ? { type: 'heading', props: { level: 2 } } : { type: next })
    editor.focus()
  }
  const addBlock = () => {
    const block = current()
    const [inserted] = editor.insertBlocks([{ type: 'paragraph' }], block, 'after')
    if (inserted) editor.setTextCursorPosition(inserted, 'start')
    editor.focus()
    // Opens the same "/" menu desktop readers use.
    const menu = editor.getExtension('suggestionMenu') as
      | { openSuggestionMenu?: (trigger: string) => void }
      | undefined
    menu?.openSuggestionMenu?.('/')
  }
  const addImage = () => {
    const block = current()
    editor.insertBlocks([{ type: 'image' }], block, 'after')
  }

  const btn = (label: string, icon: React.ReactNode, run: () => void, accent = false) => (
    <button
      type="button"
      aria-label={label}
      className={`editor-toolbar__btn${accent ? ' editor-toolbar__btn--accent' : ''}`}
      // Keep the editor focused (and the keyboard up) while tapping.
      onMouseDown={(e) => e.preventDefault()}
      onClick={run}
    >
      {icon}
    </button>
  )

  return (
    <>
      <BlockNoteView
        editor={editor}
        editable={editable}
        theme={nebulaTheme}
        onChange={() => onChange(editor.document as PartialBlock[])}
      />
      {editable && mobile && (
        <div className="editor-toolbar" role="toolbar" aria-label="Formatting">
          {btn('Add a block', <Plus size={22} strokeWidth={1.5} />, addBlock, true)}
          {btn('Heading', <Type size={22} strokeWidth={1.5} />, () => toggle('heading'))}
          {btn('Bulleted list', <List size={22} strokeWidth={1.5} />, () => toggle('bulletListItem'))}
          {btn('To-do', <SquareCheck size={22} strokeWidth={1.5} />, () => toggle('checkListItem'))}
          {btn('Quote', <Quote size={22} strokeWidth={1.5} />, () => toggle('quote'))}
          {btn('Image', <ImageIcon size={22} strokeWidth={1.5} />, addImage)}
          <span className="editor-toolbar__spacer" />
          {btn('Hide keyboard', <ChevronDown size={22} strokeWidth={1.5} />, () =>
            (document.activeElement as HTMLElement | null)?.blur(),
          )}
        </div>
      )}
    </>
  )
}

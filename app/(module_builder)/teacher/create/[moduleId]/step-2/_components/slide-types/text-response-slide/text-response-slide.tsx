'use client'

import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { EditorState } from 'lexical'
import { Info } from 'lucide-react'

import { ToolbarPlugin } from '../context-slide/toolbar-plugin'
import { Alert, AlertDescription } from '@/components/ui/alert'

const theme = {
	paragraph: 'mb-2',
	text: {
		bold: 'font-bold',
		italic: 'italic',
		underline: 'underline',
	},
}

function onError(error: Error) {
	console.error(error)
}

export function TextResponseSlide({
	content,
	onUpdate,
}: {
	content: string
	onUpdate: (content: string) => void
}) {
	const initialConfig = {
		namespace: 'TextResponseSlideEditor',
		theme,
		onError,
		editorState: content ? content : undefined,
	}

	function onChange(editorState: EditorState) {
		const editorStateJSON = editorState.toJSON()
		onUpdate(JSON.stringify(editorStateJSON))
	}

	return (
		<div className='flex min-h-[400px] flex-col gap-4'>
			<Alert className='bg-primary/5 border-primary/20'>
				<Info className='h-4 w-4' />
				<AlertDescription className='text-primary border-primary/20'>
					This interactive slide lets students respond to your content
					with reflections, open-ended answers, or feedback
				</AlertDescription>
			</Alert>
			<div className='flex min-h-[400px] flex-col overflow-hidden rounded-md border bg-background'>
				<LexicalComposer initialConfig={initialConfig}>
					<ToolbarPlugin />
					<div className='relative min-h-[350px] overflow-auto'>
						<RichTextPlugin
							contentEditable={
								<ContentEditable
									className='min-h-[350px] resize-none p-4 focus:outline-hidden'
									aria-placeholder='Enter question...'
									placeholder={
										<div className='pointer-events-none absolute top-4 left-4 text-muted-foreground'>
											Enter question
										</div>
									}
								/>
							}
							ErrorBoundary={LexicalErrorBoundary}
						/>
						<HistoryPlugin />
						<AutoFocusPlugin />
						<OnChangePlugin onChange={onChange} />
					</div>
				</LexicalComposer>
			</div>
		</div>
	)
}


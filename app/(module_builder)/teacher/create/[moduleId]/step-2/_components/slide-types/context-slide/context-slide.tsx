'use client'

import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { EditorState } from 'lexical'

import { ToolbarPlugin } from './toolbar-plugin'

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

export function ContextSlide({
	content,
	onUpdate,
}: {
	content: string
	onUpdate: (content: string) => void
}) {
	const initialConfig = {
		namespace: 'ContextSlideEditor',
		theme,
		onError,
		editorState: content ? content : undefined,
	}

	function onChange(editorState: EditorState) {
		const editorStateJSON = editorState.toJSON()
		onUpdate(JSON.stringify(editorStateJSON))
	}

	return (
		<div className='flex h-full flex-col overflow-hidden rounded-md border bg-background'>
			<LexicalComposer initialConfig={initialConfig}>
				<ToolbarPlugin />
				<div className='relative flex-1 overflow-auto'>
					<RichTextPlugin
						contentEditable={
							<ContentEditable
								className='min-h-full resize-none p-4 focus:outline-hidden'
								aria-placeholder='Enter context...'
								placeholder={
									<div className='pointer-events-none absolute top-4 left-4 text-muted-foreground'>
										Enter context
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
	)
}
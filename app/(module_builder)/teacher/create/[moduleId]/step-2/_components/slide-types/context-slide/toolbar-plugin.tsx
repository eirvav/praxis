'use client'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
	$getSelection,
	$isRangeSelection,
	FORMAT_TEXT_COMMAND,
} from 'lexical'
import {
	Bold,
	Italic,
	Link,
	List,
	ListOrdered,
	Image,
	RemoveFormatting,
	Underline,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { Toggle } from '@/components/ui/toggle'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'

export function ToolbarPlugin() {
	const [editor] = useLexicalComposerContext()
	const [isBold, setIsBold] = useState(false)
	const [isItalic, setIsItalic] = useState(false)
	const [isUnderline, setIsUnderline] = useState(false)

	const updateToolbar = useCallback(() => {
		const selection = $getSelection()
		if ($isRangeSelection(selection)) {
			setIsBold(selection.hasFormat('bold'))
			setIsItalic(selection.hasFormat('italic'))
			setIsUnderline(selection.hasFormat('underline'))
		}
	}, [])

	useEffect(() => {
		return editor.registerUpdateListener(({ editorState }) => {
			editorState.read(() => {
				updateToolbar()
			})
		})
	}, [editor, updateToolbar])

	return (
		<div className='flex items-center gap-1 border-b p-2 bg-primary/5 text-primary'>
			<Select defaultValue='normal'>
				<SelectTrigger className='h-8 w-[120px] bg-background text-primary'>
					<SelectValue placeholder='Normal' />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value='normal'>Normal</SelectItem>
					<SelectItem value='h1'>Heading 1</SelectItem>
					<SelectItem value='h2'>Heading 2</SelectItem>
					<SelectItem value='h3'>Heading 3</SelectItem>
				</SelectContent>
			</Select>

			<div className='mx-2 h-4 w-px bg-border' />

			<Toggle
				size='sm'
				pressed={isBold}
				onPressedChange={() => {
					editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')
				}}
				aria-label='Toggle bold'
			>
				<Bold className='h-4 w-4' />
			</Toggle>

			<Toggle
				size='sm'
				pressed={isItalic}
				onPressedChange={() => {
					editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')
				}}
				aria-label='Toggle italic'
			>
				<Italic className='h-4 w-4' />
			</Toggle>

			<Toggle
				size='sm'
				pressed={isUnderline}
				onPressedChange={() => {
					editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')
				}}
				aria-label='Toggle underline'
			>
				<Underline className='h-4 w-4' />
			</Toggle>

			<div className='mx-2 h-4 w-px bg-border' />

			<Toggle size='sm' aria-label='Toggle unordered list'>
				<List className='h-4 w-4' />
			</Toggle>

			<Toggle size='sm' aria-label='Toggle ordered list'>
				<ListOrdered className='h-4 w-4' />
			</Toggle>
		</div>
	)
}


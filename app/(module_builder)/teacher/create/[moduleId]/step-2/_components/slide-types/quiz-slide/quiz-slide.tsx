'use client'

import { Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { QuizOption } from '../../../../types'

type QuizSlideProps = {
	description: string
	question: string
	options: QuizOption[]
	allowMultipleCorrect: boolean
	onUpdate: (updates: {
		description?: string
		question?: string
		options?: QuizOption[]
	}) => void
}

function generateId() {
	if (typeof crypto !== 'undefined' && crypto.randomUUID) {
		return crypto.randomUUID()
	}

	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
		/[xy]/g,
		(char) => {
			const rand = (Math.random() * 16) | 0
			const value = char === 'x' ? rand : (rand & 0x3) | 0x8
			return value.toString(16)
		},
	)
}

function createOption(index: number): QuizOption {
	return {
		id: generateId(),
		text: '',
		isCorrect: false,
	}
}

export function QuizSlide({
	description,
	question,
	options,
	allowMultipleCorrect,
	onUpdate,
}: QuizSlideProps) {
	const normalizedOptions =
		options?.length > 0
			? options
			: [createOption(1), createOption(2), createOption(3)]

	const handleUpdateOption = (id: string, text: string) => {
		const nextOptions = normalizedOptions.map((option) =>
			option.id === id ? { ...option, text } : option,
		)
		onUpdate({ options: nextOptions })
	}

	const handleToggleCorrect = (id: string) => {
		const nextOptions = normalizedOptions.map((option) => {
			if (option.id !== id) {
				return allowMultipleCorrect
					? option
					: { ...option, isCorrect: false }
			}
			return { ...option, isCorrect: !option.isCorrect }
		})
		onUpdate({ options: nextOptions })
	}

	const handleDeleteOption = (id: string) => {
		if (normalizedOptions.length <= 1) return
		const nextOptions = normalizedOptions.filter((option) => option.id !== id)
		onUpdate({ options: nextOptions })
	}

	const handleAddOption = () => {
		const nextOptions = [
			...normalizedOptions,
			createOption(normalizedOptions.length + 1),
		]
		onUpdate({ options: nextOptions })
	}

	return (
		<div className='flex flex-col gap-6'>
			<div className='space-y-2'>
				<Label htmlFor='quiz-description'>
					Description <span className='text-muted-foreground'>(Optional)</span>
				</Label>
				<Input
					id='quiz-description'
					placeholder='Add some context to your question'
					value={description}
					onChange={(event) =>
						onUpdate({ description: event.target.value })
					}
				/>
			</div>

			<div className='space-y-2'>
				<Label htmlFor='quiz-question'>Question</Label>
				<Input
					id='quiz-question'
					placeholder='Enter you question'
					value={question}
					onChange={(event) =>
						onUpdate({ question: event.target.value })
					}
				/>
			</div>

			<div className='space-y-3'>
				<div className='flex items-center justify-between'>
					<Label>Options</Label>
				</div>
				<div className='flex flex-col gap-3'>
					{normalizedOptions.map((option, index) => (
						<div
							key={option.id}
							className='flex items-center gap-2'
						>
							<span className='min-w-7 rounded-md bg-muted/30 px-2 py-1 text-xs font-semibold text-muted-foreground'>
								{index + 1}
							</span>
							<Input
								placeholder={`Option ${index + 1}`}
								value={option.text}
								onChange={(event) =>
									handleUpdateOption(option.id, event.target.value)
								}
							/>
							<Button
								type='button'
								variant={option.isCorrect ? 'default' : 'outline'}
								className='min-w-20'
								onClick={() => handleToggleCorrect(option.id)}
							>
								{option.isCorrect ? 'Correct' : 'Mark correct'}
							</Button>
							<Button
								type='button'
								variant='outline'
								size='icon'
								onClick={() => handleDeleteOption(option.id)}
								disabled={normalizedOptions.length <= 1}
							>
								<Trash2 className='size-4 text-destructive' />
							</Button>
						</div>
					))}
				</div>
				<p className='text-xs text-muted-foreground'>
					Mark one option as correct for the quiz
				</p>
				<div className='flex justify-end'>
					<Button type='button' variant='outline' onClick={handleAddOption}>
						<Plus className='size-4' />
						Add Option
					</Button>
				</div>
			</div>
		</div>
	)
}


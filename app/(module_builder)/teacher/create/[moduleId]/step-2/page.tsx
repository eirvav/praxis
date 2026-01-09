'use client'

import {
	type ChangeEvent,
	type KeyboardEvent,
	type MouseEvent,
	useMemo,
	useState,
	useTransition,
} from 'react'

import { saveSlidesAction } from '../actions'
import { useBuilder } from '../_components/builder-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'

export default function SlidesBuilderPage() {
	const {
		moduleId,
		slides,
		selectedSlideId,
		addSlide,
		updateSlide,
		deleteSlide,
		moveSlide,
		selectSlide,
		setLastSyncedAt,
	} = useBuilder()

	const [error, setError] = useState<string | null>(null)
	const [success, setSuccess] = useState<string | null>(null)
	const [isSaving, startSaving] = useTransition()

	const selectedSlide = useMemo(
		() =>
			slides.find((slide) => slide.id === selectedSlideId) ??
			slides[0],
		[slides, selectedSlideId],
	)

	async function handleSaveSlides() {
		setError(null)
		setSuccess(null)

		startSaving(async () => {
			const result = await saveSlidesAction({
				moduleId,
				slides,
			})

			if (!result.ok) {
				setError(result.message ?? 'Could not save slides')
				return
			}

			setLastSyncedAt(new Date().toISOString())
			setSuccess('Slides saved')
		})
	}

	const slideList = (
		<div className='flex h-[calc(100vh-180px)] flex-col gap-4 overflow-y-auto rounded-md border bg-muted/30 p-3'>
			<div className='flex items-center justify-between gap-2'>
				<h3 className='text-sm font-medium'>Slides</h3>
				<Button
					size='sm'
					variant='secondary'
					type='button'
					onClick={addSlide}
				>
					Add slide
				</Button>
			</div>
			<Separator />
			{slides.length === 0 ? (
				<p className='text-sm text-muted-foreground'>
					No slides yet. Add your first context slide.
				</p>
			) : (
				<div className='flex flex-col gap-2'>
					{slides.map((slide) => {
						const isActive = slide.id === selectedSlide?.id
						return (
							<div
								key={slide.id}
								role='button'
								tabIndex={0}
								onClick={() => selectSlide(slide.id)}
								onKeyDown={(
									event: KeyboardEvent<HTMLDivElement>,
								) => {
									if (event.key === 'Enter') {
										selectSlide(slide.id)
									}
								}}
								className={[
									'flex flex-col rounded-md border px-3 py-2 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
									isActive
										? 'border-primary bg-primary/10'
										: 'hover:bg-muted',
								].join(' ')}
							>
								<div className='flex items-center justify-between text-xs text-muted-foreground'>
									<span>#{slide.position}</span>
									<span>{slide.type}</span>
								</div>
								<div className='text-sm font-medium'>
									{slide.title || 'Untitled context slide'}
								</div>
								<div className='mt-2 flex gap-2 text-xs'>
									<Button
										size='sm'
										variant='outline'
										type='button'
										onClick={(
											event: MouseEvent<HTMLButtonElement>,
										) => {
											event.stopPropagation()
											moveSlide(slide.id, 'up')
										}}
									>
										Up
									</Button>
									<Button
										size='sm'
										variant='outline'
										type='button'
										onClick={(
											event: MouseEvent<HTMLButtonElement>,
										) => {
											event.stopPropagation()
											moveSlide(slide.id, 'down')
										}}
									>
										Down
									</Button>
									<Button
										size='sm'
										variant='destructive'
										type='button'
										onClick={(
											event: MouseEvent<HTMLButtonElement>,
										) => {
											event.stopPropagation()
											deleteSlide(slide.id)
										}}
									>
										Delete
									</Button>
								</div>
							</div>
						)
					})}
				</div>
			)}
		</div>
	)

	const editorPane = selectedSlide ? (
		<Card className='h-[calc(100vh-180px)] overflow-hidden'>
			<CardHeader className='flex flex-row items-center justify-between gap-2'>
				<div>
					<CardTitle className='text-xl'>
						{selectedSlide.title || 'Context slide'}
					</CardTitle>
					<p className='text-sm text-muted-foreground'>
						Main content area stays put while you scroll slides.
					</p>
				</div>
				<Button
					type='button'
					onClick={handleSaveSlides}
					disabled={isSaving}
				>
					{isSaving ? 'Saving…' : 'Save slides'}
				</Button>
			</CardHeader>
			<CardContent className='space-y-4 overflow-hidden'>
				<div className='space-y-2'>
					<Label htmlFor='slide-title'>Slide title</Label>
					<Input
						id='slide-title'
						placeholder='Intro context'
						value={selectedSlide.title}
						onChange={(
							event: ChangeEvent<HTMLInputElement>,
						) =>
							updateSlide(selectedSlide.id, {
								title: event.target.value,
							})
						}
					/>
				</div>
				<div className='space-y-2'>
					<Label htmlFor='slide-body'>Content</Label>
					<Textarea
						id='slide-body'
						className='h-64 resize-none'
						placeholder='Add your context for students'
						value={selectedSlide.content?.body ?? ''}
						onChange={(
							event: ChangeEvent<HTMLTextAreaElement>,
						) =>
							updateSlide(selectedSlide.id, {
								content: {
									...selectedSlide.content,
									body: event.target.value,
								},
							})
						}
					/>
				</div>
				{error ? (
					<div className='rounded-md border border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive'>
						{error}
					</div>
				) : null}
				{success ? (
					<div className='rounded-md border border-emerald-500 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700'>
						{success}
					</div>
				) : null}
			</CardContent>
		</Card>
	) : (
		<Card className='flex h-[calc(100vh-180px)] items-center justify-center'>
			<p className='text-sm text-muted-foreground'>
				Add a slide to start editing.
			</p>
		</Card>
	)

	const settingsPane = selectedSlide ? (
		<div className='h-[calc(100vh-180px)] rounded-md border bg-muted/20 p-4'>
			<h3 className='text-sm font-medium'>Slide settings</h3>
			<p className='text-xs text-muted-foreground'>
				Tweak visibility and notes.
			</p>
			<Separator className='my-3' />
			<div className='flex items-center gap-2'>
				<Checkbox
					id='visible'
					checked={
						(selectedSlide.settings?.visible as boolean) ??
						true
					}
					onCheckedChange={(checked) =>
						updateSlide(selectedSlide.id, {
							settings: {
								...selectedSlide.settings,
								visible: Boolean(checked),
							},
						})
					}
				/>
				<Label htmlFor='visible'>Visible to students</Label>
			</div>
			<div className='mt-4 space-y-2'>
				<Label htmlFor='notes'>Internal notes</Label>
				<Textarea
					id='notes'
					rows={5}
					placeholder='Private notes for teachers'
					value={
						(selectedSlide.settings?.notes as string) ?? ''
					}
					onChange={(
						event: ChangeEvent<HTMLTextAreaElement>,
					) =>
						updateSlide(selectedSlide.id, {
							settings: {
								...selectedSlide.settings,
								notes: event.target.value,
							},
						})
					}
				/>
			</div>
		</div>
	) : (
		<div className='flex h-[calc(100vh-180px)] items-center justify-center rounded-md border bg-muted/20 p-4 text-sm text-muted-foreground'>
			No slide selected.
		</div>
	)

	return (
		<div className='grid grid-cols-[260px_1fr_280px] gap-4'>
			{slideList}
			{editorPane}
			{settingsPane}
		</div>
	)
}

'use client'

import { useEffect, useMemo } from 'react'
import { Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { LikertScaleSlider } from '../../../../types'

type LikertScaleSlideProps = {
	description: string
	sliders: LikertScaleSlider[]
	onUpdate: (updates: {
		description?: string
		sliders?: LikertScaleSlider[]
	}) => void
	onUpdateSettings?: (updates: Record<string, unknown>) => void
}

const defaultLabels = {
	left: 'Not at all',
	middle: 'Somewhat',
	right: 'Very much',
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

function createSlider(): LikertScaleSlider {
	return {
		id: generateId(),
		question: '',
		labels: { ...defaultLabels },
		min: 0,
		max: 5,
	}
}

export function LikertScaleSlide({
	description,
	sliders,
	onUpdate,
	onUpdateSettings,
}: LikertScaleSlideProps) {
	const normalizedSliders = useMemo(() => sliders ?? [], [sliders])

	useEffect(() => {
		if (normalizedSliders.length > 0) return
		const seeded = createSlider()
		onUpdate({ sliders: [seeded] })
		onUpdateSettings?.({ activeSliderId: seeded.id })
	}, [normalizedSliders.length, onUpdate, onUpdateSettings])

	const handleUpdateSlider = (
		id: string,
		updates: Partial<LikertScaleSlider>,
	) => {
		const nextSliders = normalizedSliders.map((slider) =>
			slider.id === id ? { ...slider, ...updates } : slider,
		)
		onUpdate({ sliders: nextSliders })
	}

	const handleUpdateLabels = (
		id: string,
		updates: Partial<LikertScaleSlider['labels']>,
	) => {
		const nextSliders = normalizedSliders.map((slider) =>
			slider.id === id
				? {
						...slider,
						labels: {
							...defaultLabels,
							...slider.labels,
							...updates,
						},
					}
				: slider,
		)
		onUpdate({ sliders: nextSliders })
	}

	const handleAddSlider = () => {
		const nextSlider = createSlider()
		const nextSliders = [...normalizedSliders, nextSlider]
		onUpdate({ sliders: nextSliders })
		onUpdateSettings?.({ activeSliderId: nextSlider.id })
	}

	const handleDeleteSlider = (id: string) => {
		const nextSliders = normalizedSliders.filter((slider) => slider.id !== id)
		if (!nextSliders.length) return
		onUpdate({ sliders: nextSliders })
		onUpdateSettings?.({ activeSliderId: nextSliders[0].id })
	}

	return (
		<div className='flex flex-col gap-6'>
			<div className='space-y-2'>
				<Label htmlFor='likert-description'>Description (Optional)</Label>
				<Textarea
					id='likert-description'
					placeholder='Add some context to your question...'
					className='min-h-[90px] resize-none'
					value={description}
					onChange={(event) =>
						onUpdate({ description: event.target.value })
					}
				/>
			</div>

			<div className='flex flex-col gap-6'>
				{normalizedSliders.map((slider, index) => {
					const labels = {
						...defaultLabels,
						...slider.labels,
					}
					const min = Math.max(0, Math.min(9, slider.min ?? 0))
					const max = Math.max(
						min + 1,
						Math.min(10, slider.max ?? 5),
					)
					const steps = Array.from(
						{ length: max - min + 1 },
						(_, stepIndex) => min + stepIndex,
					)
					const gridTemplateColumns = `repeat(${steps.length}, minmax(0, 1fr))`

					return (
						<div
							key={slider.id}
							className='rounded-xl border bg-background p-4 shadow-xs'
						>
							<div className='flex items-center justify-between'>
								<h3 className='text-sm font-semibold'>
									Slider {index + 1}
								</h3>
								{normalizedSliders.length > 1 && (
									<Button
										variant='ghost'
										size='icon'
										type='button'
										onClick={() => handleDeleteSlider(slider.id)}
										aria-label={`Delete slider ${index + 1}`}
									>
										<Trash2 className='size-4 text-muted-foreground' />
									</Button>
								)}
							</div>

							<div className='mt-4 space-y-4'>
								<div className='space-y-2'>
									<Label htmlFor={`likert-question-${slider.id}`}>
										Question
									</Label>
									<Input
										id={`likert-question-${slider.id}`}
										placeholder='Enter your question'
										value={slider.question}
										required
										onChange={(event) =>
											handleUpdateSlider(slider.id, {
												question: event.target.value,
											})
										}
									/>
								</div>

								<div className='space-y-2'>
									<Label>Labels</Label>
									<div className='grid gap-2 md:grid-cols-3'>
										<Input
											placeholder='Not at all'
											value={labels.left}
											onChange={(event) =>
												handleUpdateLabels(slider.id, {
													left: event.target.value,
												})
											}
										/>
										<Input
											placeholder='Somewhat'
											value={labels.middle}
											onChange={(event) =>
												handleUpdateLabels(slider.id, {
													middle: event.target.value,
												})
											}
										/>
										<Input
											placeholder='Very much'
											value={labels.right}
											onChange={(event) =>
												handleUpdateLabels(slider.id, {
													right: event.target.value,
												})
											}
										/>
									</div>
								</div>

								<div className='space-y-2'>
									<Label>Preview</Label>
									<div className='flex items-center justify-between text-xs text-muted-foreground'>
										<span>{labels.left}</span>
										<span>{labels.middle}</span>
										<span>{labels.right}</span>
									</div>
									<div
										className='grid gap-2'
										style={{ gridTemplateColumns }}
									>
										{steps.map((value) => (
											<div
												key={`${slider.id}-${value}`}
												className='flex items-center justify-center rounded-md border bg-muted/10 py-2 text-sm font-medium'
											>
												{value}
											</div>
										))}
									</div>
								</div>
							</div>
						</div>
					)
				})}
			</div>

			<div className='flex justify-end'>
				<Button
					type='button'
					className='gap-2'
					onClick={handleAddSlider}
				>
					<Plus className='size-4' />
					Add
				</Button>
			</div>
		</div>
	)
}


'use client'

import { useMemo, useState } from 'react'

import {
	AlignLeft,
	Camera,
	ListTodo,
	MessageSquare,
	MoveHorizontal,
	Video,
	type LucideIcon,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { SlideDraft } from '../../types'
import { SlidePreview } from './slide-preview'

const slideLabels: Record<string, string> = {
	context: 'Context',
	video: 'Video',
	writtenResponse: 'Written Response',
	likertScale: 'Likert Scale',
	videoResponse: 'Video Response',
	knowledgeTest: 'Quiz',
}

function getDisplayTitle(slide: SlideDraft) {
	if (slide.title && !slide.title.startsWith('New ')) {
		return slide.title
	}
	return slideLabels[slide.type] ?? slide.type
}

const slideIcons: Record<string, LucideIcon> = {
	context: MessageSquare,
	video: Video,
	writtenResponse: AlignLeft,
	likertScale: MoveHorizontal,
	videoResponse: Camera,
	knowledgeTest: ListTodo,
}

export function SlideReview({ slides }: { slides: SlideDraft[] }) {
	const [selectedId, setSelectedId] = useState<string | null>(
		slides[0]?.id ?? null,
	)

	const activeSlide = useMemo(
		() => slides.find((slide) => slide.id === selectedId),
		[slides, selectedId],
	)

	return (
		<Card className='overflow-hidden'>
			<CardContent className='p-4'>
				<div className='flex items-center justify-between'>
					<div>
						<h3 className='text-sm font-semibold'>Slide review</h3>
						<p className='text-xs text-muted-foreground'>
							Select one slide to preview your content.
						</p>
					</div>
					<Button variant='outline' type='button'>
						Student Preview
					</Button>
				</div>

				<div className='mt-4 grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]'>
					<div className='space-y-2'>
						{slides.length === 0 ? (
							<p className='text-xs text-muted-foreground'>
								No slides added yet.
							</p>
						) : (
							slides.map((slide) => {
								const label = slideLabels[slide.type] ?? slide.type
								const Icon =
									slideIcons[slide.type] ?? MessageSquare

								return (
								<button
									key={slide.id}
									type='button'
									onClick={() => setSelectedId(slide.id)}
									className={cn(
										'flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left text-sm transition',
										selectedId === slide.id
											? 'border-primary/50 bg-primary/5'
											: 'bg-background hover:border-primary/40',
									)}
								>
									<span className='min-w-10 rounded-md bg-muted/30 px-2 py-1 text-xs font-semibold text-muted-foreground'>
										#{slide.position}
									</span>
									<span className='flex items-center gap-2 font-medium text-sm'>
										<Icon className='size-4 text-muted-foreground' />
										{label}
									</span>
								</button>
								)
							})
						)}
					</div>

					<div className='rounded-md border bg-muted/10 p-4'>
						{activeSlide ? (
							<div className='space-y-3'>
								<div className='text-xs text-muted-foreground'>
									Slide #{activeSlide.position}
								</div>
								<div className='text-lg font-semibold'>
									{getDisplayTitle(activeSlide)}
								</div>
								<SlidePreview slide={activeSlide} />
							</div>
						) : (
							<p className='text-sm text-muted-foreground'>
								Select a slide to preview it.
							</p>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	)
}


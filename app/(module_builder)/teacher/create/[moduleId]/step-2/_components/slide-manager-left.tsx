'use client'

import { IconMessageCircle, IconPlus } from '@tabler/icons-react'

import { useBuilder } from '../../_components/builder-context'
import { Button } from '@/components/ui/button'

export function SlideManagerLeft() {
	const {
		slides,
		selectedSlideId,
		addSlide,
		selectSlide,
		moveSlide,
		deleteSlide,
	} = useBuilder()

	return (
		<div className='flex h-full flex-col gap-3 overflow-hidden'>
			<div className='sticky top-0 z-10 flex items-center gap-2 pb-2'>
				<Button
					size='default'
					variant='secondary'
					className='w-full justify-center gap-2 rounded-full px-3 bg-primary text-primary-foreground hover:bg-primary/90'
					type='button'
					onClick={addSlide}
				>
					<IconPlus className='size-4' />
					Add Slide
				</Button>
			</div>
			<div className='flex flex-col gap-3 overflow-y-auto pr-1'>
				{slides.map((slide) => {
					const isActive = slide.id === selectedSlideId
					return (
						<div
							key={slide.id}
							role='button'
							tabIndex={0}
							onClick={() => selectSlide(slide.id)}
							className={[
								'group flex flex-col gap-2 rounded-xl border px-3 py-3 shadow-sm transition hover:border-primary hover:bg-primary/5',
								isActive ? 'border-primary bg-primary/10' : 'bg-background',
							].join(' ')}
						>
							<div className='flex items-center justify-between text-xs text-muted-foreground'>
								<span className='font-medium'>Slide {slide.position}</span>
								<span className='rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground'>
									{slide.type}
								</span>
							</div>
							<div className='flex items-center gap-2 text-muted-foreground'>
								<IconMessageCircle className='size-4' />
								<span className='text-sm text-foreground'>
									{slide.title || 'Untitled slide'}
								</span>
							</div>
							<div className='flex items-center gap-2 text-xs text-muted-foreground'>
								<button
									type='button'
									className='rounded border px-2 py-1 hover:border-primary hover:text-primary'
									onClick={(event) => {
										event.stopPropagation()
										moveSlide(slide.id, 'up')
									}}
								>
									Up
								</button>
								<button
									type='button'
									className='rounded border px-2 py-1 hover:border-primary hover:text-primary'
									onClick={(event) => {
										event.stopPropagation()
										moveSlide(slide.id, 'down')
									}}
								>
									Down
								</button>
								<button
									type='button'
									className='rounded border px-2 py-1 text-destructive hover:border-destructive hover:bg-destructive/10'
									onClick={(event) => {
										event.stopPropagation()
										deleteSlide(slide.id)
									}}
								>
									Delete
								</button>
							</div>
						</div>
					)
				})}
			</div>
		</div>
	)
}

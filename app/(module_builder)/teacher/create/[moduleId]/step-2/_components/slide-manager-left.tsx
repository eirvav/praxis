'use client'

import { IconPlus } from '@tabler/icons-react'
import {
	AlignLeft,
	Camera,
	Copy,
	ListTodo,
	MessageSquare,
	MoveHorizontal,
	Trash2,
	Video,
	type LucideIcon,
} from 'lucide-react'
import { CSS } from '@dnd-kit/utilities'
import {
	DndContext,
	type DragEndEvent,
	KeyboardSensor,
	PointerSensor,
	closestCenter,
	useSensor,
	useSensors,
} from '@dnd-kit/core'
import {
	SortableContext,
	useSortable,
	verticalListSortingStrategy,
	sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'

import { useBuilder } from '../../_components/builder-context'
import { Button } from '@/components/ui/button'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover'
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { cn } from '@/lib/utils'
import type { SlideDraft } from '../../types'

const slideIcons: Record<string, LucideIcon> = {
	context: MessageSquare,
	video: Video,
	writtenResponse: AlignLeft,
	knowledgeTest: ListTodo,
	videoResponse: Camera,
	likertScale: MoveHorizontal,
}

const slideIconColors: Record<string, string> = {
	context: 'text-emerald-600',
	video: 'text-purple-500',
	writtenResponse: 'text-sky-500',
	knowledgeTest: 'text-amber-500',
	videoResponse: 'text-rose-500',
	likertScale: 'text-indigo-500',
}

export function SlideManagerLeft() {
	const {
		slides,
		selectedSlideId,
		addSlide,
		selectSlide,
		deleteSlide,
		reorderSlides,
		duplicateSlide,
	} = useBuilder()

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: { distance: 5 },
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	)

	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event
		if (!over || active.id === over.id) return
		reorderSlides(String(active.id), String(over.id))
	}

	return (
		<div className='flex h-full flex-col gap-3 overflow-hidden'>
			<div className='sticky top-0 z-10 flex items-center gap-2 pb-2'>
				<Popover>
					<PopoverTrigger asChild>
						<Button
							size='default'
							variant='secondary'
							className='h-10 w-full justify-center gap-2 rounded-full bg-primary px-3 text-primary-foreground hover:bg-primary/90'
							type='button'
						>
							<IconPlus className='size-4' />
							Add Slide
						</Button>
					</PopoverTrigger>
					<PopoverContent
						side='bottom'
						align='start'
						className='ml-2 w-80 p-3 shadow-lg'
					>
						<div className='flex flex-col gap-4'>
							<div className='flex flex-col gap-2'>
								<span className='text-xs font-semibold uppercase text-muted-foreground'>
									Context Slides
								</span>
								<div className='grid grid-cols-2 gap-2'>
									<Button
										variant='outline'
										className='flex h-auto flex-col gap-2 p-3 hover:border-primary hover:bg-primary/5 hover:text-primary'
										onClick={() => addSlide('context')}
									>
										<MessageSquare className='size-6' />
										<span className='text-xs font-medium'>
											Context
										</span>
									</Button>
									<Button
										variant='outline'
										className='flex h-auto flex-col gap-2 p-3 hover:border-primary hover:bg-primary/5 hover:text-primary'
										onClick={() => addSlide('video')}
									>
										<Video className='size-6' />
										<span className='text-xs font-medium'>
											Video
										</span>
									</Button>
								</div>
							</div>

							<div className='flex flex-col gap-2'>
								<span className='text-xs font-semibold uppercase text-muted-foreground'>
									Interactive Slides
								</span>
								<div className='grid grid-cols-2 gap-2'>
									<Button
										variant='outline'
										className='flex h-auto flex-col gap-2 p-3 hover:border-primary hover:bg-primary/5 hover:text-primary'
										onClick={() => addSlide('writtenResponse')}
									>
										<AlignLeft className='size-6' />
										<span className='text-xs font-medium'>
											Written Response
										</span>
									</Button>
									<Button
										variant='outline'
										className='flex h-auto flex-col gap-2 p-3 hover:border-primary hover:bg-primary/5 hover:text-primary'
										onClick={() => addSlide('knowledgeTest')}
									>
										<ListTodo className='size-6' />
										<span className='text-xs font-medium'>
											Knowledge Test
										</span>
									</Button>
									<Button
										variant='outline'
										className='flex h-auto flex-col gap-2 p-3 hover:border-primary hover:bg-primary/5 hover:text-primary'
										onClick={() => addSlide('videoResponse')}
									>
										<Camera className='size-6' />
										<span className='text-xs font-medium'>
											Video Response
										</span>
									</Button>
									<Button
										variant='outline'
										className='flex h-auto flex-col gap-2 p-3 hover:border-primary hover:bg-primary/5 hover:text-primary'
										onClick={() => addSlide('likertScale')}
									>
										<MoveHorizontal className='size-6' />
										<span className='text-xs font-medium'>
											Likert Scale
										</span>
									</Button>
								</div>
							</div>
						</div>
					</PopoverContent>
				</Popover>
			</div>

			<DndContext
				sensors={sensors}
				onDragEnd={handleDragEnd}
				collisionDetection={closestCenter}
			>
				<SortableContext
					items={slides.map((slide) => slide.id)}
					strategy={verticalListSortingStrategy}
				>
					<div className='flex flex-col gap-3 overflow-y-auto pr-1'>
						{slides.map((slide) => (
							<SlideListItem
								key={slide.id}
								slide={slide}
								isActive={slide.id === selectedSlideId}
								selectSlide={selectSlide}
								duplicateSlide={duplicateSlide}
								deleteSlide={deleteSlide}
							/>
						))}
					</div>
				</SortableContext>
			</DndContext>
		</div>
	)
}

function SlideListItem({
	slide,
	isActive,
	selectSlide,
	duplicateSlide,
	deleteSlide,
}: {
	slide: SlideDraft
	isActive: boolean
	selectSlide: (id: string) => void
	duplicateSlide: (id: string) => void
	deleteSlide: (id: string) => void
}) {
	const {
		setNodeRef,
		attributes,
		listeners,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: slide.id })

	const Icon =
		slideIcons[slide.type as keyof typeof slideIcons] ?? MessageSquare

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	}

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={cn('relative w-full pl-6', isDragging && 'z-20')}
		>
			<span
				className={cn(
					'pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground',
					isActive && 'text-primary',
				)}
			>
				{slide.position}
			</span>
			<ContextMenu>
				<ContextMenuTrigger asChild>
					<div
						{...attributes}
						{...listeners}
						role='button'
						tabIndex={0}
						onClick={(event) => {
							event.preventDefault()
							selectSlide(slide.id)
						}}
						aria-label={slide.title || `Slide ${slide.position}`}
						className={cn(
							'flex h-24 w-full items-center justify-center rounded-2xl border border-muted-foreground/30 bg-card shadow-sm transition',
							isActive &&
								'border-primary/60 bg-background shadow-md ring-1 ring-primary/40',
							isDragging && 'scale-[1.02] border-primary shadow-lg',
							!isActive &&
								'hover:border-primary/40 hover:bg-primary/5',
						)}
					>
						<Icon
							className={cn(
								'size-6',
								slideIconColors[
									slide.type as keyof typeof slideIconColors
								] ?? 'text-foreground',
							)}
						/>
					</div>
				</ContextMenuTrigger>
				<ContextMenuContent className='w-48'>
					<ContextMenuItem
						onSelect={(event) => {
							event.preventDefault()
							duplicateSlide(slide.id)
						}}
					>
						<Copy className='size-4' />
						Duplicate
					</ContextMenuItem>
					<ContextMenuItem
						variant='destructive'
						onSelect={(event) => {
							event.preventDefault()
							deleteSlide(slide.id)
						}}
					>
						<Trash2 className='size-4' />
						Delete
					</ContextMenuItem>
				</ContextMenuContent>
			</ContextMenu>
		</div>
	)
}

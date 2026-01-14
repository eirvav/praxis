'use client'

import { Camera } from 'lucide-react'

import type { SlideDraft } from '../../types'

function formatDuration(seconds: number) {
	const minutes = Math.floor(seconds / 60)
	const remaining = seconds % 60
	const paddedSeconds = String(remaining).padStart(2, '0')

	if (minutes <= 0) return `${remaining}s`
	return `${minutes}m ${paddedSeconds}s`
}

function extractLexicalText(rawContent?: string | null) {
	if (!rawContent) return ''
	const trimmed = rawContent.trim()
	if (!trimmed) return ''

	try {
		const parsed = JSON.parse(trimmed)
		const output: string[] = []

		const walk = (node: Record<string, unknown>) => {
			if (typeof node.text === 'string') {
				output.push(node.text)
			}

			if (Array.isArray(node.children)) {
				if (node.type === 'paragraph' && output.length > 0) {
					output.push('\n')
				}
				node.children.forEach((child) => {
					if (child && typeof child === 'object') {
						walk(child as Record<string, unknown>)
					}
				})
			}
		}

		if (parsed && typeof parsed === 'object') {
			const rootNode =
				parsed && typeof parsed === 'object' && 'root' in parsed
					? (parsed as { root?: Record<string, unknown> }).root
					: (parsed as Record<string, unknown>)
			if (rootNode && typeof rootNode === 'object') {
				walk(rootNode)
			}
		}

		return output.join('').replace(/\n+/g, '\n').trim()
	} catch {
		return trimmed
	}
}

export function SlidePreview({ slide }: { slide: SlideDraft }) {
	if (slide.type === 'context') {
		const text = extractLexicalText(slide.content?.body)
		return (
			<p className='whitespace-pre-wrap text-sm text-foreground'>
				{text || 'No content yet.'}
			</p>
		)
	}

	if (slide.type === 'video') {
		return (
			<div className='space-y-2 text-sm'>
				<p className='font-medium'>
					{slide.content?.videoTitle || 'Untitled video'}
				</p>
				<p className='text-muted-foreground'>
					{slide.content?.videoContext || 'No context added.'}
				</p>
				{slide.content?.videoUrl ? (
					<div className='overflow-hidden rounded-md border bg-black'>
						<video
							src={slide.content.videoUrl}
							controls
							className='h-48 w-full object-contain'
						/>
					</div>
				) : (
					<p className='text-xs text-muted-foreground'>
						No video uploaded yet.
					</p>
				)}
			</div>
		)
	}

	if (slide.type === 'writtenResponse') {
		const text = extractLexicalText(slide.content?.question)
		return (
			<div className='space-y-2 text-sm'>
				<p className='font-medium'>Written response prompt</p>
				<p className='whitespace-pre-wrap text-muted-foreground'>
					{text || 'No question yet.'}
				</p>
			</div>
		)
	}

	if (slide.type === 'likertScale') {
		const sliders = slide.content?.sliders ?? []
		return (
			<div className='space-y-3 text-sm'>
				<p className='text-muted-foreground'>
					{slide.content?.description || 'No description added.'}
				</p>
				<div className='space-y-2'>
					{sliders.length === 0 ? (
						<p className='text-xs text-muted-foreground'>
							No sliders configured.
						</p>
					) : (
						sliders.map((slider, index) => (
							<div
								key={slider.id}
								className='rounded-md border bg-muted/10 px-3 py-2'
							>
								<p className='text-xs text-muted-foreground'>
									Slider {index + 1}
								</p>
								<p className='font-medium'>
									{slider.question || 'No question yet.'}
								</p>
								<p className='text-xs text-muted-foreground'>
									Range {slider.min}–{slider.max}
								</p>
							</div>
						))
					)}
				</div>
			</div>
		)
	}

	if (slide.type === 'videoResponse') {
		const maxDurationSeconds =
			typeof slide.settings?.maxDurationSeconds === 'number'
				? slide.settings.maxDurationSeconds
				: 120
		const details = [
			`Required: ${slide.settings?.requiredSlide ? 'Yes' : 'No'}`,
			`Multiple responses: ${
				slide.settings?.allowMultipleResponses ? 'Yes' : 'No'
			}`,
			`Max duration: ${formatDuration(maxDurationSeconds)}`,
		]
		return (
			<div className='space-y-3 text-sm'>
				<div className='flex w-full flex-col items-center justify-center gap-4 rounded-md border border-dashed bg-muted/5 p-5 text-center text-sm text-muted-foreground'>
					<div className='rounded-full bg-muted p-3'>
						<Camera className='size-5 text-muted-foreground' />
					</div>
					<div>
						<p className='font-medium text-foreground'>
							Record a video response
						</p>
						<p className='text-xs text-muted-foreground'>
							Students will record and submit responses here
						</p>
					</div>
					<div className='w-full rounded-lg border bg-background/60 p-3 text-left'>
						<p className='text-sm font-medium'>
							Current response settings
						</p>
						<ul className='mt-2 space-y-1 text-xs text-muted-foreground'>
							{details.map((detail) => (
								<li key={detail}>• {detail}</li>
							))}
						</ul>
					</div>
				</div>
			</div>
		)
	}

	if (slide.type === 'knowledgeTest') {
		const options = slide.content?.options ?? []
		return (
			<div className='space-y-3 text-sm'>
				<p className='text-muted-foreground'>
					{slide.content?.description || 'No description added.'}
				</p>
				<p className='font-medium'>
					{slide.content?.question || 'No question yet.'}
				</p>
				<div className='space-y-2'>
					{options.length === 0 ? (
						<p className='text-xs text-muted-foreground'>
							No options configured.
						</p>
					) : (
						options.map((option, index) => (
							<div
								key={option.id}
								className='flex items-center justify-between rounded-md border bg-muted/10 px-3 py-2 text-xs'
							>
								<span>
									{index + 1}.{' '}
									{option.text || `Option ${index + 1}`}
								</span>
								{option.isCorrect && (
									<span className='font-semibold text-primary'>
										Correct
									</span>
								)}
							</div>
						))
					)}
				</div>
			</div>
		)
	}

	return (
		<p className='text-sm text-muted-foreground'>
			Preview unavailable for this slide type.
		</p>
	)
}


'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useBuilder } from '../../_components/builder-context'
import { ContextSlide } from './slide-types/context-slide/context-slide'
import { VideoUploadSlide } from './slide-types/video-upload-slide/video-upload-slide'
import { TextResponseSlide } from './slide-types/text-response-slide/text-response-slide'
import { LikertScaleSlide } from './slide-types/likert-scale-slide/likert-scale-slide'
import { VideoResponseSlide } from './slide-types/video-response-slide/video-response-slide'
import { QuizSlide } from './slide-types/quiz-slide/quiz-slide'

export function MainContentMiddle() {
	const { slides, selectedSlideId, updateSlide } = useBuilder()

	const activeSlide = slides.find((s) => s.id === selectedSlideId)
	const slideTypeLabel =
		activeSlide?.type === 'writtenResponse'
			? 'Written Response'
			: activeSlide?.type === 'likertScale'
				? 'Likert Scale'
				: activeSlide?.type === 'videoResponse'
					? 'Video Response'
					: activeSlide?.type === 'knowledgeTest'
						? 'Knowledge Test'
				: activeSlide?.type ?? ''

	if (!activeSlide) {
		return (
			<Card className='w-full self-start'>
				<CardContent className='py-8 text-center text-muted-foreground'>
					No slide selected
				</CardContent>
			</Card>
		)
	}

	return (
		<Card className='flex w-full max-h-full flex-col overflow-hidden self-start'>
			<CardHeader className='flex flex-row items-center justify-between gap-2 py-0 px-4 shrink-0'>
				<div className='flex items-center gap-2'>
					<CardTitle className='text-lg'>
						Slide {activeSlide.position}
					</CardTitle>
					<span className='rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium capitalize text-foreground'>
						{slideTypeLabel}
					</span>
				</div>
			</CardHeader>
			<Separator />
			<CardContent className='bg-muted/10 p-4 pt-0 overflow-y-auto min-h-0'>
				{activeSlide.type === 'context' && (
					<ContextSlide
						key={activeSlide.id}
						content={activeSlide.content.body || ''}
						onUpdate={(newBody) => {
							updateSlide(activeSlide.id, {
								content: {
									...activeSlide.content,
									body: newBody,
								},
							})
						}}
					/>
				)}
				{activeSlide.type === 'video' && (
					<VideoUploadSlide
						key={activeSlide.id}
						videoTitle={activeSlide.content.videoTitle || ''}
						videoContext={activeSlide.content.videoContext || ''}
						videoUrl={activeSlide.content.videoUrl || ''}
						onUpdate={(updates) => {
							updateSlide(activeSlide.id, {
								content: {
									...activeSlide.content,
									...updates,
								},
							})
						}}
					/>
				)}
				{activeSlide.type === 'writtenResponse' && (
					<TextResponseSlide
						key={activeSlide.id}
						content={activeSlide.content.question || ''}
						onUpdate={(newQuestion) => {
							updateSlide(activeSlide.id, {
								content: {
									...activeSlide.content,
									question: newQuestion,
								},
							})
						}}
					/>
				)}
				{activeSlide.type === 'likertScale' && (
					<LikertScaleSlide
						key={activeSlide.id}
						description={activeSlide.content.description || ''}
						sliders={activeSlide.content.sliders || []}
						onUpdate={(updates) => {
							updateSlide(activeSlide.id, {
								content: {
									...activeSlide.content,
									...updates,
								},
							})
						}}
						onUpdateSettings={(settingsUpdates) => {
							updateSlide(activeSlide.id, {
								settings: {
									...activeSlide.settings,
									...settingsUpdates,
								},
							})
						}}
					/>
				)}
				{activeSlide.type === 'videoResponse' && (
					<VideoResponseSlide
						key={activeSlide.id}
						settings={activeSlide.settings || {}}
					/>
				)}
				{activeSlide.type === 'knowledgeTest' && (
					<QuizSlide
						key={activeSlide.id}
						description={activeSlide.content.description || ''}
						question={activeSlide.content.question || ''}
						options={activeSlide.content.options || []}
						allowMultipleCorrect={Boolean(
							activeSlide.settings?.allowMultipleCorrect,
						)}
						onUpdate={(updates) => {
							updateSlide(activeSlide.id, {
								content: {
									...activeSlide.content,
									...updates,
								},
							})
						}}
					/>
				)}
				{activeSlide.type !== 'context' &&
					activeSlide.type !== 'video' &&
					activeSlide.type !== 'writtenResponse' &&
					activeSlide.type !== 'likertScale' &&
					activeSlide.type !== 'videoResponse' &&
					activeSlide.type !== 'knowledgeTest' && (
						<div className='flex h-full items-center justify-center rounded-lg border bg-background text-muted-foreground m-4'>
							Placeholder for {activeSlide.type} slide
						</div>
					)}
			</CardContent>
		</Card>
	)
}

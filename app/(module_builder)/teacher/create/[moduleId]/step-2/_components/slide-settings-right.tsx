'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { useBuilder } from '../../_components/builder-context'
import { LikertScaleSettings } from './slide-types/likert-scale-slide/likert-scale-settings'
import { VideoUploadSettings } from './slide-types/video-upload-slide/video-upload-settings'
import { TextResponseSettings } from './slide-types/text-response-slide/text-response-settings'
import { VideoResponseSettings } from './slide-types/video-response-slide/video-response-settings'
import { QuizSettings } from './slide-types/quiz-slide/quiz-settings'

const slideTypeLabels: Record<string, string> = {
	context: 'Context',
	video: 'Video',
	writtenResponse: 'Written Response',
	likertScale: 'Likert Scale',
	knowledgeTest: 'Knowledge Test',
	videoResponse: 'Video Response',
}

export function SlideSettingsRight() {
	const { slides, selectedSlideId, updateSlide } = useBuilder()
	const activeSlide = slides.find((slide) => slide.id === selectedSlideId)
	const isLikert = activeSlide?.type === 'likertScale'
	const isVideo = activeSlide?.type === 'video'
	const isTextResponse = activeSlide?.type === 'writtenResponse'
	const isVideoResponse = activeSlide?.type === 'videoResponse'
	const isKnowledgeTest = activeSlide?.type === 'knowledgeTest'

	return (
		<Card className='w-full overflow-hidden self-start'>
			<CardHeader>
				<CardTitle className='text-base'>Slide Settings</CardTitle>
				<p className='text-sm text-muted-foreground'>
					Choose type and basic options.
				</p>
			</CardHeader>
			<CardContent className='space-y-4'>
				<div className='space-y-2'>
					<Label>Slide Type</Label>
					<Select
						value={activeSlide?.type ?? 'context'}
						disabled
					>
						<SelectTrigger className='w-full'>
							<SelectValue
								placeholder={slideTypeLabels.context}
							/>
						</SelectTrigger>
						<SelectContent>
							{Object.entries(slideTypeLabels).map(
								([value, label]) => (
									<SelectItem key={value} value={value}>
										{label}
									</SelectItem>
								),
							)}
						</SelectContent>
					</Select>
				</div>

				{activeSlide && isLikert && (
					<LikertScaleSettings
						slide={activeSlide}
						onUpdateSlide={(updates) =>
							updateSlide(activeSlide.id, updates)
						}
					/>
				)}
				{activeSlide && isVideo && (
					<VideoUploadSettings
						slide={activeSlide}
						onUpdateSlide={(updates) =>
							updateSlide(activeSlide.id, updates)
						}
					/>
				)}
				{activeSlide && isTextResponse && (
					<TextResponseSettings
						slide={activeSlide}
						onUpdateSlide={(updates) =>
							updateSlide(activeSlide.id, updates)
						}
					/>
				)}
				{activeSlide && isVideoResponse && (
					<VideoResponseSettings
						slide={activeSlide}
						onUpdateSlide={(updates) =>
							updateSlide(activeSlide.id, updates)
						}
					/>
				)}
				{activeSlide && isKnowledgeTest && (
					<QuizSettings
						slide={activeSlide}
						onUpdateSlide={(updates) =>
							updateSlide(activeSlide.id, updates)
						}
					/>
				)}
				{!isLikert &&
					!isVideo &&
					!isTextResponse &&
					!isVideoResponse &&
					!isKnowledgeTest && (
					<div className='rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground'>
						Additional settings placeholder
					</div>
				)}
			</CardContent>
		</Card>
	)
}

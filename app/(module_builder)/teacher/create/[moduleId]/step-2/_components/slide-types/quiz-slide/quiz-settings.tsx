'use client'

import { Toggle } from '@/components/ui/toggle'
import type { SlideDraft } from '../../../../types'

type QuizSettingsProps = {
	slide: SlideDraft
	onUpdateSlide: (updates: Partial<SlideDraft>) => void
}

export function QuizSettings({ slide, onUpdateSlide }: QuizSettingsProps) {
	const requiredSlide = Boolean(slide.settings?.requiredSlide)
	const allowMultipleCorrect = Boolean(
		slide.settings?.allowMultipleCorrect,
	)
	const shuffleOptions = Boolean(slide.settings?.shuffleOptions)

	const updateSettings = (updates: Record<string, unknown>) =>
		onUpdateSlide({
			settings: {
				...slide.settings,
				...updates,
			},
		})

	return (
		<div className='space-y-3'>
			<div className='flex items-center justify-between rounded-lg border bg-muted/10 px-3 py-2'>
				<span className='text-sm font-medium'>Required Slide</span>
				<Toggle
					pressed={requiredSlide}
					onPressedChange={(value) =>
						updateSettings({ requiredSlide: value })
					}
					variant='outline'
					className='min-w-16'
				>
					{requiredSlide ? 'On' : 'Off'}
				</Toggle>
			</div>
			<div className='flex items-center justify-between rounded-lg border bg-muted/10 px-3 py-2'>
				<span className='text-sm font-medium'>
					Allow multiple correct answers
				</span>
				<Toggle
					pressed={allowMultipleCorrect}
					onPressedChange={(value) =>
						updateSettings({ allowMultipleCorrect: value })
					}
					variant='outline'
					className='min-w-16'
				>
					{allowMultipleCorrect ? 'On' : 'Off'}
				</Toggle>
			</div>
			<div className='flex items-center justify-between rounded-lg border bg-muted/10 px-3 py-2'>
				<span className='text-sm font-medium'>Shuffle options</span>
				<Toggle
					pressed={shuffleOptions}
					onPressedChange={(value) =>
						updateSettings({ shuffleOptions: value })
					}
					variant='outline'
					className='min-w-16'
				>
					{shuffleOptions ? 'On' : 'Off'}
				</Toggle>
			</div>
		</div>
	)
}


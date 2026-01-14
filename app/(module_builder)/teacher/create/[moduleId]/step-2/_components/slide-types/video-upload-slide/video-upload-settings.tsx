'use client'

import { Toggle } from '@/components/ui/toggle'
import type { SlideDraft } from '../../../../types'

type VideoUploadSettingsProps = {
	slide: SlideDraft
	onUpdateSlide: (updates: Partial<SlideDraft>) => void
}

export function VideoUploadSettings({
	slide,
	onUpdateSlide,
}: VideoUploadSettingsProps) {
	const requiredToWatch = Boolean(slide.settings?.requiredToWatch)
	const replayVideo = Boolean(slide.settings?.replayVideo)

	return (
		<div className='space-y-3'>
			<div className='flex items-center justify-between rounded-lg border bg-muted/10 px-3 py-2'>
				<span className='text-sm font-medium'>Required to watch</span>
				<Toggle
					pressed={requiredToWatch}
					onPressedChange={(value) =>
						onUpdateSlide({
							settings: {
								...slide.settings,
								requiredToWatch: value,
							},
						})
					}
					variant='outline'
					className='min-w-16'
				>
					{requiredToWatch ? 'On' : 'Off'}
				</Toggle>
			</div>
			<div className='flex items-center justify-between rounded-lg border bg-muted/10 px-3 py-2'>
				<span className='text-sm font-medium'>Replay Video</span>
				<Toggle
					pressed={replayVideo}
					onPressedChange={(value) =>
						onUpdateSlide({
							settings: {
								...slide.settings,
								replayVideo: value,
							},
						})
					}
					variant='outline'
					className='min-w-16'
				>
					{replayVideo ? 'On' : 'Off'}
				</Toggle>
			</div>
		</div>
	)
}


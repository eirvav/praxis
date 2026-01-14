'use client'

import { Input } from '@/components/ui/input'
import { Toggle } from '@/components/ui/toggle'
import type { SlideDraft } from '../../../../types'

type TextResponseSettingsProps = {
	slide: SlideDraft
	onUpdateSlide: (updates: Partial<SlideDraft>) => void
}

export function TextResponseSettings({
	slide,
	onUpdateSlide,
}: TextResponseSettingsProps) {
	const requiredSlide = Boolean(slide.settings?.requiredSlide)
	const maxWordsEnabled = Boolean(slide.settings?.maxWordsEnabled)
	const maxWordsValue =
		typeof slide.settings?.maxWords === 'number'
			? String(slide.settings.maxWords)
			: ''

	return (
		<div className='space-y-3'>
			<div className='flex items-center justify-between rounded-lg border bg-muted/10 px-3 py-2'>
				<span className='text-sm font-medium'>Required Slide</span>
				<Toggle
					pressed={requiredSlide}
					onPressedChange={(value) =>
						onUpdateSlide({
							settings: {
								...slide.settings,
								requiredSlide: value,
							},
						})
					}
					variant='outline'
					className='min-w-16'
				>
					{requiredSlide ? 'On' : 'Off'}
				</Toggle>
			</div>
			<div className='flex items-center justify-between rounded-lg border bg-muted/10 px-3 py-2'>
				<span className='text-sm font-medium'>Max Words</span>
				<Toggle
					pressed={maxWordsEnabled}
					onPressedChange={(value) =>
						onUpdateSlide({
							settings: {
								...slide.settings,
								maxWordsEnabled: value,
							},
						})
					}
					variant='outline'
					className='min-w-16'
				>
					{maxWordsEnabled ? 'On' : 'Off'}
				</Toggle>
			</div>
			{maxWordsEnabled && (
				<div className='space-y-2 rounded-lg border bg-background px-3 py-2'>
					<span className='text-sm font-medium text-muted-foreground'>
						Max Words
					</span>
					<Input
						type='number'
						min='1'
						placeholder='e.g. 250'
						value={maxWordsValue}
						onChange={(event) => {
							const nextValue = event.target.value
							const parsed = nextValue ? Number(nextValue) : null
							onUpdateSlide({
								settings: {
									...slide.settings,
									maxWords: parsed,
								},
							})
						}}
					/>
				</div>
			)}
		</div>
	)
}


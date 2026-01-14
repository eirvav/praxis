'use client'

import { Slider } from '@/components/ui/slider'
import { Toggle } from '@/components/ui/toggle'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { SlideDraft } from '../../../../types'

type VideoResponseSettingsProps = {
	slide: SlideDraft
	onUpdateSlide: (updates: Partial<SlideDraft>) => void
}

const MIN_DURATION = 10
const MAX_DURATION = 600
const STEP = 30

function formatDuration(seconds: number) {
	const minutes = Math.floor(seconds / 60)
	const remaining = seconds % 60
	const paddedSeconds = String(remaining).padStart(2, '0')

	if (minutes <= 0) return `${remaining}s`
	return `${minutes}m ${paddedSeconds}s`
}

export function VideoResponseSettings({
	slide,
	onUpdateSlide,
}: VideoResponseSettingsProps) {
	const requiredSlide = Boolean(slide.settings?.requiredSlide)
	const allowMultipleResponses = Boolean(
		slide.settings?.allowMultipleResponses,
	)
	const maxResponses =
		typeof slide.settings?.maxResponses === 'number'
			? String(slide.settings.maxResponses)
			: ''
	const maxDurationSeconds =
		typeof slide.settings?.maxDurationSeconds === 'number'
			? slide.settings.maxDurationSeconds
			: 120
	const clampedDuration = Math.min(
		MAX_DURATION,
		Math.max(MIN_DURATION, maxDurationSeconds),
	)

	const updateSettings = (updates: Record<string, unknown>) =>
		onUpdateSlide({
			settings: {
				...slide.settings,
				...updates,
			},
		})

	return (
		<div className='space-y-4'>
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

			<div className='space-y-3 rounded-lg border bg-muted/10 px-3 py-3'>
				<div className='flex items-start justify-between gap-3'>
					<div className='space-y-1'>
						<p className='text-sm font-medium'>
							Allow multiple responses
						</p>
						<p className='text-xs text-muted-foreground'>
							If enabled, students can submit multiple responses
						</p>
					</div>
					<Toggle
						pressed={allowMultipleResponses}
						onPressedChange={(value) =>
							updateSettings({ allowMultipleResponses: value })
						}
						variant='outline'
						className='min-w-16'
					>
						{allowMultipleResponses ? 'On' : 'Off'}
					</Toggle>
				</div>
				{allowMultipleResponses && (
					<div className='space-y-2 rounded-lg border bg-background px-3 py-2'>
						<div className='space-y-1'>
							<span className='text-sm font-medium'>
								Maximum responses allowed
							</span>
							<Input
								type='number'
								min='1'
								className='w-full'
								placeholder='e.g. 2'
								value={maxResponses}
								onChange={(event) => {
									const nextValue = event.target.value
									const parsed = nextValue
										? Number(nextValue)
										: null
									updateSettings({ maxResponses: parsed })
								}}
							/>
							<p className='text-xs text-muted-foreground'>
								Maximum responses allowed
							</p>
						</div>
					</div>
				)}
			</div>

			<div className='space-y-3 rounded-lg border bg-muted/10 px-3 py-3'>
				<div className='flex items-start justify-between gap-3'>
					<div className='space-y-1'>
						<p className='text-sm font-medium'>
							Max response duration
						</p>
						<p className='text-xs text-muted-foreground'>
							Set the maximum length of video responses
						</p>
					</div>
					<span className='text-sm font-semibold'>
						{formatDuration(clampedDuration)}
					</span>
				</div>
				<Slider
					min={MIN_DURATION}
					max={MAX_DURATION}
					step={STEP}
					value={[clampedDuration]}
					onValueChange={(value) =>
						updateSettings({ maxDurationSeconds: value[0] })
					}
				/>
				<div className='flex items-center justify-end gap-2'>
					<Button
						type='button'
						size='sm'
						variant='outline'
						onClick={() =>
							updateSettings({
								maxDurationSeconds: Math.max(
									MIN_DURATION,
									clampedDuration - STEP,
								),
							})
						}
					>
						-30s
					</Button>
					<Button
						type='button'
						size='sm'
						variant='outline'
						onClick={() =>
							updateSettings({
								maxDurationSeconds: Math.min(
									MAX_DURATION,
									clampedDuration + STEP,
								),
							})
						}
					>
						+30s
					</Button>
				</div>
			</div>

			<div className='flex items-center justify-between rounded-lg border border-destructive/60 bg-destructive/5 px-3 py-2'>
				<div>
					<p className='text-sm font-medium text-destructive'>
						Force instant response
					</p>
				</div>
				<Toggle
					pressed={Boolean(slide.settings?.forceInstantResponse)}
					onPressedChange={(value) =>
						updateSettings({ forceInstantResponse: value })
					}
					variant='outline'
					className='min-w-16 border-destructive/60 text-destructive data-[state=on]:bg-destructive data-[state=on]:text-destructive-foreground'
				>
					{slide.settings?.forceInstantResponse ? 'On' : 'Off'}
				</Toggle>
			</div>
		</div>
	)
}


'use client'

import { AlignLeft, Camera, Info } from 'lucide-react'

import { Alert, AlertDescription } from '@/components/ui/alert'

type VideoResponseSlideProps = {
	settings: Record<string, unknown>
}

function formatDuration(seconds: number) {
	const minutes = Math.floor(seconds / 60)
	const remaining = seconds % 60
	const paddedSeconds = String(remaining).padStart(2, '0')

	if (minutes <= 0) return `${remaining}s`
	return `${minutes}m ${paddedSeconds}s`
}

function formatSummary(settings: Record<string, unknown>) {
	const requiredSlide = Boolean(settings.requiredSlide)
	const allowMultipleResponses = Boolean(settings.allowMultipleResponses)
	const maxResponses =
		typeof settings.maxResponses === 'number' ? settings.maxResponses : null
	const maxDurationSeconds =
		typeof settings.maxDurationSeconds === 'number'
			? settings.maxDurationSeconds
			: 120
	const forceInstantResponse = Boolean(settings.forceInstantResponse)

	const details = []
	details.push(requiredSlide ? 'Required slide enabled' : 'Optional response')
	if (allowMultipleResponses && maxResponses) {
		details.push(`Up to ${maxResponses} responses`)
	} else if (allowMultipleResponses) {
		details.push('Multiple responses enabled')
	}
	details.push(`Max duration ${formatDuration(maxDurationSeconds)}`)
	if (forceInstantResponse) {
		details.push('Instant response required')
	}

	return details
}

export function VideoResponseSlide({ settings }: VideoResponseSlideProps) {
	const details = formatSummary(settings)

	return (
		<div className='flex h-full flex-col gap-4'>
			<Alert className='bg-primary/5 border-primary/20'>
				<Info className='h-4 w-4' />
				<AlertDescription className='text-primary border-primary/20'>
					This slide will allow students to record and submit video
					responses. Configure the response settings in the right
					panel.
				</AlertDescription>
			</Alert>
			<div className='flex w-full flex-col items-center justify-center gap-4 rounded-md border border-dashed bg-muted/5 p-6 text-center text-sm text-muted-foreground'>
				<div className='rounded-full bg-muted p-4'>
					<Camera className='size-6 text-muted-foreground' />
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
					<div className='flex items-center gap-2'>
						<AlignLeft className='size-4 text-muted-foreground' />
						<span className='text-sm font-medium'>
							Current response settings
						</span>
					</div>
					<ul className='mt-3 space-y-1 text-sm text-muted-foreground'>
						{details.map((detail) => (
							<li key={detail}>• {detail}</li>
						))}
					</ul>
				</div>
			</div>
		</div>
	)
}


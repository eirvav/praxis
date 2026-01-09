'use client'

import { IconArrowLeft, IconArrowRight, IconX } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'

interface BuilderHeaderProps {
	moduleTitle: string | null
	hasModuleTitle: boolean
	stepIndex: number
	stepLabels: string[]
	isPublishing: boolean
	onExit: () => void
	onBack?: () => void
	onNext?: () => void
	onPublish?: () => void
}

export function BuilderHeader({
	moduleTitle,
	hasModuleTitle,
	stepIndex,
	stepLabels,
	isPublishing,
	onExit,
	onBack,
	onNext,
	onPublish,
}: BuilderHeaderProps) {
	const clampedIndex = Math.max(0, Math.min(stepIndex, stepLabels.length - 1))
	const stepNumber = clampedIndex + 1
	const stepName = stepLabels[clampedIndex] ?? 'Module Overview'
	const progressPercent =
		stepLabels.length === 0
			? 0
			: ((clampedIndex + 1) / stepLabels.length) * 100

	const titleText =
		clampedIndex > 0 && hasModuleTitle && moduleTitle
			? moduleTitle
			: 'Create Module'

	return (
		<header className='sticky top-0 z-30 border-b bg-background/95 backdrop-blur'>
			<div className='relative flex items-center justify-between gap-4 px-4 py-3 md:px-6'>
				<div className='flex min-w-0 items-center gap-2 text-sm font-medium'>
					<button
						type='button'
						onClick={onExit}
						className='flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted'
						aria-label='Exit to dashboard'
					>
						<IconX className='size-4' />
					</button>
					<span className='truncate text-base font-semibold'>
						{titleText}
					</span>
				</div>

				<div className='pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center md:text-base'>
					<span className='font-semibold'>{`Step ${stepNumber}: `}</span>
					<span className='font-normal text-sm md:text-base'>
						{stepName}
					</span>
				</div>

				<div className='flex min-w-[180px] flex-col items-end gap-1 text-xs text-muted-foreground'>
					<div className='flex items-center gap-2'>
						{onBack ? (
							<Button
								size='default'
								variant='outline'
								onClick={onBack}
							>
								<IconArrowLeft className='size-4' />
								Back
							</Button>
						) : null}
						{onNext ? (
							<Button
								size='default'
								onClick={onNext}
								data-variant='primary'
							>
								Next Step <IconArrowRight className='size-4' />
							</Button>
						) : null}
						{onPublish ? (
							<Button
								size='default'
								onClick={onPublish}
								disabled={isPublishing}
							>
								{isPublishing ? 'Publishing…' : 'Publish Module'}
							</Button>
						) : null}
					</div>
				</div>
			</div>
			<div className='h-1 w-full bg-muted'>
				<div
					className='h-full bg-primary transition-[width] duration-500'
					style={{ width: `${progressPercent}%` }}
				/>
			</div>
		</header>
	)
}


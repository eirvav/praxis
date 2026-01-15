'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useMemo, useTransition, type ReactNode } from 'react'
import { toast } from 'sonner'

import { publishModuleAction } from '../actions'
import { uploadPendingVideos } from '../publish-upload'
import { validateSlidesForPublish } from '../publish-validation'
import { BuilderHeader } from './builder-header'
import { useBuilder } from './builder-context'
import { Toaster } from '@/components/ui/sonner'

const steps = [
	{
		segment: 'step-1',
		label: 'Module Overview',
	},
	{
		segment: 'step-2',
		label: 'Add Content',
	},
	{
		segment: 'step-3',
		label: 'Review & Publish',
	},
]

export function BuilderShell({
	moduleId,
	children,
}: {
	moduleId: string
	children: ReactNode
}) {
	const router = useRouter()
	const pathname = usePathname()
	const {
		module,
		slides,
		setLastSyncedAt,
		getPendingVideoFile,
		clearPendingVideoFiles,
		hasActiveVideoUploads,
	} = useBuilder()

	const currentIndex = useMemo(() => {
		if (!pathname) return 0
		const found = steps.findIndex((step) =>
			pathname.includes(step.segment),
		)
		return found === -1 ? 0 : found
	}, [pathname])

	const [isPublishing, startPublishing] = useTransition()

	const goToStep = (index: number) => {
		const clamped = Math.min(Math.max(index, 0), steps.length - 1)
		const target = steps[clamped]?.segment ?? 'step-1'
		router.push(`/teacher/create/${moduleId}/${target}`)
	}

	const handlePublish = () => {
		startPublishing(async () => {
			if (hasActiveVideoUploads) {
				toast.error('Wait for video uploads to finish before publishing.')
				return
			}

			if (!module.title) {
				toast.error('Add a title before publishing')
				return
			}

			const issues = validateSlidesForPublish(
				slides,
				(slideId) => Boolean(getPendingVideoFile(slideId)),
			)
			if (issues.length > 0) {
				toast.error(issues[0]?.message ?? 'Slides are incomplete.')
				return
			}

			let updatedSlides = slides
			try {
				updatedSlides = await uploadPendingVideos({
					moduleId,
					slides,
					getPendingVideoFile,
				})
			} catch (uploadError) {
				const message =
					uploadError instanceof Error
						? uploadError.message
						: 'Video upload failed.'
				toast.error(message)
				return
			}

			const result = await publishModuleAction({
				moduleId,
				module,
				slides: updatedSlides,
			})

			if (!result.ok) {
				toast.error(result.message ?? 'Could not publish module')
				return
			}

			setLastSyncedAt(result.publishAt)
			clearPendingVideoFiles()
			toast.success('Module published')
			router.push('/teacher')
		})
	}

	return (
		<div className='min-h-screen text-foreground'>
			<Toaster position='bottom-right' />
			<BuilderHeader
				moduleTitle={module.title}
				hasModuleTitle={Boolean(module.title)}
				stepIndex={currentIndex}
				stepLabels={steps.map((step) => step.label)}
				isPublishing={isPublishing}
				onExit={() => router.push('/teacher')}
				onBack={
					currentIndex > 0 ? () => goToStep(currentIndex - 1) : undefined
				}
				onNext={
					currentIndex < steps.length - 1
						? () => goToStep(currentIndex + 1)
						: undefined
				}
				onPublish={
					currentIndex === steps.length - 1 ? handlePublish : undefined
				}
			/>
			<main className='w-full px-2 pt-6 pb-6 md:px-4 lg:px-6 overflow-hidden'>
				{children}
			</main>
		</div>
	)
}


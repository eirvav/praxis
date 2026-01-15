'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { publishModuleAction } from '../actions'
import { useBuilder } from '../_components/builder-context'
import { uploadPendingVideos } from '../publish-upload'
import { validateSlidesForPublish } from '../publish-validation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { IconArrowLeft } from '@tabler/icons-react'
import { SlideReview } from './_components/slide-review'
export default function ReviewPublishPage() {
	const {
		moduleId,
		module,
		slides,
		setLastSyncedAt,
		getPendingVideoFile,
		clearPendingVideoFiles,
	} = useBuilder()
	const router = useRouter()

	const [isPublishing, startPublishing] = useTransition()
	const [error, setError] = useState<string | null>(null)
	const [success, setSuccess] = useState<string | null>(null)

	async function handlePublish() {
		setError(null)
		setSuccess(null)

		if (!module.title) {
			setError('Add a title before publishing')
			return
		}

		startPublishing(async () => {
			const issues = validateSlidesForPublish(
				slides,
				(slideId) => Boolean(getPendingVideoFile(slideId)),
			)
			if (issues.length > 0) {
				setError(issues[0]?.message ?? 'Slides are incomplete.')
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
				setError(message)
				return
			}

			const result = await publishModuleAction({
				moduleId,
				module,
				slides: updatedSlides,
			})

			if (!result.ok) {
				setError(result.message ?? 'Could not publish module')
				return
			}

			setLastSyncedAt(result.publishAt)
			clearPendingVideoFiles()
			setSuccess('Published and saved')
			router.push('/teacher')
		})
	}

	return (
		<div className='mx-auto w-full max-w-4xl lg:w-3/5 space-y-6'>
			<Card>
				<CardHeader>
					<CardTitle className='text-2xl'>
						Review & publish
					</CardTitle>
					<p className='text-sm text-muted-foreground'>
						Confirm module details and preview the student view.
					</p>
				</CardHeader>
				<CardContent className='space-y-4'>
					<div className='grid grid-cols-1 gap-4'>
						<div className='rounded-md border bg-muted/10 p-4'>
							<h3 className='text-sm font-semibold'>
								Module summary
							</h3>
							<dl className='mt-3 space-y-2 text-sm'>
								<div className='flex justify-between gap-2'>
									<dt className='text-muted-foreground'>
										Title
									</dt>
									<dd className='text-right'>
										{module.title || 'Untitled'}
									</dd>
								</div>
								<div className='flex justify-between gap-2'>
									<dt className='text-muted-foreground'>
										Course
									</dt>
									<dd className='text-right'>
										{module.courseId || 'Not set'}
									</dd>
								</div>
								<div className='flex justify-between gap-2'>
									<dt className='text-muted-foreground'>
										Deadline
									</dt>
									<dd className='text-right'>
										{module.deadlineAt || 'No deadline'}
									</dd>
								</div>
								<div>
									<dt className='text-muted-foreground'>
										Description
									</dt>
									<dd className='mt-1 whitespace-pre-wrap'>
										{module.description || 'No description'}
									</dd>
								</div>
							</dl>
						</div>
						<SlideReview slides={slides} />
					</div>

					<Separator />

					{error ? (
						<div className='rounded-md border border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive'>
							{error}
						</div>
					) : null}
					{success ? (
						<div className='rounded-md border border-emerald-500 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700'>
							{success}
						</div>
					) : null}

					<div className='flex items-center justify-between gap-3'>
						<Button variant='outline' asChild>
							<Link
								href={`/teacher/create/${moduleId}/step-2`}
							>
								<IconArrowLeft className='size-4' />
								Back to Step 2
							</Link>
						</Button>
						<div className='flex gap-2'>
							<Button
								onClick={handlePublish}
								disabled={isPublishing}
							>
								{isPublishing
									? 'Publishing…'
									: 'Publish Module'}
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}

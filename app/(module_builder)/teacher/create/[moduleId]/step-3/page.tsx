'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'

import { publishModuleAction } from '../actions'
import { useBuilder } from '../_components/builder-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export default function ReviewPublishPage() {
	const { moduleId, module, slides, setLastSyncedAt } =
		useBuilder()
	const router = useRouter()

	const [isPublishing, startPublishing] = useTransition()
	const [error, setError] = useState<string | null>(null)
	const [success, setSuccess] = useState<string | null>(null)

	const previewSlide = useMemo(
		() => slides[0],
		[slides],
	)

	async function handlePublish() {
		setError(null)
		setSuccess(null)

		if (!module.title) {
			setError('Add a title before publishing')
			return
		}

		startPublishing(async () => {
			const result = await publishModuleAction({
				moduleId,
				module,
				slides,
			})

			if (!result.ok) {
				setError(result.message ?? 'Could not publish module')
				return
			}

			setLastSyncedAt(result.publishAt)
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
						<div className='rounded-md border bg-muted/10 p-4'>
							<h3 className='text-sm font-semibold'>
								Slides ({slides.length})
							</h3>
							<div className='mt-3 flex flex-col gap-2 text-sm'>
								{slides.length === 0 ? (
									<p className='text-muted-foreground'>
										No slides added yet.
									</p>
								) : (
									slides.map((slide) => (
										<div
											key={slide.id}
											className='flex items-center justify-between rounded-md border bg-background px-3 py-2'
										>
											<div>
												<div className='text-xs text-muted-foreground'>
													#{slide.position} ·{' '}
													{slide.type}
												</div>
												<div className='font-medium'>
													{slide.title ||
														'Untitled'}
												</div>
											</div>
											<div className='text-xs text-muted-foreground'>
												{slide.settings?.visible ===
												false
													? 'Hidden'
													: 'Visible'}
											</div>
										</div>
									))
								)}
							</div>
						</div>
					</div>

					<Separator />

					<div className='space-y-3 rounded-md border bg-background p-4'>
						<h3 className='text-sm font-semibold'>
							Student preview
						</h3>
						{previewSlide ? (
							<div className='space-y-2 rounded-md border bg-muted/10 p-4'>
								<div className='text-xs text-muted-foreground'>
									Slide #{previewSlide.position}
								</div>
								<div className='text-lg font-semibold'>
									{previewSlide.title || 'Untitled'}
								</div>
								<p className='whitespace-pre-wrap text-sm'>
									{previewSlide.content?.body ||
										'No content yet.'}
								</p>
							</div>
						) : (
							<p className='text-sm text-muted-foreground'>
								Add a slide to preview how students will see it.
							</p>
						)}
					</div>

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
								Back to Step 2
							</Link>
						</Button>
						<div className='flex gap-2'>
							<Button
								variant='secondary'
								asChild
							>
								<Link href='/teacher'>
									Return to teacher home
								</Link>
							</Button>
							<Button
								onClick={handlePublish}
								disabled={isPublishing}
							>
								{isPublishing
									? 'Publishing…'
									: 'Publish now'}
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}

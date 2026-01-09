'use client'

import Link from 'next/link'
import {
	type ChangeEvent,
	useState,
	useTransition,
} from 'react'
import { z } from 'zod'

import { saveModuleAction } from '../actions'
import { useBuilder } from '../_components/builder-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const moduleFormSchema = z.object({
	title: z.string().min(1, 'Title is required'),
	description: z.string().optional(),
	courseId: z.string().optional(),
	deadlineAt: z.string().optional(),
})

export default function ModuleOverviewPage() {
	const {
		moduleId,
		module,
		updateModule,
		setLastSyncedAt,
	} = useBuilder()

	const [error, setError] = useState<string | null>(null)
	const [success, setSuccess] = useState<string | null>(null)
	const [isSaving, startSaving] = useTransition()

	async function handleSave() {
		setError(null)
		setSuccess(null)

		const parsed = moduleFormSchema.safeParse({
			title: module.title,
			description: module.description,
			courseId: module.courseId,
			deadlineAt: module.deadlineAt ?? undefined,
		})

		if (!parsed.success) {
			setError(parsed.error.issues[0]?.message ?? 'Invalid data')
			return
		}

		startSaving(async () => {
			const result = await saveModuleAction({
				moduleId,
				title: parsed.data.title,
				description: parsed.data.description ?? '',
				courseId: parsed.data.courseId ?? '',
				deadlineAt: parsed.data.deadlineAt ?? null,
			})

			if (!result.ok) {
				setError(result.message ?? 'Could not save module')
				return
			}

			setLastSyncedAt(new Date().toISOString())
			setSuccess('Saved')
		})
	}

	return (
		<div className='mx-auto w-full max-w-4xl lg:w-3/5'>
			<Card>
				<CardHeader>
					<CardTitle className='text-2xl'>
						Module overview
					</CardTitle>
					<p className='text-sm text-muted-foreground'>
						Title, timeline, course, and description live here.
					</p>
				</CardHeader>
				<CardContent className='space-y-6'>
					<div className='space-y-2'>
						<Label htmlFor='title'>Title</Label>
						<Input
							id='title'
							placeholder='Foundations of AI'
							value={module.title}
							onChange={(event: ChangeEvent<HTMLInputElement>) =>
								updateModule({
									title: event.target.value,
								})
							}
						/>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='course'>Course</Label>
						<Input
							id='course'
							placeholder='Course identifier or name'
							value={module.courseId}
							onChange={(event: ChangeEvent<HTMLInputElement>) =>
								updateModule({
									courseId: event.target.value,
								})
							}
						/>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='deadline'>Deadline</Label>
						<Input
							id='deadline'
							type='date'
							value={module.deadlineAt ?? ''}
							onChange={(event: ChangeEvent<HTMLInputElement>) =>
								updateModule({
									deadlineAt: event.target.value || null,
								})
							}
						/>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='description'>Description</Label>
						<Textarea
							id='description'
							rows={4}
							placeholder='Explain the goal of this module'
							value={module.description}
							onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
								updateModule({
									description: event.target.value,
								})
							}
						/>
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

					<div className='flex items-center justify-between gap-3 pt-2'>
						<Button
							type='button'
							variant='outline'
							asChild
						>
							<Link
								href={`/teacher/create/${moduleId}/step-2`}
							>
								Continue to Step 2
							</Link>
						</Button>
						<Button
							type='button'
							onClick={handleSave}
							disabled={isSaving}
						>
							{isSaving ? 'Saving…' : 'Save overview'}
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}

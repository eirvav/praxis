'use server'

import { z } from 'zod'

import { getUserWithRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

import type {
	ModuleDraft,
	SlideDraft,
} from './types'

const moduleSchema = z.object({
	moduleId: z.string().uuid(),
	title: z.string().min(1, 'Title is required'),
	description: z.string().nullable().optional(),
	courseId: z.string().nullable().optional(),
	deadlineAt: z.string().nullable().optional(),
})

const likertSliderSchema = z.object({
	id: z.string().uuid(),
	question: z.string().default(''),
	labels: z
		.object({
			left: z.string().default('Not at all'),
			middle: z.string().default('Somewhat'),
			right: z.string().default('Very much'),
		})
		.default({
			left: 'Not at all',
			middle: 'Somewhat',
			right: 'Very much',
		}),
	min: z.number().int().min(0).max(9).default(0),
	max: z.number().int().min(1).max(10).default(5),
})

const quizOptionSchema = z.object({
	id: z.string(),
	text: z.string().default(''),
	isCorrect: z.boolean().default(false),
})

const slideSchema = z.object({
	id: z.string().uuid(),
	position: z.number().int().positive(),
	type: z.enum([
		'context',
		'video',
		'writtenResponse',
		'likertScale',
		'videoResponse',
		'knowledgeTest',
	]),
	title: z.string().default(''),
	content: z
		.object({
			body: z.string().nullable().optional(),
			videoTitle: z.string().nullable().optional(),
			videoContext: z.string().nullable().optional(),
			videoUrl: z.string().nullable().optional(),
			question: z.string().nullable().optional(),
			description: z.string().nullable().optional(),
			sliders: z.array(likertSliderSchema).optional(),
			options: z.array(quizOptionSchema).optional(),
		})
		.passthrough()
		.default({ body: '' }),
	settings: z.record(z.string(), z.any()).default({}),
})

const slidesSchema = z.array(slideSchema)

async function assertTeacher() {
	const user = await getUserWithRole()
	if (user.role !== 'teacher' && user.role !== 'admin') {
		throw new Error('Only teachers can edit modules')
	}
	return user
}

async function upsertModule({
	userId,
	moduleId,
	payload,
	publishAt,
}: {
	userId: string
	moduleId: string
	payload: ModuleDraft
	publishAt?: string | null
}) {
	const supabase = await createClient()
	const data = {
		id: moduleId,
		teacher_id: userId,
		title: payload.title,
		description: payload.description ?? null,
		course_id: payload.courseId || null,
		deadline_at: payload.deadlineAt || null,
		publish_at: publishAt ?? payload.publishAt ?? null,
		updated_at: new Date().toISOString(),
	}

	const { error } = await supabase
		.from('modules')
		.upsert(data, { onConflict: 'id' })

	if (error) {
		return { ok: false as const, message: error.message }
	}

	return { ok: true as const }
}

async function replaceSlides({
	moduleId,
	slides,
}: {
	moduleId: string
	slides: SlideDraft[]
}) {
	const supabase = await createClient()

	const { error: deleteErr } = await supabase
		.from('slides')
		.delete()
		.eq('module_id', moduleId)

	if (deleteErr) {
		return { ok: false as const, message: deleteErr.message }
	}

	if (!slides.length) {
		return { ok: true as const }
	}

	const rows = slides.map((slide) => ({
		id: slide.id,
		module_id: moduleId,
		position: slide.position,
		type: slide.type,
		title: slide.title ?? null,
		content: slide.content ?? {},
		settings: slide.settings ?? {},
		updated_at: new Date().toISOString(),
	}))

	const { error: insertErr } = await supabase
		.from('slides')
		.insert(rows)

	if (insertErr) {
		return { ok: false as const, message: insertErr.message }
	}

	return { ok: true as const }
}

function normalizeSlides(input: z.infer<typeof slidesSchema>): SlideDraft[] {
	return input.map((slide, idx) => ({
		id: slide.id,
		position: slide.position ?? idx + 1,
		type: slide.type,
		title: slide.title ?? '',
		content: {
			...slide.content,
			body: slide.content?.body ?? '',
			description: slide.content?.description ?? '',
			sliders:
				slide.type === 'likertScale'
					? (slide.content?.sliders ?? []).map((slider) => ({
							...slider,
							labels: {
								left:
									slider.labels?.left ?? 'Not at all',
								middle:
									slider.labels?.middle ?? 'Somewhat',
								right:
									slider.labels?.right ?? 'Very much',
							},
							min: slider.min ?? 0,
							max: slider.max ?? 5,
						}))
					: slide.content?.sliders,
			options:
				slide.type === 'knowledgeTest'
					? (slide.content?.options ?? []).map((option) => ({
							id: option.id,
							text: option.text ?? '',
							isCorrect: Boolean(option.isCorrect),
						}))
					: slide.content?.options,
		},
		settings: slide.settings ?? {},
	}))
}

export async function saveModuleAction(input: {
	moduleId: string
	title: string
	description?: string | null
	courseId?: string | null
	deadlineAt?: string | null
}) {
	try {
		const user = await assertTeacher()

		const parsed = moduleSchema.parse({
			...input,
			description: input.description ?? null,
			courseId: input.courseId ?? null,
			deadlineAt: input.deadlineAt ?? null,
		})

		const result = await upsertModule({
			userId: user.id,
			moduleId: parsed.moduleId,
			payload: {
				title: parsed.title,
				description: parsed.description ?? '',
				courseId: parsed.courseId ?? '',
				deadlineAt: parsed.deadlineAt ?? null,
				publishAt: null,
			},
		})

		if (!result.ok) {
			return { ok: false as const, message: result.message }
		}

		return { ok: true as const }
	} catch (error) {
		const message =
			error instanceof Error ? error.message : 'Failed to save module'
		return { ok: false as const, message }
	}
}

export async function saveSlidesAction(input: {
	moduleId: string
	slides: SlideDraft[]
}) {
	await assertTeacher()

	const parsedSlides = slidesSchema.parse(input.slides)
	const slides = normalizeSlides(parsedSlides)

	const supabase = await createClient()
	const { data: moduleRow, error: moduleErr } = await supabase
		.from('modules')
		.select('id')
		.eq('id', input.moduleId)
		.maybeSingle()

	if (moduleErr && moduleErr.code !== 'PGRST116') {
		throw moduleErr
	}

	if (!moduleRow) {
		return {
			ok: false as const,
			message: 'Save the overview first before adding slides.',
		}
	}

	const replaceResult = await replaceSlides({
		moduleId: input.moduleId,
		slides,
	})

	if (!replaceResult.ok) {
		return replaceResult
	}

	return { ok: true as const }
}

export async function publishModuleAction(input: {
	moduleId: string
	module: ModuleDraft
	slides: SlideDraft[]
}) {
	const user = await assertTeacher()

	const parsedModule = moduleSchema.parse({
		moduleId: input.moduleId,
		title: input.module.title,
		description: input.module.description ?? null,
		courseId: input.module.courseId ?? null,
		deadlineAt: input.module.deadlineAt ?? null,
	})

	const parsedSlides = slidesSchema.parse(input.slides)
	const slides = normalizeSlides(parsedSlides)
	const publishAt = new Date().toISOString()

	await upsertModule({
		userId: user.id,
		moduleId: parsedModule.moduleId,
		payload: {
			title: parsedModule.title,
			description: parsedModule.description ?? '',
			courseId: parsedModule.courseId ?? '',
			deadlineAt: parsedModule.deadlineAt ?? null,
			publishAt,
		},
		publishAt,
	})

	const replaceResult = await replaceSlides({
		moduleId: input.moduleId,
		slides,
	})

	if (!replaceResult.ok) {
		return replaceResult
	}

	return { ok: true as const, publishAt }
}


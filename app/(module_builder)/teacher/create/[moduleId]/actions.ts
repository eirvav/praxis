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
			videoPath: z.string().nullable().optional(),
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

const MAX_VIDEO_DURATION = 600
const MIN_VIDEO_DURATION = 10

function isTemporaryVideoUrl(url?: string | null) {
	if (!url) return false
	return url.startsWith('blob:') || url.startsWith('data:')
}

function extractLexicalText(rawContent?: string | null) {
	if (!rawContent) return ''
	const trimmed = rawContent.trim()
	if (!trimmed) return ''

	try {
		const parsed = JSON.parse(trimmed)
		const output: string[] = []

		const walk = (node: Record<string, unknown>) => {
			if (typeof node.text === 'string') {
				output.push(node.text)
			}
			if (Array.isArray(node.children)) {
				node.children.forEach((child) => {
					if (child && typeof child === 'object') {
						walk(child as Record<string, unknown>)
					}
				})
			}
		}

		if (parsed && typeof parsed === 'object') {
			const rootNode =
				parsed && typeof parsed === 'object' && 'root' in parsed
					? (parsed as { root?: Record<string, unknown> }).root
					: (parsed as Record<string, unknown>)
			if (rootNode && typeof rootNode === 'object') {
				walk(rootNode)
			}
		}

		return output.join(' ').trim()
	} catch {
		return trimmed
	}
}

function normalizeSettings(slide: SlideDraft): SlideDraft['settings'] {
	if (slide.type === 'video') {
		return {
			requiredToWatch: Boolean(slide.settings?.requiredToWatch),
			replayVideo: Boolean(slide.settings?.replayVideo),
		}
	}

	if (slide.type === 'writtenResponse') {
		return {
			requiredSlide: Boolean(slide.settings?.requiredSlide),
			maxWordsEnabled: Boolean(slide.settings?.maxWordsEnabled),
			maxWords:
				typeof slide.settings?.maxWords === 'number'
					? slide.settings.maxWords
					: null,
		}
	}

	if (slide.type === 'videoResponse') {
		const maxDurationSeconds =
			typeof slide.settings?.maxDurationSeconds === 'number'
				? slide.settings.maxDurationSeconds
				: 120
		return {
			requiredSlide: Boolean(slide.settings?.requiredSlide),
			allowMultipleResponses: Boolean(
				slide.settings?.allowMultipleResponses,
			),
			maxResponses:
				typeof slide.settings?.maxResponses === 'number'
					? slide.settings.maxResponses
					: null,
			maxDurationSeconds: Math.min(
				MAX_VIDEO_DURATION,
				Math.max(MIN_VIDEO_DURATION, maxDurationSeconds),
			),
			forceInstantResponse: Boolean(
				slide.settings?.forceInstantResponse,
			),
		}
	}

	if (slide.type === 'knowledgeTest') {
		return {
			requiredSlide: Boolean(slide.settings?.requiredSlide),
			allowMultipleCorrect: Boolean(
				slide.settings?.allowMultipleCorrect,
			),
			shuffleOptions: Boolean(slide.settings?.shuffleOptions),
		}
	}

	if (slide.type === 'likertScale') {
		const activeSliderId =
			typeof slide.settings?.activeSliderId === 'string'
				? slide.settings.activeSliderId
				: null
		return activeSliderId ? { activeSliderId } : {}
	}

	return slide.settings ?? {}
}

function normalizeContent(slide: SlideDraft): SlideDraft['content'] {
	// Helper to convert null to undefined for string properties
	const str = (val: string | null | undefined): string | undefined => {
		return val === null ? undefined : val
	}

	if (slide.type === 'video') {
		return {
			videoTitle: str(slide.content?.videoTitle) ?? '',
			videoContext: str(slide.content?.videoContext) ?? '',
			videoUrl: isTemporaryVideoUrl(slide.content?.videoUrl)
				? ''
				: str(slide.content?.videoUrl) ?? '',
			videoPath: str(slide.content?.videoPath) ?? '',
		}
	}

	if (slide.type === 'writtenResponse') {
		return {
			question: str(slide.content?.question) ?? '',
		}
	}

	if (slide.type === 'likertScale') {
		return {
			description: str(slide.content?.description) ?? '',
			sliders: slide.content?.sliders ?? [],
		}
	}

	if (slide.type === 'videoResponse') {
		return {
			question: str(slide.content?.question) ?? '',
		}
	}

	if (slide.type === 'knowledgeTest') {
		return {
			description: str(slide.content?.description) ?? '',
			question: str(slide.content?.question) ?? '',
			options: slide.content?.options ?? [],
		}
	}

	return {
		body: str(slide.content?.body) ?? '',
	}
}

function validateSlidesForPublish(slides: SlideDraft[]) {
	const issues: string[] = []

	slides.forEach((slide) => {
		if (slide.type === 'context') {
			const text = extractLexicalText(slide.content?.body)
			if (!text) issues.push(`Context slide ${slide.position} is empty.`)
		}

		if (slide.type === 'writtenResponse') {
			const text = extractLexicalText(slide.content?.question)
			if (!text) {
				issues.push(
					`Written response slide ${slide.position} is missing a question.`,
				)
			}
			if (
				slide.settings?.maxWordsEnabled &&
				typeof slide.settings?.maxWords !== 'number'
			) {
				issues.push(
					`Written response slide ${slide.position} needs a max word count.`,
				)
			}
		}

		if (slide.type === 'video') {
			if (!slide.content?.videoTitle?.trim()) {
				issues.push(
					`Video slide ${slide.position} is missing a title.`,
				)
			}
			if (!slide.content?.videoPath?.trim()) {
				issues.push(
					`Video slide ${slide.position} is missing an uploaded video.`,
				)
			}
		}

		if (slide.type === 'likertScale') {
			const sliders = slide.content?.sliders ?? []
			if (!sliders.length) {
				issues.push(
					`Likert scale slide ${slide.position} needs at least one slider.`,
				)
			}
			const activeSliderId =
				typeof slide.settings?.activeSliderId === 'string'
					? slide.settings.activeSliderId
					: null
			if (
				activeSliderId &&
				!sliders.some((slider) => slider.id === activeSliderId)
			) {
				issues.push(
					`Likert scale slide ${slide.position} needs a valid active slider.`,
				)
			}
			sliders.forEach((slider, index) => {
				if (!slider.question?.trim()) {
					issues.push(
						`Likert scale slide ${slide.position} slider ${
							index + 1
						} is missing a question.`,
					)
				}
				if (!slider.labels?.left?.trim()) {
					issues.push(
						`Likert scale slide ${slide.position} slider ${
							index + 1
						} needs a left label.`,
					)
				}
				if (!slider.labels?.middle?.trim()) {
					issues.push(
						`Likert scale slide ${slide.position} slider ${
							index + 1
						} needs a middle label.`,
					)
				}
				if (!slider.labels?.right?.trim()) {
					issues.push(
						`Likert scale slide ${slide.position} slider ${
							index + 1
						} needs a right label.`,
					)
				}
				if (slider.min >= slider.max) {
					issues.push(
						`Likert scale slide ${slide.position} slider ${
							index + 1
						} needs a valid range.`,
					)
				}
			})
		}

		if (slide.type === 'knowledgeTest') {
			if (!slide.content?.question?.trim()) {
				issues.push(
					`Knowledge test slide ${slide.position} is missing a question.`,
				)
			}
			const options = slide.content?.options ?? []
			if (options.length < 2) {
				issues.push(
					`Knowledge test slide ${slide.position} needs at least two options.`,
				)
			}
			if (!options.some((option) => option.isCorrect)) {
				issues.push(
					`Knowledge test slide ${slide.position} needs a correct answer.`,
				)
			}
			options.forEach((option, index) => {
				if (!option.text?.trim()) {
					issues.push(
						`Knowledge test slide ${slide.position} option ${
							index + 1
						} is missing text.`,
					)
				}
			})
		}

		if (slide.type === 'videoResponse') {
			const allowMultipleResponses = Boolean(
				slide.settings?.allowMultipleResponses,
			)
			if (
				allowMultipleResponses &&
				typeof slide.settings?.maxResponses !== 'number'
			) {
				issues.push(
					`Video response slide ${slide.position} needs a max response count.`,
				)
			}
			const maxDurationSeconds =
				typeof slide.settings?.maxDurationSeconds === 'number'
					? slide.settings.maxDurationSeconds
					: null
			if (
				!maxDurationSeconds ||
				maxDurationSeconds < MIN_VIDEO_DURATION ||
				maxDurationSeconds > MAX_VIDEO_DURATION
			) {
				issues.push(
					`Video response slide ${slide.position} needs a valid max duration.`,
				)
			}
		}
	})

	return issues
}

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
	return input.map((slide, idx) => {
		// Convert null values to undefined in content to match SlideDraft type
		const normalizedContent = slide.content
			? Object.fromEntries(
					Object.entries(slide.content).map(([key, value]) => [
						key,
						value === null ? undefined : value,
					]),
				)
			: {}

		const normalizedSlide: SlideDraft = {
			...slide,
			content: normalizedContent as SlideDraft['content'],
			settings: slide.settings ?? {},
		}

		return {
			id: slide.id,
			position: slide.position ?? idx + 1,
			type: slide.type,
			title: slide.title ?? '',
			content: {
				...normalizeContent(normalizedSlide),
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
			settings: normalizeSettings(normalizedSlide),
		}
	})
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
	const issues = validateSlidesForPublish(slides)
	if (issues.length > 0) {
		return {
			ok: false as const,
			message: issues[0] ?? 'Slides are incomplete.',
		}
	}
	const publishAt = new Date().toISOString()

	const upsertResult = await upsertModule({
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

	if (!upsertResult.ok) {
		return upsertResult
	}

	const replaceResult = await replaceSlides({
		moduleId: input.moduleId,
		slides,
	})

	if (!replaceResult.ok) {
		return replaceResult
	}

	return { ok: true as const, publishAt }
}


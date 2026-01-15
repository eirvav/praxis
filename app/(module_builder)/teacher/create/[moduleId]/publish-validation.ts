import type { SlideDraft } from './types'

export type SlideValidationIssue = {
	slideId: string
	message: string
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

export function validateSlidesForPublish(
	slides: SlideDraft[],
	hasPendingVideo?: (slideId: string) => boolean,
): SlideValidationIssue[] {
	const issues: SlideValidationIssue[] = []

	slides.forEach((slide) => {
		if (slide.type === 'context') {
			const text = extractLexicalText(slide.content?.body)
			if (!text) {
				issues.push({
					slideId: slide.id,
					message: `Context slide ${slide.position} is empty.`,
				})
			}
		}

		if (slide.type === 'writtenResponse') {
			const text = extractLexicalText(slide.content?.question)
			if (!text) {
				issues.push({
					slideId: slide.id,
					message: `Written response slide ${slide.position} is missing a question.`,
				})
			}
			if (
				slide.settings?.maxWordsEnabled &&
				typeof slide.settings?.maxWords !== 'number'
			) {
				issues.push({
					slideId: slide.id,
					message: `Written response slide ${slide.position} needs a max word count.`,
				})
			}
		}

		if (slide.type === 'video') {
			if (!slide.content?.videoTitle?.trim()) {
				issues.push({
					slideId: slide.id,
					message: `Video slide ${slide.position} is missing a title.`,
				})
			}
			const hasPending = hasPendingVideo ? hasPendingVideo(slide.id) : false
			if (!slide.content?.videoPath?.trim() && !hasPending) {
				issues.push({
					slideId: slide.id,
					message: `Video slide ${slide.position} is missing an uploaded video.`,
				})
			}
		}

		if (slide.type === 'likertScale') {
			const sliders = slide.content?.sliders ?? []
			if (!sliders.length) {
				issues.push({
					slideId: slide.id,
					message: `Likert scale slide ${slide.position} needs at least one slider.`,
				})
			}
			const activeSliderId =
				typeof slide.settings?.activeSliderId === 'string'
					? slide.settings.activeSliderId
					: null
			if (
				activeSliderId &&
				!sliders.some((slider) => slider.id === activeSliderId)
			) {
				issues.push({
					slideId: slide.id,
					message: `Likert scale slide ${slide.position} needs a valid active slider.`,
				})
			}
			sliders.forEach((slider, index) => {
				if (!slider.question?.trim()) {
					issues.push({
						slideId: slide.id,
						message: `Likert scale slide ${slide.position} slider ${
							index + 1
						} is missing a question.`,
					})
				}
				if (!slider.labels?.left?.trim()) {
					issues.push({
						slideId: slide.id,
						message: `Likert scale slide ${slide.position} slider ${
							index + 1
						} needs a left label.`,
					})
				}
				if (!slider.labels?.middle?.trim()) {
					issues.push({
						slideId: slide.id,
						message: `Likert scale slide ${slide.position} slider ${
							index + 1
						} needs a middle label.`,
					})
				}
				if (!slider.labels?.right?.trim()) {
					issues.push({
						slideId: slide.id,
						message: `Likert scale slide ${slide.position} slider ${
							index + 1
						} needs a right label.`,
					})
				}
				if (slider.min >= slider.max) {
					issues.push({
						slideId: slide.id,
						message: `Likert scale slide ${slide.position} slider ${
							index + 1
						} needs a valid range.`,
					})
				}
			})
		}

		if (slide.type === 'knowledgeTest') {
			if (!slide.content?.question?.trim()) {
				issues.push({
					slideId: slide.id,
					message: `Knowledge test slide ${slide.position} is missing a question.`,
				})
			}
			const options = slide.content?.options ?? []
			if (options.length < 2) {
				issues.push({
					slideId: slide.id,
					message: `Knowledge test slide ${slide.position} needs at least two options.`,
				})
			}
			if (!options.some((option) => option.isCorrect)) {
				issues.push({
					slideId: slide.id,
					message: `Knowledge test slide ${slide.position} needs a correct answer.`,
				})
			}
			options.forEach((option, index) => {
				if (!option.text?.trim()) {
					issues.push({
						slideId: slide.id,
						message: `Knowledge test slide ${slide.position} option ${
							index + 1
						} is missing text.`,
					})
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
				issues.push({
					slideId: slide.id,
					message: `Video response slide ${slide.position} needs a max response count.`,
				})
			}
			const maxDurationSeconds =
				typeof slide.settings?.maxDurationSeconds === 'number'
					? slide.settings.maxDurationSeconds
					: null
			if (
				!maxDurationSeconds ||
				maxDurationSeconds < 10 ||
				maxDurationSeconds > 600
			) {
				issues.push({
					slideId: slide.id,
					message: `Video response slide ${slide.position} needs a valid max duration.`,
				})
			}
		}
	})

	return issues
}


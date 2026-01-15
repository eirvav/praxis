import { validateSlidesForPublish } from '../publish-validation'
import type { SlideDraft } from '../types'

function lexicalText(text: string) {
	return JSON.stringify({
		root: {
			children: [{ text }],
		},
	})
}

function baseSlide(overrides: Partial<SlideDraft>): SlideDraft {
	return {
		id: 'slide-1',
		position: 1,
		type: 'context',
		title: 'Slide',
		content: {
			body: lexicalText('content'),
		},
		settings: {},
		...overrides,
	}
}

describe('validateSlidesForPublish', () => {
	it('flags missing context content', () => {
		const slides = [
			baseSlide({
				content: { body: '' },
			}),
		]
		const issues = validateSlidesForPublish(slides)
		expect(issues[0]?.message).toContain('Context slide')
	})

	it('allows video slides with pending uploads', () => {
		const slides = [
			baseSlide({
				type: 'video',
				content: {
					videoTitle: 'My video',
					videoPath: '',
				},
			}),
		]
		const issues = validateSlidesForPublish(
			slides,
			(slideId) => slideId === 'slide-1',
		)
		expect(issues.length).toBe(0)
	})

	it('flags missing knowledge test answers', () => {
		const slides = [
			baseSlide({
				type: 'knowledgeTest',
				content: {
					description: '',
					question: 'What?',
					options: [
						{ id: '1', text: 'A', isCorrect: false },
						{ id: '2', text: 'B', isCorrect: false },
					],
				},
			}),
		]
		const issues = validateSlidesForPublish(slides)
		expect(
			issues.some((issue) => issue.message.includes('correct answer')),
		).toBe(true)
	})

	it('flags likert sliders missing labels', () => {
		const slides = [
			baseSlide({
				type: 'likertScale',
				content: {
					description: '',
					sliders: [
						{
							id: 'slider-1',
							question: 'How?',
							labels: { left: '', middle: 'Mid', right: 'Right' },
							min: 0,
							max: 5,
						},
					],
				},
				settings: { activeSliderId: 'slider-1' },
			}),
		]
		const issues = validateSlidesForPublish(slides)
		expect(
			issues.some((issue) => issue.message.includes('left label')),
		).toBe(true)
	})

	it('flags written response max words misconfiguration', () => {
		const slides = [
			baseSlide({
				type: 'writtenResponse',
				content: {
					question: lexicalText('Tell me more'),
				},
				settings: { maxWordsEnabled: true, maxWords: null },
			}),
		]
		const issues = validateSlidesForPublish(slides)
		expect(
			issues.some((issue) => issue.message.includes('max word count')),
		).toBe(true)
	})

	it('flags video response max responses when enabled', () => {
		const slides = [
			baseSlide({
				type: 'videoResponse',
				content: {},
				settings: { allowMultipleResponses: true, maxDurationSeconds: 120 },
			}),
		]
		const issues = validateSlidesForPublish(slides)
		expect(
			issues.some((issue) => issue.message.includes('max response count')),
		).toBe(true)
	})
})


export type ModuleDraft = {
	title: string
	description: string
	courseId: string
	deadlineAt: string | null
	publishAt?: string | null
}

export type LikertScaleSlider = {
	id: string
	question: string
	labels: {
		left: string
		middle: string
		right: string
	}
	min: number
	max: number
}

export type QuizOption = {
	id: string
	text: string
	isCorrect: boolean
}

export type SlideDraft = {
	id: string
	position: number
	type:
		| 'context'
		| 'video'
		| 'writtenResponse'
		| 'likertScale'
		| 'videoResponse'
		| 'knowledgeTest'
	title: string
	content: {
		body?: string
		videoTitle?: string
		videoContext?: string
		videoUrl?: string
		question?: string
		description?: string
		sliders?: LikertScaleSlider[]
		options?: QuizOption[]
	}
	settings: Record<string, unknown>
}

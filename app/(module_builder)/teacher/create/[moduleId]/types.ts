export type ModuleDraft = {
	title: string
	description: string
	courseId: string
	deadlineAt: string | null
	publishAt?: string | null
}

export type SlideDraft = {
	id: string
	position: number
	type: 'context' | 'video' | 'writtenResponse'
	title: string
	content: {
		body?: string
		videoTitle?: string
		videoContext?: string
		videoUrl?: string
		question?: string
	}
	settings: Record<string, unknown>
}

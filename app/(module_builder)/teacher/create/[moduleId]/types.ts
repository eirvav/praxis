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
	type: 'context'
	title: string
	content: {
		body: string
	}
	settings: Record<string, unknown>
}


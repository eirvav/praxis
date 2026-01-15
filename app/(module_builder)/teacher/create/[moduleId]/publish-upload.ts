import type { SlideDraft } from './types'

const MAX_VIDEO_BYTES = 50 * 1024 * 1024
const ALLOWED_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']

type UploadOptions = {
	moduleId: string
	slides: SlideDraft[]
	getPendingVideoFile: (slideId: string) => File | null
}

export async function uploadPendingVideos({
	moduleId,
	slides,
	getPendingVideoFile,
}: UploadOptions) {
	const batchStart = performance.now()
	const updatedSlides = await Promise.all(
		slides.map(async (slide) => {
			if (slide.type !== 'video') return slide
			const file = getPendingVideoFile(slide.id)
			if (!file) return slide

			if (file.size > MAX_VIDEO_BYTES) {
				throw new Error('Video must be 50MB or smaller.')
			}

			if (!ALLOWED_TYPES.includes(file.type)) {
				throw new Error('Unsupported video format.')
			}

			const formData = new FormData()
			formData.append('file', file)
			formData.append('moduleId', moduleId)
			formData.append('slideId', slide.id)

			const uploadStart = performance.now()
			const response = await fetch('/api/module-builder/upload-video', {
				method: 'POST',
				body: formData,
			})
			const uploadEnd = performance.now()

			if (!response.ok) {
				const payload = (await response.json()) as { message?: string }
				throw new Error(payload.message ?? 'Video upload failed.')
			}

			const payload = (await response.json()) as { path?: string }
			if (!payload.path) {
				throw new Error('Video upload failed.')
			}

			console.info('[module-builder] video upload', {
				slideId: slide.id,
				sizeBytes: file.size,
				durationMs: Math.round(uploadEnd - uploadStart),
			})

			return {
				...slide,
				content: {
					...slide.content,
					videoPath: payload.path,
					videoUrl: '',
				},
			}
		}),
	)

	const batchEnd = performance.now()
	console.info('[module-builder] upload batch', {
		count: updatedSlides.filter((slide) => slide.type === 'video').length,
		durationMs: Math.round(batchEnd - batchStart),
	})

	return updatedSlides
}


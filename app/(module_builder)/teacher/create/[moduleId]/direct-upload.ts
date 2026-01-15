import { createClient } from '@/lib/supabase/client'

const MAX_VIDEO_BYTES = 50 * 1024 * 1024
const ALLOWED_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']

type DirectUploadInput = {
	moduleId: string
	slideId: string
	file: File
}

export async function uploadVideoSlideFile({
	moduleId,
	slideId,
	file,
}: DirectUploadInput) {
	if (file.size > MAX_VIDEO_BYTES) {
		throw new Error('Video must be 50MB or smaller.')
	}

	if (!ALLOWED_TYPES.includes(file.type)) {
		throw new Error('Unsupported video format.')
	}

	const response = await fetch('/api/module-builder/signed-upload', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			moduleId,
			slideId,
			fileType: file.type,
		}),
	})

	if (!response.ok) {
		const payload = (await response.json()) as { message?: string }
		throw new Error(payload.message ?? 'Video upload failed.')
	}

	const payload = (await response.json()) as { path?: string; token?: string }
	if (!payload.path || !payload.token) {
		throw new Error('Video upload failed.')
	}

	const supabase = createClient()
	const { error } = await supabase.storage
		.from('teacher-video-uploads')
		.uploadToSignedUrl(payload.path, payload.token, file, {
			contentType: file.type,
			upsert: true,
		})

	if (error) {
		throw new Error(error.message)
	}

	return payload.path
}


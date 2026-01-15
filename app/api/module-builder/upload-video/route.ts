import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getUserWithRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

const MAX_VIDEO_BYTES = 50 * 1024 * 1024
const ALLOWED_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']

const payloadSchema = z.object({
	moduleId: z.string().uuid(),
	slideId: z.string().uuid(),
})

function safeFilename(name: string) {
	return name.replace(/[^a-zA-Z0-9._-]/g, '-')
}

export async function POST(request: Request) {
	try {
		const requestStart = Date.now()
		const user = await getUserWithRole()
		if (user.role !== 'teacher' && user.role !== 'admin') {
			return NextResponse.json(
				{ message: 'Unauthorized' },
				{ status: 403 },
			)
		}

		const formData = await request.formData()
		const formParsedAt = Date.now()
		const file = formData.get('file')
		const moduleId = formData.get('moduleId')
		const slideId = formData.get('slideId')

		const parsed = payloadSchema.safeParse({
			moduleId,
			slideId,
		})

		if (!parsed.success) {
			return NextResponse.json(
				{ message: 'Invalid upload payload' },
				{ status: 400 },
			)
		}

		if (!file || !(file instanceof File)) {
			return NextResponse.json(
				{ message: 'Missing video file' },
				{ status: 400 },
			)
		}

		if (file.size > MAX_VIDEO_BYTES) {
			return NextResponse.json(
				{ message: 'Video exceeds 50MB limit' },
				{ status: 413 },
			)
		}

		if (!ALLOWED_TYPES.includes(file.type)) {
			return NextResponse.json(
				{ message: 'Unsupported video format' },
				{ status: 415 },
			)
		}

		const safeName = safeFilename(file.name || 'upload')
		const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
		const path = [
			'module-builder-uploads',
			parsed.data.moduleId,
			parsed.data.slideId,
			`${timestamp}-${safeName}`,
		].join('/')

		const supabase = await createClient()
		const uploadStart = Date.now()
		const { error } = await supabase.storage
			.from('teacher-video-uploads')
			.upload(path, file, {
				contentType: file.type,
				upsert: false,
			})
		const uploadEnd = Date.now()

		if (error) {
			return NextResponse.json(
				{ message: error.message },
				{ status: 500 },
			)
		}

		console.info('[module-builder] upload-video timing', {
			moduleId: parsed.data.moduleId,
			slideId: parsed.data.slideId,
			formMs: formParsedAt - requestStart,
			uploadMs: uploadEnd - uploadStart,
			totalMs: uploadEnd - requestStart,
		})

		return NextResponse.json({ path })
	} catch (error) {
		const message =
			error instanceof Error ? error.message : 'Upload failed'
		return NextResponse.json({ message }, { status: 500 })
	}
}


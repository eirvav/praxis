import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getUserWithRole } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'

const ALLOWED_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']

const payloadSchema = z.object({
	moduleId: z.string().uuid(),
	slideId: z.string().uuid(),
	fileType: z.string(),
})

function extensionForType(fileType: string) {
	if (fileType === 'video/webm') return '.webm'
	if (fileType === 'video/mp4') return '.mp4'
	if (fileType === 'video/quicktime') return '.mov'
	return ''
}

export async function POST(request: Request) {
	try {
		const user = await getUserWithRole()
		if (user.role !== 'teacher' && user.role !== 'admin') {
			return NextResponse.json(
				{ message: 'Unauthorized' },
				{ status: 403 },
			)
		}

		const payload = await request.json()
		const parsed = payloadSchema.safeParse(payload)

		if (!parsed.success) {
			return NextResponse.json(
				{ message: 'Invalid upload payload' },
				{ status: 400 },
			)
		}

		if (!ALLOWED_TYPES.includes(parsed.data.fileType)) {
			return NextResponse.json(
				{ message: 'Unsupported video format' },
				{ status: 415 },
			)
		}

		const extension = extensionForType(parsed.data.fileType)
		const path = [
			'module-builder-uploads',
			parsed.data.moduleId,
			parsed.data.slideId,
			`video${extension}`,
		].join('/')

		const supabase = createServiceClient()
		const { data, error } = await supabase.storage
			.from('teacher-video-uploads')
			.createSignedUploadUrl(path, {
				upsert: true,
			})

		if (error || !data?.token) {
			return NextResponse.json(
				{ message: error?.message ?? 'Upload initialization failed' },
				{ status: 500 },
			)
		}

		return NextResponse.json({ path: data.path ?? path, token: data.token })
	} catch (error) {
		const message =
			error instanceof Error ? error.message : 'Upload initialization failed'
		return NextResponse.json({ message }, { status: 500 })
	}
}


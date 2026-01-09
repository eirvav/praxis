import { Suspense } from 'react'
import type { ReactNode } from 'react'

import { BuilderProvider } from './_components/builder-context'
import { BuilderShell } from './_components/builder-shell'
import type { ModuleDraft, SlideDraft } from './types'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

async function loadInitialData(moduleId: string) {
	const supabase = await createClient()

	const { data: moduleRow } = await supabase
		.from('modules')
		.select(
			'id,title,description,course_id,deadline_at,publish_at',
		)
		.eq('id', moduleId)
		.maybeSingle()

	const { data: slideRows } = await supabase
		.from('slides')
		.select('id,module_id,position,type,title,content,settings')
		.eq('module_id', moduleId)
		.order('position', { ascending: true })

	const moduleData: ModuleDraft | null = moduleRow
		? {
				title: moduleRow.title ?? '',
				description: moduleRow.description ?? '',
				courseId: moduleRow.course_id ?? '',
				deadlineAt: moduleRow.deadline_at,
				publishAt: moduleRow.publish_at,
		  }
		: null

	const slidesData: SlideDraft[] =
		slideRows?.map((slide) => ({
			id: slide.id,
			position: slide.position,
			type: slide.type as SlideDraft['type'],
			title: slide.title ?? 'Untitled',
			content:
				typeof slide.content === 'object' && slide.content
					? slide.content
					: { body: '' },
			settings:
				typeof slide.settings === 'object' && slide.settings
					? slide.settings
					: {},
		})) ?? []

	return { moduleData, slidesData }
}

async function BuilderContent({
	paramsPromise,
	children,
}: {
	paramsPromise: Promise<{ moduleId: string }>
	children: ReactNode
}) {
	const { moduleId } = await paramsPromise
	await requireRole(['teacher'])

	const { moduleData, slidesData } = await loadInitialData(moduleId)

	return (
		<BuilderProvider
			moduleId={moduleId}
			initialModule={moduleData}
			initialSlides={slidesData}
		>
			<BuilderShell moduleId={moduleId}>{children}</BuilderShell>
		</BuilderProvider>
	)
}

export default function BuilderLayout({
	children,
	params,
}: {
	children: ReactNode
	params: Promise<{ moduleId: string }>
}) {
	return (
		<Suspense fallback={<div className='p-6 text-sm'>Loading module builder…</div>}>
			<BuilderContent paramsPromise={params}>{children}</BuilderContent>
		</Suspense>
	)
}

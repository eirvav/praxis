import { Suspense } from 'react'
import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'

import { PlayerProvider, type ModuleData } from '@/app/(module_player)/_components/player-context'
import { PlayerShell } from '@/app/(module_player)/_components/player-shell'
import type { SlideDraft } from '@/app/(module_builder)/teacher/create/[moduleId]/types'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

async function loadModuleData(moduleId: string) {
	const supabase = await createClient()

	// Fetch published module
	const { data: moduleRow, error: moduleError } = await supabase
		.from('modules')
		.select('id,title,description,deadline_at,publish_at')
		.eq('id', moduleId)
		.not('publish_at', 'is', null)
		.maybeSingle()

	if (moduleError || !moduleRow) {
		return { moduleData: null, slidesData: [] }
	}

	// Fetch slides for the module
	const { data: slideRows } = await supabase
		.from('slides')
		.select('id,module_id,position,type,title,content,settings')
		.eq('module_id', moduleId)
		.order('position', { ascending: true })

	const moduleData: ModuleData = {
		id: moduleRow.id,
		title: moduleRow.title ?? 'Untitled Module',
		description: moduleRow.description ?? '',
		deadlineAt: moduleRow.deadline_at,
		publishAt: moduleRow.publish_at,
	}

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

async function PlayerContent({
	paramsPromise,
	children,
}: {
	paramsPromise: Promise<{ moduleId: string }>
	children: ReactNode
}) {
	const { moduleId } = await paramsPromise
	await requireRole(['student'])

	const { moduleData, slidesData } = await loadModuleData(moduleId)

	if (!moduleData) {
		notFound()
	}

	return (
		<PlayerProvider module={moduleData} slides={slidesData}>
			<PlayerShell>{children}</PlayerShell>
		</PlayerProvider>
	)
}

export default function PlayerLayout({
	children,
	params,
}: {
	children: ReactNode
	params: Promise<{ moduleId: string }>
}) {
	return (
		<Suspense
			fallback={
				<div className="flex min-h-screen items-center justify-center">
					<p className="text-sm text-muted-foreground">Loading module...</p>
				</div>
			}
		>
			<PlayerContent paramsPromise={params}>{children}</PlayerContent>
		</Suspense>
	)
}


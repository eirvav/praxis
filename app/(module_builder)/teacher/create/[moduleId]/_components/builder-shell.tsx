'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

import { useBuilder } from './builder-context'
import { cn } from '@/lib/utils'

const steps = [
	{
		id: 'step-1',
		label: 'Step 1 · Overview',
		segment: 'step-1',
	},
	{
		id: 'step-2',
		label: 'Step 2 · Content',
		segment: 'step-2',
	},
	{
		id: 'step-3',
		label: 'Step 3 · Review',
		segment: 'step-3',
	},
]

export function BuilderShell({
	moduleId,
	children,
}: {
	moduleId: string
	children: ReactNode
}) {
	const pathname = usePathname()
	const { lastSyncedAt } = useBuilder()

	return (
		<div className='min-h-screen bg-background text-foreground'>
			<header className='sticky top-0 z-30 border-b bg-background/95 backdrop-blur'>
				<div className='mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3'>
					<nav className='flex items-center gap-2 text-sm'>
						{steps.map((step) => {
							const href = `/teacher/create/${moduleId}/${step.segment}`
							const isActive = pathname?.includes(step.segment)

							return (
								<Link
									key={step.id}
									href={href}
									className={cn(
										'rounded-md px-3 py-2 transition-colors',
										isActive
											? 'bg-primary text-primary-foreground'
											: 'hover:bg-muted',
									)}
								>
									{step.label}
								</Link>
							)
						})}
					</nav>
					<div className='text-xs text-muted-foreground'>
						{lastSyncedAt
							? `Last saved at ${new Date(
									lastSyncedAt,
							  ).toLocaleTimeString()}`
							: 'Draft stored locally'}
					</div>
				</div>
			</header>
			<main className='mx-auto max-w-6xl px-6 py-8'>
				{children}
			</main>
		</div>
	)
}


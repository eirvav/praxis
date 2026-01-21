'use client'

import type { ReactNode } from 'react'
import { Toaster } from 'sonner'

export function PlayerShell({ children }: { children: ReactNode }) {
	return (
		<div className="flex min-h-screen flex-col bg-background">
			{children}
			<Toaster position="bottom-right" richColors />
		</div>
	)
}


'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export function MainContentMiddle() {
	return (
		<Card className='w-full overflow-hidden self-start'>
			<CardHeader className='flex flex-row items-center justify-between gap-2'>
				<div className='space-y-1'>
					<CardTitle className='text-xl'>Slide 1</CardTitle>
					<div className='flex items-center gap-2 text-xs text-muted-foreground'>
						<span className='rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground'>
							Context
						</span>
						<span>Enter context</span>
					</div>
				</div>
				<div className='rounded-md bg-muted px-3 py-1 text-xs text-muted-foreground'>
					Toolbar placeholder
				</div>
			</CardHeader>
			<Separator />
			<CardContent className='h-full overflow-auto bg-white'>
				<div className='min-h-[420px] rounded-lg border bg-white px-4 py-3 text-muted-foreground'>
					Rich text editor placeholder
				</div>
			</CardContent>
		</Card>
	)
}

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function SlideSettingsRight() {
	return (
		<Card className='w-full overflow-hidden self-start'>
			<CardHeader>
				<CardTitle className='text-base'>Slide Settings</CardTitle>
				<p className='text-sm text-muted-foreground'>
					Choose type and basic options.
				</p>
			</CardHeader>
			<CardContent className='space-y-4'>
				<div className='space-y-2'>
					<Label>Slide Type</Label>
					<Select defaultValue='context'>
						<SelectTrigger>
							<SelectValue placeholder='Context' />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value='context'>Context</SelectItem>
							<SelectItem value='quiz'>Quiz (placeholder)</SelectItem>
							<SelectItem value='video'>Video (placeholder)</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div className='rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground'>
					Additional settings placeholder
				</div>
			</CardContent>
		</Card>
	)
}

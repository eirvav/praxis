'use client'

import { MainContentMiddle } from './_components/main-content-middle'
import { SlideManagerLeft } from './_components/slide-manager-left'
import { SlideSettingsRight } from './_components/slide-settings-right'

export default function SlidesBuilderPage() {
	return (
		<div className='w-full max-w-[2000px] mx-auto px-2 md:px-4 pb-4 h-[calc(100vh-120px)]'>
			<div className='grid grid-cols-[240px_minmax(0,1fr)_320px] gap-4 md:gap-6 h-full'>
				<SlideManagerLeft />
				<MainContentMiddle />
				<SlideSettingsRight />
			</div>
		</div>
	)
}

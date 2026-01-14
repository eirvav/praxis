'use client'

import { useEffect, useMemo } from 'react'

import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import type { LikertScaleSlider, SlideDraft } from '../../../../types'

type LikertScaleSettingsProps = {
	slide: SlideDraft
	onUpdateSlide: (updates: Partial<SlideDraft>) => void
}

const rangeOptions = Array.from({ length: 11 }, (_, value) => value)

export function LikertScaleSettings({
	slide,
	onUpdateSlide,
}: LikertScaleSettingsProps) {
	const sliders = useMemo(() => slide.content.sliders ?? [], [slide])

	const settingsActiveSliderId =
		typeof slide.settings?.activeSliderId === 'string'
			? slide.settings.activeSliderId
			: null

	const resolvedSliderId =
		settingsActiveSliderId &&
		sliders.some((slider) => slider.id === settingsActiveSliderId)
			? settingsActiveSliderId
			: sliders[0]?.id ?? null

	useEffect(() => {
		if (!resolvedSliderId) return
		if (resolvedSliderId === settingsActiveSliderId) return
		onUpdateSlide({
			settings: {
				...slide.settings,
				activeSliderId: resolvedSliderId,
			},
		})
	}, [onUpdateSlide, resolvedSliderId, settingsActiveSliderId, slide.settings])

	const activeSlider = sliders.find(
		(slider) => slider.id === resolvedSliderId,
	)

	const minValue = Math.max(0, Math.min(9, activeSlider?.min ?? 0))
	const maxValue = Math.max(
		minValue + 1,
		Math.min(10, activeSlider?.max ?? 5),
	)

	const minOptions = rangeOptions.filter((value) => value < maxValue)
	const maxOptions = rangeOptions.filter((value) => value > minValue)

	const updateSlider = (id: string, updates: Partial<LikertScaleSlider>) => {
		const nextSliders = sliders.map((slider) =>
			slider.id === id ? { ...slider, ...updates } : slider,
		)
		onUpdateSlide({
			content: {
				...slide.content,
				sliders: nextSliders,
			},
		})
	}

	return (
		<div className='space-y-4'>
			<div className='space-y-2'>
				<Label>Slider</Label>
				<Select
					value={resolvedSliderId ?? ''}
					onValueChange={(value) =>
						onUpdateSlide({
							settings: {
								...slide.settings,
								activeSliderId: value,
							},
						})
					}
					disabled={!sliders.length}
				>
					<SelectTrigger className='w-full'>
						<SelectValue placeholder='Select slider' />
					</SelectTrigger>
					<SelectContent>
						{sliders.map((slider, index) => (
							<SelectItem key={slider.id} value={slider.id}>
								Slider {index + 1}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<div className='space-y-2'>
				<Label>Slider Range</Label>
				<div className='grid grid-cols-2 gap-3'>
					<div className='space-y-1'>
						<span className='text-xs text-muted-foreground'>
							Minimum
						</span>
						<Select
							value={String(minValue)}
							onValueChange={(value) => {
								if (!activeSlider) return
								updateSlider(activeSlider.id, {
									min: Number(value),
								})
							}}
							disabled={!activeSlider}
						>
							<SelectTrigger className='w-full'>
								<SelectValue placeholder='0' />
							</SelectTrigger>
							<SelectContent>
								{minOptions.map((value) => (
									<SelectItem
										key={`min-${value}`}
										value={String(value)}
									>
										{value}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className='space-y-1'>
						<span className='text-xs text-muted-foreground'>
							Maximum
						</span>
						<Select
							value={String(maxValue)}
							onValueChange={(value) => {
								if (!activeSlider) return
								updateSlider(activeSlider.id, {
									max: Number(value),
								})
							}}
							disabled={!activeSlider}
						>
							<SelectTrigger className='w-full'>
								<SelectValue placeholder='5' />
							</SelectTrigger>
							<SelectContent>
								{maxOptions.map((value) => (
									<SelectItem
										key={`max-${value}`}
										value={String(value)}
									>
										{value}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>
			</div>
		</div>
	)
}


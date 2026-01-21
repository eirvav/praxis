'use client'

import Link from 'next/link'
import { ArrowLeft, ArrowRight, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { usePlayer } from '@/app/(module_player)/_components/player-context'
import { MediaPermissionGate } from '@/app/(module_player)/_components/media-permission-gate'
import { SlidePreview } from '@/app/(module_builder)/teacher/create/[moduleId]/step-3/_components/slide-preview'

export default function PlayerPage() {
	const {
		module,
		permissionsGranted,
		currentSlide,
		currentSlideIndex,
		slides,
		goToNextSlide,
		goToPreviousSlide,
		isFirstSlide,
		isLastSlide,
	} = usePlayer()

	// Show permission gate if not granted
	if (!permissionsGranted) {
		return <MediaPermissionGate />
	}

	// Show slide content
	return (
		<div className="flex min-h-screen flex-col">
			{/* Header */}
			<header className="flex items-center justify-between border-b bg-background px-4 py-3">
				<div className="flex items-center gap-4">
					<Button variant="ghost" size="icon" asChild>
						<Link href="/student">
							<X className="size-5" />
							<span className="sr-only">Exit module</span>
						</Link>
					</Button>
					<div>
						<h1 className="font-semibold">
							{module?.title ?? 'Module'}
						</h1>
						<p className="text-sm text-muted-foreground">
							Slide {currentSlideIndex + 1} of {slides.length}
						</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={goToPreviousSlide}
						disabled={isFirstSlide}
					>
						<ArrowLeft className="mr-1 size-4" />
						Back
					</Button>
					<Button
						size="sm"
						onClick={goToNextSlide}
						disabled={isLastSlide}
					>
						Next
						<ArrowRight className="ml-1 size-4" />
					</Button>
				</div>
			</header>

			{/* Content */}
			<main className="flex flex-1 flex-col items-center justify-center p-6">
				<div className="w-full max-w-2xl">
					{currentSlide ? (
						<div className="rounded-lg border bg-card p-6 shadow-sm">
							<div className="mb-4 border-b pb-4">
								<span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
									{currentSlide.type.replace(/([A-Z])/g, ' $1').trim()}
								</span>
								<h2 className="mt-1 text-xl font-semibold">
									{currentSlide.title || 'Untitled slide'}
								</h2>
							</div>
							<SlidePreview slide={currentSlide} />
						</div>
					) : (
						<div className="text-center text-muted-foreground">
							<p>No slides available in this module.</p>
						</div>
					)}
				</div>
			</main>

			{/* Footer progress */}
			<footer className="border-t bg-muted/30 px-4 py-3">
				<div className="mx-auto flex max-w-2xl items-center justify-between">
					<span className="text-sm text-muted-foreground">
						Progress: {currentSlideIndex + 1} / {slides.length}
					</span>
					<div className="h-2 w-48 overflow-hidden rounded-full bg-muted">
						<div
							className="h-full bg-primary transition-all"
							style={{
								width: `${((currentSlideIndex + 1) / slides.length) * 100}%`,
							}}
						/>
					</div>
				</div>
			</footer>
		</div>
	)
}


'use client'

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
	type ReactNode,
} from 'react'

import type { SlideDraft } from '@/app/(module_builder)/teacher/create/[moduleId]/types'

export type ModuleData = {
	id: string
	title: string
	description: string
	deadlineAt: string | null
	publishAt: string | null
}

type PlayerContextValue = {
	module: ModuleData | null
	slides: SlideDraft[]
	currentSlideIndex: number
	setCurrentSlideIndex: (index: number) => void
	currentSlide: SlideDraft | null
	permissionsGranted: boolean
	setPermissionsGranted: (granted: boolean) => void
	mediaStream: MediaStream | null
	setMediaStream: (stream: MediaStream | null) => void
	goToNextSlide: () => void
	goToPreviousSlide: () => void
	isFirstSlide: boolean
	isLastSlide: boolean
}

const PlayerContext = createContext<PlayerContextValue | null>(null)

export function usePlayer() {
	const ctx = useContext(PlayerContext)
	if (!ctx) {
		throw new Error('usePlayer must be used within PlayerProvider')
	}
	return ctx
}

export function PlayerProvider({
	module,
	slides,
	children,
}: {
	module: ModuleData | null
	slides: SlideDraft[]
	children: ReactNode
}) {
	const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
	const [permissionsGranted, setPermissionsGranted] = useState(false)
	const [mediaStream, setMediaStream] = useState<MediaStream | null>(null)
	const mediaStreamRef = useRef<MediaStream | null>(null)

	// Keep ref in sync for cleanup
	useEffect(() => {
		mediaStreamRef.current = mediaStream
	}, [mediaStream])

	// Cleanup media stream on unmount
	useEffect(() => {
		return () => {
			if (mediaStreamRef.current) {
				mediaStreamRef.current.getTracks().forEach((track) => track.stop())
			}
		}
	}, [])

	const currentSlide = slides[currentSlideIndex] ?? null

	const goToNextSlide = useCallback(() => {
		if (currentSlideIndex < slides.length - 1) {
			setCurrentSlideIndex(currentSlideIndex + 1)
		}
	}, [currentSlideIndex, slides.length])

	const goToPreviousSlide = useCallback(() => {
		if (currentSlideIndex > 0) {
			setCurrentSlideIndex(currentSlideIndex - 1)
		}
	}, [currentSlideIndex])

	const isFirstSlide = currentSlideIndex === 0
	const isLastSlide = currentSlideIndex === slides.length - 1

	return (
		<PlayerContext.Provider
			value={{
				module,
				slides,
				currentSlideIndex,
				setCurrentSlideIndex,
				currentSlide,
				permissionsGranted,
				setPermissionsGranted,
				mediaStream,
				setMediaStream,
				goToNextSlide,
				goToPreviousSlide,
				isFirstSlide,
				isLastSlide,
			}}
		>
			{children}
		</PlayerContext.Provider>
	)
}


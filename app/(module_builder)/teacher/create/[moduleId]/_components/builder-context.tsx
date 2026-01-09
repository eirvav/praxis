'use client'

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
	type ReactNode,
} from 'react'

import type {
	ModuleDraft,
	SlideDraft,
} from '../types'

type BuilderState = {
	module: ModuleDraft
	slides: SlideDraft[]
	selectedSlideId: string | null
	lastSyncedAt: string | null
}

type BuilderContextValue = BuilderState & {
	moduleId: string
	updateModule: (input: Partial<ModuleDraft>) => void
	addSlide: (type?: SlideDraft['type']) => void
	updateSlide: (id: string, input: Partial<SlideDraft>) => void
	deleteSlide: (id: string) => void
	moveSlide: (id: string, direction: 'up' | 'down') => void
	reorderSlides: (activeId: string, overId: string) => void
	duplicateSlide: (id: string) => void
	selectSlide: (id: string | null) => void
	setLastSyncedAt: (value: string | null) => void
	resetFromServer: (moduleData: ModuleDraft, slidesData: SlideDraft[]) => void
}

const BuilderContext = createContext<BuilderContextValue | null>(null)

const emptyModule: ModuleDraft = {
	title: '',
	description: '',
	courseId: '',
	deadlineAt: null,
	publishAt: null,
}

function resequence(slides: SlideDraft[], sortSlides = true): SlideDraft[] {
	const ordered = sortSlides
		? slides.slice().sort((a, b) => a.position - b.position)
		: slides.slice()

	return ordered.map((slide, idx) => ({ ...slide, position: idx + 1 }))
}

function storageKey(moduleId: string) {
	return `module-builder-${moduleId}`
}

function generateId() {
	if (typeof crypto !== 'undefined' && crypto.randomUUID) {
		return crypto.randomUUID()
	}

	// Lightweight UUID v4 fallback
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
		/[xy]/g,
		(char) => {
			const rand = (Math.random() * 16) | 0
			const value = char === 'x' ? rand : (rand & 0x3) | 0x8
			return value.toString(16)
		},
	)
}

export function BuilderProvider({
	moduleId,
	initialModule,
	initialSlides,
	children,
}: {
	moduleId: string
	initialModule: ModuleDraft | null
	initialSlides: SlideDraft[]
	children: ReactNode
}) {
	const [state, setState] = useState<BuilderState>(() => {
		const seededSlides =
			initialSlides?.length > 0
				? resequence(initialSlides)
				: []
		const seededModule = initialModule ?? emptyModule

		return {
			module: seededModule,
			slides: seededSlides,
			selectedSlideId: seededSlides[0]?.id ?? null,
			lastSyncedAt: null,
		}
	})

	useEffect(() => {
		if (typeof window === 'undefined') return
		const raw = window.localStorage.getItem(storageKey(moduleId))
		if (!raw) return
		try {
			const parsed = JSON.parse(raw) as BuilderState
			setState((prev) => ({
				...prev,
				...parsed,
				slides: resequence(parsed.slides ?? []),
				selectedSlideId:
					parsed.selectedSlideId ??
					parsed.slides?.[0]?.id ??
					null,
			}))
		} catch {
			// ignore invalid stored state
		}
	}, [moduleId])

	useEffect(() => {
		if (typeof window === 'undefined') return
		window.localStorage.setItem(
			storageKey(moduleId),
			JSON.stringify(state),
		)
	}, [moduleId, state])

	const updateModule = useCallback((input: Partial<ModuleDraft>) => {
		setState((prev) => ({
			...prev,
			module: { ...prev.module, ...input },
		}))
	}, [])

	const addSlide = useCallback((type: SlideDraft['type'] = 'context') => {
		setState((prev) => {
			let title = 'New context slide'
			if (type === 'video') title = 'New video slide'
			else if (type === 'writtenResponse') title = 'New written response'

			const newSlide: SlideDraft = {
				id: generateId(),
				position: prev.slides.length + 1,
				type,
				title,
				content: { body: '' },
				settings: {},
			}

			const slides = resequence([...prev.slides, newSlide], false)
			return {
				...prev,
				slides,
				selectedSlideId: newSlide.id,
			}
		})
	}, [])

	const updateSlide = useCallback(
		(id: string, input: Partial<SlideDraft>) => {
			setState((prev) => {
				const slides = prev.slides.map((slide) =>
					slide.id === id
						? { ...slide, ...input }
						: slide,
				)
				return {
					...prev,
					slides: resequence(slides, false),
				}
			})
		},
		[],
	)

	const deleteSlide = useCallback((id: string) => {
		setState((prev) => {
			const slides = resequence(
				prev.slides.filter((slide) => slide.id !== id),
				false,
			)
			const selectedSlideId =
				prev.selectedSlideId === id
					? slides[0]?.id ?? null
					: prev.selectedSlideId
			return {
				...prev,
				slides,
				selectedSlideId,
			}
		})
	}, [])

	const moveSlide = useCallback(
		(id: string, direction: 'up' | 'down') => {
			setState((prev) => {
				const idx = prev.slides.findIndex(
					(slide) => slide.id === id,
				)
				if (idx === -1) return prev

				const targetIdx =
					direction === 'up' ? idx - 1 : idx + 1
				if (
					targetIdx < 0 ||
					targetIdx >= prev.slides.length
				) {
					return prev
				}

				const slides = prev.slides.slice()
				const [removed] = slides.splice(idx, 1)
				slides.splice(targetIdx, 0, removed)

				return {
					...prev,
					slides: resequence(slides, false),
				}
			})
		},
		[],
	)

	const reorderSlides = useCallback((activeId: string, overId: string) => {
		if (activeId === overId) return

		setState((prev) => {
			const fromIdx = prev.slides.findIndex((slide) => slide.id === activeId)
			const toIdx = prev.slides.findIndex((slide) => slide.id === overId)
			if (fromIdx === -1 || toIdx === -1) return prev

			const slides = prev.slides.slice()
			const [moved] = slides.splice(fromIdx, 1)
			slides.splice(toIdx, 0, moved)

			return { ...prev, slides: resequence(slides, false) }
		})
	}, [])

	const duplicateSlide = useCallback((id: string) => {
		setState((prev) => {
			const sourceIdx = prev.slides.findIndex((slide) => slide.id === id)
			if (sourceIdx === -1) return prev

			const source = prev.slides[sourceIdx]
			const clone: SlideDraft = {
				...source,
				id: generateId(),
				content: { ...source.content },
				settings: { ...source.settings },
			}

			const slides = resequence(
				[
					...prev.slides.slice(0, sourceIdx + 1),
					clone,
					...prev.slides.slice(sourceIdx + 1),
				],
				false,
			)

			return {
				...prev,
				slides,
				selectedSlideId: clone.id,
			}
		})
	}, [])

	const selectSlide = useCallback((id: string | null) => {
		setState((prev) => ({ ...prev, selectedSlideId: id }))
	}, [])

	const setLastSyncedAt = useCallback((value: string | null) => {
		setState((prev) => ({ ...prev, lastSyncedAt: value }))
	}, [])

	const resetFromServer = useCallback(
		(moduleData: ModuleDraft, slidesData: SlideDraft[]) => {
			setState({
				module: moduleData,
				slides: resequence(slidesData),
				selectedSlideId:
					slidesData[0]?.id ?? null,
				lastSyncedAt: null,
			})
		},
		[],
	)

	const value = useMemo(
		() => ({
			moduleId,
			...state,
			updateModule,
			addSlide,
			updateSlide,
			deleteSlide,
			moveSlide,
			reorderSlides,
			duplicateSlide,
			selectSlide,
			setLastSyncedAt,
			resetFromServer,
		}),
		[
			addSlide,
			deleteSlide,
			moduleId,
			moveSlide,
			reorderSlides,
			duplicateSlide,
			resetFromServer,
			selectSlide,
			setLastSyncedAt,
			state,
			updateModule,
			updateSlide,
		],
	)

	return (
		<BuilderContext.Provider value={value}>
			{children}
		</BuilderContext.Provider>
	)
}

export function useBuilder() {
	const ctx = useContext(BuilderContext)
	if (!ctx) {
		throw new Error('useBuilder must be used within BuilderProvider')
	}
	return ctx
}

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Camera, Mic, AlertCircle, CheckCircle2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { usePlayer } from './player-context'

type PermissionStatus = 'pending' | 'granted' | 'denied' | 'error'

export function MediaPermissionGate() {
	const { setPermissionsGranted, setMediaStream } = usePlayer()
	const videoRef = useRef<HTMLVideoElement>(null)
	const streamRef = useRef<MediaStream | null>(null)
	const permissionsGrantedRef = useRef(false)
	const audioContextRef = useRef<AudioContext | null>(null)
	const analyserRef = useRef<AnalyserNode | null>(null)
	const animationFrameRef = useRef<number | null>(null)

	const [cameraStatus, setCameraStatus] = useState<PermissionStatus>('pending')
	const [micStatus, setMicStatus] = useState<PermissionStatus>('pending')
	const [errorMessage, setErrorMessage] = useState<string | null>(null)
	const [isRequesting, setIsRequesting] = useState(false)
	const [localStream, setLocalStream] = useState<MediaStream | null>(null)
	const [audioLevel, setAudioLevel] = useState(0)

	// Attach stream to video element and start playing
	useEffect(() => {
		const video = videoRef.current
		if (!video || !localStream) return

		console.log('Attaching stream to video element')
		video.srcObject = localStream

		// Explicitly try to play
		video.play().catch((err) => {
			console.error('Video play error:', err)
		})
	}, [localStream])

	// Set up audio level monitoring
	useEffect(() => {
		if (!localStream) return

		const audioTracks = localStream.getAudioTracks()
		if (audioTracks.length === 0) return

		// Create audio context and analyser
		const audioContext = new AudioContext()
		const analyser = audioContext.createAnalyser()
		analyser.fftSize = 256
		analyser.smoothingTimeConstant = 0.3 // Lower = more responsive/spiky

		const source = audioContext.createMediaStreamSource(localStream)
		source.connect(analyser)

		audioContextRef.current = audioContext
		analyserRef.current = analyser

		// Monitor audio levels
		const dataArray = new Uint8Array(analyser.frequencyBinCount)

		const updateLevel = () => {
			if (!analyserRef.current) return

			analyserRef.current.getByteFrequencyData(dataArray)

			// Calculate average level
			const sum = dataArray.reduce((acc, val) => acc + val, 0)
			const average = sum / dataArray.length
			// Normalize to 0-100
			const normalizedLevel = Math.min(100, (average / 128) * 100)

			setAudioLevel(normalizedLevel)
			animationFrameRef.current = requestAnimationFrame(updateLevel)
		}

		updateLevel()

		// Cleanup
		return () => {
			if (animationFrameRef.current) {
				cancelAnimationFrame(animationFrameRef.current)
			}
			if (audioContextRef.current) {
				audioContextRef.current.close()
			}
		}
	}, [localStream])

	const requestPermissions = useCallback(async () => {
		setIsRequesting(true)
		setErrorMessage(null)

		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				video: {
					width: { ideal: 1280 },
					height: { ideal: 720 },
				},
				audio: true,
			})

			console.log('Stream obtained:', stream)

			streamRef.current = stream
			setLocalStream(stream)

			// Check which tracks we got
			const hasVideo = stream.getVideoTracks().length > 0
			const hasAudio = stream.getAudioTracks().length > 0

			setCameraStatus(hasVideo ? 'granted' : 'denied')
			setMicStatus(hasAudio ? 'granted' : 'denied')

			if (hasVideo && hasAudio) {
				permissionsGrantedRef.current = true
				// Store stream in context for later use
				setMediaStream(stream)
			}
		} catch (err) {
			const error = err as Error
			console.error('Permission error:', error)

			if (error.name === 'NotAllowedError') {
				setCameraStatus('denied')
				setMicStatus('denied')
				setErrorMessage(
					'Camera and microphone access was denied. Please allow access in your browser settings.'
				)
			} else if (error.name === 'NotFoundError') {
				setErrorMessage(
					'No camera or microphone found. Please connect a device and try again.'
				)
				setCameraStatus('error')
				setMicStatus('error')
			} else {
				setErrorMessage(
					`An error occurred: ${error.message}. Please try again.`
				)
				setCameraStatus('error')
				setMicStatus('error')
			}
		} finally {
			setIsRequesting(false)
		}
	}, [setMediaStream])

	const handleContinue = useCallback(() => {
		if (cameraStatus === 'granted' && micStatus === 'granted') {
			setPermissionsGranted(true)
		}
	}, [cameraStatus, micStatus, setPermissionsGranted])

	// Cleanup ONLY on unmount - use ref to check if we should stop tracks
	useEffect(() => {
		return () => {
			// Only stop tracks if permissions weren't granted (stream not passed to context)
			if (streamRef.current && !permissionsGrantedRef.current) {
				console.log('Cleanup: stopping tracks')
				streamRef.current.getTracks().forEach((track) => track.stop())
			}
			if (animationFrameRef.current) {
				cancelAnimationFrame(animationFrameRef.current)
			}
			if (audioContextRef.current) {
				audioContextRef.current.close()
			}
		}
	}, []) // Empty deps - only runs on unmount

	const bothGranted = cameraStatus === 'granted' && micStatus === 'granted'
	const hasStream = localStream !== null

	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-muted/30 px-4">
			<div className="w-full max-w-lg space-y-8">
				<div className="text-center">
					<h1 className="text-3xl font-bold tracking-tight">
						Before we begin
					</h1>
					<p className="mt-2 text-muted-foreground">
						This module requires camera and microphone access to record
						your responses.
					</p>
				</div>

				{/* Video Preview - always render video element */}
				<div className="relative mx-auto aspect-video w-full max-w-md overflow-hidden rounded-xl border bg-black shadow-lg">
					<video
						ref={videoRef}
						autoPlay
						playsInline
						muted
						className="h-full w-full scale-x-[-1] object-cover"
						style={{ display: hasStream ? 'block' : 'none' }}
					/>
					{!hasStream && (
						<div className="flex h-full items-center justify-center">
							<Camera className="size-16 text-muted-foreground/30" />
						</div>
					)}
				</div>

				{/* Permission Status */}
				<div className="space-y-3">
					<PermissionRow
						icon={Camera}
						label="Camera"
						status={cameraStatus}
					/>
					<PermissionRowWithLevel
						icon={Mic}
						label="Microphone"
						status={micStatus}
						audioLevel={audioLevel}
					/>
				</div>

				{/* Error Message */}
				{errorMessage && (
					<div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
						<AlertCircle className="mt-0.5 size-5 shrink-0" />
						<p>{errorMessage}</p>
					</div>
				)}

				{/* Action Buttons */}
				<div className="flex flex-col gap-3">
					{!bothGranted ? (
						<Button
							size="lg"
							onClick={requestPermissions}
							disabled={isRequesting}
							className="w-full"
						>
							{isRequesting
								? 'Requesting access...'
								: cameraStatus === 'pending'
									? 'Enable Camera & Microphone'
									: 'Try Again'}
						</Button>
					) : (
						<Button
							size="lg"
							onClick={handleContinue}
							className="w-full"
						>
							Continue to Module
						</Button>
					)}
				</div>

				{/* Help text */}
				<p className="text-center text-xs text-muted-foreground">
					Your camera and microphone are only used during this module.
					<br />
					You can revoke access anytime in your browser settings.
				</p>
			</div>
		</div>
	)
}

function PermissionRow({
	icon: Icon,
	label,
	status,
}: {
	icon: typeof Camera
	label: string
	status: PermissionStatus
}) {
	return (
		<div className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
			<div className="flex items-center gap-3">
				<Icon className="size-5 text-muted-foreground" />
				<span className="font-medium">{label}</span>
			</div>
			<StatusBadge status={status} />
		</div>
	)
}

function PermissionRowWithLevel({
	icon: Icon,
	label,
	status,
	audioLevel,
}: {
	icon: typeof Mic
	label: string
	status: PermissionStatus
	audioLevel: number
}) {
	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
				<div className="flex items-center gap-3">
					<Icon className="size-5 text-muted-foreground" />
					<span className="font-medium">{label}</span>
				</div>
				<StatusBadge status={status} />
			</div>
			{status === 'granted' && (
				<div className="px-1">
					<div className="flex items-center gap-2">
						<span className="text-xs text-muted-foreground">Level:</span>
						<div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
							<div
								className="h-full rounded-full bg-green-500"
								style={{ width: `${audioLevel}%` }}
							/>
						</div>
					</div>
					<p className="mt-1 text-xs text-muted-foreground">
						Speak to test your microphone
					</p>
				</div>
			)}
		</div>
	)
}

function StatusBadge({ status }: { status: PermissionStatus }) {
	switch (status) {
		case 'granted':
			return (
				<span className="flex items-center gap-1.5 text-sm font-medium text-green-600">
					<CheckCircle2 className="size-4" />
					Enabled
				</span>
			)
		case 'denied':
			return (
				<span className="flex items-center gap-1.5 text-sm font-medium text-destructive">
					<AlertCircle className="size-4" />
					Denied
				</span>
			)
		case 'error':
			return (
				<span className="flex items-center gap-1.5 text-sm font-medium text-destructive">
					<AlertCircle className="size-4" />
					Error
				</span>
			)
		default:
			return (
				<span className="text-sm text-muted-foreground">
					Not requested
				</span>
			)
	}
}

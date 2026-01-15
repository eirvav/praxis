'use client'

import { useRef, useState } from 'react'
import { Upload, Video as VideoIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface VideoUploadSlideProps {
	videoTitle: string
	videoContext: string
	videoUrl: string
	onUpdate: (
		fields: Partial<{
			videoTitle: string
			videoContext: string
			videoUrl: string
		}>,
	) => void
	onSelectFile: (file: File | null, previewUrl?: string | null) => void
}

export function VideoUploadSlide({
	videoTitle,
	videoContext,
	videoUrl,
	onUpdate,
	onSelectFile,
}: VideoUploadSlideProps) {
	const fileInputRef = useRef<HTMLInputElement>(null)
	// Local state for previewing uploaded file before it's saved/uploaded to server
	// In a real app, this would handle the upload process
	const [previewUrl, setPreviewUrl] = useState<string | null>(videoUrl || null)
	const [error, setError] = useState<string | null>(null)

	const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0]
		if (file) {
			if (file.size > 50 * 1024 * 1024) {
				setError('Video must be 50MB or smaller.')
				event.target.value = ''
				return
			}

			setError(null)
			// For this UI demo, we'll create a local object URL
			const url = URL.createObjectURL(file)
			setPreviewUrl(url)
			onUpdate({ videoUrl: url })
			onSelectFile(file, url)
		}
	}

	const triggerFileInput = () => {
		fileInputRef.current?.click()
	}

	return (
		<div className='flex flex-col gap-6 p-0 h-full'>
			<div className='space-y-2'>
				<Label htmlFor='video-title'>Video Title</Label>
				<Input
					id='video-title'
					placeholder='Enter a title for this video'
					value={videoTitle || ''}
					onChange={(e) => onUpdate({ videoTitle: e.target.value })}
				/>
			</div>

			<div className='space-y-2'>
				<Label htmlFor='video-context'>Video Context (Optional)</Label>
				<Textarea
					id='video-context'
					placeholder='Provide context about what the video is about'
					className='min-h-[100px] resize-none'
					value={videoContext || ''}
					onChange={(e) => onUpdate({ videoContext: e.target.value })}
				/>
				<p className='text-xs text-muted-foreground'>
					This context will be shown to students to help them
					understand what to focus on.
				</p>
			</div>

			<div className='space-y-2'>
				<Label>Upload Video</Label>
				<div className='relative'>
					{previewUrl ? (
						<div className='relative h-42 w-full overflow-hidden rounded-md border bg-black'>
							<video
								src={previewUrl}
								controls
								className='h-full w-full object-contain'
							/>
							<div className='absolute top-4 right-4 z-10'>
								<Button
									variant='secondary'
									className='gap-2 bg-white text-black hover:bg-white/90'
									onClick={triggerFileInput}
								>
									<VideoIcon className='size-4' />
									Replace Video
								</Button>
							</div>
						</div>
					) : (
						<div
							role='button'
							tabIndex={0}
							onClick={triggerFileInput}
							onKeyDown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									triggerFileInput()
								}
							}}
							className='flex h-48 w-full cursor-pointer flex-col items-center justify-center gap-4 rounded-md border border-dashed bg-muted/5 transition-colors hover:bg-muted/10'
						>
							<div className='rounded-full bg-muted p-4'>
								<Upload className='size-6 text-muted-foreground' />
							</div>
							<div className='text-center'>
								<p className='font-medium'>
									Click to upload video
								</p>
								<p className='text-xs text-muted-foreground'>
									MP4, WebM, or MOV (max. 50MB)
								</p>
							</div>
						</div>
					)}
					<input
						ref={fileInputRef}
						type='file'
						accept='video/mp4,video/webm,video/quicktime'
						className='hidden'
						onChange={handleFileSelect}
					/>
					{error ? (
						<p className='mt-2 text-xs text-destructive'>
							{error}
						</p>
					) : null}
				</div>
			</div>
		</div>
	)
}


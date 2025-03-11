'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader, Search, X } from 'lucide-react'
import { useState, useTransition, useEffect } from 'react'
import { Toaster, toast } from 'sonner'

export const SearchUsers = () => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(() => searchParams.get('search') || '')
  const [isPending, startTransition] = useTransition()

  // Keep query in sync with URL parameters
  useEffect(() => {
    setQuery(searchParams.get('search') || '')
  }, [searchParams])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(() => {
      if (query.trim()) {
        router.push(`${pathname}?search=${encodeURIComponent(query.trim())}`)
        // Show loading toast
        toast.promise(
          // This is just to give feedback - search happens on server
          new Promise(resolve => setTimeout(resolve, 500)), 
          {
            loading: 'Searching for users...',
            success: 'Search results updated',
            error: 'Error searching for users'
          }
        )
      } else {
        router.push(pathname)
      }
    })
  }

  const handleClear = () => {
    setQuery('')
    startTransition(() => {
      router.push(pathname)
      toast.success('Search cleared')
    })
  }

  return (
    <>
      <Toaster position="top-center" />
      <form onSubmit={handleSearch} className="flex w-full max-w-lg items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="search"
            name="search"
            type="text"
            placeholder="Search users by name or email..."
            className="pl-8"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isPending}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Searching...
            </>
          ) : (
            'Search'
          )}
        </Button>
        {query && (
          <Button 
            type="button" 
            variant="outline"
            onClick={handleClear}
            disabled={isPending}
          >
            Clear
          </Button>
        )}
      </form>
    </>
  )
}
import { createBrowserClient } from '@supabase/ssr'

function getPublishableKey() {
	return (
		process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
		process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
	)
}

export function createClient() {
	const publishableKey = getPublishableKey()
	if (!publishableKey) {
		throw new Error('Missing Supabase publishable key.')
	}

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
		publishableKey,
	)
}

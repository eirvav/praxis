export {}

declare global {
	const describe: (name: string, fn: () => void) => void
	const it: (name: string, fn: () => void) => void
	const test: (name: string, fn: () => void) => void
	const expect: {
		<T>(actual: T): {
			toBe: (expected: T) => void
			toContain: (expected: string) => void
			toBeTruthy: () => void
			toBeFalsy: () => void
		}
	}
}


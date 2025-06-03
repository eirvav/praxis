'use client'

import { SignIn } from '@clerk/nextjs'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function SignInPage() {
  const { isSignedIn, user, isLoaded } = useUser()
  const router = useRouter()

  useEffect(() => {
    // Only proceed if Clerk has loaded and user is signed in
    if (isLoaded && isSignedIn && user) {
      // Add a small delay to ensure all authentication processes are complete
      const timeoutId = setTimeout(() => {
        // Get user role from public metadata
        const userRole = user.publicMetadata?.role as string | undefined
        
        // Determine redirect path based on role
        let redirectPath = '/student' // default
        if (userRole === 'admin') {
          redirectPath = '/admin'
        } else if (userRole === 'teacher') {
          redirectPath = '/teacher'
        }
        
        // Force navigation - this helps with Safari's redirect issues
        router.push(redirectPath)
      }, 100) // Small delay to ensure state is settled

      return () => clearTimeout(timeoutId)
    }
  }, [isLoaded, isSignedIn, user, router])

  return (
    <div className="w-full">
      <div className="mb-6 sm:mb-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">Hi there!</h2>
        <p className="text-gray-500">Please sign in to praXis!</p>
      </div>

      <SignIn
        appearance={{
          variables: {
            colorPrimary: '#4f46e5',
            colorText: '#111827',
            colorTextSecondary: '#6B7280',
            colorBackground: 'white',
            colorInputBackground: 'white',
            colorInputText: '#111827',
            fontFamily: 'inherit',
            borderRadius: '0.5rem',
            spacingUnit: '0.25rem',
          },
          elements: {
            rootBox: {
              width: '100%',
            },
            card: {
              border: 'none',
              boxShadow: 'none',
              backgroundColor: 'transparent',
              width: '100%',
            },
            form: {
              gap: '1rem',
              width: '100%',
            },
            formButtonPrimary: {
              backgroundColor: '#4f46e5',
              fontSize: '0.875rem',
              textTransform: 'none',
              padding: '0.75rem 1.25rem',
              fontWeight: 500,
              width: '100%',
              '&:hover': {
                backgroundColor: '#4338ca',
              },
            },
            formFieldInput: {
              width: '100%',
              fontSize: '0.875rem',
              padding: '0.75rem',
              paddingRight: '2.5rem',
              borderColor: '#E5E7EB',
              '@media (max-width: 640px)': {
                fontSize: '1rem',
                padding: '0.875rem',
                paddingRight: '2.75rem',
              },
              '&:focus': {
                borderColor: '#4f46e5',
                boxShadow: '0 0 0 1px #4f46e5',
              },
            },
            header: {
              display: 'none',
            },
            footer: {
              '& + div': {
                fontSize: '0.875rem',
                color: '#6B7280',
                '& a': {
                  color: '#4f46e5',
                  fontWeight: 500,
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                },
              },
            },
            formFieldLabel: {
              fontSize: '0.875rem',
              color: '#374151',
              fontWeight: 500,
              marginBottom: '0.5rem',
            },
            formFieldAction: {
              color: '#4f46e5',
              fontSize: '0.875rem',
              '&:hover': {
                color: '#4338ca',
                textDecoration: 'underline',
              },
            },
            formFieldRow: {
              marginBottom: '0.5rem',
              width: '100%',
            },
            formButtonRow: {
              marginTop: '1.5rem',
              width: '100%',
            },
            otherMethods: {
              marginTop: '1.5rem',
              width: '100%',
            },
            formFieldInputShowPasswordButton: {
              right: '0.75rem',
              color: '#6B7280',
              width: '1.5rem',
              height: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              '@media (max-width: 640px)': {
                width: '1.5rem',
                height: '1.5rem',
              },
              '&:hover': {
                color: '#4B5563',
              },
            },
            dividerRow: {
              marginTop: '1.5rem',
              marginBottom: '1.5rem',
              width: '100%',
            },
            dividerLine: {
              borderColor: '#E5E7EB',
            },
            dividerText: {
              color: '#6B7280',
              fontSize: '0.875rem',
            },
            alternativeMethods: {
              width: '100%',
              '& button': {
                width: '100%',
                marginBottom: '0.75rem',
                padding: '0.75rem 1.25rem',
                borderColor: '#E5E7EB',
                '@media (max-width: 640px)': {
                  padding: '0.875rem 1.25rem',
                },
                '&:hover': {
                  backgroundColor: '#F9FAFB',
                },
              },
            },
          },
          layout: {
            socialButtonsPlacement: "bottom",
            showOptionalFields: false,
            logoPlacement: "none",
          },
        }}
      />
    </div>
  )
}
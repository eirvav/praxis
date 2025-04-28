import { Waitlist } from '@clerk/nextjs'

export default function WaitlistPage() {
  return (
    <div className="flex justify-center w-full">
      <Waitlist
        appearance={{
          variables: {
            colorPrimary: '#4f46e5',
            colorText: '#4338ca',
            colorTextSecondary: '#4f46e5',
            colorBackground: 'transparent',
            colorInputBackground: 'white',
            colorInputText: '#1e1b4b',
            fontFamily: 'inherit',
            borderRadius: '0.5rem',
          },
          elements: {
            formButtonPrimary: {
              backgroundColor: '#4f46e5',
              fontSize: '14px',
              textTransform: 'none',
              fontWeight: 500,
              '&:hover': {
                backgroundColor: '#4338ca',
              },
            },
            card: {
              backgroundColor: 'transparent',
              boxShadow: 'none',
              width: '100%',
              border: 'none',
            },
            header: {
              display: 'none',
            },
            headerTitle: {
              display: 'none',
            },
            headerSubtitle: {
              display: 'none',
            },
            socialButtonsBlockButton: {
              border: '1px solid #e0e7ff',
              color: '#4f46e5',
              '&:hover': {
                backgroundColor: '#f5f3ff',
              },
            },
            dividerLine: {
              backgroundColor: '#c7d2fe',
            },
            dividerText: {
              color: '#4f46e5',
            },
            formFieldLabel: {
              color: '#4338ca',
              fontWeight: 500,
              fontSize: '0.875rem',
            },
            formFieldInput: {
              border: '1px solid #c7d2fe',
              backgroundColor: 'white',
              padding: '0.625rem',
              '&:focus': {
                borderColor: '#4f46e5',
                boxShadow: '0 0 0 1px #4f46e5',
              },
            },
            footerActionLink: {
              color: '#4f46e5',
              fontWeight: 500,
              '&:hover': {
                color: '#4338ca',
              },
            },
            logoBox: {
              display: 'none',
            },
            logoImage: {
              display: 'none',
            },
            identityPreviewEditButton: {
              color: '#4f46e5',
              '&:hover': {
                color: '#4338ca',
              },
            },
            identityPreviewText: {
              color: '#4338ca',
            },
            alertText: {
              color: '#4338ca',
            },
            formFieldAction: {
              color: '#4f46e5',
              '&:hover': {
                color: '#4338ca',
              },
            },
            form: {
              gap: '1.25rem',
            },
            footer: {
              backgroundColor: 'transparent',
              borderTop: 'none',
            },
            footerAction: {
              color: '#4f46e5',
              backgroundColor: 'transparent',
            },
            footerActionText: {
              color: '#4f46e5',
            },
            footerText: {
              color: '#4f46e5',
            },
            main: {
              backgroundColor: 'transparent',
            },
            rootBox: {
              backgroundColor: 'transparent',
              boxShadow: 'none',
            },
          },
          layout: {
            showOptionalFields: false,
            logoPlacement: "none",
            logoImageUrl: "",
          },
        }}
      />
    </div>
  )
} 
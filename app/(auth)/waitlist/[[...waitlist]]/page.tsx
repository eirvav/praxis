'use client';

import { Waitlist } from '@clerk/nextjs'
import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function WaitlistPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    // Check URL parameters first (for page refreshes)
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('status') === 'complete') {
      setIsSubmitted(true);
      return;
    }

    // ENHANCED DETECTION: Find and modify the form submit button directly
    const setupSubmitButtonListener = () => {
      const waitlistForm = document.querySelector('form');
      if (waitlistForm) {
        const submitButton = waitlistForm.querySelector('button[type="submit"]') as HTMLButtonElement;
        if (submitButton) {
          // Create a wrapper for the original click handler
          const originalClickHandler = submitButton.onclick;
          submitButton.onclick = (e: MouseEvent) => {
            // Call original handler
            if (originalClickHandler) {
              originalClickHandler.call(submitButton, e);
            }
            
            // Get email input
            const emailInput = waitlistForm.querySelector('input[type="email"]') as HTMLInputElement;
            if (emailInput && emailInput.value && emailInput.validity.valid) {
              // Set a timeout to check for errors after submission
              setTimeout(() => {
                const errors = document.querySelectorAll('.cl-formFieldError');
                if (errors.length === 0) {
                  setIsSubmitted(true);
                  // Update URL for refreshes
                  const url = new URL(window.location.href);
                  url.searchParams.set('status', 'complete');
                  window.history.replaceState({}, '', url);
                }
              }, 800); // Short delay to allow Clerk to process
            }
          };
        }
      }
    };
    
    // Set up mutation observer to detect Clerk's success message
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          // Look for the submit button if not found yet
          if (!document.querySelector('form button[type="submit"]')) {
            setupSubmitButtonListener();
          }
          
          // Check for Clerk's success messages
          const clerkSuccess = document.querySelector('[data-localization-key*="waitlistSubmitted"]');
          if (clerkSuccess) {
            setIsSubmitted(true);
            // Update URL for refreshes
            const url = new URL(window.location.href);
            url.searchParams.set('status', 'complete');
            window.history.replaceState({}, '', url);
            observer.disconnect();
          }
        }
      }
    });
    
    // Start observing DOM changes
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // Initial setup attempt (in case elements already exist)
    setupSubmitButtonListener();
    
    // Fallback method: direct form submission listener
    const handleFormSubmit = () => {
      // Delay to allow processing
      setTimeout(() => {
        const errors = document.querySelectorAll('.cl-formFieldError');
        if (errors.length === 0) {
          setIsSubmitted(true);
          // Update URL
          const url = new URL(window.location.href);
          url.searchParams.set('status', 'complete');
          window.history.replaceState({}, '', url);
        }
      }, 1000);
    };
    
    // Attempt to find the form periodically
    const formFinder = setInterval(() => {
      const form = document.querySelector('form');
      if (form) {
        form.addEventListener('submit', handleFormSubmit as EventListener);
        clearInterval(formFinder);
      }
    }, 300);
    
    return () => {
      observer.disconnect();
      clearInterval(formFinder);
      const form = document.querySelector('form');
      if (form) form.removeEventListener('submit', handleFormSubmit as EventListener);
    };
  }, []);
  
  // Show our custom success message
  if (isSubmitted) {
    return (
      <div className="flex justify-center w-full">
        <div className="text-center p-6" style={{opacity: 1, animation: 'fadeIn 0.5s ease-in'}}>
          <div className="flex justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#4f46e5" className="w-16 h-16">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-indigo-600 mb-2">You're on the waitlist!</h3>
          <p className="text-indigo-900 mb-4">
            Thank you for joining our waitlist. We'll notify you as soon as your account is ready.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-0">
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Image src="/logo.svg" alt="Praxis Logo" width={27} height={28} priority />
          <span className="text-xl font-semibold text-indigo-600">Praxis</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">Join the <span className="text-indigo-600">waitlist</span></h2>
        <p className="text-gray-500">Be the first to know when we launch</p>
      </div>

      <Waitlist
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
'use client';

import { Waitlist } from '@clerk/nextjs';
import { useState, useEffect } from 'react';

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
  
  // Render Clerk's waitlist component with our styling
  return (
    <div className="flex justify-center w-full">
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
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
      {/* Test button removed for production */}
    </div>
  );
} 
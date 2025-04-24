import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="flex justify-center w-full">
      <SignUp
        appearance={{
          elements: {
            formButtonPrimary: 
              "bg-black hover:bg-gray-800 text-sm normal-case",
            card: "bg-white shadow-none",
            headerTitle: "text-gray-900",
            headerSubtitle: "text-gray-600",
            socialButtonsBlockButton: 
              "border-gray-200 text-gray-600 hover:bg-gray-50",
            dividerLine: "bg-gray-200",
            dividerText: "text-gray-600",
            formFieldLabel: "text-gray-700",
            formFieldInput: 
              "border-gray-200 focus:border-black focus:ring-black",
            footerActionLink: 
              "text-black hover:text-gray-800",
          },
          layout: {
            socialButtonsPlacement: "bottom",
            showOptionalFields: false,
          },
        }}
      />
    </div>
  )
}
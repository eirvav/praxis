interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepLabels?: string[];
}

export function StepIndicator({ 
  currentStep, 
  totalSteps, 
  stepLabels = ["Module Overview", "Add Content", "Preview & Confirm"] 
}: StepIndicatorProps) {
  return (
    <div className="border-b bg-white">
      {/* Current step label */}
      <div className="px-4 py-3 flex justify-center">
        <div className="text-center">
          <div className="flex items-center gap-2 text-lg">
            <span className="font-semibold">Step {currentStep}:</span>
            <span className="text-gray-700">{stepLabels[currentStep - 1]}</span>
          </div>
        </div>
      </div>
      
      {/* Step progress bar */}
      <div className="px-6 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <div key={index} className="flex items-center">
              {/* Step circle */}
              <div className="relative">
                <div 
                  className={`h-10 w-10 rounded-full flex items-center justify-center
                    ${currentStep > index ? 'bg-primaryStyling text-white' : 'bg-gray-200 text-gray-500'}`}
                >
                  {index + 1}
                </div>
                
                {/* Progress line */}
                {index < totalSteps - 1 && (
                  <div className="absolute top-1/2 -translate-y-1/2 left-full w-[calc(100%_+_1.5rem)]">
                    <div className="h-[2px] w-full mx-2">
                      <div 
                        className={`h-full transition-all duration-300 ease-in-out
                          ${currentStep > index + 1 ? 'bg-primaryStyling' : 'bg-gray-200'}`}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default StepIndicator; 
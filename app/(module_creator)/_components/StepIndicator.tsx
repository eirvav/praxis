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
        <div className="max-w-3xl mx-auto flex items-center gap-0">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <div key={index} className="flex-1 flex items-center">
              <div 
                className={`h-10 w-10 rounded-full flex items-center justify-center
                  ${currentStep > index ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}`}
              >
                {index + 1}
              </div>
              
              {index < totalSteps - 1 && (
                <div 
                  className={`h-1 flex-1 
                    ${currentStep > index + 1 ? 'bg-indigo-600' : 'bg-gray-200'}`}
                ></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default StepIndicator; 
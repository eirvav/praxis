import { SmartphoneIcon } from "lucide-react";

export default function MobileWarning() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8 p-8 bg-white/10 rounded-xl backdrop-blur-sm shadow-xl">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="absolute -top-2 left-1/2 -translate-x-1/2">
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center animate-pulse">
                <SmartphoneIcon className="w-10 h-10 text-red-500" />
              </div>
            </div>
          </div>
          
          <div className="pt-20">
            <h1 className="text-2xl font-bold text-white mt-4">
              Desktop Only Access
            </h1>
            <p className="mt-4 text-gray-300 text-sm leading-relaxed">
              For the best experience and full functionality, please use a <span className="font-bold">laptop</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 
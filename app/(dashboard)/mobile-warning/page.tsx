'use client'

import Image from "next/image";
import { MapPin, Sparkles, Users } from "lucide-react";

export default function MobileWarning() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-indigo-900 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
      </div>
      
      <div className="max-w-sm w-full space-y-8 p-8 bg-white/10 rounded-2xl backdrop-blur-md shadow-xl border border-white/20 relative">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="absolute -top-20 left-1/2 -translate-x-1/2">
              <div className="w-28 h-28 rounded-full bg-white/20 backdrop-blur-sm p-2 shadow-xl">
                <Image
                  src="/praxisavatar.png"
                  alt="Praxis Avatar"
                  width={200}
                  height={200}
                  className="w-full h-full object-contain animate-bounce-slow"
                />
              </div>
            </div>
          </div>
          
          <div className="pt-14">
            <h1 className="text-2xl font-bold text-white mt-4">
              Hey there! 👋
            </h1>
            
            <div className="mt-6 space-y-6">
              <div className="flex items-center justify-center gap-8">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-2">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-white/80 text-sm">Find our booth</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-2">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-white/80 text-sm">Live demo</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-2">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-white/80 text-sm">Meet the team</p>
                </div>
              </div>
              
              <p className="text-white/90 text-base">
                Experience our product in person!
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx global>{`
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
} 
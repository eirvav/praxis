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
              Mobile version coming soon! 🚀
            </h1>
            
            <p className="mt-4 text-white/90 text-base">
              For now, we'd love to give you a personal experience:
            </p>
            
            <div className="mt-8 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-indigo-500 flex-shrink-0 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-white/90 text-sm">
                    <span className="font-semibold block text-white">Where to find us</span>
                    Look for us in the main exhibition area
                  </p>
                </div>
                
                <div className="flex items-center gap-3 text-left">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex-shrink-0 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-white/90 text-sm">
                    <span className="font-semibold block text-white">What to expect</span>
                    Test praxis for yourself!
                  </p>
                </div>
                
                <div className="flex items-center gap-3 text-left">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-fuchsia-400 to-indigo-500 flex-shrink-0 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-white/90 text-sm">
                    <span className="font-semibold block text-white">Who you'll meet</span>
                    Our friendly team is ready to assist you
                  </p>
                </div>
              </div>
              
              <div className="pt-2">
                <p className="text-white/80 text-sm italic">
                  We can't wait to show you what we've built!
                </p>
              </div>
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
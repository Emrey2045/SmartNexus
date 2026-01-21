import { Outlet } from "react-router-dom";
import { useMemo } from "react";

export default function AuthLayout() {
  // Sabit particle pozisyonları (her render'da değişmemesi için)
  const particles = useMemo(() => {
    return Array.from({ length: 55 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 3 + Math.random() * 4,
      size: i < 30 ? 'small' : i < 45 ? 'medium' : 'star',
    }));
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center px-4 py-12">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating Blob Circles */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
        
        {/* Floating Particles */}
        {particles.map((particle) => {
          if (particle.size === 'small') {
            return (
              <div
                key={`particle-${particle.id}`}
                className="absolute w-1.5 h-1.5 bg-white/50 rounded-full animate-float"
                style={{
                  left: `${particle.left}%`,
                  top: `${particle.top}%`,
                  animationDelay: `${particle.delay}s`,
                  animationDuration: `${particle.duration}s`,
                }}
              />
            );
          } else if (particle.size === 'medium') {
            return (
              <div
                key={`particle-${particle.id}`}
                className="absolute w-3 h-3 bg-white/30 rounded-full animate-float"
                style={{
                  left: `${particle.left}%`,
                  top: `${particle.top}%`,
                  animationDelay: `${particle.delay}s`,
                  animationDuration: `${particle.duration}s`,
                }}
              />
            );
          } else {
            return (
              <div
                key={`particle-${particle.id}`}
                className="absolute w-1 h-1 bg-white rounded-full animate-twinkle"
                style={{
                  left: `${particle.left}%`,
                  top: `${particle.top}%`,
                  animationDelay: `${particle.delay}s`,
                  boxShadow: '0 0 6px 2px rgba(255,255,255,0.8)',
                }}
              />
            );
          }
        })}

        {/* Rotating Orbs */}
        <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-white/20 rounded-full blur-2xl animate-spin-slow"></div>
        <div className="absolute bottom-1/4 left-1/4 w-24 h-24 bg-purple-300/30 rounded-full blur-xl animate-spin-reverse"></div>
        <div className="absolute top-1/2 right-1/3 w-20 h-20 bg-pink-300/30 rounded-full blur-lg animate-spin-slow"></div>

        {/* Moving Lines */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-1/4 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-slide-right"></div>
          <div className="absolute top-1/2 right-0 w-1 h-full bg-gradient-to-b from-transparent via-white/20 to-transparent animate-slide-down"></div>
          <div className="absolute bottom-1/4 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-slide-left"></div>
        </div>

        {/* Wave Animation */}
        <div className="absolute bottom-0 left-0 w-full h-32 overflow-hidden">
          <div className="absolute bottom-0 left-0 w-full h-full bg-gradient-to-t from-white/10 to-transparent animate-wave"></div>
        </div>
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-indigo-600/20 via-transparent to-transparent"></div>
      </div>

      {/* Animated Logo in Background */}
      <div className="absolute top-10 left-1/2 transform -translate-x-1/2 z-0">
        <div className="text-8xl font-bold bg-gradient-to-r from-white/20 to-white/10 bg-clip-text text-transparent animate-pulse">
          SmartNexus
        </div>
      </div>

      {/* Content Card */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/20 bg-white/90 backdrop-blur-md p-8 shadow-2xl">
        <Outlet />
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
            opacity: 0.4;
          }
          25% {
            transform: translateY(-20px) translateX(10px);
            opacity: 0.6;
          }
          50% {
            transform: translateY(-40px) translateX(-10px);
            opacity: 0.8;
          }
          75% {
            transform: translateY(-20px) translateX(5px);
            opacity: 0.6;
          }
        }
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes spin-reverse {
          from {
            transform: rotate(360deg);
          }
          to {
            transform: rotate(0deg);
          }
        }
        @keyframes slide-right {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        @keyframes slide-left {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        @keyframes slide-down {
          0% {
            transform: translateY(-100%);
          }
          100% {
            transform: translateY(100%);
          }
        }
        @keyframes wave {
          0%, 100% {
            transform: translateX(0) translateY(0);
          }
          25% {
            transform: translateX(25%) translateY(-10px);
          }
          50% {
            transform: translateX(50%) translateY(0);
          }
          75% {
            transform: translateX(75%) translateY(-10px);
          }
        }
        @keyframes twinkle {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.5);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animate-float {
          animation: float linear infinite;
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        .animate-spin-reverse {
          animation: spin-reverse 15s linear infinite;
        }
        .animate-slide-right {
          animation: slide-right 8s linear infinite;
        }
        .animate-slide-left {
          animation: slide-left 10s linear infinite;
        }
        .animate-slide-down {
          animation: slide-down 12s linear infinite;
        }
        .animate-wave {
          animation: wave 6s ease-in-out infinite;
        }
        .animate-twinkle {
          animation: twinkle 2s ease-in-out infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}

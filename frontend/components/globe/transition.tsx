"use client"

import { useEffect, useState } from "react"
import { useAppState } from "@/lib/app-state"

export function Transition() {
  const selectedStadium = useAppState((state) => state.selectedStadium)
  const setView = useAppState((state) => state.setView)
  const [phase, setPhase] = useState<"zoom" | "fade">("zoom")

  useEffect(() => {
    // Phase 1: Zoom animation (1.5s)
    const zoomTimer = setTimeout(() => {
      setPhase("fade")
    }, 1500)

    // Phase 2: Fade complete, show dashboard (2.5s total)
    const fadeTimer = setTimeout(() => {
      setView("dashboard")
    }, 2500)

    return () => {
      clearTimeout(zoomTimer)
      clearTimeout(fadeTimer)
    }
  }, [setView])

  return (
    <div className="fixed inset-0 bg-background z-50 flex items-center justify-center overflow-hidden">
      {/* Animated zoom effect */}
      <div 
        className={`absolute inset-0 flex items-center justify-center transition-all duration-[1.5s] ease-in-out ${
          phase === "zoom" ? "scale-100 opacity-100" : "scale-150 opacity-0"
        }`}
      >
        {/* Circular expanding ring */}
        <div className="relative">
          <div className="w-32 h-32 rounded-full border-2 border-lavender/50 animate-ping" />
          <div className="absolute inset-0 w-32 h-32 rounded-full border border-amethyst animate-pulse" />
        </div>
      </div>

      {/* Stadium name reveal */}
      <div 
        className={`text-center z-10 transition-all duration-1000 ${
          phase === "zoom" 
            ? "translate-y-0 opacity-100" 
            : "translate-y-10 opacity-0"
        }`}
      >
        <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground mb-2">
          Entering
        </p>
        <h2 className="text-4xl font-bold text-lavender">
          {selectedStadium?.name}
        </h2>
        <p className="text-muted-foreground mt-2">
          {selectedStadium?.city}, {selectedStadium?.country}
        </p>
      </div>

      {/* Radial lines animation */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className={`absolute top-1/2 left-1/2 h-px origin-left bg-gradient-to-r from-transparent via-amethyst/30 to-transparent transition-all duration-[1.5s] ${
              phase === "zoom" ? "w-0" : "w-[150vw]"
            }`}
            style={{
              transform: `rotate(${i * 30}deg)`,
              transitionDelay: `${i * 50}ms`,
            }}
          />
        ))}
      </div>

      {/* Final fade overlay */}
      <div 
        className={`absolute inset-0 bg-background transition-opacity duration-500 ${
          phase === "fade" ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  )
}

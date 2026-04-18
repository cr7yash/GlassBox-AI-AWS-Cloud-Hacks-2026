"use client"

import dynamic from "next/dynamic"
import { useAppState } from "@/lib/app-state"
import { Transition } from "@/components/globe/transition"
import { Dashboard } from "@/components/dashboard/dashboard"

// Dynamic import for 3D components to avoid SSR issues
const Globe = dynamic(() => import("@/components/globe/globe").then((mod) => mod.Globe), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-lavender border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading GlassBox AI...</p>
      </div>
    </div>
  ),
})

export default function Home() {
  const view = useAppState((state) => state.view)

  return (
    <main className="min-h-screen bg-background">
      {view === "globe" && <Globe />}
      {view === "transition" && <Transition />}
      {view === "dashboard" && <Dashboard />}
    </main>
  )
}

"use client"

import { Suspense, useRef, useMemo } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Stars, Html, useTexture, Line } from "@react-three/drei"
import type { Group, Mesh } from "three"
import { Vector3 } from "three"
import { stadiums, latLngToVector3, type Stadium } from "@/lib/stadiums"
import { useAppState } from "@/lib/app-state"
import { GlobeMagnitudeBars } from "@/components/globe/globe-magnitude-bars"

const EARTH_TEXTURE =
  "https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg"

const EARTH_RADIUS = 2

function Earth() {
  const meshRef = useRef<Mesh>(null)
  const map = useTexture(EARTH_TEXTURE)

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
      <meshStandardMaterial map={map} roughness={0.62} metalness={0.05} />
    </mesh>
  )
}

/** Great-circle–style chords on the shell (decorative, rotates with globe). */
function StadiumArcs() {
  const shellR = EARTH_RADIUS * 1.035
  const lineSets = useMemo(() => {
    const surface = stadiums.map((s) => {
      const { x, y, z } = latLngToVector3(s.lat, s.lng, shellR)
      return new Vector3(x, y, z)
    })
    const segs = 28
    const sets: Vector3[][] = []
    for (let i = 0; i < surface.length; i++) {
      const a = surface[i]
      const b = surface[(i + 1) % surface.length]
      const pts: Vector3[] = []
      for (let k = 0; k <= segs; k++) {
        const t = k / segs
        pts.push(a.clone().lerp(b, t).normalize().multiplyScalar(shellR))
      }
      sets.push(pts)
    }
    return sets
  }, [])

  return (
    <>
      {lineSets.map((pts, i) => (
        <Line key={i} points={pts} color="#e879f9" opacity={0.22} transparent lineWidth={1} />
      ))}
    </>
  )
}

/**
 * Single rigid body: Earth texture, magnitude bars, stadium pins, and arcs
 * all share this rotation so markers stay glued to geography (WebGL Globe style).
 */
function RotatingGlobeBody({ onSelect }: { onSelect: (s: Stadium) => void }) {
  const groupRef = useRef<Group>(null)

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001
    }
  })

  return (
    <group ref={groupRef}>
      <Suspense
        fallback={
          <mesh>
            <sphereGeometry args={[EARTH_RADIUS, 32, 32]} />
            <meshStandardMaterial color="#1a2744" emissive="#2d1b4e" emissiveIntensity={0.25} />
          </mesh>
        }
      >
        <Earth />
      </Suspense>

      <GlobeMagnitudeBars earthRadius={EARTH_RADIUS} />
      <StadiumArcs />

      {stadiums.map((stadium) => (
        <StadiumPin key={stadium.id} stadium={stadium} onSelect={onSelect} />
      ))}
    </group>
  )
}

function StadiumPin({ stadium, onSelect }: { stadium: Stadium; onSelect: (s: Stadium) => void }) {
  const groupRef = useRef<Group>(null)
  const position = useMemo(() => {
    const { x, y, z } = latLngToVector3(stadium.lat, stadium.lng, EARTH_RADIUS * 1.028)
    return [x, y, z] as [number, number, number]
  }, [stadium])

  return (
    <group ref={groupRef} position={position}>
      {/* Pin marker */}
      <mesh onClick={() => onSelect(stadium)}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial 
          color="#c4b5fd" 
          emissive="#8b5cf6" 
          emissiveIntensity={0.5} 
        />
      </mesh>
      
      {/* Pulsing ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.06, 0.08, 32]} />
        <meshBasicMaterial color="#a78bfa" transparent opacity={0.6} />
      </mesh>

      {/* Label */}
      <Html
        position={[0, 0.15, 0]}
        center
        style={{
          pointerEvents: "auto",
          userSelect: "none",
        }}
      >
        <button
          onClick={() => onSelect(stadium)}
          className="group flex flex-col items-center cursor-pointer"
        >
          <div className="px-3 py-1.5 bg-charcoal/90 backdrop-blur-sm border border-amethyst/30 rounded-lg shadow-lg transition-all group-hover:border-lavender group-hover:scale-105">
            <span className="text-xs font-medium text-lavender whitespace-nowrap">
              {stadium.name}
            </span>
          </div>
          <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-amethyst/30" />
        </button>
      </Html>
    </group>
  )
}

function GlobeScene() {
  const selectStadium = useAppState((state) => state.selectStadium)

  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 3, 5]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.3} color="#8b5cf6" />
      
      <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />

      <RotatingGlobeBody onSelect={selectStadium} />

      <OrbitControls 
        enableZoom={true} 
        enablePan={false} 
        minDistance={3} 
        maxDistance={8}
        autoRotate
        autoRotateSpeed={0.5}
      />
    </>
  )
}

export function Globe() {
  return (
    <div className="relative h-screen w-full bg-background">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <GlobeScene />
      </Canvas>
      
      {/* Overlay UI */}
      <div className="absolute top-8 left-8 z-10">
        <h1 className="text-3xl font-bold text-lavender tracking-tight">
          GlassBox AI
        </h1>
        <p className="text-muted-foreground mt-1">
          Select a stadium to begin audit
        </p>
      </div>

      {/* Legend */}
      <div className="absolute bottom-8 left-8 z-10 flex items-center gap-3 px-4 py-3 bg-card/80 backdrop-blur-sm border border-border rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-lavender animate-pulse" />
          <span className="text-sm text-muted-foreground">Stadium Location</span>
        </div>
        <span className="text-muted-foreground/50">|</span>
        <span className="text-sm text-muted-foreground">Click to select</span>
      </div>
    </div>
  )
}

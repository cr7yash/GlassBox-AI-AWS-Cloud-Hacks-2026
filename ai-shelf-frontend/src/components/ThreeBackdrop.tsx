"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float } from "@react-three/drei";
import * as THREE from "three";
import { useMemo, useRef } from "react";

function StadiumWire() {
  const group = useRef<THREE.Group>(null);

  const ringGeo = useMemo(() => new THREE.TorusGeometry(3.2, 0.22, 18, 220), []);
  const innerGeo = useMemo(() => new THREE.TorusGeometry(2.2, 0.09, 14, 180), []);
  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#b18fcf"),
        emissive: new THREE.Color("#d8d8f6"),
        emissiveIntensity: 0.12,
        metalness: 0.6,
        roughness: 0.22
      }),
    []
  );
  const wire = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color("#d8d8f6"),
        transparent: true,
        opacity: 0.28,
        wireframe: true
      }),
    []
  );

  const beamGeo = useMemo(() => new THREE.CylinderGeometry(0.02, 0.02, 3.8, 10), []);
  const beamMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color("#d8d8f6"),
        transparent: true,
        opacity: 0.12
      }),
    []
  );

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (group.current) {
      group.current.rotation.y = t * 0.12;
      group.current.rotation.x = -0.35 + Math.sin(t * 0.25) * 0.03;
    }
  });

  return (
    <group ref={group} position={[0, -0.2, 0]}>
      <Float speed={1.0} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh geometry={ringGeo} material={mat} />
        <mesh geometry={ringGeo} material={wire} />
        <mesh geometry={innerGeo} material={wire} />

        {Array.from({ length: 10 }).map((_, i) => {
          const a = (i / 10) * Math.PI * 2;
          return (
            <mesh
              key={i}
              geometry={beamGeo}
              material={beamMat}
              position={[Math.cos(a) * 2.6, 0.3, Math.sin(a) * 2.6]}
              rotation={[0, a, Math.PI / 2]}
            />
          );
        })}
      </Float>
    </group>
  );
}

export function ThreeBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-20 opacity-70">
      <Canvas
        camera={{ position: [0, 0.6, 7.6], fov: 42 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <color attach="background" args={["#000000"]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[3, 5, 2]} intensity={1.1} color="#d8d8f6" />
        <directionalLight position={[-4, -2, 4]} intensity={0.6} color="#b18fcf" />

        <StadiumWire />
        <Environment preset="city" />
      </Canvas>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-bg/10 via-bg/30 to-bg" />
    </div>
  );
}


"use client"

import { useLayoutEffect, useMemo, useRef } from "react"
import type { InstancedMesh } from "three"
import {
  Color,
  CylinderGeometry,
  MeshStandardMaterial,
  Object3D,
  Quaternion,
  Vector3,
} from "three"
import { stadiums, latLngToVector3 } from "@/lib/stadiums"

const UP = new Vector3(0, 1, 0)

const SPIKE_COUNT = stadiums.length

/** One spike per stadium: magnitude from relative capacity (taller = larger venue). */
function stadiumSpikePoints(): { lat: number; lng: number; mag: number }[] {
  const caps = stadiums.map((s) => s.capacity)
  const minC = Math.min(...caps)
  const maxC = Math.max(...caps)
  return stadiums.map((s) => {
    const mag =
      maxC <= minC ? 0.62 : 0.38 + 0.62 * ((s.capacity - minC) / (maxC - minC))
    return { lat: s.lat, lng: s.lng, mag }
  })
}

type GlobeMagnitudeBarsProps = {
  /** Earth mesh radius (must match sphere in `Earth`). */
  earthRadius?: number
}

/**
 * Five WebGL-Globe–style bars — one per stadium — rigidly attached to the sphere.
 * @see https://github.com/dataarts/webgl-globe
 */
export function GlobeMagnitudeBars({ earthRadius = 2 }: GlobeMagnitudeBarsProps) {
  const ref = useRef<InstancedMesh>(null)
  const tmp = useMemo(() => new Object3D(), [])
  const q = useMemo(() => new Quaternion(), [])
  const geom = useMemo(() => new CylinderGeometry(0.03, 0.02, 1, 6), [])
  const mat = useMemo(
    () =>
      new MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.32,
        metalness: 0.2,
        emissive: "#5eead4",
        emissiveIntensity: 0.28,
        toneMapped: false,
      }),
    [],
  )
  const points = useMemo(() => stadiumSpikePoints(), [])

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return

    const n = new Vector3()
    const baseR = earthRadius * 1.002

    for (let i = 0; i < points.length; i++) {
      const { lat, lng, mag } = points[i]
      const p = latLngToVector3(lat, lng, 1)
      n.set(p.x, p.y, p.z).normalize()
      const h = 0.08 + mag * 0.42
      tmp.position.copy(n.clone().multiplyScalar(baseR + h * 0.5))
      q.setFromUnitVectors(UP, n)
      tmp.quaternion.copy(q)
      tmp.scale.set(1, h, 1)
      tmp.updateMatrix()
      mesh.setMatrixAt(i, tmp.matrix)

      const t = mag
      const c = new Color().setHSL(0.52 + t * 0.1, 0.5 + t * 0.2, 0.5 + t * 0.12)
      mesh.setColorAt(i, c)
    }

    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [earthRadius, points, q, tmp])

  return <instancedMesh ref={ref} args={[geom, mat, SPIKE_COUNT]} frustumCulled={false} />
}

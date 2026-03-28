"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function WireframeSphere() {
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    if (!meshRef.current) return;

    const time = state.clock.getElapsedTime();

    // Slow rotation on X and Y axes
    meshRef.current.rotation.x = time * 0.1;
    meshRef.current.rotation.y = time * 0.15;

    // Pulse scale between 0.95 and 1.05 using sin wave
    const scale = 1.0 + Math.sin(time * 0.8) * 0.05;
    meshRef.current.scale.setScalar(scale);
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <icosahedronGeometry args={[1, 1]} />
      <meshBasicMaterial
        color="#00FFFF"
        wireframe
        transparent
        opacity={0.3}
      />
    </mesh>
  );
}

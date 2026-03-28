"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function CyberGrid() {
  const groupRef = useRef<THREE.Group>(null!);

  const gridMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: new THREE.Color("#00FFFF"),
        transparent: true,
        opacity: 0.15,
      }),
    []
  );

  const innerGridMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: new THREE.Color("#00FFFF"),
        transparent: true,
        opacity: 0.08,
      }),
    []
  );

  useFrame((_, delta) => {
    if (groupRef.current) {
      // Scroll the grid forward continuously
      groupRef.current.position.z =
        (groupRef.current.position.z + delta * 0.5) % 1;
    }
  });

  return (
    <group ref={groupRef} position={[0, -2, 0]} rotation={[-0.15, 0, 0]}>
      {/* Primary grid */}
      <gridHelper
        args={[50, 50, "#00FFFF", "#00FFFF"]}
        material={gridMaterial}
      />
      {/* Secondary smaller overlay grid for depth */}
      <gridHelper
        args={[50, 150, "#00FFFF", "#00FFFF"]}
        material={innerGridMaterial}
      />
    </group>
  );
}

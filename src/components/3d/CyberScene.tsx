"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import CyberGrid from "./CyberGrid";
import FloatingParticles from "./FloatingParticles";
import WireframeSphere from "./WireframeSphere";

export default function CyberScene() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: "transparent" }}
      >
        <Suspense fallback={null}>
          <CyberGrid />
          <FloatingParticles />
          <WireframeSphere />
        </Suspense>
      </Canvas>
    </div>
  );
}

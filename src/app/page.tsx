import dynamic from "next/dynamic";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";

const CyberScene = dynamic(() => import("@/components/3d/CyberScene"), {
  ssr: false,
});

export default function Home() {
  return (
    <div className="relative min-h-screen bg-cyber-dark">
      {/* 3D Background */}
      <div className="fixed inset-0 z-0">
        <CyberScene />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <Navbar />
        <Hero />
        <Features />
        <HowItWorks />
        <CTA />
        <Footer />
      </div>
    </div>
  );
}

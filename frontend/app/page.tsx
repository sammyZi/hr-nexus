"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import PillarsSection from "@/components/landing/PillarsSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import BenefitsSection from "@/components/landing/BenefitsSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";

export default function LandingPage() {
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem("access_token");
        if (token) {
            router.push("/dashboard");
        }
    }, [router]);

    return (
        <div className="min-h-screen bg-white font-balsamiq">
            <Navbar />
            <HeroSection />
            <FeaturesSection />
            <PillarsSection />
            <HowItWorksSection />
            <BenefitsSection />
            <CTASection />
            <Footer />
        </div>
    );
}

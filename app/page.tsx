import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/acuasafe/HeroSection";
import { BillCheckerSection } from "@/components/landing/acuasafe/BillCheckerSection";
import { FeatureSection } from "@/components/landing/acuasafe/FeatureSection";
import { AboutSection } from "@/components/landing/acuasafe/AboutSection";
import { ServiceSection } from "@/components/landing/acuasafe/ServiceSection";
import { ChooseUsSection } from "@/components/landing/acuasafe/ChooseUsSection";
import { TariffSection } from "@/components/landing/acuasafe/TariffSection";
import { TestimonialSection } from "@/components/landing/acuasafe/TestimonialSection";
import { CtaSection } from "@/components/landing/acuasafe/CtaSection";
import { FooterSection } from "@/components/landing/acuasafe/FooterSection";

export default function LandingPage() {
    return (
        <main className="min-h-screen font-sans overflow-x-hidden">
            <Navbar />

            {/* 1. Hero Section */}
            <HeroSection />

            {/* 2. Bill Checker Section */}
            <BillCheckerSection />

            {/* 3. Features Section */}
            <FeatureSection />

            {/* 4. About Section */}
            <AboutSection />

            {/* 5. Services Section */}
            <ServiceSection />

            {/* 6. Choose Us Section */}
            <ChooseUsSection />

            {/* 7. Tariff Section (replaced Shop) */}
            <TariffSection />

            {/* 8. Testimonials */}
            <TestimonialSection />

            {/* 9. CTA Section */}
            <CtaSection />

            {/* 10. Footer */}
            <FooterSection />
        </main>
    );
}

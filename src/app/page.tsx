export const dynamic = "force-dynamic";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import ReviewsSection from "@/components/landing/ReviewsSection";
import PricingSection from "@/components/landing/PricingSection";
import Footer from "@/components/landing/Footer";

export default async function HomePage() {
    const session = await auth();
    if (session?.user) redirect("/dashboard");

    return (
        <main className="min-h-screen bg-[#0f172a]">
            <Navbar />
            <HeroSection />
            <FeaturesSection />
            <ReviewsSection />
            <PricingSection />
            <Footer />
        </main>
    );
}

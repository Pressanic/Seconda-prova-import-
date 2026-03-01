import ScrollToTop from "@/components/landing/ScrollToTop";
import LoadingScreen from "@/components/landing/LoadingScreen";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import LogoBar from "@/components/landing/LogoBar";
import ProductShowcaseSection from "@/components/landing/ProductShowcaseSection";
import ReviewsSection from "@/components/landing/ReviewsSection";
import PricingSection from "@/components/landing/PricingSection";
import FAQSection from "@/components/landing/FAQSection";
import FinalCTASection from "@/components/landing/FinalCTASection";
import Footer from "@/components/landing/Footer";

export default function HomePage() {
    return (
        <main className="min-h-screen bg-[#0f172a]">
            <LoadingScreen />
            <ScrollToTop />
            <Navbar />
            <HeroSection />
            <LogoBar />
            <ProductShowcaseSection />
            <ReviewsSection />
            <PricingSection />
            <FAQSection />
            <FinalCTASection />
            <Footer />
        </main>
    );
}

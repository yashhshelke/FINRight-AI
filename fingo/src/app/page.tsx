import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { AmbientBackground } from "@/components/shared/ambient-background";
import { Hero } from "@/components/home/hero";
import { AIReveal } from "@/components/home/ai-reveal";
import { Features } from "@/components/home/features";
import { DashboardPreview } from "@/components/home/dashboard-preview";
import { AnalyticsPreview } from "@/components/home/analytics-preview";
import { AIAssistantPreview } from "@/components/home/ai-assistant-preview";
import { CTASection } from "@/components/home/cta-section";

export default function HomePage() {
  return (
    <main className="relative overflow-hidden">
      <AmbientBackground />
      <Navbar />
      <Hero />
      <AIReveal />
      <Features />
      <DashboardPreview />
      <AnalyticsPreview />
      <AIAssistantPreview />
      <CTASection />
      <Footer />
    </main>
  );
}

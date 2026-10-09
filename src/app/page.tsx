import Navbar from "@/components/landing/navbar";
import Hero from "@/components/landing/hero";
import MetricsStrip from "@/components/landing/metrics-strip";
import BrowserDemo from "@/components/demo/browser-demo";
import Features from "@/components/landing/features";
import Automation from "@/components/landing/automation";
import Comparison from "@/components/landing/comparison";
import Privacy from "@/components/landing/privacy";
import Download from "@/components/landing/download";
import Footer from "@/components/landing/footer";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Download />
        <MetricsStrip />
        <BrowserDemo />
        <Features />
        <Automation />
        <Comparison />
        <Privacy />
      </main>
      <Footer />
    </div>
  );
}

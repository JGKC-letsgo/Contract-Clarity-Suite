import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { FileText, Sparkles, Shield, Clock, Share2, LayoutTemplate } from "lucide-react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function Landing() {
  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      {/* Nav */}
      <header className="border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-lg">
          <FileText className="h-5 w-5 text-primary" />
          <span>Contract Clarity</span>
        </div>
        <div className="flex gap-2">
          <Link href="/sign-in">
            <Button variant="ghost">Sign In</Button>
          </Link>
          <Link href="/sign-up">
            <Button>Get Started</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center">
        <div className="max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 text-sm bg-primary/10 text-primary px-3 py-1.5 rounded-full font-medium">
            <Sparkles className="h-3.5 w-3.5" />
            AI-Powered Contract Intelligence
          </div>
          <h1 className="text-5xl font-bold tracking-tight leading-tight">
            Review contracts smarter,<br /> negotiate faster.
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Contract Clarity automatically flags risky clauses, summarizes key terms, tracks changes, and helps you negotiate with confidence — all in one place.
          </p>
          <div className="flex gap-4 justify-center pt-2">
            <Link href="/sign-up">
              <Button size="lg" className="px-8">
                Start for free
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button size="lg" variant="outline" className="px-8">
                Sign in
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Features */}
      <section className="border-t bg-muted/30 px-6 py-16">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: Sparkles,
              title: "AI Risk Analysis",
              desc: "Instantly highlights critical clauses, unlimited liability, one-sided termination rights, and more.",
            },
            {
              icon: Shield,
              title: "Negotiate Confidently",
              desc: "Track negotiation status per risk, get AI-suggested safer clauses, and capture counter-proposals.",
            },
            {
              icon: Clock,
              title: "Version History",
              desc: "Full redline diff between any two versions with side-by-side or merged view.",
            },
            {
              icon: Share2,
              title: "One-Click Sharing",
              desc: "Share a read-only link with clients or colleagues — no login required to view.",
            },
            {
              icon: LayoutTemplate,
              title: "Contract Templates",
              desc: "Start from professionally drafted NDA, MSA, SLA, and Employment templates.",
            },
            {
              icon: FileText,
              title: "PDF / DOCX Upload",
              desc: "Upload contracts directly instead of pasting text — we handle the extraction.",
            },
          ].map((f) => (
            <div key={f.title} className="flex gap-4 items-start">
              <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t px-6 py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Contract Clarity — Contract Intelligence
      </footer>
    </div>
  );
}

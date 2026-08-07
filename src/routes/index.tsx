import { Link, createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  MessageCircle,
  BookOpen,
  Layers,
  Mic,
  Headphones,
  PenLine,
  Trophy,
  Flame,
  Sparkles,
  Bot,
  GraduationCap,
  Globe,
  Check,
  Star,
  ArrowRight,
  Crown,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import heroTutor from "@/assets/hero-tutor.jpg";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Languages", href: "#languages" },
  { label: "AI Tutor", href: "#tutor" },
  { label: "Pricing", href: "#pricing" },
];

const MODULES = [
  {
    icon: Layers,
    title: "Smart Flashcards",
    desc: "Image & audio cards with a spaced-repetition engine that schedules reviews right before you forget.",
  },
  {
    icon: BookOpen,
    title: "Grammar Lessons",
    desc: "Clear explanations, live examples, and AI breakdowns for every CEFR level — A1 to C2.",
  },
  {
    icon: Mic,
    title: "Speaking Practice",
    desc: "Talk out loud with your tutor. Get scored on pronunciation, grammar, vocabulary and fluency.",
  },
  {
    icon: Headphones,
    title: "Listening",
    desc: "Native and AI-generated audio with comprehension quizzes tuned to your current level.",
  },
  {
    icon: PenLine,
    title: "Writing & Translation",
    desc: "Build sentences and translate, then receive instant AI corrections with grammar feedback.",
  },
  {
    icon: MessageCircle,
    title: "AI Conversations",
    desc: "Unlimited, judgment-free dialogue. Your tutor adapts to your goals, mistakes and pace.",
  },
];

const LANGUAGES = [
  { flag: "🇬🇧", name: "English" },
  { flag: "🇪🇸", name: "Spanish" },
  { flag: "🇫🇷", name: "French" },
  { flag: "🇩🇪", name: "German" },
  { flag: "🇮🇹", name: "Italian" },
  { flag: "🇵🇹", name: "Portuguese" },
  { flag: "🇯🇵", name: "Japanese" },
  { flag: "🇰🇷", name: "Korean" },
  { flag: "🇨🇳", name: "Chinese" },
  { flag: "🇷🇺", name: "Russian" },
  { flag: "🇵🇱", name: "Polish" },
  { flag: "🇳🇴", name: "Norwegian" },
  { flag: "🇸🇪", name: "Swedish" },
  { flag: "🇩🇰", name: "Danish" },
  { flag: "🇫🇮", name: "Finnish" },
  { flag: "🇳🇱", name: "Dutch" },
  { flag: "🇹🇷", name: "Turkish" },
  { flag: "🇸🇦", name: "Arabic" },
  { flag: "🇮🇳", name: "Hindi" },
  { flag: "🇹🇭", name: "Thai" },
  { flag: "🇻🇳", name: "Vietnamese" },
  { flag: "🇮🇩", name: "Indonesian" },
  { flag: "🇬🇷", name: "Greek" },
  { flag: "🇨🇿", name: "Czech" },
  { flag: "🇺🇦", name: "Ukrainian" },
  { flag: "🇷🇴", name: "Romanian" },
  { flag: "🇮🇱", name: "Hebrew" },
  { flag: "🇭🇺", name: "Hungarian" },
];

const STATS = [
  { value: "28+", label: "Languages" },
  { value: "6", label: "CEFR levels" },
  { value: "∞", label: "AI conversations" },
  { value: "100+", label: "XP levels" },
];

const GAMIFICATION = [
  { icon: Flame, title: "Streaks", desc: "Keep your daily flame alive and never break the chain." },
  {
    icon: Trophy,
    title: "Achievements",
    desc: "Unlock badges from First Lesson to Conversation Master.",
  },
  {
    icon: Zap,
    title: "XP & Levels",
    desc: "Earn daily, weekly and monthly XP across 100+ levels.",
  },
  { icon: Star, title: "Leaderboards", desc: "Compete with friends, your country and the world." },
];

const PRICING = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    highlight: false,
    features: [
      "Limited AI conversations",
      "Core lessons & flashcards",
      "Daily challenges",
      "Streaks & basic achievements",
    ],
    cta: "Start free",
  },
  {
    name: "Premium",
    price: "$12",
    period: "per month",
    highlight: true,
    features: [
      "Unlimited AI conversations",
      "Voice tutor & pronunciation scoring",
      "Advanced lessons & all languages",
      "Premium avatars & personalities",
      "Offline mode, no ads",
    ],
    cta: "Go Premium",
  },
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ShinGiTai Language — Learn Any Language With Your AI Tutor" },
      {
        name: "description",
        content:
          "Master 28+ languages with AI conversation practice, smart flashcards, grammar lessons and personalized learning paths. Meet your personal AI tutor.",
      },
      {
        property: "og:title",
        content: "ShinGiTai Language — Learn Any Language With Your AI Tutor",
      },
      {
        property: "og:description",
        content:
          "AI conversation practice, smart flashcards and grammar lessons across 28+ languages.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main>
        <Hero />
        <Stats />
        <Features />
        <Languages />
        <Tutor />
        <Gamification />
        <Pricing />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <span className="grid h-9 w-9 place-items-center rounded-xl gradient-brand text-primary-foreground shadow-glow">
        <Globe className="h-5 w-5" />
      </span>
      <span className="text-lg font-bold tracking-tight font-display">
        ShinGiTai <span className="text-gradient">Language</span>
      </span>
    </Link>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
        <Logo />
        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link to="/auth">Log in</Link>
          </Button>
          <Button asChild variant="hero" size="sm">
            <Link to="/auth">Get started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-40 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 md:py-28 lg:grid-cols-2">
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground shadow-soft">
            <Sparkles className="h-4 w-4 text-primary" />
            Your personal AI language coach
          </span>
          <h1 className="mt-6 text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
            Learn any language by <span className="text-gradient">actually talking</span>.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            ShinGiTai Language blends conversation practice, smart flashcards, grammar and quizzes
            into one adaptive path — guided by a tutor you design yourself.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild variant="hero" size="xl">
              <Link to="/auth">
                Start learning free
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild variant="soft" size="xl">
              <Link to="/auth">
                <MessageCircle />
                Meet your AI tutor
              </Link>
            </Button>
          </div>
          <div className="mt-8 flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex -space-x-2">
              {["🇯🇵", "🇪🇸", "🇫🇷", "🇰🇷"].map((f) => (
                <span
                  key={f}
                  className="grid h-9 w-9 place-items-center rounded-full border-2 border-background bg-secondary text-base"
                >
                  {f}
                </span>
              ))}
            </div>
            <span>Loved by learners across 28+ languages</span>
          </div>
        </div>

        <div className="relative animate-fade-up">
          <div className="absolute inset-6 rounded-[2.5rem] gradient-brand opacity-20 blur-2xl" />
          <div className="relative overflow-hidden rounded-[2.5rem] border border-border bg-card shadow-elegant">
            <img
              src={heroTutor}
              alt="ShinGiTai Language AI tutor character surrounded by language speech bubbles"
              width={1024}
              height={1024}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="absolute -left-4 top-8 flex items-center gap-3 rounded-2xl border border-border bg-card/95 p-3 shadow-elegant backdrop-blur animate-float">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-success/15 text-success">
              <Flame className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold leading-none">15 day streak</p>
              <p className="text-xs text-muted-foreground">Keep it going!</p>
            </div>
          </div>
          <div
            className="absolute -bottom-4 right-2 flex items-center gap-3 rounded-2xl border border-border bg-card/95 p-3 shadow-coral backdrop-blur animate-float"
            style={{ animationDelay: "1.5s" }}
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gold/20 text-gold-foreground">
              <Trophy className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold leading-none">+240 XP today</p>
              <p className="text-xs text-muted-foreground">Conversation Master</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stats() {
  return (
    <section className="border-y border-border bg-card/40">
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-5 py-12 md:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.label} className="text-center">
            <p className="text-4xl font-bold text-gradient font-display">{s.value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: ReactNode;
  subtitle?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <span className="text-sm font-semibold uppercase tracking-wider text-primary">{eyebrow}</span>
      <h2 className="mt-3 text-3xl sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-4 text-lg text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

function Features() {
  return (
    <section id="features" className="mx-auto max-w-7xl px-5 py-24">
      <SectionHeading
        eyebrow="Everything in one place"
        title={<>One platform, every way to learn</>}
        subtitle="Vocabulary, grammar, reading, listening, writing and speaking — all woven into a single adaptive journey."
      />
      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {MODULES.map((m) => (
          <div
            key={m.title}
            className="group rounded-3xl border border-border bg-card p-7 shadow-soft transition-all hover:-translate-y-1 hover:shadow-elegant"
          >
            <span className="grid h-12 w-12 place-items-center rounded-2xl gradient-brand text-primary-foreground shadow-glow transition-transform group-hover:scale-110">
              <m.icon className="h-6 w-6" />
            </span>
            <h3 className="mt-5 text-xl">{m.title}</h3>
            <p className="mt-2 text-muted-foreground">{m.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Languages() {
  return (
    <section id="languages" className="border-y border-border bg-card/40 py-24">
      <div className="mx-auto max-w-7xl px-5">
        <SectionHeading
          eyebrow="28+ languages"
          title={<>Learn any language, from any language</>}
          subtitle="Pick your native tongue and your target — ShinGiTai Language adapts the entire experience to you."
        />
        <div className="mt-14 flex flex-wrap justify-center gap-3">
          {LANGUAGES.map((l) => (
            <span
              key={l.name}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elegant"
            >
              <span className="text-base">{l.flag}</span>
              {l.name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function Tutor() {
  const personalities = [
    { icon: GraduationCap, label: "Professional teacher" },
    { icon: Sparkles, label: "Friendly friend" },
    { icon: Bot, label: "Anime style" },
    { icon: Crown, label: "Historical character" },
  ];
  return (
    <section id="tutor" className="mx-auto max-w-7xl px-5 py-24">
      <div className="grid items-center gap-14 lg:grid-cols-2">
        <div>
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">
            Your AI tutor
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl">Design a coach that gets you</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Choose the look, voice, name and personality of your tutor. They explain grammar, run
            conversations, correct mistakes and build exercises around your goals.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {personalities.map((p) => (
              <div
                key={p.label}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft"
              >
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-secondary-foreground">
                  <p.icon className="h-5 w-5" />
                </span>
                <span className="font-medium">{p.label}</span>
              </div>
            ))}
          </div>
          <Button asChild variant="coral" size="lg" className="mt-8">
            <Link to="/auth">
              Create your tutor
              <ArrowRight />
            </Link>
          </Button>
        </div>

        <div className="relative">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-elegant">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <img
                src={heroTutor}
                alt="AI tutor avatar"
                width={1024}
                height={1024}
                loading="lazy"
                className="h-12 w-12 rounded-full object-cover"
              />
              <div>
                <p className="font-bold leading-none">Mika · your tutor</p>
                <p className="text-xs text-success">● Online · Japanese N5</p>
              </div>
            </div>
            <div className="mt-5 space-y-4">
              <ChatBubble side="left">こんにちは！How was your day today?</ChatBubble>
              <ChatBubble side="right">
                Watashi wa genki desu! I want to practice ordering food.
              </ChatBubble>
              <ChatBubble side="left">
                Great choice! Quick tip: use <strong>を</strong> to mark what you order. Try:
                コーヒー
                <strong>を</strong>ください ☕
              </ChatBubble>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ChatBubble({ side, children }: { side: "left" | "right"; children: ReactNode }) {
  const isRight = side === "right";
  return (
    <div className={isRight ? "flex justify-end" : "flex justify-start"}>
      <div
        className={
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm " +
          (isRight
            ? "gradient-brand text-primary-foreground rounded-br-sm"
            : "bg-secondary text-secondary-foreground rounded-bl-sm")
        }
      >
        {children}
      </div>
    </div>
  );
}

function Gamification() {
  return (
    <section className="border-y border-border bg-card/40 py-24">
      <div className="mx-auto max-w-7xl px-5">
        <SectionHeading
          eyebrow="Stay motivated"
          title={<>Learning that feels like a game</>}
          subtitle="XP, streaks, leaderboards and daily challenges keep you coming back every day."
        />
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {GAMIFICATION.map((g) => (
            <div
              key={g.title}
              className="rounded-3xl border border-border bg-card p-7 text-center shadow-soft transition-all hover:-translate-y-1 hover:shadow-elegant"
            >
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl gradient-warm text-accent-foreground shadow-coral">
                <g.icon className="h-7 w-7" />
              </span>
              <h3 className="mt-5 text-lg">{g.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{g.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="mx-auto max-w-7xl px-5 py-24">
      <SectionHeading
        eyebrow="Pricing"
        title={<>Start free, upgrade when you're ready</>}
        subtitle="No credit card required to begin your first lesson."
      />
      <div className="mx-auto mt-14 grid max-w-4xl gap-6 md:grid-cols-2">
        {PRICING.map((p) => (
          <div
            key={p.name}
            className={
              "relative rounded-3xl border p-8 shadow-soft " +
              (p.highlight ? "border-primary/50 bg-card shadow-elegant" : "border-border bg-card")
            }
          >
            {p.highlight && (
              <span className="absolute -top-3 left-8 inline-flex items-center gap-1 rounded-full gradient-warm px-3 py-1 text-xs font-bold text-accent-foreground shadow-coral">
                <Crown className="h-3.5 w-3.5" /> Most popular
              </span>
            )}
            <h3 className="text-2xl">{p.name}</h3>
            <div className="mt-3 flex items-end gap-1">
              <span className="text-4xl font-bold font-display">{p.price}</span>
              <span className="mb-1 text-sm text-muted-foreground">/{p.period}</span>
            </div>
            <ul className="mt-6 space-y-3">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-success/15 text-success">
                    <Check className="h-3 w-3" />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
            <Button
              asChild
              variant={p.highlight ? "hero" : "soft"}
              size="lg"
              className="mt-8 w-full"
            >
              <Link to="/auth">{p.cta}</Link>
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="mx-auto max-w-7xl px-5 pb-24">
      <div className="relative overflow-hidden rounded-[2.5rem] gradient-brand px-8 py-16 text-center shadow-elegant">
        <div className="pointer-events-none absolute -left-10 -top-10 h-48 w-48 rounded-full bg-primary-foreground/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-accent/30 blur-2xl" />
        <h2 className="relative mx-auto max-w-2xl text-3xl text-primary-foreground sm:text-4xl">
          Your next language is one conversation away
        </h2>
        <p className="relative mx-auto mt-4 max-w-xl text-primary-foreground/80">
          Join ShinGiTai Language and start speaking from day one.
        </p>
        <div className="relative mt-8 flex justify-center">
          <Button asChild variant="coral" size="xl">
            <Link to="/auth">
              Start learning free
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-card/40">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 py-10 sm:flex-row">
        <Logo />
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} ShinGiTai Language. Learn boldly.
        </p>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground">
            Features
          </a>
          <a href="#pricing" className="hover:text-foreground">
            Pricing
          </a>
          <a href="#tutor" className="hover:text-foreground">
            AI Tutor
          </a>
        </div>
      </div>
    </footer>
  );
}

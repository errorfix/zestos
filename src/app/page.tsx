import Link from 'next/link';
import Image from 'next/image';
import { getEvents } from '@/lib/db';
import Navbar from '@/components/Navbar';
import CountdownTimer from '@/components/CountdownTimer';
import EventCatalogSection from '@/components/EventCatalogSection';
import {
  Sparkles,
  Trophy,
  ArrowRight,
  Music,
  MapPin,
  Calendar,
  Clock,
  Phone,
  Mail,
  HelpCircle,
  Flame,
  CheckCircle2,
  Users,
  Star,
  ExternalLink,
  Award,
  Layers,
  PartyPopper,
  Radio,
} from 'lucide-react';

export const revalidate = 0;

export const metadata = {
  title: 'ZEST 2K26 - GENZFY • Lingaya\'s Vidyapeeth',
  description: "The Annual National Cultural & Tech Festival of Lingaya's Vidyapeeth. October 30 & 31, 2026.",
};

export default async function HomePage() {
  const events = await getEvents();
  const informalzCount = events.filter((e) => e.category.toLowerCase() === 'informalz').length;
  const competitiveCount = events.filter((e) => e.category.toLowerCase() !== 'informalz').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-400 selection:text-slate-950">
      {/* Sticky Navigation Bar (Top Register Button, No Committee Portal) */}
      <Navbar />

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* 🌟 HERO SECTION (Formal University Prestige x GENZFY Dark Energy) */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-16 sm:pb-28 border-b border-slate-800/80">
        {/* Ambient Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-amber-500/15 via-orange-500/10 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 -left-48 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-48 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Institutional Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-slate-900/90 border border-slate-700/80 text-slate-300 shadow-lg mb-6 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>Lingaya&apos;s Vidyapeeth • Deemed-to-be University u/s 3 of UGC Act 1956</span>
          </div>

          {/* Main Title: ZEST 2K26 - GENZFY */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-none mb-4">
            ZEST 2K26{' '}
            <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 bg-clip-text text-transparent">
              GENZFY
            </span>
          </h1>

          <p className="text-lg sm:text-2xl font-semibold text-slate-300 max-w-3xl mx-auto tracking-tight mb-3">
            Two Days of Electrifying Showdowns, Star Concerts &amp; Campus Euphoria
          </p>

          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed mb-8">
            Experience the flagship annual cultural &amp; technical festival of Lingaya&apos;s Vidyapeeth.
            Bringing together 15 competitive arenas, 16 informal games, ₹1,00,000+ in rewards, and a show-stopping Star Night.
          </p>

          {/* Call to Actions (Top Registration Link) */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-12">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-sm sm:text-base font-extrabold bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 shadow-xl shadow-orange-500/20 transition-all hover:scale-105 focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>Register for Events</span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </Link>

            <Link
              href="/register?category=informalz"
              className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl text-sm sm:text-base font-bold bg-slate-900/90 hover:bg-slate-800 text-amber-300 border border-amber-500/30 transition-all hover:border-amber-400/60 shadow-lg"
            >
              <PartyPopper className="w-4 h-4 text-amber-400" />
              <span>Claim Free Informalz Pass</span>
            </Link>

            <a
              href="#schedule"
              className="inline-flex items-center gap-2 px-6 py-4 rounded-2xl text-sm font-semibold bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
            >
              <span>View Schedule</span>
            </a>
          </div>

          {/* Live Festival Countdown Timer */}
          <div className="mb-14">
            <CountdownTimer />
          </div>

          {/* Metric Highlights Pill Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto">
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl text-center">
              <span className="block text-2xl sm:text-3xl font-black text-amber-400">₹1,00,000+</span>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cash Prizes &amp; Rewards</span>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl text-center">
              <span className="block text-2xl sm:text-3xl font-black text-white">15 Arenas</span>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Competitive Showdowns</span>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl text-center">
              <span className="block text-2xl sm:text-3xl font-black text-emerald-400">16 Games</span>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">100% Free Informalz</span>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl text-center">
              <span className="block text-2xl sm:text-3xl font-black text-rose-400">Star Night</span>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Live Bollywood Concert</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* 📅 TWO-DAY FESTIVAL SCHEDULE OVERVIEW */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      <section id="schedule" className="py-20 border-b border-slate-800/80 bg-slate-950 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-3">
              <Calendar className="w-3.5 h-3.5" />
              <span>Two-Day Festival Schedule</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              October 30 &amp; 31: 48 Hours of Action
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              From dawn inauguration ceremonies to late-night rock concerts and dance battles.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Day 1 Card */}
            <div className="relative bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl hover:border-amber-500/40 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-400 text-slate-950 uppercase tracking-wider">
                  Day 1 • October 30
                </span>
                <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  09:00 AM – 08:00 PM
                </span>
              </div>

              <h3 className="text-2xl font-bold text-white mb-2">
                Inauguration, Band Battles &amp; Fashion
              </h3>
              <p className="text-xs text-slate-400 mb-6">
                The grand kickoff featuring ceremonial torch lighting, high-voltage band clashes, and runway fashion.
              </p>

              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                    01
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-200">Grand Inauguration Ceremony</h4>
                    <p className="text-xs text-slate-400">Chief Guest Keynote by Shri Govind Namdev, lamp lighting, and welcome address.</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                    02
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-200">Battle of the Bands (Rock / Fusion)</h4>
                    <p className="text-xs text-slate-400">Inter-college live bands competing with high-voltage original &amp; cover sets.</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                    03
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-200">Vogue: The Grand Fashion Walk</h4>
                    <p className="text-xs text-slate-400">Themed couture, avant-garde runway design, and top styling showcases.</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                    04
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-200">Rangmanch (Nukkad Natak) &amp; Vocals</h4>
                    <p className="text-xs text-slate-400">Social street theatre followed by Eastern &amp; Western solo vocal competitions.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Day 2 Card */}
            <div className="relative bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl hover:border-orange-500/40 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-gradient-to-r from-orange-500 to-rose-500 text-white uppercase tracking-wider">
                  Day 2 • October 31
                </span>
                <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-orange-400" />
                  09:30 AM – Late Night
                </span>
              </div>

              <h3 className="text-2xl font-bold text-white mb-2">
                Dance Battles, Awards &amp; Star Night
              </h3>
              <p className="text-xs text-slate-400 mb-6">
                Choreography face-offs, grand stage plays, prize distributions, and the mega Star Night live concert.
              </p>

              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                    01
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-200">Step Up &amp; Nritya (Mega Dance Showdown)</h4>
                    <p className="text-xs text-slate-400">Western solo, classical solo, Bollywood duets, and Footloose group dance face-offs.</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                    02
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-200">Rap Battle Cypher &amp; Drama Finals</h4>
                    <p className="text-xs text-slate-400">Beatboxing and rap cyphers alongside Curtain Call one-act stage plays.</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                    03
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-200">Grand Valedictory &amp; Prize Distribution</h4>
                    <p className="text-xs text-slate-400">Awarding ₹1,00,000+ in cash prizes, university trophies, and medals.</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-800/50 flex items-start gap-3 ring-1 ring-rose-500/30">
                  <div className="w-7 h-7 rounded-xl bg-rose-500 text-slate-950 flex items-center justify-center shrink-0 mt-0.5 font-extrabold text-xs">
                    ★
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-rose-300">STAR NIGHT: Kanika Kapoor Live in Concert</h4>
                    <p className="text-xs text-slate-300">The ultimate festival finale! Bollywood chartbusters, high-energy live band, and stage lights.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* 🌟 CELEBRITY GUESTS & STAR ATTRACTIONS */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      <section id="celebrities" className="py-20 border-b border-slate-800/80 bg-slate-900/50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20 mb-3">
              <Star className="w-3.5 h-3.5" />
              <span>Celebrity Lineup</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Star Attractions &amp; Distinguished Guests
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Welcoming celebrated icons from Indian cinema, theatre, and the music industry.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Guest 1: Shri Govind Namdev */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 hover:border-amber-500/50 transition-colors shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    Cultural Keynote &amp; Chief Guest
                  </span>
                  <span className="text-xs text-slate-500 font-medium">Day 1 • Oct 30</span>
                </div>
                <h3 className="text-2xl font-black text-white">Shri Govind Namdev</h3>
                <p className="text-xs text-amber-400 font-semibold mt-0.5">
                  Veteran Bollywood Actor &amp; National Theatre Icon
                </p>
                <p className="text-xs text-slate-400 mt-4 leading-relaxed">
                  Celebrated for unforgettable performances in critically acclaimed cinema, theatre classics, and Hindi films (Satya, Sarfarosh, Bandit Queen). Gracing ZEST 2K26 to inspire the next generation of actors, playwrights, and artists.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Inauguration Address &amp; Theatre Masterclass</span>
              </div>
            </div>

            {/* Guest 2: Kanika Kapoor */}
            <div className="bg-slate-900 border border-rose-900/40 rounded-3xl p-6 sm:p-8 hover:border-rose-500/60 transition-colors shadow-xl flex flex-col justify-between ring-1 ring-rose-500/20">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    Star Night Live Headliner
                  </span>
                  <span className="text-xs text-rose-400 font-medium">Day 2 • Oct 31</span>
                </div>
                <h3 className="text-2xl font-black text-white">Kanika Kapoor</h3>
                <p className="text-xs text-rose-400 font-semibold mt-0.5">
                  Bollywood Playback Sensation &amp; Multi-Award Winner
                </p>
                <p className="text-xs text-slate-400 mt-4 leading-relaxed">
                  The voice behind global anthems like &quot;Baby Doll&quot;, &quot;Chittiyaan Kalaiyaan&quot;, &quot;Lovely&quot;, and &quot;Oo Bolega Ya Oo Oo Bolega&quot;. Performing live with a dynamic concert band on the Lingaya&apos;s Vidyapeeth Main Arena.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Full Live Concert &amp; Stage Production</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* 🏆 PRIZE POOL & HIGHLIGHTS */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      <section id="prizes" className="py-20 border-b border-slate-800/80 bg-slate-950 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-amber-950/30 via-slate-900 to-orange-950/30 border border-amber-500/30 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
            <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30 mb-4">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Rewards &amp; Accolades</span>
              </div>

              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
                ₹1,00,000+ Prize Pool in Glory &amp; Cash Rewards
              </h2>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-8">
                Compete across 15 national-level arenas. Top performers will take home direct cash awards, prestigious university trophies, gold medals, and government-recognized performance certificates.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <span className="block text-2xl font-black text-amber-400">Cash Prizes</span>
                  <p className="text-xs text-slate-400 mt-1">Direct wire &amp; cash disbursal to 1st and 2nd position winners across all events.</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <span className="block text-2xl font-black text-white">Trophies &amp; Medals</span>
                  <p className="text-xs text-slate-400 mt-1">Official Lingaya&apos;s Vidyapeeth ZEST 2K26 championship trophies for colleges.</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <span className="block text-2xl font-black text-emerald-400">Merit Certificates</span>
                  <p className="text-xs text-slate-400 mt-1">Verified HMAC-credentialed certificates for all finalists and participants.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* 🎯 EVENT CATEGORIES & INTERACTIVE EVENT CATALOG */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      <section id="events-catalog" className="py-20 border-b border-slate-800/80 bg-slate-900/60 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-2">
                <Layers className="w-3.5 h-3.5" />
                <span>31 Events Configured</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Event Arenas &amp; Catalog
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Explore 15 competitive arenas and 16 100% free informal games. Solo and team registrations available.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/register?category=informalz"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 transition-colors"
              >
                <PartyPopper className="w-3.5 h-3.5" />
                <span>16 Free Informalz Games</span>
              </Link>
            </div>
          </div>

          {/* Interactive Client-Side Catalog with Live Filter Pills & Search */}
          <EventCatalogSection initialEvents={events} />
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* 🚀 REGISTRATION SECTION (BOTTOM REGISTRATION CALLOUT) */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      <section id="register" className="py-20 border-b border-slate-800/80 bg-slate-950 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative bg-gradient-to-tr from-slate-900 via-slate-900 to-amber-950/40 border border-slate-700/80 rounded-3xl p-8 sm:p-14 text-center shadow-2xl overflow-hidden">
            <div className="absolute top-0 right-1/4 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30 mb-4">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Online Registration Now Open</span>
              </div>

              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
                Ready to Take the Stage at ZEST 2K26?
              </h2>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-8">
                Join thousands of students and performers from universities across India.
                Fast instant passes, automated Razorpay confirmation, and instant entry QR generation.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-extrabold bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 shadow-xl shadow-orange-500/25 transition-all hover:scale-105"
                >
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>Register for Events (Top &amp; Bottom)</span>
                  <ArrowRight className="w-4 h-4 text-slate-950" />
                </Link>

                <Link
                  href="/register?category=informalz"
                  className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl text-base font-bold bg-slate-900 hover:bg-slate-800 text-purple-300 border border-purple-500/30 transition-colors"
                >
                  <span>Claim 100% Free Informalz Pass</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* ❓ FREQUENTLY ASKED QUESTIONS (FAQ) */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      <section id="faqs" className="py-20 border-b border-slate-800/80 bg-slate-900/50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-3">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Got Questions?</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Everything you need to know about eligibility, passes, accommodations, and rules.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <h3 className="font-bold text-slate-100 text-base">Who is eligible to participate in ZEST 2K26?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Any bona fide student enrolled in a recognized college, university, or institute is eligible. A valid college student ID card must be presented at the gate entrance for physical check-in.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <h3 className="font-bold text-slate-100 text-base">How does the 100% Free Informalz pass work?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                All 16 Informalz games (Tug of War, Arm Wrestling, Minute to Win It, Open Mic, etc.) have ₹0 entry fee. You can select multiple events simultaneously in the registration form and instantly generate your all-access free pass.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <h3 className="font-bold text-slate-100 text-base">What are the Day Pass pricing options for stage events?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                For eligible competitive events, attendees can opt for a Single Day pass at ₹150 or an All-Access Both Days Pass at ₹250. Payment is securely verified via Razorpay UPI, Netbanking, or Debit Card.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <h3 className="font-bold text-slate-100 text-base">How do I submit audio tracks for singing or dance?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                During registration, events requiring tracks provide a field to paste your Google Drive or cloud audio link. You can also visit the Stage Committee Desk on-spot to upload or hand over tracks via USB.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <h3 className="font-bold text-slate-100 text-base">Is entry to Kanika Kapoor Star Night included?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Yes! All registered event participants and festival pass holders with a valid ticket QR pass are granted access to the Star Night concert arena on Day 2.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <h3 className="font-bold text-slate-100 text-base">Can I register on-spot at the campus entrance?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Yes, our Registration Committee operates Fast-Track On-Spot Desks at the campus entrance accepting cash or on-spot UPI for immediate gate pass issuance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* 📍 VENUE INFORMATION & EMBEDDED GOOGLE MAP */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      <section id="venue" className="py-20 border-b border-slate-800/80 bg-slate-950 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3">
              <MapPin className="w-3.5 h-3.5" />
              <span>Campus Location</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Venue &amp; Getting Here
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Hosted at the lush green campus of Lingaya&apos;s Vidyapeeth in Faridabad, Delhi NCR.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start max-w-6xl mx-auto">
            {/* Address & Transit Guide */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
              <div>
                <h3 className="font-bold text-white text-lg mb-1">Campus Address</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Lingaya&apos;s Vidyapeeth Campus<br />
                  Nachauli, Jasana Road, Old Faridabad,<br />
                  Faridabad, Haryana – 121002, India
                </p>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-800 text-xs text-slate-400">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                    M
                  </span>
                  <div>
                    <strong className="text-slate-200 block">Delhi Metro Access:</strong>
                    Nearest stations are Badarpur Border or Old Faridabad on the Violet Line.
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                    B
                  </span>
                  <div>
                    <strong className="text-slate-200 block">University Shuttles:</strong>
                    Continuous shuttle buses will ferry participants between metro stations and the campus gates.
                  </div>
                </div>
              </div>

              <a
                href="https://maps.google.com/?q=Lingaya's+Vidyapeeth+Faridabad"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
              >
                <span>Open in Google Maps App</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>
            </div>

            {/* Embedded Google Map */}
            <div className="lg:col-span-2 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl h-[380px] relative bg-slate-900">
              <iframe
                title="Lingaya's Vidyapeeth Campus Location Map"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3509.730310892257!2d77.3752599761501!3d28.397193975793086!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390cdd969966b565%3A0x6bfe7d1f11e9fbf9!2sLingaya&#39;s%20Vidyapeeth!5e0!3m2!1sen!2sin!4v1710000000000!5m2!1sen!2sin"
                width="100%"
                height="100%"
                style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg)' }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* 📞 OFFICIAL COMMITTEE HELPLINES */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      <section id="contact" className="py-20 border-b border-slate-800/80 bg-slate-900/40 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-3">
              <Phone className="w-3.5 h-3.5" />
              <span>Festival Helplines</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Committee Helplines &amp; Support
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Have specific questions regarding rules, registrations, or slots? Connect with the student coordinators.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto mb-8">
            {/* General Queries */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">General Queries</span>
              <h3 className="font-bold text-white text-sm">Fest Secretariat</h3>
              <div className="space-y-1 text-xs text-slate-300 font-mono">
                <a href="tel:9910606863" className="block hover:text-amber-400 transition-colors">
                  +91 9910606863
                </a>
                <a href="tel:8587978902" className="block hover:text-amber-400 transition-colors">
                  +91 8587978902
                </a>
              </div>
            </div>

            {/* Music & Dance Queries */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 block">Music &amp; Dance</span>
              <h3 className="font-bold text-white text-sm">Sound &amp; Stage Crew</h3>
              <div className="space-y-1 text-xs text-slate-300 font-mono">
                <a href="tel:7065262575" className="block hover:text-purple-400 transition-colors">
                  +91 7065262575
                </a>
                <a href="tel:9311209393" className="block hover:text-purple-400 transition-colors">
                  +91 9311209393
                </a>
              </div>
            </div>

            {/* Theatre Queries */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 block">Theatre &amp; Drama</span>
              <h3 className="font-bold text-white text-sm">Rangmanch Desk</h3>
              <div className="space-y-1 text-xs text-slate-300 font-mono">
                <a href="tel:9310137290" className="block hover:text-rose-400 transition-colors">
                  +91 9310137290
                </a>
              </div>
            </div>

            {/* Fashion Show Queries */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 block">Fashion Show</span>
              <h3 className="font-bold text-white text-sm">Vogue Runway Desk</h3>
              <div className="space-y-1 text-xs text-slate-300 font-mono">
                <a href="tel:8882738214" className="block hover:text-blue-400 transition-colors">
                  +91 8882738214
                </a>
              </div>
            </div>
          </div>

          {/* Central Email Card */}
          <div className="max-w-md mx-auto p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-center gap-3 text-xs text-slate-300 text-center">
            <Mail className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Official Email:{' '}
              <a
                href="mailto:csitcommittee@lingayasvidyapeeth.edu.in"
                className="font-bold text-amber-400 hover:underline"
              >
                csitcommittee@lingayasvidyapeeth.edu.in
              </a>
            </span>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* 🏛️ FOOTER */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      <footer className="bg-slate-950 border-t border-slate-900 py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-900">
            {/* Logo & University Info */}
            <div className="flex items-center gap-3.5">
              <div className="relative w-12 h-14 bg-white p-1 rounded-xl shrink-0">
                <Image
                  src="/lingayas_logo.png"
                  alt="Lingaya's Vidyapeeth"
                  width={50}
                  height={60}
                  className="object-contain max-h-full"
                />
              </div>
              <div>
                <span className="font-extrabold text-white text-base tracking-tight block">
                  ZEST 2K26 - GENZFY
                </span>
                <p className="text-xs text-slate-400">
                  Lingaya&apos;s Vidyapeeth (Deemed-to-be University u/s 3 of UGC Act 1956)
                </p>
              </div>
            </div>

            {/* Quick Links */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-400">
              <Link href="/register" className="hover:text-amber-400 transition-colors">
                Registration
              </Link>
              <Link href="/register?category=informalz" className="hover:text-amber-400 transition-colors">
                Informalz Free Pass
              </Link>
              <a href="#schedule" className="hover:text-amber-400 transition-colors">
                Schedule
              </a>
              <a href="#venue" className="hover:text-amber-400 transition-colors">
                Venue
              </a>
              <a href="#contact" className="hover:text-amber-400 transition-colors">
                Helpline
              </a>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <p>
              &copy; 2026 Lingaya&apos;s Vidyapeeth. FestOS v2.0 • All Rights Reserved.
            </p>
            <p className="text-[11px] text-slate-600">
              Engineered by Anuj Kumar Thakur • High-Velocity Concurrency Architecture
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

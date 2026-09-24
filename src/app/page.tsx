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
  MapPin,
  Calendar,
  Clock,
  Phone,
  Mail,
  HelpCircle,
  CheckCircle2,
  Star,
  ExternalLink,
  Layers,
  Train,
} from 'lucide-react';

export const revalidate = 0;

export const metadata = {
  title: 'ZEST 2K26 - GENZFY • Lingaya\'s Vidyapeeth',
  description: "Annual National Cultural & Technical Festival of Lingaya's Vidyapeeth. October 30 & 31, 2026.",
};

export default async function HomePage() {
  const events = await getEvents();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-amber-100 selection:text-amber-900">
      {/* Sticky Light-Themed Header */}
      <Navbar />

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* 🌟 HERO SECTION (Formal University Prestige, Minimal Light Aesthetic) */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-slate-200/80 pt-10 pb-16 sm:pt-14 sm:pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Institutional Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-slate-100 border border-slate-200 text-slate-700 mb-5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Lingaya&apos;s Vidyapeeth • Deemed-to-be University u/s 3 of UGC Act 1956</span>
          </div>

          {/* Festival Title */}
          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-none mb-3">
            ZEST 2K26{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600">
              GENZFY
            </span>
          </h1>

          <p className="text-base sm:text-xl font-bold text-slate-700 max-w-2xl mx-auto mb-2">
            Annual National Cultural &amp; Technical Festival
          </p>

          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto mb-6">
            October 30 &amp; 31, 2026 • Lingaya&apos;s Vidyapeeth Campus, Faridabad
          </p>

          {/* Minimal Top Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs sm:text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Register Now</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>

            <Link
              href="/register?category=informalz"
              className="inline-flex items-center gap-1.5 px-5 py-3 rounded-xl text-xs sm:text-sm font-semibold bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 transition-colors"
            >
              <span>Informalz Day Pass (₹150)</span>
            </Link>
          </div>

          {/* Countdown Timer */}
          <div className="mb-10">
            <CountdownTimer />
          </div>

          {/* Key Metrics Strip (10 Lakh+ Prize Pool) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
            <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl text-center">
              <span className="block text-xl sm:text-2xl font-black text-slate-900">₹10 Lakh+</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Prize Pool &amp; Cash</span>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl text-center">
              <span className="block text-xl sm:text-2xl font-black text-slate-900">15 Arenas</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Competitive Events</span>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl text-center">
              <span className="block text-xl sm:text-2xl font-black text-purple-600">16 Games</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Informalz Passes</span>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl text-center">
              <span className="block text-xl sm:text-2xl font-black text-rose-600">Star Night</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Live Bollywood Concert</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* 📅 TWO-DAY FESTIVAL OVERVIEW (Minimal & Formal) */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      <section className="py-14 border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200 mb-2">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Program Schedule</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Two-Day Festival Overview
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Day 1 */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  Day 1 • October 30
                </span>
                <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  09:00 AM – 08:00 PM
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                Inauguration, Band Battles &amp; Fashion Show
              </h3>
              <p className="text-xs text-slate-600 mb-4">
                Grand ceremonial opening followed by university competitions and stage showcases.
              </p>
              <ul className="space-y-2 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  <span><strong>Inauguration Ceremony:</strong> Keynote by Chief Guest Shri Govind Namdev</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  <span><strong>Battle of the Bands:</strong> Inter-college rock &amp; fusion showdown</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  <span><strong>Vogue Fashion Show:</strong> Thematic runway presentation</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  <span><strong>Rangmanch (Nukkad Natak):</strong> Street play &amp; Eastern/Western solo vocals</span>
                </li>
              </ul>
            </div>

            {/* Day 2 */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300">
                  Day 2 • October 31
                </span>
                <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  09:30 AM – Late Night
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                Dance Competitions, Closing Ceremony &amp; Star Night
              </h3>
              <p className="text-xs text-slate-600 mb-4">
                High-energy choreography battles, valedictory awards, and live Bollywood concert.
              </p>
              <ul className="space-y-2 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  <span><strong>Step Up Dance Competitions:</strong> Solo, duet &amp; mega group choreography</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  <span><strong>Drama &amp; Rap Cyphers:</strong> Stage plays, beatboxing &amp; rap clashes</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  <span><strong>Closing Ceremony:</strong> Prize disbursal of ₹10 Lakh+ prize pool</span>
                </li>
                <li className="flex items-center gap-2 text-rose-700 font-bold">
                  <Star className="w-3.5 h-3.5 text-rose-600" />
                  <span>Star Night Concert: Kanika Kapoor Live in Concert</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* 🌟 CELEBRITY GUESTS & STAR NIGHT (Minimal & Formal) */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      <section className="py-14 border-b border-slate-200 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white text-slate-700 border border-slate-200 mb-2">
              <Star className="w-3.5 h-3.5 text-amber-500" />
              <span>Dignitaries &amp; Artists</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Celebrity Guests &amp; Headliners
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Shri Govind Namdev */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 mb-3">
                  Chief Guest • Day 1 (Oct 30)
                </span>
                <h3 className="text-xl font-bold text-slate-900">Shri Govind Namdev</h3>
                <p className="text-xs text-amber-700 font-semibold mt-0.5">
                  Veteran Bollywood Actor &amp; National Theatre Icon
                </p>
                <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                  Celebrated performer renowned for landmark roles across Indian cinema and theatre (Satya, Sarfarosh, Bandit Queen). Gracing ZEST 2K26 to inaugurate the festival and interact with student artists.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Festival Inauguration &amp; Cultural Address</span>
              </div>
            </div>

            {/* Kanika Kapoor */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200 mb-3">
                  Star Night Headliner • Day 2 (Oct 31)
                </span>
                <h3 className="text-xl font-bold text-slate-900">Kanika Kapoor</h3>
                <p className="text-xs text-rose-700 font-semibold mt-0.5">
                  Bollywood Playback Singer &amp; Live Performer
                </p>
                <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                  Award-winning vocalist behind Bollywood superhits including &quot;Baby Doll&quot;, &quot;Chittiyaan Kalaiyaan&quot;, &quot;Lovely&quot;, and &quot;Oo Bolega Ya Oo Oo Bolega&quot;. Performing live on the campus main stage.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-rose-600" />
                <span>Live Musical Concert on Campus Grounds</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* 🏆 PRIZE POOL (₹10,00,000+ Formal Highlight) */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      <section className="py-12 border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 uppercase tracking-wider">
                <Trophy className="w-4 h-4 text-amber-600" />
                <span>Official Rewards &amp; Recognition</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                ₹10,00,000+ Prize Pool
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-xl">
                Compete across 15 national-level arenas. Winners take home direct cash prizes, university championship trophies, and accredited merit certificates.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/register"
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-colors"
              >
                Register for Arena
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* 🎯 EVENT ARENAS & CATALOG */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      <section id="events-catalog" className="py-14 border-b border-slate-200 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white text-slate-700 border border-slate-200 mb-2">
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                <span>31 Events Configured</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Event Arenas &amp; Games
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                15 competitive stage arenas and 16 engaging informal campus activities.
              </p>
            </div>

            <Link
              href="/register?category=informalz"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors self-start sm:self-auto"
            >
              <span>Informalz Passes (₹150 / ₹250)</span>
            </Link>
          </div>

          {/* Interactive Light-Themed Catalog */}
          <EventCatalogSection initialEvents={events} />
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* 🚀 REGISTRATION SECTION (Bottom Registration Callout) */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      <section className="py-14 border-b border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 sm:p-10">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-2">
              Register for ZEST 2K26
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto mb-6">
              Instant entry QR generation, secure Razorpay verification, and all-access passes for all events and informal games.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-xs sm:text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Register for Events</span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                href="/register?category=informalz"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs sm:text-sm font-semibold bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 transition-colors"
              >
                <span>Informalz Day Pass</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* ❓ FREQUENTLY ASKED QUESTIONS (Minimal & Formal) */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      <section id="faqs" className="py-14 border-b border-slate-200 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white text-slate-700 border border-slate-200 mb-2">
              <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
              <span>Questions &amp; Guidelines</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-1.5">
              <h3 className="font-bold text-slate-900 text-sm">Who is eligible to participate?</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Enrolled students from any recognized college or university. A valid student ID card must be presented for physical campus check-in.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-1.5">
              <h3 className="font-bold text-slate-900 text-sm">How does the Informalz Day pass work?</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Enjoy campus viewing, fun stalls, and informal games! Selecting games on Day 1 is ₹150, Day 2 is ₹150, or choose games spanning both days for ₹250 flat with full Star Night concert access.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-1.5">
              <h3 className="font-bold text-slate-900 text-sm">Is Star Night concert entry included?</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Yes. All registered event participants and pass holders with an entry QR code are admitted to the Day 2 Kanika Kapoor Star Night concert arena.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-1.5">
              <h3 className="font-bold text-slate-900 text-sm">Can I register on-spot at the campus?</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Yes. Fast-Track On-Spot Registration desks will be operational at the main gate, accepting both cash and UPI payments.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* 📍 VENUE, NEAREST METRO (SECTOR 28 METRO) & GOOGLE MAP */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      <section id="venue" className="py-14 border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200 mb-2">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              <span>Location &amp; Metro Connectivity</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Venue &amp; Getting Here
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start max-w-5xl mx-auto">
            {/* Campus Address & Metro Station Details */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-5">
              <div>
                <h3 className="font-bold text-slate-900 text-base mb-1">Campus Venue</h3>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  Lingaya&apos;s Vidyapeeth Campus<br />
                  Nachauli, Jasana Road, Old Faridabad,<br />
                  Faridabad, Haryana – 121002, India
                </p>
              </div>

              {/* Nearest Metro Station Highlight (Requested by User) */}
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-blue-900 font-bold">
                  <Train className="w-4 h-4 text-blue-700 shrink-0" />
                  <span>Nearest Metro Station</span>
                </div>
                <p className="text-slate-800 font-semibold text-[13px]">
                  Sector 28 Metro Station
                </p>
                <p className="text-[11px] text-slate-600">
                  Violet Line (Delhi Metro). Frequent e-rickshaws, auto-rickshaws, and university transport run directly from Sector 28 Metro Station to the campus gates.
                </p>
              </div>

              <a
                href="https://maps.google.com/?q=Lingaya's+Vidyapeeth+Nachauli+Faridabad"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-white border border-slate-300 text-slate-800 hover:bg-slate-100 transition-colors shadow-xs"
              >
                <span>Open in Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              </a>
            </div>

            {/* Accurate Google Map Embed (Clean Light Theme) */}
            <div className="lg:col-span-2 rounded-2xl overflow-hidden border border-slate-200 shadow-xs h-[340px] relative bg-slate-100">
              <iframe
                title="Lingaya's Vidyapeeth Campus Map"
                src="https://maps.google.com/maps?q=Lingaya's+Vidyapeeth,+Nachauli,+Jasana+Road,+Faridabad,+Haryana+121002&t=&z=15&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* 📞 HELPLINE NUMBERS & SUPPORT */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      <section id="contact" className="py-14 border-b border-slate-200 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white text-slate-700 border border-slate-200 mb-2">
              <Phone className="w-3.5 h-3.5 text-slate-500" />
              <span>Contact Support</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Committee Helplines
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto mb-6">
            {/* General Queries */}
            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block mb-1">General Queries</span>
              <div className="space-y-1 text-xs text-slate-800 font-medium">
                <a href="tel:9910606863" className="block hover:text-amber-700 transition-colors">
                  +91 9910606863
                </a>
                <a href="tel:8587978902" className="block hover:text-amber-700 transition-colors">
                  +91 8587978902
                </a>
              </div>
            </div>

            {/* Music & Dance Queries */}
            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block mb-1">Music &amp; Dance</span>
              <div className="space-y-1 text-xs text-slate-800 font-medium">
                <a href="tel:7065262575" className="block hover:text-purple-700 transition-colors">
                  +91 7065262575
                </a>
                <a href="tel:9311209393" className="block hover:text-purple-700 transition-colors">
                  +91 9311209393
                </a>
              </div>
            </div>

            {/* Theatre Queries */}
            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block mb-1">Theatre</span>
              <div className="space-y-1 text-xs text-slate-800 font-medium">
                <a href="tel:9310137290" className="block hover:text-rose-700 transition-colors">
                  +91 9310137290
                </a>
              </div>
            </div>

            {/* Fashion Show Queries */}
            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block mb-1">Fashion Show</span>
              <div className="space-y-1 text-xs text-slate-800 font-medium">
                <a href="tel:8882738214" className="block hover:text-blue-700 transition-colors">
                  +91 8882738214
                </a>
              </div>
            </div>
          </div>

          {/* Central Email Card */}
          <div className="max-w-md mx-auto p-3.5 rounded-xl bg-white border border-slate-200 flex items-center justify-center gap-2.5 text-xs text-slate-700 text-center shadow-xs">
            <Mail className="w-4 h-4 text-slate-500 shrink-0" />
            <span>
              Email:{' '}
              <a
                href="mailto:csitcommittee@lingayasvidyapeeth.edu.in"
                className="font-bold text-slate-900 hover:underline"
              >
                csitcommittee@lingayasvidyapeeth.edu.in
              </a>
            </span>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* 🏛️ FORMAL FOOTER */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-slate-200 py-10 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-12 shrink-0">
                <Image
                  src="/lingayas_logo.png"
                  alt="Lingaya's Vidyapeeth"
                  width={40}
                  height={48}
                  className="object-contain max-h-full"
                />
              </div>
              <div>
                <span className="font-extrabold text-slate-900 text-sm tracking-tight block">
                  ZEST 2K26 - GENZFY
                </span>
                <p className="text-[11px] text-slate-500">
                  Lingaya&apos;s Vidyapeeth • Deemed-to-be University
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600">
              <Link href="/register" className="hover:text-slate-900 transition-colors">
                Registration
              </Link>
              <Link href="/register?category=informalz" className="hover:text-slate-900 transition-colors">
                Informalz Passes
              </Link>
              <a href="#venue" className="hover:text-slate-900 transition-colors">
                Venue
              </a>
              <a href="#contact" className="hover:text-slate-900 transition-colors">
                Helpline
              </a>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
            <p>&copy; 2026 Lingaya&apos;s Vidyapeeth. FestOS v2.0 • All Rights Reserved.</p>
            <p>Faridabad, Haryana – 121002</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

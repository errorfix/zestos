'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Sparkles, Calendar, Menu, X, ArrowRight } from 'lucide-react';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand & Logo */}
        <Link href="/" className="flex items-center gap-3.5 group focus:outline-none">
          {/* Official Lingaya's Vidyapeeth Logo */}
          <div className="relative w-12 h-14 sm:w-14 sm:h-16 flex items-center justify-center shrink-0 bg-white p-1 rounded-xl shadow-md group-hover:scale-105 transition-transform">
            <Image
              src="/lingayas_logo.png"
              alt="Lingaya's Vidyapeeth Logo"
              width={64}
              height={70}
              priority
              className="object-contain max-h-full"
            />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg sm:text-xl text-white tracking-tight group-hover:text-amber-400 transition-colors">
                ZEST 2K26
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 text-slate-950 shadow-sm">
                GENZFY
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium tracking-tight">
              Lingaya&apos;s Vidyapeeth (Deemed University)
            </p>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1.5 text-xs font-semibold text-slate-300">
          <Link
            href="/#events-catalog"
            className="px-3 py-2 rounded-xl hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            Events
          </Link>
          <Link
            href="/#schedule"
            className="px-3 py-2 rounded-xl hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            2-Day Schedule
          </Link>
          <Link
            href="/#celebrities"
            className="px-3 py-2 rounded-xl hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            Star Night
          </Link>
          <Link
            href="/#prizes"
            className="px-3 py-2 rounded-xl hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            Prizes (₹1L+)
          </Link>
          <Link
            href="/#venue"
            className="px-3 py-2 rounded-xl hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            Venue
          </Link>
          <Link
            href="/#faqs"
            className="px-3 py-2 rounded-xl hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            FAQs
          </Link>
          <Link
            href="/#contact"
            className="px-3 py-2 rounded-xl hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            Helpline
          </Link>
        </nav>

        {/* Top Registration Action Button */}
        <div className="hidden sm:flex items-center gap-3">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-extrabold bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 shadow-lg shadow-orange-500/25 transition-all hover:scale-105 focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <Sparkles className="w-3.5 h-3.5 text-slate-950" />
            <span>Register Now</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-950" />
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="flex sm:hidden items-center gap-2">
          <Link
            href="/register"
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-400 text-slate-950"
          >
            Register
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden px-4 pt-3 pb-6 bg-slate-900 border-b border-slate-800 space-y-2 text-xs font-semibold text-slate-300 animate-in fade-in-50">
          <Link
            href="/#events-catalog"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl hover:bg-slate-800 hover:text-white"
          >
            Events Catalog
          </Link>
          <Link
            href="/#schedule"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl hover:bg-slate-800 hover:text-white"
          >
            2-Day Schedule
          </Link>
          <Link
            href="/#celebrities"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl hover:bg-slate-800 hover:text-white"
          >
            Star Night &amp; Guests
          </Link>
          <Link
            href="/#prizes"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl hover:bg-slate-800 hover:text-white"
          >
            Prizes (₹1,00,000+)
          </Link>
          <Link
            href="/#venue"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl hover:bg-slate-800 hover:text-white"
          >
            Venue &amp; Map
          </Link>
          <Link
            href="/#faqs"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl hover:bg-slate-800 hover:text-white"
          >
            Frequently Asked Questions
          </Link>
          <Link
            href="/#contact"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl hover:bg-slate-800 hover:text-white"
          >
            Committee Helplines
          </Link>
          <div className="pt-2">
            <Link
              href="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-extrabold bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-md"
            >
              <Sparkles className="w-4 h-4" />
              <span>Register Now</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

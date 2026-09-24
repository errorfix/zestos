'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Sparkles, Menu, X, ArrowRight } from 'lucide-react';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand & University Crest */}
        <Link href="/" className="flex items-center gap-3.5 group focus:outline-none">
          <div className="relative w-12 h-14 sm:w-13 sm:h-15 flex items-center justify-center shrink-0 p-1 group-hover:scale-105 transition-transform">
            <Image
              src="/lingayas_logo.png"
              alt="Lingaya's Vidyapeeth Crest"
              width={56}
              height={64}
              priority
              className="object-contain max-h-full"
            />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg sm:text-xl text-slate-900 tracking-tight group-hover:text-amber-600 transition-colors">
                ZEST 2K26
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                GENZFY
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium tracking-tight">
              Lingaya&apos;s Vidyapeeth (Deemed University)
            </p>
          </div>
        </Link>

        {/* Desktop Navigation Links - Minimal & Formal (Schedule, Prize, StarNight removed as requested) */}
        <nav className="hidden md:flex items-center gap-1 text-xs font-semibold text-slate-600">
          <Link
            href="/#events-catalog"
            className="px-3 py-2 rounded-lg hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            Events Catalog
          </Link>
          <Link
            href="/#venue"
            className="px-3 py-2 rounded-lg hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            Venue &amp; Metro
          </Link>
          <Link
            href="/#faqs"
            className="px-3 py-2 rounded-lg hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            FAQs
          </Link>
          <Link
            href="/#contact"
            className="px-3 py-2 rounded-lg hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            Helpline
          </Link>
        </nav>

        {/* Top Registration Button */}
        <div className="hidden sm:flex items-center gap-3">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all hover:shadow focus-visible:ring-2 focus-visible:ring-slate-900"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Register Now</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="flex sm:hidden items-center gap-2">
          <Link
            href="/register"
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white"
          >
            Register
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden px-4 pt-3 pb-6 bg-white border-b border-slate-200 space-y-1.5 text-xs font-semibold text-slate-700 animate-in fade-in-50 shadow-lg">
          <Link
            href="/#events-catalog"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg hover:bg-slate-100 hover:text-slate-900"
          >
            Events Catalog
          </Link>
          <Link
            href="/#venue"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg hover:bg-slate-100 hover:text-slate-900"
          >
            Venue &amp; Metro Directions
          </Link>
          <Link
            href="/#faqs"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg hover:bg-slate-100 hover:text-slate-900"
          >
            Frequently Asked Questions
          </Link>
          <Link
            href="/#contact"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg hover:bg-slate-100 hover:text-slate-900"
          >
            Committee Helplines
          </Link>
          <div className="pt-2">
            <Link
              href="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold bg-slate-900 text-white shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Register Now</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

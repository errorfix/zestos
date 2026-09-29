'use client';

import React, { useState } from 'react';
import AdminRegistrationsTable from '@/components/AdminRegistrationsTable';
import CollegeDelegationsView from '@/components/CollegeDelegationsView';
import { Users, Building2 } from 'lucide-react';

export default function RniDashboardView() {
  const [activeTab, setActiveTab] = useState<'INDIVIDUAL' | 'COLLEGE'>('INDIVIDUAL');

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-200/80 rounded-2xl w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('INDIVIDUAL')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'INDIVIDUAL'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4 text-indigo-600" />
          <span>Individual Attendee Registry</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('COLLEGE')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'COLLEGE'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4 text-indigo-600" />
          <span>College Delegations &amp; Contingents</span>
        </button>
      </div>

      {activeTab === 'INDIVIDUAL' ? (
        <AdminRegistrationsTable
          apiEndpoint="/api/admin/registrations?excludeCategory=informalz"
          title="R&I Attendee Registry"
          subtitle="R&I Committee registrations, ticket passes, stage track assets, and payment records (excludes Informalz)."
        />
      ) : (
        <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-lg text-slate-100">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-white">College Contingent Registries</h3>
            <p className="text-xs text-slate-400">
              Drill down by institution, view delegation team leaders, participated events, and attendee passes.
            </p>
          </div>
          <CollegeDelegationsView />
        </div>
      )}
    </div>
  );
}

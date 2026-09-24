'use client';

import React, { useState, useTransition } from 'react';
import {
  Calendar,
  Edit3,
  PlusCircle,
  Users,
  MapPin,
  CheckCircle2,
  AlertCircle,
  X,
  Save,
} from 'lucide-react';
import { InitialEventData } from '@/lib/mockEvents';

interface AdminEventsManagerProps {
  initialEvents: InitialEventData[];
  apiEndpoint?: string;
  categoryFilter?: string;
  excludeCategory?: string;
  defaultCategory?: string;
  title?: string;
  subtitle?: string;
}

export default function AdminEventsManager({
  initialEvents,
  apiEndpoint = '/api/admin/events',
  categoryFilter,
  excludeCategory,
  defaultCategory,
  title,
  subtitle,
}: AdminEventsManagerProps) {
  const [events, setEvents] = useState<InitialEventData[]>(initialEvents);
  const [editingEvent, setEditingEvent] = useState<InitialEventData | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [isSaving, startTransition] = useTransition();

  React.useEffect(() => {
    setEvents(initialEvents);
  }, [initialEvents]);

  const displayedEvents = events.filter((evt) => {
    if (categoryFilter) {
      return evt.category.toLowerCase() === categoryFilter.toLowerCase();
    }
    if (excludeCategory) {
      return evt.category.toLowerCase() !== excludeCategory.toLowerCase();
    }
    return true;
  });

  // Form states for Modal
  const [formData, setFormData] = useState({
    title: '',
    category: 'Cultural - Music',
    feeInr: 100,
    minTeamSize: 1,
    maxTeamSize: 1,
    venue: '',
    date: '',
    description: '',
  });

  const openEditModal = (evt: InitialEventData) => {
    setEditingEvent(evt);
    setIsCreatingNew(false);
    setFormData({
      title: evt.title,
      category: evt.category,
      feeInr: evt.feeAmount / 100,
      minTeamSize: evt.minTeamSize,
      maxTeamSize: evt.maxTeamSize,
      venue: evt.venue || '',
      date: evt.date || '',
      description: evt.description || '',
    });
  };

  const openCreateModal = () => {
    setEditingEvent(null);
    setIsCreatingNew(true);
    const initialCat = defaultCategory || (categoryFilter ? 'Informalz' : 'Cultural - Music');
    setFormData({
      title: '',
      category: initialCat,
      feeInr: initialCat === 'Informalz' ? 0 : 150,
      minTeamSize: 1,
      maxTeamSize: 1,
      venue: "Lingaya's Campus",
      date: 'March 28, 2026',
      description: '',
    });
  };

  const closeModal = () => {
    setEditingEvent(null);
    setIsCreatingNew(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      try {
        const payload = {
          id: editingEvent ? editingEvent.id : undefined,
          title: formData.title,
          category: formData.category,
          feeInr: Number(formData.feeInr),
          minTeamSize: Number(formData.minTeamSize),
          maxTeamSize: Number(formData.maxTeamSize),
          venue: formData.venue,
          date: formData.date,
          description: formData.description,
        };

        const res = await fetch(apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to save event');
        }

        if (editingEvent) {
          // Update local state
          setEvents((prev) =>
            prev.map((e) => (e.id === editingEvent.id ? data.event : e))
          );
          setNotification(`Event "${formData.title}" updated successfully.`);
        } else {
          // Add new event
          setEvents((prev) => [...prev, data.event]);
          setNotification(`New event "${formData.title}" created successfully.`);
        }

        closeModal();
        setTimeout(() => setNotification(null), 4000);
      } catch (err) {
        alert((err as Error).message);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {title || 'Active Campus Events'} ({displayedEvents.length})
          </h2>
          <p className="text-xs text-slate-500">
            {subtitle || 'Edit fees, team size rules, and venue details in real time.'}
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-[#1a73e8] hover:bg-[#1557b0] text-white shadow-sm transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add New Event</span>
        </button>
      </div>

      {notification && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-sm text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{notification}</span>
        </div>
      )}

      {/* Events Table / Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {displayedEvents.map((evt) => (
          <div
            key={evt.id}
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                  {evt.category}
                </span>
                <span className="font-bold text-base text-slate-900">
                  ₹{evt.feeAmount / 100}
                </span>
              </div>

              <h3 className="font-bold text-slate-900 text-base mb-1.5">{evt.title}</h3>

              <div className="space-y-1.5 text-xs text-slate-500 mb-4">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    Team: {evt.minTeamSize} – {evt.maxTeamSize} participant(s)
                  </span>
                </div>
                {evt.venue && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{evt.venue}</span>
                  </div>
                )}
                {evt.date && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{evt.date}</span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => openEditModal(evt)}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold bg-slate-100 hover:bg-[#e8f0fe] hover:text-[#1a73e8] text-slate-700 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Event Details</span>
            </button>
          </div>
        ))}
      </div>

      {/* Edit / Create Event Modal */}
      {(editingEvent || isCreatingNew) && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">
                {isCreatingNew ? 'Create New Event' : `Edit: ${editingEvent?.title}`}
              </h3>
              <button
                onClick={closeModal}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Event Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                  >
                    <option value="Technical">Technical</option>
                    <option value="Cultural">Cultural</option>
                    <option value="E-Sports">E-Sports</option>
                    <option value="Literary">Literary</option>
                    <option value="Management">Management</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fee (INR ₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.feeInr}
                    onChange={(e) =>
                      setFormData({ ...formData, feeInr: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Min Team Size
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.minTeamSize}
                    onChange={(e) =>
                      setFormData({ ...formData, minTeamSize: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Max Team Size
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.maxTeamSize}
                    onChange={(e) =>
                      setFormData({ ...formData, maxTeamSize: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Venue
                  </label>
                  <input
                    type="text"
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    placeholder="e.g. Auditorium Hall A"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date
                  </label>
                  <input
                    type="text"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    placeholder="e.g. March 28, 2026"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-[#1a73e8] hover:bg-[#1557b0] text-white"
                >
                  <Save className="w-3.5 h-3.5" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

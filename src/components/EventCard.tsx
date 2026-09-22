import Link from 'next/link';
import { Users, MapPin, Calendar, ArrowRight, Zap, Music, Trophy } from 'lucide-react';
import { InitialEventData } from '@/lib/mockEvents';

interface EventCardProps {
  event: InitialEventData;
}

export default function EventCard({ event }: EventCardProps) {
  const isSolo = event.minTeamSize === 1 && event.maxTeamSize === 1;
  const inrAmount = event.feeAmount / 100;

  const getCategoryTheme = (category: string) => {
    switch (category.toLowerCase()) {
      case 'technical':
        return {
          bg: 'bg-blue-50',
          text: 'text-blue-700',
          border: 'border-blue-200',
          icon: <Zap className="w-3.5 h-3.5" />,
        };
      case 'cultural':
        return {
          bg: 'bg-purple-50',
          text: 'text-purple-700',
          border: 'border-purple-200',
          icon: <Music className="w-3.5 h-3.5" />,
        };
      case 'e-sports':
        return {
          bg: 'bg-emerald-50',
          text: 'text-emerald-700',
          border: 'border-emerald-200',
          icon: <Trophy className="w-3.5 h-3.5" />,
        };
      default:
        return {
          bg: 'bg-slate-50',
          text: 'text-slate-700',
          border: 'border-slate-200',
          icon: <Zap className="w-3.5 h-3.5" />,
        };
    }
  };

  const theme = getCategoryTheme(event.category);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col justify-between hover:shadow-lg transition-all duration-200 group">
      <div className="p-6">
        <div className="flex items-center justify-between gap-2 mb-3">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${theme.bg} ${theme.text} ${theme.border}`}
          >
            {theme.icon}
            {event.category}
          </span>
          <div className="text-right">
            <span className="text-xl font-bold text-slate-900">₹{inrAmount}</span>
            <span className="text-xs text-slate-500 block">per {isSolo ? 'entry' : 'team'}</span>
          </div>
        </div>

        <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#1a73e8] transition-colors leading-snug mb-2">
          {event.title}
        </h3>

        {event.description && (
          <p className="text-sm text-slate-600 mb-4 line-clamp-2">
            {event.description}
          </p>
        )}

        <div className="space-y-2 pt-2 border-t border-slate-100 text-xs font-medium text-slate-600">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              {isSolo ? (
                <span className="text-slate-800 font-semibold">Solo Event (1 Participant)</span>
              ) : (
                <span>
                  Team Size: <strong className="text-slate-800">{event.minTeamSize} – {event.maxTeamSize} Members</strong>
                </span>
              )}
            </span>
          </div>

          {event.venue && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{event.venue}</span>
            </div>
          )}

          {event.date && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{event.date}</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 bg-slate-50 border-t border-slate-100">
        <Link
          href={`/register?event=${event.id}`}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold bg-white border border-slate-300 text-slate-800 hover:bg-[#1a73e8] hover:text-white hover:border-[#1a73e8] shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-[#1a73e8]"
        >
          <span>Register for Event</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

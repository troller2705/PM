import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Avatar from '@/components/common/Avatar';
import { cn } from '@/lib/utils';
import { addWeeks, format, startOfWeek, eachWeekOfInterval, differenceInDays, parseISO, addDays } from 'date-fns';

const STATUS_COLORS = {
  available:           'bg-emerald-400',
  partially_available: 'bg-amber-400',
  fully_allocated:     'bg-red-400',
  on_leave:            'bg-slate-300',
};

const STATUS_LABELS = {
  available:           'Available',
  partially_available: 'Partial',
  fully_allocated:     'Allocated',
  on_leave:            'On Leave',
};

export default function AvailabilityTimeline({ users, profiles, forecasts, projects }) {
  const weeks = useMemo(() => {
    const now = new Date();
    return eachWeekOfInterval({ start: startOfWeek(now), end: addWeeks(now, 11) });
  }, []);

  const rows = useMemo(() => {
    return users.map(user => {
      const profile = profiles.find(p => p.user_id === user.id);
      return { user, profile };
    });
  }, [users, profiles]);

  // For each user, find assigned forecasts
  const getUserForecasts = (userId) =>
    forecasts.filter(f => f.assigned_user_ids?.includes(userId) && f.start_date && f.end_date);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle>Availability & Allocation Timeline</CardTitle>
        <CardDescription>12-week forward-looking resource allocation view</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <div className="min-w-max">
          {/* Week headers */}
          <div className="flex items-center gap-0 mb-2 pl-44">
            {weeks.map(w => (
              <div key={w.toISOString()} className="w-14 text-center text-xs text-slate-400 font-medium shrink-0 px-1">
                {format(w, 'MMM d')}
              </div>
            ))}
          </div>

          {rows.length === 0 ? (
            <p className="text-sm text-slate-400 py-10 text-center">No team members found</p>
          ) : rows.map(({ user, profile }) => {
            const userForecasts = getUserForecasts(user.id);
            return (
              <div key={user.id} className="flex items-center gap-0 mb-2 group">
                {/* Name */}
                <div className="w-44 shrink-0 flex items-center gap-2 pr-2">
                  <Avatar name={user.full_name} email={user.email} size="sm" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-800 truncate">{user.full_name}</p>
                    <p className="text-xs text-slate-400 truncate">{profile?.title || user.role}</p>
                  </div>
                </div>

                {/* Week cells */}
                <div className="flex items-center gap-0 relative h-8">
                  {weeks.map((weekStart, idx) => {
                    const weekEnd = addWeeks(weekStart, 1);
                    const isCovered = userForecasts.some(f => {
                      const fs = parseISO(f.start_date);
                      const fe = parseISO(f.end_date);
                      return fs < weekEnd && fe > weekStart;
                    });
                    const status = profile?.status || 'available';
                    const baseColor = isCovered ? 'bg-violet-400' : STATUS_COLORS[status] || 'bg-emerald-400';
                    const isFirst = idx === 0;
                    const isLast = idx === weeks.length - 1;

                    return (
                      <div
                        key={idx}
                        title={isCovered ? 'Allocated to project' : STATUS_LABELS[status]}
                        className={cn(
                          "w-14 h-5 shrink-0 cursor-default transition-opacity hover:opacity-80",
                          baseColor,
                          isFirst && "rounded-l-full",
                          isLast && "rounded-r-full",
                          !isFirst && "border-l border-white/20"
                        )}
                      />
                    );
                  })}
                </div>

                {/* Availability badge */}
                <div className="ml-3 shrink-0">
                  <Badge className={cn(
                    "text-xs border-0",
                    profile?.status === 'available' ? 'bg-emerald-100 text-emerald-700' :
                    profile?.status === 'on_leave' ? 'bg-slate-100 text-slate-500' :
                    profile?.status === 'fully_allocated' ? 'bg-red-100 text-red-700' :
                    'bg-amber-100 text-amber-700'
                  )}>
                    {STATUS_LABELS[profile?.status || 'available']}
                  </Badge>
                </div>
              </div>
            );
          })}

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100 flex-wrap">
            {Object.entries(STATUS_COLORS).map(([key, color]) => (
              <div key={key} className="flex items-center gap-1.5">
                <div className={cn("w-4 h-4 rounded", color)} />
                <span className="text-xs text-slate-500">{STATUS_LABELS[key]}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-violet-400" />
              <span className="text-xs text-slate-500">Forecast Allocated</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
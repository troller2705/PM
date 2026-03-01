import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Avatar from '@/components/common/Avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { addWeeks, format, startOfWeek, eachWeekOfInterval, subWeeks } from 'date-fns';

const WORKLOAD_COLORS = [
  { max: 0,   bg: 'bg-slate-100', label: 'No tasks' },
  { max: 25,  bg: 'bg-emerald-100', label: 'Light (0–25%)' },
  { max: 50,  bg: 'bg-emerald-300', label: 'Moderate (25–50%)' },
  { max: 75,  bg: 'bg-amber-300', label: 'Heavy (50–75%)' },
  { max: 100, bg: 'bg-orange-400', label: 'Very heavy (75–100%)' },
  { max: Infinity, bg: 'bg-red-500', label: 'Overloaded (>100%)' },
];

function getColor(pct) {
  return WORKLOAD_COLORS.find(c => pct <= c.max) || WORKLOAD_COLORS[WORKLOAD_COLORS.length - 1];
}

export default function WorkloadHeatmap({ users, tasks, profiles }) {
  const weeks = useMemo(() => {
    const now = new Date();
    return eachWeekOfInterval({ start: subWeeks(now, 1), end: addWeeks(now, 7) });
  }, []);

  const rows = useMemo(() => {
    return users.map(user => {
      const profile = profiles.find(p => p.user_id === user.id);
      const capacityHrs = profile?.availability_hours_per_week || 40;

      const weekData = weeks.map(weekStart => {
        const weekEnd = addWeeks(weekStart, 1);
        // tasks active during this week
        const activeTasks = tasks.filter(t => {
          if (t.assignee_id !== user.id) return false;
          if (t.status === 'done') return false;
          if (!t.due_date) return ['in_progress', 'review', 'testing'].includes(t.status);
          const due = new Date(t.due_date);
          return due >= weekStart && due < weekEnd;
        });
        const estimatedHrs = activeTasks.reduce((s, t) => s + (t.estimated_hours || 8), 0);
        const pct = capacityHrs > 0 ? Math.round((estimatedHrs / capacityHrs) * 100) : 0;
        return { pct, estimatedHrs, taskCount: activeTasks.length, capacityHrs };
      });

      return { user, profile, weekData };
    });
  }, [users, tasks, profiles, weeks]);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle>Workload Heatmap</CardTitle>
        <CardDescription>Estimated hours vs. weekly capacity across the team</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <TooltipProvider delayDuration={100}>
          <div className="min-w-max">
            {/* Header row */}
            <div className="flex items-center gap-1 mb-2 pl-44">
              {weeks.map(w => (
                <div key={w.toISOString()} className="w-12 text-center text-xs text-slate-500 font-medium">
                  {format(w, 'MMM d')}
                </div>
              ))}
            </div>
            {/* Member rows */}
            {rows.length === 0 ? (
              <p className="text-sm text-slate-400 py-8 text-center">No team members to display</p>
            ) : rows.map(({ user, profile, weekData }) => (
              <div key={user.id} className="flex items-center gap-1 mb-1">
                <div className="flex items-center gap-2 w-44 shrink-0">
                  <Avatar name={user.full_name} email={user.email} size="sm" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-800 truncate">{user.full_name}</p>
                    <p className="text-xs text-slate-400 truncate">{profile?.title || user.role}</p>
                  </div>
                </div>
                {weekData.map((cell, idx) => {
                  const color = getColor(cell.pct);
                  return (
                    <Tooltip key={idx}>
                      <TooltipTrigger asChild>
                        <div className={cn(
                          "w-12 h-8 rounded cursor-pointer flex items-center justify-center text-xs font-medium transition-opacity hover:opacity-80",
                          color.bg,
                          cell.pct > 75 ? 'text-white' : 'text-slate-700'
                        )}>
                          {cell.pct > 0 ? `${cell.pct}%` : ''}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        <p className="font-semibold">{format(weeks[idx], 'MMM d')} week</p>
                        <p>{cell.taskCount} task{cell.taskCount !== 1 ? 's' : ''}</p>
                        <p>{cell.estimatedHrs}h / {cell.capacityHrs}h capacity</p>
                        <p className="text-slate-400">{color.label}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            ))}
            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100 flex-wrap">
              {WORKLOAD_COLORS.map(c => (
                <div key={c.label} className="flex items-center gap-1.5">
                  <div className={cn("w-4 h-4 rounded", c.bg)} />
                  <span className="text-xs text-slate-500">{c.label}</span>
                </div>
              ))}
            </div>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
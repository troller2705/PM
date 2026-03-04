import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { differenceInDays, parseISO, format, addDays, startOfDay, min, max } from 'date-fns';
import { Link2 } from 'lucide-react';

const STATUS_COLORS = {
  done: 'bg-emerald-500',
  in_progress: 'bg-blue-500',
  review: 'bg-purple-500',
  testing: 'bg-amber-500',
  blocked: 'bg-red-500',
  todo: 'bg-slate-400',
  backlog: 'bg-slate-300',
};

export default function GanttChart({ tasks, dependencies = [], users = [] }) {
  const { rows, minDate, maxDate, totalDays } = useMemo(() => {
    const dated = tasks.filter(t => t.due_date);
    if (dated.length === 0) return { rows: [], minDate: new Date(), maxDate: new Date(), totalDays: 30 };

    const allDates = dated.map(t => parseISO(t.due_date));
    const minDate = startOfDay(addDays(min(allDates), -7));
    const maxDate = startOfDay(addDays(max(allDates), 7));
    const totalDays = Math.max(differenceInDays(maxDate, minDate), 14);

    const rows = dated.map(t => {
      const due = parseISO(t.due_date);
      const startOffset = Math.max(0, differenceInDays(due, minDate) - (t.estimated_hours ? Math.ceil(t.estimated_hours / 8) : 1));
      const duration = Math.max(1, t.estimated_hours ? Math.ceil(t.estimated_hours / 8) : 1);
      const startPct = (startOffset / totalDays) * 100;
      const widthPct = Math.max(1, (duration / totalDays) * 100);
      const assignee = users.find(u => u.id === t.assignee_id);
      const hasDeps = dependencies.some(d => d.task_id === t.id);
      return { task: t, startPct, widthPct, assignee, hasDeps };
    });

    return { rows, minDate, maxDate, totalDays };
  }, [tasks, dependencies, users]);

  // generate week markers
  const weekMarkers = useMemo(() => {
    const markers = [];
    let cursor = new Date(minDate);
    while (cursor <= maxDate) {
      const pct = (differenceInDays(cursor, minDate) / totalDays) * 100;
      markers.push({ date: new Date(cursor), pct });
      cursor = addDays(cursor, 7);
    }
    return markers;
  }, [minDate, maxDate, totalDays]);

  if (rows.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="py-16 text-center text-slate-400">
          <p>No tasks with due dates to display on Gantt chart.</p>
          <p className="text-sm mt-1">Set due dates on tasks to see them here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle>Gantt Chart</CardTitle>
        <CardDescription>Task timeline with dependencies</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <div className="min-w-[700px]">
          {/* Week headers */}
          <div className="flex border-b border-slate-100 bg-slate-50">
            <div className="w-56 shrink-0 px-4 py-2 text-xs font-medium text-slate-500">Task</div>
            <div className="flex-1 relative h-8">
              {weekMarkers.map((m, i) => (
                <div key={i} className="absolute top-0 bottom-0 flex flex-col justify-center"
                  style={{ left: `${m.pct}%` }}>
                  <div className="h-full border-l border-slate-200" />
                  <span className="absolute top-1 left-1 text-xs text-slate-400 whitespace-nowrap">
                    {format(m.date, 'MMM d')}
                  </span>
                </div>
              ))}
              {/* Today marker */}
              {(() => {
                const todayPct = (differenceInDays(new Date(), minDate) / totalDays) * 100;
                return todayPct >= 0 && todayPct <= 100 ? (
                  <div className="absolute top-0 bottom-0 border-l-2 border-violet-500 z-10"
                    style={{ left: `${todayPct}%` }}>
                    <span className="absolute -top-0 -left-3 text-[10px] text-violet-600 font-bold">Today</span>
                  </div>
                ) : null;
              })()}
            </div>
          </div>

          {/* Rows */}
          <TooltipProvider delayDuration={100}>
            {rows.map(({ task, startPct, widthPct, assignee, hasDeps }) => (
              <div key={task.id} className="flex items-center border-b border-slate-50 hover:bg-slate-50 group h-10">
                {/* Task name */}
                <div className="w-56 shrink-0 px-4 flex items-center gap-2">
                  {hasDeps && <Link2 className="h-3 w-3 text-blue-400 shrink-0" />}
                  <Link to={createPageUrl(`TaskDetail?id=${task.id}`)}
                    className="text-xs font-medium text-slate-700 truncate hover:text-violet-600 hover:underline">
                    {task.title}
                  </Link>
                </div>
                {/* Bar */}
                <div className="flex-1 relative h-6">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "absolute top-0 h-full rounded cursor-pointer flex items-center px-2 overflow-hidden",
                          STATUS_COLORS[task.status] || 'bg-slate-400',
                          "opacity-90 hover:opacity-100 transition-opacity"
                        )}
                        style={{ left: `${startPct}%`, width: `${widthPct}%`, minWidth: '6px' }}
                      >
                        <span className="text-white text-[10px] font-medium truncate">{task.title}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p className="font-semibold">{task.title}</p>
                      <p className="text-xs">Due: {task.due_date ? format(parseISO(task.due_date), 'MMM d, yyyy') : 'None'}</p>
                      <p className="text-xs capitalize">Status: {task.status?.replace(/_/g, ' ')}</p>
                      {task.estimated_hours && <p className="text-xs">{task.estimated_hours}h estimated</p>}
                      {assignee && <p className="text-xs">Assignee: {assignee.full_name}</p>}
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            ))}
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
}
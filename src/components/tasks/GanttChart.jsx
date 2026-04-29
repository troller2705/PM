import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { differenceInDays, parseISO, format, addDays, startOfDay, min, max, isValid, isAfter, isBefore } from 'date-fns';
import { Link2, ChevronDown, ChevronRight, ListTree } from 'lucide-react';
import { Badge } from "@/components/ui/badge";


const STATUS_COLORS = {
  done: 'bg-emerald-500',
  in_progress: 'bg-blue-500',
  review: 'bg-purple-500',
  testing: 'bg-amber-500',
  blocked: 'bg-red-500',
  todo: 'bg-slate-400',
  backlog: 'bg-slate-300',
};

// Helper to safely parse dates
const safeParseDate = (dateString, fallback = null) => {
  if (!dateString) return fallback;
  const parsed = parseISO(dateString);
  return isValid(parsed) ? parsed : fallback;
};

export default function GanttChart({ tasks = [], dependencies = [], users = [] }) {
  const [collapsedRows, setCollapsedRows] = useState(new Set());

  const toggleCollapse = (taskId) => {
    const newCollapsed = new Set(collapsedRows);
    if (newCollapsed.has(taskId)) {
      newCollapsed.delete(taskId);
    } else {
      newCollapsed.add(taskId);
    }
    setCollapsedRows(newCollapsed);
  };

  const { flatRows, minDate, maxDate, totalDays } = useMemo(() => {
    if (tasks.length === 0) return { flatRows: [], minDate: new Date(), maxDate: new Date(), totalDays: 30 };

    const taskMap = new Map(tasks.map(t => [t.id, { ...t, children: [] }]));
    const roots = [];

    tasks.forEach(t => {
      if (t.parent_task_id && taskMap.has(t.parent_task_id)) {
        taskMap.get(t.parent_task_id).children.push(taskMap.get(t.id));
      } else {
        roots.push(taskMap.get(t.id));
      }
    });

    const calculateDates = (node) => {
      let childStartDates = [];
      let childEndDates = [];

      if (node.children.length > 0) {
        node.children.forEach(child => {
          const { start, end } = calculateDates(child);
          if (start) childStartDates.push(start);
          if (end) childEndDates.push(end);
        });
      }

      let start = safeParseDate(node.start_date);
      let end = safeParseDate(node.due_date);

      if (childStartDates.length > 0) {
        const minChildStart = min(childStartDates);
        if (!start || isAfter(minChildStart, start)) {
          start = minChildStart;
        }
      }
      
      if (childEndDates.length > 0) {
        const maxChildEnd = max(childEndDates);
        if (!end || isBefore(maxChildEnd, end)) {
          end = maxChildEnd;
        }
      }

      if (!start && end) {
        start = startOfDay(addDays(end, -(node.estimated_hours ? Math.ceil(node.estimated_hours / 8) : 1)));
      } else if (start && !end) {
        end = startOfDay(addDays(start, (node.estimated_hours ? Math.ceil(node.estimated_hours / 8) : 1)));
      } else if (!start && !end) {
        start = startOfDay(new Date());
        end = startOfDay(addDays(start, 1));
      }

      node._calculatedStart = start;
      node._calculatedEnd = end;
      
      return { start, end };
    };

    roots.forEach(calculateDates);

    const allValidDates = Array.from(taskMap.values()).flatMap(t => [t._calculatedStart, t._calculatedEnd]).filter(Boolean);
    if (allValidDates.length === 0) allValidDates.push(new Date());

    const globalMin = startOfDay(addDays(min(allValidDates), -7));
    const globalMax = startOfDay(addDays(max(allValidDates), 7));
    const totalDuration = Math.max(differenceInDays(globalMax, globalMin), 30);

    const flatten = (nodes, depth = 0) => {
      let result = [];
      nodes.sort((a, b) => (a.order || 0) - (b.order || 0)).forEach(node => {
        const startOffset = differenceInDays(node._calculatedStart, globalMin);
        const duration = Math.max(1, differenceInDays(node._calculatedEnd, node._calculatedStart));
        
        const startPct = (startOffset / totalDuration) * 100;
        const widthPct = Math.max(0.2, (duration / totalDuration) * 100);
        
        const assignee = users.find(u => u.id === node.assignee_id);
        const hasDeps = dependencies.some(d => d.task_id === node.id || d.depends_on_task_id === node.id);
        const isParent = node.children && node.children.length > 0;

        result.push({ task: node, depth, isParent, startPct, widthPct, assignee, hasDeps });

        if (isParent && !collapsedRows.has(node.id)) {
          result = result.concat(flatten(node.children, depth + 1));
        }
      });
      return result;
    };

    return { 
      flatRows: flatten(roots), 
      minDate: globalMin, 
      maxDate: globalMax, 
      totalDays: totalDuration 
    };
  }, [tasks, dependencies, users, collapsedRows]);

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

  if (flatRows.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="py-16 text-center text-slate-400">
          <ListTree className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>No tasks available to construct Gantt chart.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm overflow-hidden flex flex-col h-full">
      <CardHeader className="border-b bg-white z-10 py-4 shrink-0">
        <CardTitle>Project Timeline</CardTitle>
        <CardDescription>Hierarchical view with auto-calculated Epic dates</CardDescription>
      </CardHeader>
      
      <CardContent className="p-0 flex-1 overflow-auto bg-slate-50/50">
        <div className="min-w-[800px]">
          <div className="flex border-b border-slate-200 bg-white sticky top-0 z-20">
            <div className="w-[300px] shrink-0 px-4 py-3 text-xs font-semibold text-slate-600 border-r border-slate-200 shadow-[1px_0_0_rgba(0,0,0,0.05)]">
              Task Name
            </div>
            <div className="flex-1 relative h-10 overflow-hidden">
              {weekMarkers.map((m, i) => (
                <div key={i} className="absolute top-0 bottom-0" style={{ left: `${m.pct}%` }}>
                  <div className="h-full border-l border-slate-200" />
                  <span className="absolute bottom-1 left-2 text-[10px] font-medium text-slate-400 whitespace-nowrap">
                    {format(m.date, 'MMM d')}
                  </span>
                </div>
              ))}
              {(() => {
                const todayPct = (differenceInDays(new Date(), minDate) / totalDays) * 100;
                if (todayPct >= 0 && todayPct <= 100) {
                  return (
                    <div className="absolute top-0 bottom-0 border-l-2 border-violet-500 z-30" style={{ left: `${todayPct}%` }}>
                      <div className="absolute -top-1 -translate-x-1/2 bg-violet-500 text-white text-[9px] px-1.5 py-0.5 rounded shadow-sm font-bold">
                        Today
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </div>

          <TooltipProvider delayDuration={200}>
            <div className="relative pb-10">
              <div className="absolute top-0 bottom-0 left-[300px] right-0 pointer-events-none z-0">
                 {weekMarkers.map((m, i) => (
                    <div key={i} className="absolute top-0 bottom-0 border-l border-slate-100" style={{ left: `${m.pct}%` }} />
                 ))}
              </div>

              {flatRows.map(({ task, depth, isParent, startPct, widthPct, assignee, hasDeps }) => (
                <div key={task.id} 
                     className={cn(
                       "flex items-stretch border-b border-slate-100 hover:bg-slate-100/50 transition-colors relative z-10",
                       isParent ? "bg-white" : "bg-transparent",
                       "group h-12"
                     )}>
                  
                  <div className="w-[300px] shrink-0 px-4 flex items-center gap-1.5 bg-inherit border-r border-slate-100 shadow-[1px_0_0_rgba(0,0,0,0.02)]">
                    <div style={{ width: `${depth * 16}px` }} className="shrink-0" />
                    
                    {isParent ? (
                      <button 
                        onClick={() => toggleCollapse(task.id)}
                        className="p-0.5 hover:bg-slate-200 rounded text-slate-500 transition-colors"
                      >
                        {collapsedRows.has(task.id) ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                      </button>
                    ) : (
                      <div className="w-[18px] shrink-0" />
                    )}

                    {hasDeps && <Link2 className="h-3.5 w-3.5 text-blue-400 shrink-0 ml-1" />}
                    
                    <Link to={createPageUrl(`TaskDetail?id=${task.id}`)}
                      className={cn(
                        "text-sm truncate hover:text-violet-600 hover:underline transition-colors",
                        isParent ? "font-semibold text-slate-800" : "font-medium text-slate-600"
                      )}>
                      {task.title}
                    </Link>
                  </div>

                  <div className="flex-1 relative h-full flex items-center">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "absolute h-6 rounded-md cursor-pointer flex items-center px-2 shadow-sm border",
                            isParent 
                              ? "bg-slate-800 border-slate-900 shadow-md"
                              : cn(STATUS_COLORS[task.status] || 'bg-slate-400', 'border-transparent opacity-90 hover:opacity-100'),
                            "transition-all duration-200 hover:ring-2 hover:ring-offset-1 hover:ring-violet-400"
                          )}
                          style={{ 
                            left: `calc(${startPct}%)`, 
                            width: `calc(${widthPct}%)`, 
                            minWidth: '8px' 
                          }}
                        >
                          <span className={cn(
                            "text-[10px] font-medium truncate pointer-events-none",
                            isParent ? "text-slate-100" : "text-white"
                          )}>
                            {widthPct > 3 ? task.title : ''}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="w-64 p-3 border-slate-200 shadow-xl">
                        <div className="space-y-1.5">
                          <p className="font-semibold text-sm leading-tight">{task.title}</p>
                          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                            <div>
                              <span className="text-slate-500 block">Start</span>
                              <span className="font-medium">{format(task._calculatedStart, 'MMM d, yyyy')}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">End</span>
                              <span className="font-medium">{format(task._calculatedEnd, 'MMM d, yyyy')}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between pt-2">
                            <Badge variant="outline" className="capitalize text-[10px]">
                              {task.status?.replace(/_/g, ' ')}
                            </Badge>
                            {isParent && <Badge variant="secondary" className="text-[10px]">Epic</Badge>}
                          </div>

                          {assignee && !isParent && (
                            <div className="pt-2 flex items-center gap-2 text-xs">
                              <div className="w-5 h-5 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-[9px]">
                                {assignee.full_name.charAt(0)}
                              </div>
                              <span className="text-slate-200">{assignee.full_name}</span>
                            </div>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              ))}
            </div>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
}
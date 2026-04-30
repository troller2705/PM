import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Avatar from '@/components/common/Avatar';
import { AlertTriangle, TrendingUp, Users, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function BottleneckAlert({ users, tasks, profiles, forecasts }) {
  const issues = useMemo(() => {
    const found = [];

    users.forEach(user => {
      const profile = profiles.find(p => p.user_id === user.id);
      const capacity = profile?.availability_hours_per_week || 40;
      const activeTasks = tasks.filter(t =>
        t.assignee_id === user.id &&
        ['in_progress', 'review', 'testing', 'todo'].includes(t.status)
      );
      const estimatedHrs = activeTasks.reduce((s, t) => s + (t.estimated_hours || 8), 0);
      const load = capacity > 0 ? Math.round((estimatedHrs / capacity) * 100) : 0;

      if (load > 100) {
        found.push({
          type: 'overloaded',
          severity: 'high',
          user,
          message: `${load}% workload (${estimatedHrs}h vs ${capacity}h/week capacity)`,
          taskCount: activeTasks.length,
        });
      } else if (profile?.status === 'on_leave' && activeTasks.length > 0) {
        found.push({
          type: 'leave_conflict',
          severity: 'medium',
          user,
          message: `Marked on leave but has ${activeTasks.length} active task${activeTasks.length !== 1 ? 's' : ''}`,
          taskCount: activeTasks.length,
        });
      }

      // Blocked tasks
      const blocked = tasks.filter(t => t.assignee_id === user.id && t.status === 'blocked');
      if (blocked.length >= 2) {
        found.push({
          type: 'blocked',
          severity: 'medium',
          user,
          message: `${blocked.length} blocked tasks need attention`,
          taskCount: blocked.length,
        });
      }
    });

    // Unfilled critical forecasts
    forecasts.filter(f => f.priority === 'critical' && f.status === 'open').forEach(f => {
      found.push({
        type: 'unfilled_forecast',
        severity: 'high',
        user: null,
        forecastTitle: f.title,
        message: `Critical forecast "${f.title}" has no assigned resources`,
        taskCount: 0,
      });
    });

    return found.sort((a, b) => (a.severity === 'high' ? -1 : 1));
  }, [users, tasks, profiles, forecasts]);

  const severityConfig = {
    high:   { icon: AlertTriangle, color: 'text-red-500',   bg: 'bg-red-50 border-red-200',   badge: 'bg-red-100 text-red-700' },
    medium: { icon: TrendingUp,   color: 'text-amber-500', bg: 'bg-amber-50 border-amber-200', badge: 'bg-amber-100 text-amber-700' },
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Bottleneck Alerts</CardTitle>
            <CardDescription>Detected workload issues and resource gaps</CardDescription>
          </div>
          {issues.length === 0 && (
            <CheckCircle className="h-5 w-5 text-emerald-500" />
          )}
        </div>
      </CardHeader>
      <CardContent>
        {issues.length === 0 ? (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-50 border border-emerald-200">
            <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
            <p className="text-sm text-emerald-700 font-medium">No bottlenecks detected — team workload looks healthy!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {issues.map((issue, idx) => {
              const cfg = severityConfig[issue.severity];
              const Icon = cfg.icon;
              return (
                <div key={idx} className={cn("flex items-start gap-3 p-3 rounded-lg border", cfg.bg)}>
                  <Icon className={cn("h-5 w-5 mt-0.5 shrink-0", cfg.color)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {issue.user && (
                        <div className="flex items-center gap-1.5">
                          <Avatar name={issue.user.full_name} email={issue.user.email} size="sm" className="h-5 w-5 text-[9px]" />
                          <span className="text-sm font-semibold text-slate-900">{issue.user.full_name}</span>
                        </div>
                      )}
                      <Badge className={cn("text-xs border-0", cfg.badge)}>
                        {issue.type.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600">{issue.message}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
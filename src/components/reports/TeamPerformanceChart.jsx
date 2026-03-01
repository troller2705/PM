import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart,
  PolarGrid, PolarAngleAxis, Radar, Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Avatar from '@/components/common/Avatar';
import { Badge } from '@/components/ui/badge';

export default function TeamPerformanceChart({ users, tasks, timeLogs }) {
  const memberStats = useMemo(() => {
    return users.map(user => {
      const assignedTasks = tasks.filter(t => t.assignee_id === user.id);
      const doneTasks = assignedTasks.filter(t => t.status === 'done');
      const inProgressTasks = assignedTasks.filter(t => t.status === 'in_progress');
      const blockedTasks = assignedTasks.filter(t => t.status === 'blocked');
      const loggedHours = timeLogs
        .filter(l => l.user_id === user.id)
        .reduce((s, l) => s + (l.hours || 0), 0);
      const completionRate = assignedTasks.length > 0
        ? Math.round((doneTasks.length / assignedTasks.length) * 100)
        : 0;

      return {
        user,
        total: assignedTasks.length,
        done: doneTasks.length,
        inProgress: inProgressTasks.length,
        blocked: blockedTasks.length,
        loggedHours: Math.round(loggedHours * 10) / 10,
        completionRate,
      };
    }).filter(s => s.total > 0).sort((a, b) => b.completionRate - a.completionRate);
  }, [users, tasks, timeLogs]);

  const chartData = memberStats.slice(0, 6).map(s => ({
    name: s.user.full_name?.split(' ')[0] || s.user.email?.split('@')[0],
    'Tasks Done': s.done,
    'In Progress': s.inProgress,
    'Hours Logged': s.loggedHours,
  }));

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle>Team Performance</CardTitle>
        <CardDescription>Individual task completion and time tracking</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {chartData.length > 0 && (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
              <Legend />
              <Bar dataKey="Tasks Done" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="In Progress" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}

        {memberStats.length === 0 ? (
          <p className="text-center text-slate-400 py-8">No team performance data yet</p>
        ) : (
          <div className="space-y-3">
            {memberStats.slice(0, 8).map(stat => (
              <div key={stat.user.id} className="flex items-center gap-3">
                <Avatar name={stat.user.full_name} email={stat.user.email} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-slate-800 truncate">{stat.user.full_name}</p>
                    <span className="text-xs text-slate-500 ml-2 shrink-0">{stat.completionRate}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div
                      className="bg-emerald-500 h-1.5 rounded-full"
                      style={{ width: `${stat.completionRate}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 shrink-0">
                  <span>{stat.done}/{stat.total} tasks</span>
                  {stat.loggedHours > 0 && <span>{stat.loggedHours}h</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
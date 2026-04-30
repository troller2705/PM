import React, { useMemo } from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function SprintVelocityChart({ sprints, tasks }) {
  const data = useMemo(() => {
    return sprints
      .filter(s => s.status === 'completed' || s.status === 'active')
      .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
      .slice(-8)
      .map(sprint => {
        const sprintTasks = tasks.filter(t => t.sprint_id === sprint.id);
        const completed = sprintTasks.filter(t => t.status === 'done').length;
        const total = sprintTasks.length;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

        return {
          name: sprint.name.length > 12 ? sprint.name.slice(0, 12) + '…' : sprint.name,
          planned: sprint.capacity || total,
          completed,
          velocity: sprint.velocity || completed,
          completion: completionRate,
        };
      });
  }, [sprints, tasks]);

  const avgVelocity = data.length > 0
    ? Math.round(data.reduce((s, d) => s + d.velocity, 0) / data.length)
    : 0;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Sprint Velocity</CardTitle>
            <CardDescription>Story points / tasks completed per sprint</CardDescription>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-violet-600">{avgVelocity}</p>
            <p className="text-xs text-slate-500">avg velocity</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-slate-400">
            No completed sprints yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="planned" name="Planned" fill="#c4b5fd" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="left" dataKey="completed" name="Completed" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="completion" name="Completion %" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
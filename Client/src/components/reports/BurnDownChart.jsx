import React, { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format, eachDayOfInterval, parseISO, isAfter, isBefore, isEqual } from 'date-fns';

export default function BurnDownChart({ project, tasks, sprint }) {
  const data = useMemo(() => {
    const startDate = sprint?.start_date || project?.start_date;
    const endDate = sprint?.end_date || project?.target_date;

    if (!startDate || !endDate) return [];

    const start = parseISO(startDate);
    const end = parseISO(endDate);
    const days = eachDayOfInterval({ start, end });
    const totalTasks = tasks.length;

    return days.map((day, idx) => {
      const ideal = Math.round(totalTasks - (totalTasks / (days.length - 1)) * idx);
      const completedByDay = tasks.filter(t => {
        if (t.status !== 'done' || !t.updated_date) return false;
        const updated = new Date(t.updated_date);
        return isBefore(updated, day) || isEqual(updated, day);
      }).length;

      const remaining = totalTasks - completedByDay;
      const isToday = isEqual(day, new Date()) || isBefore(day, new Date());

      return {
        date: format(day, 'MMM d'),
        ideal,
        actual: isToday ? remaining : null,
      };
    });
  }, [project, tasks, sprint]);

  if (data.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Burn-Down Chart</CardTitle>
          <CardDescription>Set start and end dates on the project to enable this chart</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48 text-slate-400">
          No date range configured
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle>Burn-Down Chart</CardTitle>
        <CardDescription>
          Ideal vs actual task completion — {tasks.length} total tasks
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11 }} label={{ value: 'Tasks Remaining', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
              formatter={(val, name) => [val, name === 'ideal' ? 'Ideal' : 'Actual']}
            />
            <Legend formatter={(val) => val === 'ideal' ? 'Ideal Burndown' : 'Actual Remaining'} />
            <Line type="monotone" dataKey="ideal" stroke="#94a3b8" strokeDasharray="6 3" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="actual" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 3 }} connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
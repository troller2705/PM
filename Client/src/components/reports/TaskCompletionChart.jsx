import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const STATUS_COLORS = {
  backlog: '#94a3b8',
  todo: '#64748b',
  in_progress: '#3b82f6',
  review: '#8b5cf6',
  testing: '#f59e0b',
  done: '#10b981',
  blocked: '#ef4444',
};

const PRIORITY_COLORS = {
  low: '#94a3b8',
  medium: '#3b82f6',
  high: '#f59e0b',
  critical: '#ef4444',
};

export default function TaskCompletionChart({ tasks, projects, mode = 'status' }) {
  const statusData = useMemo(() => {
    const counts = {};
    tasks.forEach(t => { counts[t.status] = (counts[t.status] || 0) + 1; });
    return Object.entries(counts).map(([status, count]) => ({
      name: status.replace(/_/g, ' '),
      value: count,
      fill: STATUS_COLORS[status] || '#94a3b8',
    }));
  }, [tasks]);

  const byProjectData = useMemo(() => {
    return projects.slice(0, 8).map(project => {
      const ptasks = tasks.filter(t => t.project_id === project.id);
      return {
        name: project.name.length > 12 ? project.name.slice(0, 12) + '…' : project.name,
        done: ptasks.filter(t => t.status === 'done').length,
        in_progress: ptasks.filter(t => t.status === 'in_progress').length,
        todo: ptasks.filter(t => ['backlog', 'todo'].includes(t.status)).length,
        blocked: ptasks.filter(t => t.status === 'blocked').length,
      };
    }).filter(d => d.done + d.in_progress + d.todo + d.blocked > 0);
  }, [tasks, projects]);

  const completionRate = tasks.length > 0
    ? Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100)
    : 0;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Task Completion Rate</CardTitle>
            <CardDescription>{tasks.length} total tasks across all projects</CardDescription>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-3xl font-bold text-emerald-600">{completionRate}%</span>
            <span className="text-xs text-slate-500">completion rate</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-medium text-slate-600 mb-3">By Status</p>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={2} dataKey="value">
                  {statusData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip formatter={(val, name) => [val, name]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend iconType="circle" iconSize={8} formatter={(val) => <span style={{ fontSize: 11 }}>{val}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-600 mb-3">By Project</p>
            {byProjectData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-slate-400 text-sm">No project data</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={byProjectData} layout="vertical" margin={{ left: 0, right: 20 }}>
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={80} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="done" name="Done" stackId="a" fill="#10b981" />
                  <Bar dataKey="in_progress" name="In Progress" stackId="a" fill="#3b82f6" />
                  <Bar dataKey="todo" name="Todo" stackId="a" fill="#94a3b8" />
                  <Bar dataKey="blocked" name="Blocked" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
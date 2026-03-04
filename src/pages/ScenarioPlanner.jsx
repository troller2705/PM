import React, { useState, useMemo } from 'react';
import { db } from '@/api/apiClient';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '@/components/common/PageHeader';
import Avatar from '@/components/common/Avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';
import { AlertTriangle, Plus, Trash2, Zap, TrendingUp, Users, Info, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { addWeeks, format, startOfWeek, eachWeekOfInterval } from 'date-fns';

export default function ScenarioPlanner() {
  const [scenarioName, setScenarioName] = useState('Baseline + New Project');
  const [newProjectHours, setNewProjectHours] = useState(0);
  const [newProjectWeeks, setNewProjectWeeks] = useState(8);
  const [newProjectTeamSize, setNewProjectTeamSize] = useState(2);
  const [capacityOverrides, setCapacityOverrides] = useState({});  // userId -> factor (0.5 = 50% available)
  const [timelineShifts, setTimelineShifts] = useState({});  // projectId -> weeks shift
  const [leaveOverrides, setLeaveOverrides] = useState({});  // userId -> on_leave bool

  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: () => db.users.list() });
  const { data: tasks = [] } = useQuery({ queryKey: ['tasks'], queryFn: () => db.tasks.list('-created_date', 500) });
  const { data: profiles = [] } = useQuery({ queryKey: ['resourceProfiles'], queryFn: () => db.resourceProfiles.list() });
  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: () => db.projects.list() });
  const { data: timeLogs = [] } = useQuery({ queryKey: ['allTimeLogs'], queryFn: () => db.timeLogs.list('-created_date', 1000) });

  const weeks = useMemo(() => {
    const now = new Date();
    return eachWeekOfInterval({ start: startOfWeek(now), end: addWeeks(now, 11) });
  }, []);

  // Compute baseline and scenario workload per week per user
  const { baselineData, scenarioData, bottlenecks } = useMemo(() => {
    const baselineData = weeks.map(weekStart => {
      const weekEnd = addWeeks(weekStart, 1);
      let totalCapacity = 0;
      let totalLoad = 0;
      users.forEach(user => {
        const profile = profiles.find(p => p.user_id === user.id);
        const cap = profile?.availability_hours_per_week || 40;
        totalCapacity += cap;
        const active = tasks.filter(t => {
          if (t.assignee_id !== user.id || t.status === 'done' || !t.due_date) return false;
          const due = new Date(t.due_date);
          return due >= weekStart && due < weekEnd;
        });
        totalLoad += active.reduce((s, t) => s + (t.estimated_hours || 8), 0);
      });
      return {
        week: format(weekStart, 'MMM d'),
        baseline: totalCapacity > 0 ? Math.round((totalLoad / totalCapacity) * 100) : 0,
        capacity: totalCapacity,
        load: totalLoad,
      };
    });

    // Distribute new project load evenly across weeks
    const newHoursPerWeek = newProjectWeeks > 0 ? newProjectHours / newProjectWeeks : 0;

    const scenarioData = weeks.map((weekStart, idx) => {
      const weekEnd = addWeeks(weekStart, 1);
      let totalCapacity = 0;
      let totalLoad = 0;
      users.forEach(user => {
        const profile = profiles.find(p => p.user_id === user.id);
        const baseCap = profile?.availability_hours_per_week || 40;
        const factor = capacityOverrides[user.id] ?? 1.0;
        const isOnLeave = leaveOverrides[user.id] ?? (profile?.status === 'on_leave');
        const cap = isOnLeave ? 0 : baseCap * factor;
        totalCapacity += cap;

        const active = tasks.filter(t => {
          if (t.assignee_id !== user.id || t.status === 'done' || !t.due_date) return false;
          const due = new Date(t.due_date);
          // Apply timeline shift for this task's project
          const shift = timelineShifts[t.project_id] || 0;
          const shiftedDue = new Date(due.getTime() + shift * 7 * 24 * 3600 * 1000);
          return shiftedDue >= weekStart && shiftedDue < weekEnd;
        });
        totalLoad += active.reduce((s, t) => s + (t.estimated_hours || 8), 0);
      });

      // Add new project hours to first N weeks
      if (idx < newProjectWeeks) {
        totalLoad += newHoursPerWeek;
      }

      const pct = totalCapacity > 0 ? Math.round((totalLoad / totalCapacity) * 100) : 0;
      return {
        week: format(weekStart, 'MMM d'),
        scenario: pct,
        scenarioLoad: Math.round(totalLoad),
        scenarioCapacity: Math.round(totalCapacity),
      };
    });

    const combined = baselineData.map((b, i) => ({ ...b, ...scenarioData[i] }));
    const bottlenecks = combined.filter(w => w.scenario > 90).map(w => w.week);

    return { baselineData: combined, scenarioData: combined, bottlenecks };
  }, [users, tasks, profiles, weeks, newProjectHours, newProjectWeeks, capacityOverrides, leaveOverrides, timelineShifts]);

  // Historical accuracy: estimated vs actual (from time logs)
  const historicalAccuracy = useMemo(() => {
    const taskMap = {};
    tasks.forEach(t => { taskMap[t.id] = t; });
    const logsByTask = {};
    timeLogs.forEach(l => {
      if (!logsByTask[l.task_id]) logsByTask[l.task_id] = 0;
      logsByTask[l.task_id] += l.hours || 0;
    });
    const pairs = Object.entries(logsByTask)
      .map(([tid, logged]) => ({ estimated: taskMap[tid]?.estimated_hours || 0, logged }))
      .filter(p => p.estimated > 0);
    if (pairs.length === 0) return null;
    const avgRatio = pairs.reduce((s, p) => s + p.logged / p.estimated, 0) / pairs.length;
    return { avgRatio: Math.round(avgRatio * 100) / 100, count: pairs.length };
  }, [tasks, timeLogs]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="What-If Scenario Planner"
        subtitle="Simulate the impact of new projects, team changes, and timeline shifts"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Plus className="h-4 w-4 text-violet-500" />New Project Scenario
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Total Hours Required</Label>
                <Input type="number" value={newProjectHours} onChange={e => setNewProjectHours(Number(e.target.value))} placeholder="320" />
              </div>
              <div className="space-y-2">
                <Label>Duration (weeks): {newProjectWeeks}</Label>
                <Slider min={1} max={24} step={1} value={[newProjectWeeks]} onValueChange={([v]) => setNewProjectWeeks(v)} />
              </div>
              <div className="space-y-2">
                <Label>Team Size: {newProjectTeamSize}</Label>
                <Slider min={1} max={users.length || 10} step={1} value={[newProjectTeamSize]} onValueChange={([v]) => setNewProjectTeamSize(v)} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />Availability Overrides
              </CardTitle>
              <CardDescription>Simulate capacity changes per person</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {users.slice(0, 6).map(user => {
                const factor = capacityOverrides[user.id] ?? 1.0;
                const onLeave = leaveOverrides[user.id] ?? false;
                return (
                  <div key={user.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar name={user.full_name} email={user.email} size="sm" className="h-5 w-5 text-[9px]" />
                        <span className="text-xs font-medium text-slate-700 truncate max-w-[90px]">{user.full_name?.split(' ')[0]}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">Leave</span>
                        <Switch
                          checked={onLeave}
                          onCheckedChange={v => setLeaveOverrides(p => ({ ...p, [user.id]: v }))}
                          className="scale-75"
                        />
                      </div>
                    </div>
                    {!onLeave && (
                      <div className="flex items-center gap-2 pl-7">
                        <Slider min={0.1} max={1} step={0.1} value={[factor]}
                          onValueChange={([v]) => setCapacityOverrides(p => ({ ...p, [user.id]: v }))}
                          className="flex-1" />
                        <span className="text-xs text-slate-500 w-8">{Math.round(factor * 100)}%</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-amber-500" />Timeline Shifts
              </CardTitle>
              <CardDescription>Shift project deadlines ±weeks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {projects.slice(0, 4).map(p => {
                const shift = timelineShifts[p.id] ?? 0;
                return (
                  <div key={p.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-700 truncate max-w-[140px]">{p.name}</span>
                      <span className="text-xs text-slate-500">{shift > 0 ? `+${shift}` : shift}w</span>
                    </div>
                    <Slider min={-8} max={8} step={1} value={[shift]}
                      onValueChange={([v]) => setTimelineShifts(prev => ({ ...prev, [p.id]: v }))} />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Chart + Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bottleneck alerts */}
          {bottlenecks.length > 0 ? (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
              <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">Bottlenecks Detected</p>
                <p className="text-sm text-red-600">
                  Team is over 90% capacity during: <strong>{bottlenecks.join(', ')}</strong>
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              <p className="text-sm text-emerald-700 font-medium">Scenario looks healthy — no overload weeks detected.</p>
            </div>
          )}

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Workload: Baseline vs Scenario</CardTitle>
              <CardDescription>% of total team capacity used each week</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={scenarioData} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                  <YAxis unit="%" tick={{ fontSize: 11 }} domain={[0, 120]} />
                  <Tooltip formatter={(v) => `${v}%`} />
                  <Legend />
                  <ReferenceLine y={100} stroke="#ef4444" strokeDasharray="4 2" label={{ value: 'Max', fill: '#ef4444', fontSize: 11 }} />
                  <ReferenceLine y={80} stroke="#f59e0b" strokeDasharray="4 2" label={{ value: 'Warning', fill: '#f59e0b', fontSize: 11 }} />
                  <Bar dataKey="baseline" name="Baseline" fill="#94a3b8" radius={[2,2,0,0]} />
                  <Bar dataKey="scenario" name="Scenario" fill="#7c3aed" radius={[2,2,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Historical accuracy */}
          {historicalAccuracy && (
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Zap className="h-4 w-4 text-amber-500" />Predictive Analytics
                </CardTitle>
                <CardDescription>Based on {historicalAccuracy.count} completed tasks with time logs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-xs text-slate-500 mb-1">Estimation Accuracy Ratio</p>
                    <p className={cn("text-2xl font-bold", historicalAccuracy.avgRatio > 1.2 ? 'text-red-600' : historicalAccuracy.avgRatio > 1.05 ? 'text-amber-600' : 'text-emerald-600')}>
                      {historicalAccuracy.avgRatio}×
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {historicalAccuracy.avgRatio > 1 ? `Tasks take ${((historicalAccuracy.avgRatio-1)*100).toFixed(0)}% longer than estimated` : 'Tasks complete faster than estimated'}
                    </p>
                  </div>
                  <div className="p-4 bg-violet-50 rounded-xl">
                    <p className="text-xs text-slate-500 mb-1">Adjusted Forecast</p>
                    <p className="text-2xl font-bold text-violet-700">
                      {Math.round(newProjectHours * historicalAccuracy.avgRatio)}h
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Predicted actual hours for new project (from {newProjectHours}h estimated)
                    </p>
                  </div>
                </div>
                {historicalAccuracy.avgRatio > 1.15 && (
                  <div className="mt-3 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <Info className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700">
                      Your team historically underestimates by {((historicalAccuracy.avgRatio-1)*100).toFixed(0)}%. Consider adding buffer to forecasts.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../api/apiClient';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '../components/common/PageHeader';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
import {
  ListTodo,
  DollarSign,
  Target,
  ShieldAlert,
  AlertCircle
} from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useAuth } from '../lib/AuthContext';
import { usePermissions } from '../components/common/usePermissions';

const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });

const customYAxisFormatter = (value) => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
  return `$${value}`;
};

// Task Status Colors for the Pie Chart
// Task Status Colors for the Pie Chart
const TASK_COLORS = {
  backlog: '#cbd5e1',     // Slate 300
  todo: '#94a3b8',        // Slate 400
  in_progress: '#3b82f6', // Blue 500
  review: '#a855f7',      // Purple 500
  testing: '#f59e0b',     // Amber 500
  done: '#10b981',        // Emerald 500
  blocked: '#ef4444'      // Red 500
};

export default function Dashboard() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const { can } = usePermissions(user);

  const canViewFinancials = can('finance.view');

  // Fetch all required data
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => db.projects.get(projectId)
  });

  const { data: allTasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => db.tasks.list()
  });

  const { data: allExpenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => db.expenses.list(), enabled: canViewFinancials
  });

  const { data: allTimeLogs = [], isLoading: timeLogsLoading } = useQuery({
    queryKey: ['timeLogs'],
    queryFn: () => db.timeLogs.list(), enabled: canViewFinancials
  });

  const { data: allResourceProfiles = [], isLoading: profilesLoading } = useQuery({
    queryKey: ['resourceProfiles'],
    queryFn: () => db.resourceProfiles.list(), enabled: canViewFinancials
  });

  const { data: allBudgets = [], isLoading: budgetsLoading } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => db.budgets.list(), enabled: canViewFinancials
  });

  const isLoading = projectLoading || tasksLoading || (canViewFinancials && (expensesLoading || timeLogsLoading || profilesLoading || budgetsLoading));

  // --- DERIVE PROJECT-SPECIFIC STATS ---
  const stats = useMemo(() => {
    if (!project || isLoading) return null;

    // Filter down to just THIS project
    const tasks = allTasks.filter(t => t.project_id === projectId);
    const budgets = allBudgets.filter(b => b.project_id === projectId);
    const expenses = allExpenses.filter(e => e.project_id === projectId && e.status === 'paid');
    const timeLogs = allTimeLogs.filter(tl => tl.project_id === projectId);

    // Task Math
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'done').length;
    const blockedTasks = tasks.filter(t => t.status === 'blocked').length;
    const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Task Chart Data
    const taskChartData = Object.keys(TASK_COLORS).map(status => ({
      name: status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: tasks.filter(t => t.status === status).length,
      fill: TASK_COLORS[status]
    })).filter(d => d.value > 0);

    // Financial Math
    let totalBudget = 0;
    let laborCost = 0;
    let expenseCost = 0;

    if (canViewFinancials) {
      totalBudget = budgets.reduce((sum, b) => sum + (b.total_amount || 0), 0);

      const profileMap = new Map(allResourceProfiles.map(p => [p.user_id, p]));
      laborCost = timeLogs.reduce((sum, tl) => {
        const rate = tl.applied_hourly_rate ?? profileMap.get(tl.user_id)?.cost_per_hour ?? 0;
        return sum + ((tl.hours || 0) * rate);
      }, 0);

      expenseCost = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    }

    const totalSpend = laborCost + expenseCost;
    const remainingBudget = totalBudget - totalSpend;
    const burnPercent = totalBudget > 0 ? (totalSpend / totalBudget) * 100 : 0;

    // Financial Chart Data
    const financialChartData = [{
      name: 'Budget Utilization',
      Budget: totalBudget,
      Labor: laborCost,
      Expenses: expenseCost
    }];

    return {
      totalTasks,
      completedTasks,
      blockedTasks,
      taskProgress,
      taskChartData,
      totalBudget,
      totalSpend,
      remainingBudget,
      burnPercent,
      financialChartData
    };
  }, [project, isLoading, allTasks, allBudgets, allExpenses, allTimeLogs, allResourceProfiles, canViewFinancials, projectId]);

  if (isLoading || !stats) {
    return (
        <div className="space-y-8">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
          <Skeleton className="h-96 rounded-xl" />
        </div>
    );
  }

  return (
      <div className="space-y-8 animate-in fade-in duration-500">

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <PageHeader
              title={project?.name || "Project Overview"}
              subtitle="Project Dashboard"/>
          <div className="flex gap-2">
            <StatusBadge status={project?.status} />
            <StatusBadge status={project?.project_type}/>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
              title="Task Completion"
              value={`${stats.taskProgress}%`}
              subtitle={`${stats.completedTasks} of ${stats.totalTasks} tasks done`}
              icon={ListTodo}
          />
          <StatCard
              title="Blocked Tasks"
              value={stats.blockedTasks}
              icon={AlertCircle}
              className={stats.blockedTasks > 0 ? "border-l-4 border-l-red-500" : ""}
          />

          {canViewFinancials ? (
              <>
                <StatCard
                    title="Total Budget"
                    value={currencyFormatter.format(stats.totalBudget)}
                    icon={Target}
                />
                <StatCard
                    title="Total Spend"
                    value={currencyFormatter.format(stats.totalSpend)}
                    icon={DollarSign}
                    trend={`${stats.burnPercent.toFixed(1)}% burned`}
                    trendUp={stats.burnPercent > 90}
                />
              </>
          ) : (
              <Card className="border-dashed border-2 col-span-2 flex flex-col items-center justify-center p-6 text-slate-400 bg-slate-50/50">
                <ShieldAlert className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm font-medium">Financial Metrics Hidden</p>
              </Card>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Task Progress Pie Chart */}
          <Card className="border-0 shadow-sm col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Task Status</CardTitle>
              <CardDescription>Current state of all project tasks</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center h-[300px]">
              {stats.totalTasks === 0 ? (
                  <div className="flex flex-col items-center justify-center text-slate-400 h-full">
                    <ListTodo className="h-8 w-8 mb-2 opacity-20" />
                    <p className="text-sm">No tasks created yet</p>
                  </div>
              ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                          data={stats.taskChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                      >
                        {stats.taskChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Financial Bar Chart */}
          <Card className="border-0 shadow-sm col-span-1 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Budget Breakdown</CardTitle>
              <CardDescription>Labor vs Expenses against Total Budget</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {!canViewFinancials ? (
                  <div className="flex flex-col items-center justify-center text-slate-400 h-full bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    <ShieldAlert className="h-8 w-8 mb-2 opacity-20" />
                    <p className="text-sm">You lack permissions to view financial data.</p>
                  </div>
              ) : stats.totalBudget === 0 ? (
                  <div className="flex flex-col items-center justify-center text-slate-400 h-full">
                    <DollarSign className="h-8 w-8 mb-2 opacity-20" />
                    <p className="text-sm">No budget established for this project.</p>
                  </div>
              ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.financialChartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={customYAxisFormatter} width={60}/>
                      <Tooltip
                          cursor={{ fill: 'transparent' }}
                          formatter={(value) => currencyFormatter.format(value)}
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend iconType="circle" />
                      <Bar dataKey="Budget" fill="#a78bfa" radius={[4, 4, 0, 0]}/>
                      <Bar dataKey="Labor" fill="#3b82f6" stackId="spend"/>
                      <Bar dataKey="Expenses" fill="#84cc16" stackId="spend" radius={[4, 4, 0, 0]}/>
                    </BarChart>
                  </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
  );
}
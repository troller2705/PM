import React from 'react';
import { db } from '../api/apiClient';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '../components/common/PageHeader';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { Skeleton } from "../components/ui/skeleton";
import {
  FolderKanban,
  ListTodo,
  DollarSign,
  Target,
  ShieldAlert
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useAuth } from '../lib/AuthContext';
import { usePermissions } from '../components/common/usePermissions'; 

const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });

// Custom Y-axis tick formatter matching BudgetVsActualsChart
const customYAxisFormatter = (value) => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}k`;
  }
  return `$${value}`;
};

export default function Dashboard() {
  const { user } = useAuth();
  const { can } = usePermissions(user);
  
  // RBAC checks
  const canViewFinancials = can('finance.view');

  const { data: projects = [], isLoading: projectsLoading } = useQuery({ queryKey: ['projects'], queryFn: () => db.projects.list() });
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({ queryKey: ['tasks'], queryFn: () => db.tasks.list() });
  const { data: expenses = [], isLoading: expensesLoading } = useQuery({ queryKey: ['expenses'], queryFn: () => db.expenses.list(), enabled: canViewFinancials });
  const { data: timeLogs = [], isLoading: timeLogsLoading } = useQuery({ queryKey: ['timeLogs'], queryFn: () => db.timeLogs.list(), enabled: canViewFinancials });
  const { data: resourceProfiles = [], isLoading: profilesLoading } = useQuery({ queryKey: ['resourceProfiles'], queryFn: () => db.resourceProfiles.list(), enabled: canViewFinancials });
  const { data: budgets = [], isLoading: budgetsLoading } = useQuery({ queryKey: ['budgets'], queryFn: () => db.budgets.list(), enabled: canViewFinancials });

  const isLoading = projectsLoading || tasksLoading ||
                   (canViewFinancials && (expensesLoading || timeLogsLoading || profilesLoading || budgetsLoading));

  const projectFinancials = React.useMemo(() => {
    if (isLoading || !canViewFinancials) return [];

    const profileMap = new Map(resourceProfiles.map(p => [p.user_id, p]));

    return projects.map(project => {
      const projectBudgets = budgets.filter(b => b.project_id === project.id);
      // Only rely on actual budget entities, ignore project.budget
      const totalBudget = projectBudgets.reduce((sum, b) => sum + b.total_amount, 0);

      const projectTimeLogs = timeLogs.filter(tl => tl.project_id === project.id);
      const laborCost = projectTimeLogs.reduce((sum, tl) => {
        // Use the snapshotted rate if available, otherwise fallback to their current profile rate
        const rate = tl.applied_hourly_rate ?? profileMap.get(tl.user_id)?.cost_per_hour ?? 0;
        return sum + (tl.hours * rate);
      }, 0);

      const projectExpenses = expenses.filter(e => e.project_id === project.id && e.status === 'paid');
      const expenseCost = projectExpenses.reduce((sum, e) => sum + e.amount, 0);

      const totalSpend = laborCost + expenseCost;
      const remaining = totalBudget - totalSpend;
      const burnPercent = totalBudget > 0 ? Math.round((totalSpend / totalBudget) * 100) : 0;

      return {
        id: project.id,
        name: project.name,
        totalBudget,
        laborCost,
        expenseCost,
        totalSpend,
        remaining,
        burnPercent,
      };
    });
  }, [isLoading, canViewFinancials, projects, budgets, timeLogs, resourceProfiles, expenses]);

  const overallStats = React.useMemo(() => {
    let totalBudget = 0;
    let totalSpend = 0;
    let burn = 0;

    if (canViewFinancials) {
      totalBudget = projectFinancials.reduce((sum, p) => sum + p.totalBudget, 0);
      totalSpend = projectFinancials.reduce((sum, p) => sum + p.totalSpend, 0);
      burn = totalBudget > 0 ? (totalSpend / totalBudget) * 100 : 0;
    }

    return {
      activeProjects: projects.filter(p => !['archived', 'maintenance'].includes(p.status)).length,
      tasksInProgress: tasks.filter(t => t.status === 'in_progress').length,
      totalBudget,
      totalSpend,
      burn,
    };
  }, [projectFinancials, projects, tasks, canViewFinancials]);

  return (
    <div className="space-y-8">
      <PageHeader title="Executive Dashboard" subtitle="High-level financial and operational overview." />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Active Projects" value={isLoading ? <Skeleton className="h-8 w-16" /> : overallStats.activeProjects} icon={FolderKanban} />
        <StatCard title="Tasks In Progress" value={isLoading ? <Skeleton className="h-8 w-16" /> : overallStats.tasksInProgress} icon={ListTodo} />
        
        {canViewFinancials ? (
          <>
            <StatCard title="Total Budget" value={isLoading ? <Skeleton className="h-8 w-24" /> : currencyFormatter.format(overallStats.totalBudget)} icon={Target} />
            <StatCard 
              title="Total Spend" 
              value={isLoading ? <Skeleton className="h-8 w-24" /> : currencyFormatter.format(overallStats.totalSpend)} 
              icon={DollarSign}
              trend={`${overallStats.burn.toFixed(1)}% of budget`}
              trendUp={overallStats.burn > 80}
            />
          </>
        ) : (
          <Card className="border-dashed border-2 col-span-2 flex flex-col items-center justify-center p-6 text-slate-400 bg-slate-50/50">
             <ShieldAlert className="h-8 w-8 mb-2 opacity-50" />
             <p className="text-sm font-medium">Financial Metrics Hidden</p>
             <p className="text-xs text-center mt-1">You do not have the 'finance.view' permission to see budget data.</p>
          </Card>
        )}
      </div>

      {canViewFinancials && (
        <>
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Budget vs. Actuals</CardTitle>
              <CardDescription>Financial performance across all active projects.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-80 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={projectFinancials} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis 
                      stroke="#888888" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={customYAxisFormatter} 
                      width={60}
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(139, 92, 246, 0.05)' }}
                      contentStyle={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}
                      formatter={(value) => currencyFormatter.format(value)}
                    />
                    <Legend iconType="circle" />
                    <Bar dataKey="totalBudget" name="Budget" fill="#a78bfa" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="laborCost" name="Labor" stackId="spend" fill="#3b82f6" />
                    <Bar dataKey="expenseCost" name="Expenses" stackId="spend" fill="#84cc16" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Project Health Summary</CardTitle>
              <CardDescription>Financial and progress overview of each project.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50 text-slate-600 font-medium">
                      <th className="p-3 text-left">Project</th>
                      <th className="p-3 text-right">Budget</th>
                      <th className="p-3 text-right">Spend</th>
                      <th className="p-3 text-center w-48">Burn Rate</th>
                      <th className="p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {projectFinancials.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="p-3 font-medium text-slate-900">{p.name}</td>
                        <td className="p-3 text-right font-mono text-slate-600">{currencyFormatter.format(p.totalBudget)}</td>
                        <td className="p-3 text-right font-mono text-slate-800">{currencyFormatter.format(p.totalSpend)}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Progress value={p.burnPercent} className="h-2" indicatorClassName={p.burnPercent > 90 ? 'bg-red-500' : 'bg-violet-500'} />
                            <span className="text-xs font-mono text-slate-500 w-12">{p.burnPercent}%</span>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <StatusBadge status={p.burnPercent > 100 ? 'Over Budget' : p.burnPercent > 85 ? 'At Risk' : 'On Track'} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
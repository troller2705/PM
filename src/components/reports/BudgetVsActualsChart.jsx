import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function BudgetVsActualsChart({ budgets = [], expenses = [], projects = [] }) {
  const data = [];

  // 1. Projects with Combined Budgets (Base + Dedicated)
  projects.forEach(project => {
    const linkedBudgets = budgets.filter(b => b.project_id === project.id);
    const dedicatedTotal = linkedBudgets.reduce((sum, b) => sum + (b.total_amount || 0), 0);
    const totalBudget = (project.budget || 0) + dedicatedTotal;

    if (totalBudget > 0) {
      const linkedBudgetIds = linkedBudgets.map(b => b.id);
      const paidExpenses = expenses.filter(e =>
        (e.project_id === project.id || linkedBudgetIds.includes(e.budget_id)) && e.status === 'paid'
      );
      const actual = paidExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      const variance = totalBudget - actual;
      const variancePct = Math.round((variance / totalBudget) * 100);

      data.push({
        name: project.name,
        budget: totalBudget,
        actual,
        variance,
        variancePct,
      });
    }
  });

  // 2. Independent Budgets (Not linked to any project)
  const independentBudgets = budgets.filter(b => !b.project_id);
  independentBudgets.forEach(budget => {
    const paidExpenses = expenses.filter(e => e.budget_id === budget.id && e.status === 'paid');
    const actual = paidExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const variance = (budget.total_amount || 0) - actual;
    const variancePct = budget.total_amount > 0 ? Math.round((variance / budget.total_amount) * 100) : 0;

    data.push({
      name: budget.name,
      budget: budget.total_amount || 0,
      actual,
      variance,
      variancePct,
    });
  });

  // Sort by budget size to make the chart hierarchical
  data.sort((a, b) => b.budget - a.budget);

  const totals = data.reduce(
    (acc, d) => ({ budget: acc.budget + d.budget, actual: acc.actual + d.actual }),
    { budget: 0, actual: 0 }
  );
  
  const overallVariance = totals.budget - totals.actual;
  const overallVariancePct = totals.budget > 0 ? Math.abs(Math.round((overallVariance / totals.budget) * 100)) : 0;

  return (
    <Card className="border-0 shadow-sm h-full">
      <CardHeader>
        <CardTitle>Budget vs. Actuals</CardTitle>
        <CardDescription>Combined financial health tracking</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-slate-400">
            No active budgets configured
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                <Tooltip 
                  formatter={(val) => `$${val.toLocaleString()}`}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Legend iconType="circle" />
                <Bar dataKey="budget" name="Budget" fill="#c4b5fd" radius={[4, 4, 0, 0]} maxBarSize={50} />
                <Bar dataKey="actual" name="Actual" radius={[4, 4, 0, 0]} maxBarSize={50}>
                  {data.map((entry, index) => (
                    <Cell key={index} fill={entry.actual > entry.budget ? '#f87171' : '#34d399'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-slate-100">
              <div className="text-center">
                <p className="text-2xl font-semibold text-slate-900">${totals.budget.toLocaleString()}</p>
                <p className="text-sm text-slate-500">Total Budget</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-semibold text-slate-900">${totals.actual.toLocaleString()}</p>
                <p className="text-sm text-slate-500">Total Spent</p>
              </div>
              <div className="text-center">
                <p className={cn("text-2xl font-semibold", overallVariance >= 0 ? "text-emerald-600" : "text-red-600")}>
                  ${Math.abs(overallVariance).toLocaleString()}
                </p>
                <div className="flex items-center justify-center gap-1 text-sm text-slate-500">
                  {overallVariance >= 0 ? <TrendingUp className="h-3 w-3 text-emerald-500" /> : <TrendingDown className="h-3 w-3 text-red-500" />}
                  {overallVariance >= 0 ? 'Remaining' : 'Over Budget'}
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
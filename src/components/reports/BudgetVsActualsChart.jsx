import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function BudgetVsActualsChart({ budgets, expenses, projects }) {
  const data = budgets.map(budget => {
    const project = projects?.find(p => p.id === budget.project_id);
    const paidExpenses = expenses.filter(e => e.budget_id === budget.id && e.status === 'paid');
    const actual = paidExpenses.reduce((s, e) => s + (e.amount || 0), 0);
    const variance = budget.total_amount - actual;
    const variancePct = budget.total_amount > 0 ? Math.round((variance / budget.total_amount) * 100) : 0;

    return {
      name: project?.name || budget.name,
      budget: budget.total_amount,
      actual,
      variance,
      variancePct,
    };
  }).filter(d => d.budget > 0);

  const totals = data.reduce(
    (acc, d) => ({ budget: acc.budget + d.budget, actual: acc.actual + d.actual }),
    { budget: 0, actual: 0 }
  );
  const overallVariance = totals.budget - totals.actual;
  const overallPct = totals.budget > 0 ? Math.round((overallVariance / totals.budget) * 100) : 0;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Budget vs. Actuals</CardTitle>
            <CardDescription>Planned spend compared to actual expenditure</CardDescription>
          </div>
          <div className={cn(
            "flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium",
            overallVariance >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
          )}>
            {overallVariance >= 0 ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
            {Math.abs(overallPct)}% {overallVariance >= 0 ? 'under' : 'over'} budget
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-slate-400">No budget data</div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                  formatter={(val) => [`$${val.toLocaleString()}`, '']}
                />
                <Legend />
                <Bar dataKey="budget" name="Budget" fill="#c4b5fd" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actual" name="Actual" radius={[4, 4, 0, 0]}>
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
                <p className="text-sm text-slate-500">{overallVariance >= 0 ? 'Remaining' : 'Over Budget'}</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
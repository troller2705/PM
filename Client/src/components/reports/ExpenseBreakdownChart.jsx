import React, { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format, parseISO, startOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';

const COLORS = ['#8b5cf6','#3b82f6','#10b981','#f59e0b','#ef4444','#ec4899','#6366f1','#14b8a6','#f97316','#a855f7'];

export default function ExpenseBreakdownChart({ expenses, categories }) {
  const paidExpenses = expenses.filter(e => e.status === 'paid' && e.amount > 0);

  const monthlyData = useMemo(() => {
    if (paidExpenses.length === 0) return [];
    const end = new Date();
    const start = subMonths(end, 5);
    return eachMonthOfInterval({ start, end }).map(month => {
      const monthStr = format(month, 'yyyy-MM');
      const total = paidExpenses
        .filter(e => e.date && e.date.startsWith(monthStr))
        .reduce((s, e) => s + (e.amount || 0), 0);
      return { month: format(month, 'MMM'), total };
    });
  }, [paidExpenses]);

  const categoryData = useMemo(() => {
    return categories.map(cat => ({
      name: cat.name,
      value: paidExpenses.filter(e => e.category_id === cat.id).reduce((s, e) => s + (e.amount || 0), 0),
    })).filter(c => c.value > 0).sort((a, b) => b.value - a.value);
  }, [paidExpenses, categories]);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle>Expense Breakdown</CardTitle>
        <CardDescription>Monthly spending trends and category distribution</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-medium text-slate-600 mb-3">Monthly Trend (6 months)</p>
            {monthlyData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-slate-400 text-sm">No expense data</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={v => [`$${v.toLocaleString()}`, 'Spent']} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Area type="monotone" dataKey="total" stroke="#8b5cf6" fill="url(#expGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-600 mb-3">By Category</p>
            {categoryData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-slate-400 text-sm">No category data</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" outerRadius={80} paddingAngle={2} dataKey="value">
                    {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={v => [`$${v.toLocaleString()}`, '']} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Legend iconType="circle" iconSize={8} formatter={val => <span style={{ fontSize: 11 }}>{val}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
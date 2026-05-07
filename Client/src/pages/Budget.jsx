import React, { useState } from 'react';
import { useParams } from 'react-router-dom'; // <-- ADDED: To grab workspace context
import { db } from '../api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../components/common/PageHeader';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import SearchInput from '../components/common/SearchInput';
import EmptyState from '../components/common/EmptyState';
import DataTable from '../components/common/DataTable';
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Switch } from "../components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Skeleton } from "../components/ui/skeleton";
import { Plus, DollarSign, Wallet, MoreVertical, Pencil, Trash2, Check, X, Tag, Briefcase, Flame, Users } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../components/ui/dropdown-menu";
import { format } from 'date-fns';
import { cn } from "../lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

const BUDGET_STATUSES = ['draft', 'pending_approval', 'approved', 'active', 'frozen', 'closed'];
const EXPENSE_STATUSES = ['pending', 'approved', 'rejected', 'paid', 'cancelled'];

export default function Budget() {
  const { projectId } = useParams(); // <-- Get the workspace ID
  const [activeTab, setActiveTab] = useState('overview');
  const [search, setSearch] = useState('');

  const [budgetDialog, setBudgetDialog] = useState(false);
  const [expenseDialog, setExpenseDialog] = useState(false);
  const [rateCardDialog, setRateCardDialog] = useState(false);

  const [editingBudget, setEditingBudget] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [editingRateCard, setEditingRateCard] = useState(null);

  const queryClient = useQueryClient();

  // Fetch all global data
  const { data: allBudgets = [], isLoading: budgetsLoading } = useQuery({ queryKey: ['budgets'], queryFn: () => db.budgets.list() });
  const { data: allExpenses = [], isLoading: expensesLoading } = useQuery({ queryKey: ['expenses'], queryFn: () => db.expenses.list() });
  const { data: categories = [] } = useQuery({ queryKey: ['budgetCategories'], queryFn: () => db.budgetCategories.list() });
  const { data: roles = [] } = useQuery({ queryKey: ['roles'], queryFn: () => db.roles.list() });
  const { data: rateCards = [], isLoading: rateCardsLoading } = useQuery({ queryKey: ['rateCards'], queryFn: () => db.rateCards?.list() || Promise.resolve([]) });

  // Filter down to ONLY this project
  const projectBudgets = allBudgets.filter(b => b.project_id === projectId);
  const projectBudgetIds = projectBudgets.map(b => b._id || b.id);
  const projectExpenses = allExpenses.filter(e => e.project_id === projectId || projectBudgetIds.includes(e.budget_id));

  const createBudgetMutation = useMutation({ mutationFn: (data) => db.budgets.create(data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['budgets'] }); setBudgetDialog(false); setEditingBudget(null); } });
  const updateBudgetMutation = useMutation({ mutationFn: ({ id, data }) => db.budgets.update(id, data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['budgets'] }); setBudgetDialog(false); setEditingBudget(null); } });
  const deleteBudgetMutation = useMutation({ mutationFn: (id) => db.budgets.delete(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['budgets'] }) });

  const createExpenseMutation = useMutation({ mutationFn: (data) => db.expenses.create(data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['expenses'] }); setExpenseDialog(false); setEditingExpense(null); } });
  const updateExpenseMutation = useMutation({ mutationFn: ({ id, data }) => db.expenses.update(id, data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['expenses'] }); setExpenseDialog(false); setEditingExpense(null); } });
  const deleteExpenseMutation = useMutation({ mutationFn: (id) => db.expenses.delete(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses'] }) });

  const createRateCardMutation = useMutation({ mutationFn: (data) => db.rateCards.create(data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['rateCards'] }); setRateCardDialog(false); setEditingRateCard(null); } });
  const updateRateCardMutation = useMutation({ mutationFn: ({ id, data }) => db.rateCards.update(id, data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['rateCards'] }); setRateCardDialog(false); setEditingRateCard(null); } });
  const deleteRateCardMutation = useMutation({ mutationFn: (id) => db.rateCards.delete(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rateCards'] }) });

  // 1. Core Calculations for THIS project
  const combinedTotalBudget = projectBudgets.reduce((sum, b) => sum + (b.total_amount || 0), 0);

  const paidExpenses = projectExpenses.filter(e => e.status === 'paid');
  const totalSpent = paidExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const billableTotal = paidExpenses.filter(e => e.is_billable).reduce((sum, e) => sum + (e.amount || 0), 0);

  const monthlySpending = (() => {
    const months = {};
    paidExpenses.forEach(e => {
      if(!e.date) return;
      const month = format(new Date(e.date), 'MMM yyyy');
      months[month] = (months[month] || 0) + (e.amount || 0);
    });
    return Object.entries(months).map(([month, amount]) => ({ month, amount })).slice(-6);
  })();
  const avgBurnRate = monthlySpending.length ? monthlySpending.reduce((sum, m) => sum + m.amount, 0) / monthlySpending.length : 0;

  const billableVsNonBillable = [
    { name: 'Billable', value: billableTotal },
    { name: 'Internal', value: totalSpent - billableTotal }
  ].filter(c => c.value > 0);

  const getCategoryById = (id) => categories.find(c => (c._id || c.id) === id);
  const getRoleById = (id) => roles.find(r => (r._id || r.id) === id);

  const handleBudgetSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      name: formData.get('name'),
      fiscal_year: Number(formData.get('fiscal_year')),
      total_amount: Number(formData.get('total_amount')),
      project_id: projectId, // <-- Implicitly lock to current project
      status: formData.get('status'),
      notes: formData.get('notes'),
    };

    const budgetId = editingBudget?._id || editingBudget?.id;
    if (editingBudget) {
      updateBudgetMutation.mutate({ id: budgetId, data });
    } else {
      createBudgetMutation.mutate(data);
    }
  };

  const handleExpenseSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const budget_id = formData.get('budget_id') === 'none' ? null : formData.get('budget_id');
    const category_id = formData.get('category_id') === 'none' ? null : formData.get('category_id');

    const data = {
      description: formData.get('description'),
      amount: Number(formData.get('amount')),
      budget_id: budget_id,
      category_id: category_id,
      project_id: projectId, // <-- Implicitly lock to current project
      vendor: formData.get('vendor'),
      date: formData.get('date'),
      status: formData.get('status'),
      payment_method: formData.get('payment_method'),
      is_billable: formData.get('is_billable') === 'on',
    };

    const expenseId = editingExpense?._id || editingExpense?.id;
    if (editingExpense) {
      updateExpenseMutation.mutate({ id: expenseId, data });
    } else {
      createExpenseMutation.mutate(data);
    }
  };

  const handleRateCardSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      role_id: formData.get('role_id'),
      hourly_rate: Number(formData.get('hourly_rate')),
      currency: formData.get('currency') || 'USD'
    };
    const rateCardId = editingRateCard?._id || editingRateCard?.id;
    editingRateCard ? updateRateCardMutation.mutate({ id: rateCardId, data }) : createRateCardMutation.mutate(data);
  };

  const expenseColumns = [
    {
      header: 'Description',
      render: (expense) => (
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium text-slate-900">{expense.description}</p>
              {expense.is_billable && <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] h-5 py-0">Billable</Badge>}
            </div>
            <p className="text-sm text-slate-500">{expense.vendor}</p>
          </div>
      ),
    },
    {
      header: 'Amount',
      render: (expense) => <span className="font-semibold text-slate-900">${expense.amount?.toLocaleString()}</span>,
    },
    {
      header: 'Category',
      render: (expense) => {
        const cat = getCategoryById(expense.category_id);
        return cat ? <Badge variant="outline" className="gap-1"><Tag className="h-3 w-3" />{cat.name}</Badge> : '-';
      },
    },
    {
      header: 'Date',
      render: (expense) => expense.date ? format(new Date(expense.date), 'MMM d, yyyy') : '-',
    },
    {
      header: 'Status',
      render: (expense) => <StatusBadge status={expense.status} />,
    },
    {
      header: 'Actions',
      render: (expense) => {
        const expenseId = expense._id || expense.id;
        return (
            <div className="flex items-center gap-2">
              {expense.status === 'pending' && (
                  <>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600" onClick={() => updateExpenseMutation.mutate({ id: expenseId, data: { ...expense, status: 'approved' } })}><Check className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => updateExpenseMutation.mutate({ id: expenseId, data: { ...expense, status: 'rejected' } })}><X className="h-4 w-4" /></Button>
                  </>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => { setEditingExpense(expense); setExpenseDialog(true); }}><Pencil className="h-4 w-4 mr-2" /> Edit</DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600" onClick={() => deleteExpenseMutation.mutate(expenseId)}><Trash2 className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
        );
      },
    },
  ];

  return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <PageHeader
            title="Project Financials"
            subtitle="Manage budgets, expenses, and burn rate for this project"
            actions={
              <div className="flex gap-2">
                <Button onClick={() => { setEditingExpense(null); setExpenseDialog(true); }}><Plus className="h-4 w-4 mr-2" /> Add Expense</Button>
              </div>
            }
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Project Budget" value={`$${combinedTotalBudget.toLocaleString()}`} icon={Wallet} subtitle="Combined dedicated budgets" />
          <StatCard title="Total Spent" value={`$${totalSpent.toLocaleString()}`} icon={DollarSign} subtitle={`${combinedTotalBudget > 0 ? Math.round((totalSpent / combinedTotalBudget) * 100) : 0}% of budget`} />
          <StatCard title="Monthly Burn Rate" value={`$${Math.round(avgBurnRate).toLocaleString()}`} icon={Flame} subtitle="Avg over last 6 months" />
          <StatCard title="Billable Total" value={`$${billableTotal.toLocaleString()}`} icon={Briefcase} subtitle={`${totalSpent > 0 ? Math.round((billableTotal / totalSpent) * 100) : 0}% of all expenses`} />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="budgets">Budgets</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="rates">Rate Cards</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="border-0 shadow-sm lg:col-span-2">
                <CardHeader><CardTitle>Historical Burn Rate</CardTitle></CardHeader>
                <CardContent>
                  {monthlySpending.length === 0 ? <p className="text-center text-slate-500 py-8">No data</p> : (
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={monthlySpending}><XAxis dataKey="month" /><YAxis /><Tooltip formatter={(value) => `$${value.toLocaleString()}`} /><Bar dataKey="amount" fill="#ef4444" radius={[4, 4, 0, 0]} /></BarChart>
                      </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardHeader><CardTitle>Billable vs Internal</CardTitle></CardHeader>
                <CardContent>
                  {billableVsNonBillable.length === 0 ? <p className="text-center text-slate-500 py-8">No data</p> : (
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie data={billableVsNonBillable} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">
                            <Cell fill="#3b82f6" /><Cell fill="#94a3b8" />
                          </Pie>
                          <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="budgets" className="mt-6">
            <div className="flex justify-end mb-4">
              <Button onClick={() => { setEditingBudget(null); setBudgetDialog(true); }}><Plus className="h-4 w-4 mr-2" /> Create Budget</Button>
            </div>
            {budgetsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-48" />)}</div>
            ) : projectBudgets.length === 0 ? (
                <EmptyState icon={Wallet} title="No budgets" description="Create a dedicated budget to start tracking this project's funds" action={() => setBudgetDialog(true)} actionLabel="Create Budget" />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {projectBudgets.map(budget => {
                    const budgetId = budget._id || budget.id;
                    const spent = projectExpenses.filter(e => e.budget_id === budgetId && e.status === 'paid').reduce((sum, e) => sum + (e.amount || 0), 0);
                    const progress = Math.min(Math.round((spent / budget.total_amount) * 100), 100);

                    return (
                        <Card key={budgetId} className="border-0 shadow-sm">
                          <CardContent className="p-5">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="font-semibold text-slate-900">{budget.name}</h3>
                                <p className="text-sm text-slate-500">FY {budget.fiscal_year}</p>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => { setEditingBudget(budget); setBudgetDialog(true); }}><Pencil className="h-4 w-4 mr-2" /> Edit</DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600" onClick={() => deleteBudgetMutation.mutate(budgetId)}><Trash2 className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            <StatusBadge status={budget.status} className="mb-4" />
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-600">Spent</span>
                                <span className="font-medium">${spent.toLocaleString()} / ${budget.total_amount?.toLocaleString()}</span>
                              </div>
                              <Progress value={progress} className={cn("h-2", progress > 90 && "bg-red-100")} indicatorClassName={progress > 90 ? 'bg-red-500' : ''} />
                              <p className="text-xs text-slate-500">{progress}% used</p>
                            </div>
                          </CardContent>
                        </Card>
                    );
                  })}
                </div>
            )}
          </TabsContent>

          <TabsContent value="expenses" className="mt-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between mb-4">
              <SearchInput value={search} onChange={setSearch} placeholder="Search project expenses..." className="sm:w-64" />
            </div>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-0">
                <DataTable columns={expenseColumns} data={projectExpenses.filter(e => e.description?.toLowerCase().includes(search.toLowerCase()))} isLoading={expensesLoading} emptyMessage="No expenses found" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rates" className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-slate-500">Define hourly billing rates for roles to calculate internal costs vs client invoicing.</p>
              <Button onClick={() => { setEditingRateCard(null); setRateCardDialog(true); }}><Plus className="h-4 w-4 mr-2" /> Add Rate Card</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {rateCards.map(rate => {
                const rateCardId = rate._id || rate.id;
                return (
                    <Card key={rateCardId} className="border-0 shadow-sm">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-100 rounded-lg"><Users className="h-5 w-5 text-slate-600" /></div>
                          <div>
                            <p className="font-semibold text-slate-900">{getRoleById(rate.role_id)?.name || 'Unknown Role'}</p>
                            <p className="text-sm text-slate-500">${rate.hourly_rate} / hour</p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setEditingRateCard(rate); setRateCardDialog(true); }}><Pencil className="h-4 w-4 mr-2" /> Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => deleteRateCardMutation.mutate(rateCardId)}><Trash2 className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </CardContent>
                    </Card>
                );
              })}
              {rateCards.length === 0 && !rateCardsLoading && (
                  <div className="col-span-3"><EmptyState icon={Briefcase} title="No Rate Cards" description="Set up hourly rates for roles to enable cost tracking." action={() => setRateCardDialog(true)} actionLabel="Add Rate" /></div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Dialogs with aria-describedby fixes */}
        <Dialog open={budgetDialog} onOpenChange={setBudgetDialog}>
          <DialogContent className="max-w-md" aria-describedby={undefined}>
            <DialogHeader><DialogTitle>{editingBudget ? 'Edit Budget' : 'Create Dedicated Budget'}</DialogTitle></DialogHeader>
            <form onSubmit={handleBudgetSubmit} className="space-y-4">
              <div className="space-y-2"><Label>Budget Name</Label><Input name="name" required defaultValue={editingBudget?.name} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Fiscal Year</Label><Input name="fiscal_year" type="number" required defaultValue={editingBudget?.fiscal_year || new Date().getFullYear()} /></div>
                <div className="space-y-2"><Label>Total Amount ($)</Label><Input name="total_amount" type="number" required defaultValue={editingBudget?.total_amount} /></div>
              </div>

              {/* The Project dropdown was removed here since it is implicitly locked to this workspace! */}

              <div className="space-y-2">
                <Label>Status</Label>
                <Select name="status" defaultValue={editingBudget?.status || 'draft'}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{BUDGET_STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <DialogFooter><Button type="button" variant="outline" onClick={() => setBudgetDialog(false)}>Cancel</Button><Button type="submit">Save</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={expenseDialog} onOpenChange={setExpenseDialog}>
          <DialogContent className="max-w-md" aria-describedby={undefined}>
            <DialogHeader><DialogTitle>{editingExpense ? 'Edit Expense' : 'Add Expense'}</DialogTitle></DialogHeader>
            <form onSubmit={handleExpenseSubmit} className="space-y-4">
              <div className="space-y-2"><Label>Description</Label><Input name="description" required defaultValue={editingExpense?.description} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Amount ($)</Label><Input name="amount" type="number" step="0.01" required defaultValue={editingExpense?.amount} /></div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  {/* Safe parsing of ISO string date for HTML input */}
                  <Input name="date" type="date" defaultValue={editingExpense?.date ? editingExpense.date.split('T')[0] : ''} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Budget</Label>
                  <Select name="budget_id" defaultValue={editingExpense?.budget_id || 'none'}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {/* ONLY shows budgets assigned to this workspace */}
                      {projectBudgets.map(b => <SelectItem key={b._id || b.id} value={b._id || b.id}>{b.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select name="category_id" defaultValue={editingExpense?.category_id || 'none'}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {categories.map(c => <SelectItem key={c._id || c.id} value={c._id || c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Project ID Dropdown removed here implicitly locked to this workspace! */}

              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100 mt-2">
                <div>
                  <Label className="text-base">Billable to Client</Label>
                  <p className="text-xs text-slate-500">Track this expense for future invoicing.</p>
                </div>
                <Switch name="is_billable" defaultChecked={editingExpense?.is_billable} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select name="status" defaultValue={editingExpense?.status || 'pending'}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{EXPENSE_STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Vendor</Label><Input name="vendor" defaultValue={editingExpense?.vendor} /></div>
              </div>

              <DialogFooter><Button type="button" variant="outline" onClick={() => setExpenseDialog(false)}>Cancel</Button><Button type="submit">Save</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={rateCardDialog} onOpenChange={setRateCardDialog}>
          <DialogContent className="max-w-sm" aria-describedby={undefined}>
            <DialogHeader><DialogTitle>{editingRateCard ? 'Edit Rate' : 'Set Role Rate'}</DialogTitle></DialogHeader>
            <form onSubmit={handleRateCardSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select name="role_id" defaultValue={editingRateCard?.role_id || 'none'} required>
                  <SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" disabled>Select a role</SelectItem>
                    {roles.map(r => <SelectItem key={r._id || r.id} value={r._id || r.id}>{r.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Hourly Rate ($)</Label><Input name="hourly_rate" type="number" step="1" required defaultValue={editingRateCard?.hourly_rate} /></div>
              <DialogFooter><Button type="button" variant="outline" onClick={() => setRateCardDialog(false)}>Cancel</Button><Button type="submit">Save</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
  );
}
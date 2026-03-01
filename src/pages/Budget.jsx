import React, { useState } from 'react';
import { base44 } from '../api/base44Client';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Skeleton } from "../components/ui/skeleton";
import {
  Plus,
  DollarSign,
  Receipt,
  Wallet,
  TrendingUp,
  MoreVertical,
  Pencil,
  Trash2,
  Check,
  X,
  Tag,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { format } from 'date-fns';
import { cn } from "../lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

const BUDGET_STATUSES = ['draft', 'pending_approval', 'approved', 'active', 'frozen', 'closed'];
const EXPENSE_STATUSES = ['pending', 'approved', 'rejected', 'paid', 'cancelled'];
const PAYMENT_METHODS = ['credit_card', 'bank_transfer', 'cash', 'invoice', 'other'];

const CHART_COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#14b8a6'];

export default function Budget() {
  const [activeTab, setActiveTab] = useState('overview');
  const [search, setSearch] = useState('');
  const [budgetDialog, setBudgetDialog] = useState(false);
  const [expenseDialog, setExpenseDialog] = useState(false);
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const queryClient = useQueryClient();

  const { data: budgets = [], isLoading: budgetsLoading } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => base44.entities.Budget.list('-created_date', 100),
  });

  const { data: expenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => base44.entities.Expense.list('-created_date', 200),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['budgetCategories'],
    queryFn: () => base44.entities.BudgetCategory.list(),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list(),
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => base44.entities.Department.list(),
  });

  // Budget mutations
  const createBudgetMutation = useMutation({
    mutationFn: (data) => base44.entities.Budget.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      setBudgetDialog(false);
      setEditingBudget(null);
    },
  });

  const updateBudgetMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Budget.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      setBudgetDialog(false);
      setEditingBudget(null);
    },
  });

  const deleteBudgetMutation = useMutation({
    mutationFn: (id) => base44.entities.Budget.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['budgets'] }),
  });

  // Expense mutations
  const createExpenseMutation = useMutation({
    mutationFn: (data) => base44.entities.Expense.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setExpenseDialog(false);
      setEditingExpense(null);
    },
  });

  const updateExpenseMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Expense.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setExpenseDialog(false);
      setEditingExpense(null);
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (id) => base44.entities.Expense.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses'] }),
  });

  // Category mutations
  const createCategoryMutation = useMutation({
    mutationFn: (data) => base44.entities.BudgetCategory.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgetCategories'] });
      setCategoryDialog(false);
      setEditingCategory(null);
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.BudgetCategory.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgetCategories'] });
      setCategoryDialog(false);
      setEditingCategory(null);
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id) => base44.entities.BudgetCategory.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['budgetCategories'] }),
  });

  // Calculations
  const totalBudget = budgets.reduce((sum, b) => sum + (b.total_amount || 0), 0);
  const totalSpent = expenses.filter(e => e.status === 'paid').reduce((sum, e) => sum + (e.amount || 0), 0);
  const pendingExpenses = expenses.filter(e => e.status === 'pending');
  const pendingAmount = pendingExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  const getCategoryById = (id) => categories.find(c => c.id === id);
  const getProjectById = (id) => projects.find(p => p.id === id);

  // Chart data
  const categorySpending = categories.map(cat => ({
    name: cat.name,
    value: expenses.filter(e => e.category_id === cat.id && e.status === 'paid').reduce((sum, e) => sum + (e.amount || 0), 0),
  })).filter(c => c.value > 0);

  const monthlySpending = (() => {
    const months = {};
    expenses.filter(e => e.status === 'paid' && e.date).forEach(e => {
      const month = format(new Date(e.date), 'MMM yyyy');
      months[month] = (months[month] || 0) + (e.amount || 0);
    });
    return Object.entries(months).map(([month, amount]) => ({ month, amount })).slice(-6);
  })();

  const handleBudgetSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      name: formData.get('name'),
      fiscal_year: Number(formData.get('fiscal_year')),
      total_amount: Number(formData.get('total_amount')),
      project_id: formData.get('project_id') || null,
      department_id: formData.get('department_id') || null,
      status: formData.get('status'),
      notes: formData.get('notes'),
    };

    if (editingBudget) {
      updateBudgetMutation.mutate({ id: editingBudget.id, data });
    } else {
      createBudgetMutation.mutate(data);
    }
  };

  const handleExpenseSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      description: formData.get('description'),
      amount: Number(formData.get('amount')),
      budget_id: formData.get('budget_id') || null,
      category_id: formData.get('category_id') || null,
      project_id: formData.get('project_id') || null,
      vendor: formData.get('vendor'),
      date: formData.get('date'),
      status: formData.get('status'),
      payment_method: formData.get('payment_method'),
      reference_number: formData.get('reference_number'),
      notes: formData.get('notes'),
    };

    if (editingExpense) {
      updateExpenseMutation.mutate({ id: editingExpense.id, data });
    } else {
      createExpenseMutation.mutate(data);
    }
  };

  const handleCategorySubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      name: formData.get('name'),
      code: formData.get('code'),
      description: formData.get('description'),
      color: formData.get('color'),
    };

    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data });
    } else {
      createCategoryMutation.mutate(data);
    }
  };

  const handleApproveExpense = (expense) => {
    updateExpenseMutation.mutate({ id: expense.id, data: { ...expense, status: 'approved' } });
  };

  const handleRejectExpense = (expense) => {
    updateExpenseMutation.mutate({ id: expense.id, data: { ...expense, status: 'rejected' } });
  };

  const expenseColumns = [
    {
      header: 'Description',
      render: (expense) => (
        <div>
          <p className="font-medium text-slate-900">{expense.description}</p>
          <p className="text-sm text-slate-500">{expense.vendor}</p>
        </div>
      ),
    },
    {
      header: 'Amount',
      render: (expense) => (
        <span className="font-semibold text-slate-900">${expense.amount?.toLocaleString()}</span>
      ),
    },
    {
      header: 'Category',
      render: (expense) => {
        const cat = getCategoryById(expense.category_id);
        return cat ? (
          <Badge variant="outline" className="gap-1">
            <Tag className="h-3 w-3" />
            {cat.name}
          </Badge>
        ) : '-';
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
      render: (expense) => (
        <div className="flex items-center gap-2">
          {expense.status === 'pending' && (
            <>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600" onClick={() => handleApproveExpense(expense)}>
                <Check className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => handleRejectExpense(expense)}>
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => { setEditingExpense(expense); setExpenseDialog(true); }}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600" onClick={() => deleteExpenseMutation.mutate(expense.id)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Budget Management"
        subtitle="Track budgets, expenses, and financial reports"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setEditingCategory(null); setCategoryDialog(true); }}>
              <Tag className="h-4 w-4 mr-2" />
              Categories
            </Button>
            <Button onClick={() => { setEditingExpense(null); setExpenseDialog(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Budget"
          value={`$${totalBudget.toLocaleString()}`}
          icon={Wallet}
        />
        <StatCard
          title="Total Spent"
          value={`$${totalSpent.toLocaleString()}`}
          icon={DollarSign}
          subtitle={`${Math.round((totalSpent / totalBudget) * 100) || 0}% of budget`}
        />
        <StatCard
          title="Pending Approval"
          value={`$${pendingAmount.toLocaleString()}`}
          icon={Receipt}
          subtitle={`${pendingExpenses.length} expenses`}
        />
        <StatCard
          title="Remaining"
          value={`$${(totalBudget - totalSpent).toLocaleString()}`}
          icon={TrendingUp}
          trend={totalBudget > totalSpent ? "On track" : "Over budget"}
          trendUp={totalBudget > totalSpent}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="budgets">Budgets</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Spending by Category */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Spending by Category</CardTitle>
              </CardHeader>
              <CardContent>
                {categorySpending.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">No spending data</p>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={categorySpending}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {categorySpending.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Monthly Spending */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Monthly Spending</CardTitle>
              </CardHeader>
              <CardContent>
                {monthlySpending.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">No spending data</p>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={monthlySpending}>
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                      <Bar dataKey="amount" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Pending Expenses */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Pending Approvals</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable
                columns={expenseColumns}
                data={pendingExpenses}
                isLoading={expensesLoading}
                emptyMessage="No pending expenses"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budgets" className="mt-6">
          <div className="flex justify-end mb-4">
            <Button onClick={() => { setEditingBudget(null); setBudgetDialog(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Create Budget
            </Button>
          </div>
          {budgetsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-48" />)}
            </div>
          ) : budgets.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="No budgets"
              description="Create your first budget to start tracking"
              action={() => setBudgetDialog(true)}
              actionLabel="Create Budget"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {budgets.map(budget => {
                const budgetExpenses = expenses.filter(e => e.budget_id === budget.id && e.status === 'paid');
                const spent = budgetExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
                const progress = Math.min(Math.round((spent / budget.total_amount) * 100), 100);

                return (
                  <Card key={budget.id} className="border-0 shadow-sm">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-slate-900">{budget.name}</h3>
                          <p className="text-sm text-slate-500">FY {budget.fiscal_year}</p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setEditingBudget(budget); setBudgetDialog(true); }}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => deleteBudgetMutation.mutate(budget.id)}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <StatusBadge status={budget.status} className="mb-4" />
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Spent</span>
                          <span className="font-medium">${spent.toLocaleString()} / ${budget.total_amount?.toLocaleString()}</span>
                        </div>
                        <Progress value={progress} className={cn("h-2", progress > 90 && "bg-red-100")} />
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
            <SearchInput value={search} onChange={setSearch} placeholder="Search expenses..." className="sm:w-64" />
            <Button onClick={() => { setEditingExpense(null); setExpenseDialog(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </div>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <DataTable
                columns={expenseColumns}
                data={expenses.filter(e => e.description?.toLowerCase().includes(search.toLowerCase()))}
                isLoading={expensesLoading}
                emptyMessage="No expenses found"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Budget Dialog */}
      <Dialog open={budgetDialog} onOpenChange={setBudgetDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingBudget ? 'Edit Budget' : 'Create Budget'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleBudgetSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Budget Name</Label>
              <Input id="name" name="name" required defaultValue={editingBudget?.name} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fiscal_year">Fiscal Year</Label>
                <Input id="fiscal_year" name="fiscal_year" type="number" required defaultValue={editingBudget?.fiscal_year || new Date().getFullYear()} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="total_amount">Total Amount ($)</Label>
                <Input id="total_amount" name="total_amount" type="number" required defaultValue={editingBudget?.total_amount} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="project_id">Project</Label>
                <Select name="project_id" defaultValue={editingBudget?.project_id || ''}>
                  <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                  <SelectContent>
                    {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="department_id">Department</Label>
                <Select name="department_id" defaultValue={editingBudget?.department_id || ''}>
                  <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                  <SelectContent>
                    {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select name="status" defaultValue={editingBudget?.status || 'draft'}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BUDGET_STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, ' ')}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" defaultValue={editingBudget?.notes} rows={2} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setBudgetDialog(false)}>Cancel</Button>
              <Button type="submit">{editingBudget ? 'Save' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Expense Dialog */}
      <Dialog open={expenseDialog} onOpenChange={setExpenseDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingExpense ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleExpenseSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" name="description" required defaultValue={editingExpense?.description} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount ($)</Label>
                <Input id="amount" name="amount" type="number" step="0.01" required defaultValue={editingExpense?.amount} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input id="date" name="date" type="date" defaultValue={editingExpense?.date} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category_id">Category</Label>
                <Select name="category_id" defaultValue={editingExpense?.category_id || ''}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget_id">Budget</Label>
                <Select name="budget_id" defaultValue={editingExpense?.budget_id || ''}>
                  <SelectTrigger><SelectValue placeholder="Select budget" /></SelectTrigger>
                  <SelectContent>
                    {budgets.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendor">Vendor</Label>
              <Input id="vendor" name="vendor" defaultValue={editingExpense?.vendor} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select name="status" defaultValue={editingExpense?.status || 'pending'}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EXPENSE_STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment_method">Payment Method</Label>
                <Select name="payment_method" defaultValue={editingExpense?.payment_method || 'credit_card'}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map(m => <SelectItem key={m} value={m} className="capitalize">{m.replace(/_/g, ' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reference_number">Reference Number</Label>
              <Input id="reference_number" name="reference_number" defaultValue={editingExpense?.reference_number} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setExpenseDialog(false)}>Cancel</Button>
              <Button type="submit">{editingExpense ? 'Save' : 'Add'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={categoryDialog} onOpenChange={setCategoryDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Categories</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              {categories.map(cat => (
                <div key={cat.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color || '#6366f1' }} />
                    <span className="font-medium">{cat.name}</span>
                    <span className="text-sm text-slate-500">({cat.code})</span>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingCategory(cat); }}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600" onClick={() => deleteCategoryMutation.mutate(cat.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={handleCategorySubmit} className="space-y-3 pt-4 border-t">
              <p className="text-sm font-medium">{editingCategory ? 'Edit Category' : 'Add New Category'}</p>
              <div className="grid grid-cols-2 gap-2">
                <Input name="name" placeholder="Name" required defaultValue={editingCategory?.name} />
                <Input name="code" placeholder="Code" required defaultValue={editingCategory?.code} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input name="description" placeholder="Description" defaultValue={editingCategory?.description} />
                <Input name="color" type="color" defaultValue={editingCategory?.color || '#6366f1'} />
              </div>
              <div className="flex gap-2">
                {editingCategory && (
                  <Button type="button" variant="outline" onClick={() => setEditingCategory(null)}>Cancel</Button>
                )}
                <Button type="submit" className="flex-1">{editingCategory ? 'Update' : 'Add'}</Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
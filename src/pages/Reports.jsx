import React, { useState } from 'react';
import { base44 } from 'api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from 'components/common/PageHeader';
import StatCard from 'components/common/StatCard';
import StatusBadge from 'components/common/StatusBadge';
import ReportExporter from 'components/reports/ReportExporter';
import BurnDownChart from 'components/reports/BurnDownChart';
import BudgetVsActualsChart from 'components/reports/BudgetVsActualsChart';
import TaskCompletionChart from 'components/reports/TaskCompletionChart';
import TeamPerformanceChart from 'components/reports/TeamPerformanceChart';
import SprintVelocityChart from 'components/reports/SprintVelocityChart';
import ProjectProgressTable from 'components/reports/ProjectProgressTable';
import ExpenseBreakdownChart from 'components/reports/ExpenseBreakdownChart';
import ScheduleReportModal from 'components/reports/ScheduleReportModal';
import { Button } from 'components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from 'components/ui/card';
import { Badge } from 'components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from 'components/ui/dialog';
import { Input } from 'components/ui/input';
import { Label } from 'components/ui/label';
import { Textarea } from 'components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from 'components/ui/select';
import { Skeleton } from 'components/ui/skeleton';
import {
  BarChart2, FileText, Clock, Calendar, Plus, Pin, PinOff,
  Trash2, Settings2, Play, FolderKanban, DollarSign, Users,
  TrendingUp, Zap, Target, Activity
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from 'lib/utils';

const REPORT_TEMPLATES = [
  {
    type: 'project_progress',
    name: 'Project Progress',
    description: 'Overall progress, health status, and timeline for all projects',
    icon: FolderKanban,
    color: 'from-violet-500 to-indigo-500',
  },
  {
    type: 'budget_vs_actuals',
    name: 'Budget vs. Actuals',
    description: 'Planned budget compared to actual spend with variance analysis',
    icon: DollarSign,
    color: 'from-emerald-500 to-teal-500',
  },
  {
    type: 'task_completion',
    name: 'Task Completion',
    description: 'Task completion rates by project, team member, and priority',
    icon: Target,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    type: 'team_performance',
    name: 'Team Performance',
    description: 'Individual and team productivity, velocity, and time tracking',
    icon: Users,
    color: 'from-amber-500 to-orange-500',
  },
  {
    type: 'burn_down',
    name: 'Burn-Down',
    description: 'Ideal vs actual task burndown for sprints and projects',
    icon: TrendingUp,
    color: 'from-rose-500 to-pink-500',
  },
  {
    type: 'sprint_velocity',
    name: 'Sprint Velocity',
    description: 'Sprint-over-sprint velocity and completion rate trends',
    icon: Zap,
    color: 'from-purple-500 to-violet-500',
  },
  {
    type: 'budget_utilization',
    name: 'Budget Utilization',
    description: 'Monthly expense trends and category-level spend breakdown',
    icon: Activity,
    color: 'from-indigo-500 to-blue-500',
  },
];

export default function Reports() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeReport, setActiveReport] = useState(null);
  const [createDialog, setCreateDialog] = useState(false);
  const [scheduleDialog, setScheduleDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState('all');
  const [selectedSprint, setSelectedSprint] = useState('all');
  const queryClient = useQueryClient();

  // Data queries
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'], queryFn: () => base44.entities.Project.list('-created_date', 100),
  });
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks'], queryFn: () => base44.entities.Task.list('-created_date', 500),
  });
  const { data: users = [] } = useQuery({
    queryKey: ['users'], queryFn: () => base44.entities.User.list(),
  });
  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets'], queryFn: () => base44.entities.Budget.list(),
  });
  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses'], queryFn: () => base44.entities.Expense.list('-created_date', 500),
  });
  const { data: sprints = [] } = useQuery({
    queryKey: ['sprints'], queryFn: () => base44.entities.Sprint.list('-created_date', 50),
  });
  const { data: timeLogs = [] } = useQuery({
    queryKey: ['timeLogs'], queryFn: () => base44.entities.TimeLog.list(),
  });
  const { data: categories = [] } = useQuery({
    queryKey: ['budgetCategories'], queryFn: () => base44.entities.BudgetCategory.list(),
  });
  const { data: savedReports = [], isLoading: savedLoading } = useQuery({
    queryKey: ['savedReports'], queryFn: () => base44.entities.SavedReport.list('-created_date'),
  });

  const createReportMutation = useMutation({
    mutationFn: (data) => base44.entities.SavedReport.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['savedReports'] }); setCreateDialog(false); },
  });
  const updateReportMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SavedReport.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['savedReports'] }),
  });
  const deleteReportMutation = useMutation({
    mutationFn: (id) => base44.entities.SavedReport.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['savedReports'] }),
  });

  const isLoading = projectsLoading || tasksLoading;

  // Filtered data
  const filteredTasks = selectedProject === 'all' ? tasks : tasks.filter(t => t.project_id === selectedProject);
  const filteredProjects = selectedProject === 'all' ? projects : projects.filter(p => p.id === selectedProject);
  const filteredSprints = selectedProject === 'all' ? sprints : sprints.filter(s => s.project_id === selectedProject);
  const selectedSprintObj = selectedSprint !== 'all' ? sprints.find(s => s.id === selectedSprint) : null;

  // Summary stats
  const totalProgress = projects.length > 0
    ? Math.round(projects.reduce((acc, p) => {
        const pt = tasks.filter(t => t.project_id === p.id);
        if (pt.length === 0) return acc;
        return acc + (tasks.filter(t => t.project_id === p.id && t.status === 'done').length / pt.length) * 100;
      }, 0) / projects.filter(p => tasks.some(t => t.project_id === p.id)).length) || 0
    : 0;
  const totalBudget = budgets.reduce((s, b) => s + (b.total_amount || 0), 0);
  const totalSpent = expenses.filter(e => e.status === 'paid').reduce((s, e) => s + (e.amount || 0), 0);
  const budgetUtilization = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  // CSV data builders
  const getProjectCsvData = () => projects.map(p => ({
    Name: p.name, Code: p.code, Status: p.status, Priority: p.priority,
    'Start Date': p.start_date, 'Target Date': p.target_date,
    Budget: p.budget, 'Tasks Total': tasks.filter(t => t.project_id === p.id).length,
    'Tasks Done': tasks.filter(t => t.project_id === p.id && t.status === 'done').length,
  }));
  const getTaskCsvData = () => tasks.map(t => ({
    Title: t.title, Status: t.status, Priority: t.priority, Type: t.task_type,
    'Due Date': t.due_date, 'Estimated Hours': t.estimated_hours, 'Logged Hours': t.logged_hours,
    Project: projects.find(p => p.id === t.project_id)?.name,
    Assignee: users.find(u => u.id === t.assignee_id)?.full_name,
  }));
  const getExpenseCsvData = () => expenses.map(e => ({
    Description: e.description, Amount: e.amount, Vendor: e.vendor,
    Date: e.date, Status: e.status, Category: categories.find(c => c.id === e.category_id)?.name,
    'Payment Method': e.payment_method, 'Reference #': e.reference_number,
  }));

  const handleScheduleSave = (scheduleData) => {
    if (activeReport) {
      updateReportMutation.mutate({ id: activeReport.id, data: scheduleData });
    }
  };

  const handleCreateReport = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    createReportMutation.mutate({
      name: fd.get('name'),
      description: fd.get('description'),
      report_type: fd.get('report_type'),
      schedule: fd.get('schedule') || 'none',
    });
  };

  const pinnedReports = savedReports.filter(r => r.is_pinned);
  const scheduleLabel = { none: 'Manual', daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Analytics"
        subtitle="Customizable dashboards, automated reports, and data exports"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Save Report
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 p-4 bg-white rounded-xl border-0 shadow-sm">
        <div className="flex items-center gap-2">
          <FolderKanban className="h-4 w-4 text-slate-400" />
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-44 h-8 text-sm">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-slate-400" />
          <Select value={selectedSprint} onValueChange={setSelectedSprint}>
            <SelectTrigger className="w-44 h-8 text-sm">
              <SelectValue placeholder="All Sprints" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sprints</SelectItem>
              {filteredSprints.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border shadow-sm">
          <TabsTrigger value="dashboard" className="gap-2">
            <BarChart2 className="h-4 w-4" />
            Live Dashboard
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <FileText className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="saved" className="gap-2">
            <Clock className="h-4 w-4" />
            Saved Reports
            {savedReports.length > 0 && (
              <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center bg-violet-600 text-white text-xs">
                {savedReports.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ─── LIVE DASHBOARD ──────────────────────────────────────── */}
        <TabsContent value="dashboard" className="mt-6 space-y-6" id="report-printable">
          {/* KPI Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Avg. Project Progress" value={isLoading ? '…' : `${totalProgress}%`} icon={Target} />
            <StatCard title="Budget Utilization" value={isLoading ? '…' : `${budgetUtilization}%`} icon={DollarSign}
              trend={budgetUtilization > 90 ? 'Over 90% used' : 'On track'} trendUp={budgetUtilization <= 90} />
            <StatCard title="Tasks Completed" value={isLoading ? '…' : tasks.filter(t => t.status === 'done').length} icon={Target}
              subtitle={`of ${tasks.length} total`} />
            <StatCard title="Blocked Tasks" value={isLoading ? '…' : tasks.filter(t => t.status === 'blocked').length} icon={Activity} />
          </div>

          {/* Row 1 */}
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Skeleton className="h-80" />
              <Skeleton className="h-80" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="relative group">
                <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ReportExporter reportTitle="Budget vs Actuals" csvData={getExpenseCsvData()} filename="budget_vs_actuals" />
                </div>
                <BudgetVsActualsChart budgets={budgets} expenses={expenses} projects={projects} />
              </div>
              <div className="relative group">
                <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ReportExporter reportTitle="Task Completion" csvData={getTaskCsvData()} filename="task_completion" />
                </div>
                <TaskCompletionChart tasks={filteredTasks} projects={filteredProjects} />
              </div>
            </div>
          )}

          {/* Row 2 */}
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Skeleton className="h-80" />
              <Skeleton className="h-80" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="relative group">
                <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ReportExporter reportTitle="Team Performance" csvData={getTaskCsvData()} filename="team_performance" />
                </div>
                <TeamPerformanceChart users={users} tasks={filteredTasks} timeLogs={timeLogs} />
              </div>
              <div className="relative group">
                <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ReportExporter reportTitle="Sprint Velocity" csvData={getTaskCsvData()} filename="sprint_velocity" />
                </div>
                <SprintVelocityChart sprints={filteredSprints} tasks={filteredTasks} />
              </div>
            </div>
          )}

          {/* Burn-Down */}
          {!isLoading && (
            <div className="relative group">
              <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <ReportExporter reportTitle="Burn Down" csvData={getTaskCsvData()} filename="burn_down" />
              </div>
              <BurnDownChart
                project={filteredProjects[0]}
                tasks={filteredTasks}
                sprint={selectedSprintObj}
              />
            </div>
          )}

          {/* Expense Breakdown */}
          {!isLoading && (
            <div className="relative group">
              <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <ReportExporter reportTitle="Expense Breakdown" csvData={getExpenseCsvData()} filename="expense_breakdown" />
              </div>
              <ExpenseBreakdownChart expenses={expenses} categories={categories} />
            </div>
          )}

          {/* Project Progress Table */}
          {!isLoading && (
            <div className="relative group">
              <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <ReportExporter reportTitle="Project Progress" csvData={getProjectCsvData()} filename="project_progress" />
              </div>
              <ProjectProgressTable projects={filteredProjects} tasks={filteredTasks} users={users} />
            </div>
          )}
        </TabsContent>

        {/* ─── TEMPLATES ────────────────────────────────────────────── */}
        <TabsContent value="templates" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {REPORT_TEMPLATES.map(template => (
              <div key={template.type}
                className="group bg-white rounded-xl border-0 shadow-sm hover:shadow-md transition-all overflow-hidden cursor-pointer"
                onClick={() => {
                  setActiveTab('dashboard');
                }}
              >
                <div className={cn("h-2 bg-gradient-to-r", template.color)} />
                <div className="p-5">
                  <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4", template.color)}>
                    <template.icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-1">{template.name}</h3>
                  <p className="text-sm text-slate-500 mb-4 line-clamp-2">{template.description}</p>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 gap-1" variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        createReportMutation.mutate({
                          name: template.name,
                          description: template.description,
                          report_type: template.type,
                          schedule: 'none',
                        });
                      }}
                    >
                      <Plus className="h-3 w-3" /> Save
                    </Button>
                    <Button size="sm" className="flex-1 gap-1" onClick={(e) => { e.stopPropagation(); setActiveTab('dashboard'); }}>
                      <Play className="h-3 w-3" /> View
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* ─── SAVED REPORTS ───────────────────────────────────────── */}
        <TabsContent value="saved" className="mt-6">
          {savedLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-40" />)}
            </div>
          ) : savedReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="p-4 rounded-full bg-slate-100 mb-4">
                <FileText className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">No saved reports</h3>
              <p className="text-slate-500 mb-6">Save a report to access it quickly or schedule it for automated delivery.</p>
              <Button onClick={() => setCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" /> Save a Report
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedReports.map(report => {
                const template = REPORT_TEMPLATES.find(t => t.type === report.report_type);
                const Icon = template?.icon || FileText;
                return (
                  <Card key={report.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={cn("p-2 rounded-lg bg-gradient-to-br", template?.color || 'from-slate-400 to-slate-500')}>
                            <Icon className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900">{report.name}</h3>
                            <p className="text-xs text-slate-500 capitalize">{report.report_type?.replace(/_/g, ' ')}</p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7"
                            onClick={() => updateReportMutation.mutate({ id: report.id, data: { is_pinned: !report.is_pinned } })}
                          >
                            {report.is_pinned
                              ? <PinOff className="h-3.5 w-3.5 text-violet-600" />
                              : <Pin className="h-3.5 w-3.5 text-slate-400" />}
                          </Button>
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7 text-red-400"
                            onClick={() => deleteReportMutation.mutate(report.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {report.description && (
                        <p className="text-sm text-slate-500 line-clamp-2 mb-3">{report.description}</p>
                      )}

                      <div className="flex items-center gap-2 mb-4 flex-wrap">
                        <Badge variant="outline" className="text-xs gap-1">
                          <Calendar className="h-3 w-3" />
                          {scheduleLabel[report.schedule] || 'Manual'}
                        </Badge>
                        {report.email_recipients?.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {report.email_recipients.length} recipient{report.email_recipients.length !== 1 ? 's' : ''}
                          </Badge>
                        )}
                        {report.is_pinned && (
                          <Badge className="text-xs bg-violet-100 text-violet-700 border-0">Pinned</Badge>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1 gap-1"
                          onClick={() => { setActiveReport(report); setScheduleDialog(true); }}
                        >
                          <Settings2 className="h-3 w-3" /> Schedule
                        </Button>
                        <Button size="sm" className="flex-1 gap-1"
                          onClick={() => setActiveTab('dashboard')}
                        >
                          <Play className="h-3 w-3" /> View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Save Report</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateReport} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Report Name</Label>
              <Input id="name" name="name" required placeholder="e.g. Weekly Status Report" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" rows={2} placeholder="What does this report track?" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="report_type">Report Type</Label>
              <Select name="report_type" defaultValue="project_progress">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REPORT_TEMPLATES.map(t => (
                    <SelectItem key={t.type} value={t.type}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="schedule">Schedule</Label>
              <Select name="schedule" defaultValue="none">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Manual only</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={createReportMutation.isPending}>Save Report</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Schedule Modal */}
      <ScheduleReportModal
        open={scheduleDialog}
        onOpenChange={setScheduleDialog}
        report={activeReport}
        onSave={handleScheduleSave}
      />
    </div>
  );
}
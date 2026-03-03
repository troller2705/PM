import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { db } from '../api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../components/common/PageHeader';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import Avatar from '../components/common/Avatar';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Skeleton } from "../components/ui/skeleton";
import { ScrollArea } from "../components/ui/scroll-area";
import {
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  GitBranch,
  Pencil,
  Trash2,
  Plus,
  MoreVertical,
  Flag,
  ListTodo
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { format } from 'date-fns';
import { cn } from "../lib/utils";

// SVAR React Gantt Import
import { Gantt, Willow } from "@svar-ui/react-gantt";
import "@svar-ui/react-gantt/all.css";

export default function ProjectDetail() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('id');
  const [activeTab, setActiveTab] = useState('overview');
  const [milestoneDialog, setMilestoneDialog] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const queryClient = useQueryClient();

  // Queries
  const { data: projects = [], isLoading: isProjectLoading } = useQuery({ queryKey: ['projects'], queryFn: () => db.projects.list() });
  const { data: tasks = [], isLoading: isTasksLoading } = useQuery({ queryKey: ['tasks'], queryFn: () => db.tasks.list() });
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: () => db.users.list() });
  const { data: expenses = [] } = useQuery({ queryKey: ['expenses'], queryFn: () => db.expenses.list() });
  
  // Note: Add a mock milestones endpoint to your apiClient later if you want to save these
  const { data: milestones = [] } = useQuery({ queryKey: ['milestones', projectId], queryFn: () => Promise.resolve([]) }); 

  const project = projects.find(p => p.id === projectId);
  const projectTasks = tasks.filter(t => t.project_id === projectId);
  const projectExpenses = expenses.filter(e => e.project_id === projectId && e.status === 'paid');

  // Stats Calculations
  const completedTasks = projectTasks.filter(t => t.status === 'done').length;
  const taskProgress = projectTasks.length > 0 ? Math.round((completedTasks / projectTasks.length) * 100) : 0;
  const spentBudget = projectExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const budgetProgress = project?.budget ? Math.round((spentBudget / project.budget) * 100) : 0;

  // Transform Tasks for SVAR Gantt Chart
  const ganttData = React.useMemo(() => {
    if (!projectTasks.length) return { tasks: [], links: [] };

    // SVAR Gantt strictly expects numeric IDs and uses 0 for the root parent.
    // We create a map to reliably convert your string IDs ('t3') to numbers.
    const idMap = {};
    let nextId = 1;
    const getNumId = (strId) => {
      if (!strId) return 0; // 0 indicates a top-level task in SVAR
      if (!idMap[strId]) idMap[strId] = nextId++;
      return idMap[strId];
    };

    const formattedTasks = projectTasks.map(t => ({
      id: getNumId(t.id),
      text: t.title || 'Unnamed Task',
      start: t.start ? new Date(t.start) : new Date(), 
      duration: t.duration || (t.estimated_hours ? Math.ceil(t.estimated_hours / 8) : 3),
      progress: t.progress || (t.status === 'done' ? 100 : t.status === 'in_progress' ? 50 : 0),
      type: t.task_type === 'epic' ? 'summary' : 'task',
      parent: getNumId(t.parent), // Safely falls back to 0 if t.parent is undefined
      open: true 
    }));

    const formattedLinks = projectTasks.flatMap(t => 
      (t.links || []).map((link, idx) => ({
        id: getNumId(`${t.id}-link-${idx}`),
        source: getNumId(link.source),
        target: getNumId(t.id),
        // SVAR uses 'e2s' (End-to-Start) for standard dependencies
        type: link.type === '0' || !link.type ? 'e2s' : link.type 
      }))
    );

    return { tasks: formattedTasks, links: formattedLinks };
  }, [projectTasks]);

  const handleMilestoneSubmit = (e) => {
    e.preventDefault();
    // Implementation for saving milestones goes here
    setMilestoneDialog(false);
  };

  if (isProjectLoading || !project) {
    return <div className="p-8"><Skeleton className="h-12 w-1/3 mb-6" /><Skeleton className="h-64 w-full" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to={createPageUrl('Projects')}><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{project.name}</h1>
          <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
            <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">{project.code}</span>
            <StatusBadge status={project.status} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Task Progress" value={`${taskProgress}%`} icon={CheckCircle2} subtitle={`${completedTasks} of ${projectTasks.length} tasks`} />
        <StatCard title="Budget Spent" value={`$${spentBudget.toLocaleString()}`} icon={AlertCircle} subtitle={project.budget ? `${budgetProgress}% of $${project.budget.toLocaleString()}` : 'No budget set'} />
        <StatCard title="Team Size" value={project.team_member_ids?.length || 0} icon={Users} subtitle="Active contributors" />
        <StatCard title="Target Date" value={project.target_date ? format(new Date(project.target_date), 'MMM d, yyyy') : 'TBD'} icon={Calendar} trend={project.target_date && new Date(project.target_date) < new Date() ? "Overdue" : "On track"} trendUp={false} />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="timeline">Timeline (Gantt)</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border-0 shadow-sm">
              <CardHeader><CardTitle>Project Description</CardTitle></CardHeader>
              <CardContent><p className="text-slate-600 whitespace-pre-wrap">{project.description || 'No description provided.'}</p></CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
              <CardContent>
                <div className="text-sm text-slate-500 text-center py-8">Activity feed coming soon...</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="mt-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              {projectTasks.length === 0 ? (
                <EmptyState icon={ListTodo} title="No tasks" description="Create tasks in the Tasks view and assign them to this project." />
              ) : (
                <div className="divide-y divide-slate-100">
                  {projectTasks.map(task => (
                    <div key={task.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                      <div>
                        <p className="font-medium text-slate-900">{task.title}</p>
                        <div className="flex gap-2 mt-1">
                          <StatusBadge status={task.status} className="text-[10px] py-0 h-4" />
                          <Badge variant="secondary" className="text-[10px] py-0 h-4">{task.task_type}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {task.assignee_id && <Avatar name={users.find(u => u.id === task.assignee_id)?.full_name} size="sm" />}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* NEW TIMELINE/GANTT TAB */}
        <TabsContent value="timeline" className="mt-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-slate-100 mb-4">
              <div>
                <CardTitle>Project Schedule & Dependencies</CardTitle>
                <p className="text-sm text-slate-500 font-normal mt-1">Visualize the critical path and task relationships.</p>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {ganttData.tasks.length === 0 ? (
                 <EmptyState icon={GitBranch} title="No scheduling data" description="Add tasks with start dates and durations to generate a timeline." />
              ) : (
                <div className="h-[500px] w-full bg-white rounded-b-lg overflow-hidden">
                  <Willow>
                    <Gantt 
                      tasks={ganttData.tasks} 
                      links={ganttData.links} 
                    />
                  </Willow>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="milestones" className="mt-6">
          <div className="flex justify-end mb-4">
            <Button onClick={() => { setEditingMilestone(null); setMilestoneDialog(true); }}>
              <Plus className="h-4 w-4 mr-2" /> Add Milestone
            </Button>
          </div>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <EmptyState icon={Flag} title="No milestones" description="Define key delivery dates for your project." action={() => setMilestoneDialog(true)} actionLabel="Add Milestone" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Milestone Dialog */}
      <Dialog open={milestoneDialog} onOpenChange={setMilestoneDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingMilestone ? 'Edit Milestone' : 'Add Milestone'}</DialogTitle></DialogHeader>
          <form onSubmit={handleMilestoneSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" required defaultValue={editingMilestone?.title} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" name="description" defaultValue={editingMilestone?.description} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date</Label>
                <Input id="due_date" name="due_date" type="date" defaultValue={editingMilestone?.due_date} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select name="status" defaultValue={editingMilestone?.status || 'pending'}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="missed">Missed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setMilestoneDialog(false)}>Cancel</Button>
              <Button type="submit">{editingMilestone ? 'Save' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
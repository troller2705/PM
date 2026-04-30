import React, { useState } from 'react';
import { db } from '@/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '@/components/common/PageHeader';
import StatusBadge from '@/components/common/StatusBadge';
import SearchInput from '@/components/common/SearchInput';
import EmptyState from '@/components/common/EmptyState';
import Avatar from '@/components/common/Avatar';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Plus, ListTodo, Clock, MoreVertical, Pencil, Trash2,
  GanttChart as GanttIcon, Calendar, LayoutGrid, List, Table2,
} from 'lucide-react';
import GanttChart from '@/components/tasks/GanttChart';
import KanbanBoard from '@/components/tasks/KanbanBoard';
import CalendarView from '@/components/tasks/CalendarView';
import SpreadsheetView from '@/components/tasks/SpreadsheetView';
import MassActionsBar from '@/components/tasks/MassActionsBar';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { cn } from "@/lib/utils";

const TASK_STATUSES = ['backlog', 'todo', 'in_progress', 'review', 'testing', 'done', 'blocked'];
const TASK_TYPES = ['feature', 'bug', 'improvement', 'task', 'epic', 'story', 'spike'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];

const VIEW_MODES = [
  { id: 'kanban', label: 'Kanban', icon: LayoutGrid },
  { id: 'list', label: 'List', icon: List },
  { id: 'gantt', label: 'Gantt', icon: GanttIcon },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'spreadsheet', label: 'Sheet', icon: Table2 },
];

export default function Tasks() {
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [viewMode, setViewMode] = useState('kanban');
  const [selectedIds, setSelectedIds] = useState([]);
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => db.tasks.list('-created_date', 200),
  });

  const { data: dependencies = [] } = useQuery({
    queryKey: ['taskDependencies'],
    queryFn: () => db.taskDependencies.list(),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => db.projects.list(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => db.users.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => db.tasks.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tasks'] }); setDialogOpen(false); setEditingTask(null); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => db.tasks.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => db.tasks.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase());
    const matchesProject = projectFilter === 'all' || t.project_id === projectFilter;
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesProject && matchesStatus;
  });

  const getProjectById = (id) => projects.find(p => p.id === id);
  const getUserById = (id) => users.find(u => u.id === id);

  const handleStatusChange = (task, newStatus) => {
    updateMutation.mutate({ id: task.id, data: { ...task, status: newStatus } });
  };

  const handleUpdate = (id, data) => {
    updateMutation.mutate({ id, data });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      title: formData.get('title'),
      description: formData.get('description'),
      project_id: formData.get('project_id') || null,
      status: formData.get('status'),
      task_type: formData.get('task_type'),
      priority: formData.get('priority'),
      assignee_id: formData.get('assignee_id') || null,
      due_date: formData.get('due_date') || null,
      estimated_hours: formData.get('estimated_hours') ? Number(formData.get('estimated_hours')) : null,
    };
    if (editingTask) {
      updateMutation.mutate({ id: editingTask.id, data });
      setDialogOpen(false); setEditingTask(null);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleBulkUpdate = async (data) => {
    await Promise.all(selectedIds.map(id => db.tasks.update(id, data)));
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    setSelectedIds([]);
  };

  const handleBulkDelete = async () => {
    await Promise.all(selectedIds.map(id => db.tasks.delete(id)));
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    setSelectedIds([]);
  };

  const TaskListRow = ({ task }) => (
    <div className="p-4 hover:bg-slate-50 transition-colors group">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <Checkbox
            checked={selectedIds.includes(task.id)}
            onCheckedChange={() => setSelectedIds(prev => prev.includes(task.id) ? prev.filter(i => i !== task.id) : [...prev, task.id])}
          />
          <StatusBadge status={task.status} />
          <div className="min-w-0">
            <Link to={createPageUrl(`TaskDetail?id=${task.id}`)}>
              <h3 className="font-medium text-slate-900 hover:text-violet-600 truncate">{task.title}</h3>
            </Link>
            <p className="text-sm text-slate-500">{getProjectById(task.project_id)?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          <StatusBadge status={task.priority} />
          {task.due_date && (
            <span className="text-xs text-slate-500 hidden sm:flex items-center gap-1">
              <Clock className="h-3 w-3" />{format(new Date(task.due_date), 'MMM d')}
            </span>
          )}
          {task.assignee_id && <Avatar name={getUserById(task.assignee_id)?.full_name} email={getUserById(task.assignee_id)?.email} size="sm" />}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100"><MoreVertical className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => { setEditingTask(task); setDialogOpen(true); }}><Pencil className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
              <DropdownMenuItem className="text-red-600" onClick={() => deleteMutation.mutate(task.id)}><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks"
        subtitle="Manage and track your team's work"
        actions={
          <Button onClick={() => { setEditingTask(null); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />New Task
          </Button>
        }
      />

      {/* Filters + View Switcher */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search tasks..." className="sm:w-56" />
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {TASK_STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, ' ')}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* View mode buttons */}
        <div className="flex items-center border rounded-lg overflow-hidden bg-white shadow-sm">
          {VIEW_MODES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setViewMode(id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-sm transition-colors",
                viewMode === id ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Views */}
      {isLoading ? (
        <div className="grid grid-cols-6 gap-4">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-96" />)}</div>
      ) : viewMode === 'kanban' ? (
        <KanbanBoard tasks={filteredTasks} users={users} onStatusChange={handleStatusChange}
          onEdit={(task) => { setEditingTask(task); setDialogOpen(true); }}
          onDelete={(id) => deleteMutation.mutate(id)} />
      ) : viewMode === 'gantt' ? (
        <GanttChart tasks={filteredTasks} dependencies={dependencies} users={users} />
      ) : viewMode === 'calendar' ? (
        <CalendarView tasks={filteredTasks} />
      ) : viewMode === 'spreadsheet' ? (
        <SpreadsheetView
          tasks={filteredTasks}
          users={users}
          projects={projects}
          selectedIds={selectedIds}
          onSelectIds={setSelectedIds}
          onUpdate={handleUpdate}
          onDelete={(id) => deleteMutation.mutate(id)}
          onEdit={(task) => { setEditingTask(task); setDialogOpen(true); }}
        />
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            {filteredTasks.length === 0 ? (
              <EmptyState icon={ListTodo} title="No tasks found" description="Create your first task" action={() => setDialogOpen(true)} actionLabel="Create Task" />
            ) : (
              <div className="divide-y divide-slate-100">
                <div className="px-4 py-2 flex items-center gap-4 bg-slate-50 border-b">
                  <Checkbox
                    checked={filteredTasks.length > 0 && filteredTasks.every(t => selectedIds.includes(t.id))}
                    onCheckedChange={() => {
                      const allSelected = filteredTasks.every(t => selectedIds.includes(t.id));
                      setSelectedIds(allSelected ? [] : filteredTasks.map(t => t.id));
                    }}
                  />
                  <span className="text-xs text-slate-500 font-medium">Select all</span>
                </div>
                {filteredTasks.map(task => <TaskListRow key={task.id} task={task} />)}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Mass Actions */}
      <MassActionsBar
        selectedIds={selectedIds}
        users={users}
        onBulkUpdate={handleBulkUpdate}
        onBulkDelete={handleBulkDelete}
        onClear={() => setSelectedIds([])}
      />

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Edit Task' : 'Create New Task'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input name="title" required defaultValue={editingTask?.title} placeholder="Task title" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea name="description" defaultValue={editingTask?.description} placeholder="Task description..." rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Project</Label>
                <Select name="project_id" defaultValue={editingTask?.project_id || ''}>
                  <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                  <SelectContent>{projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Assignee</Label>
                <Select name="assignee_id" defaultValue={editingTask?.assignee_id || ''}>
                  <SelectTrigger><SelectValue placeholder="Select assignee" /></SelectTrigger>
                  <SelectContent>{users.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select name="status" defaultValue={editingTask?.status || 'backlog'}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TASK_STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select name="task_type" defaultValue={editingTask?.task_type || 'task'}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TASK_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select name="priority" defaultValue={editingTask?.priority || 'medium'}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PRIORITIES.map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input name="due_date" type="date" defaultValue={editingTask?.due_date} />
              </div>
              <div className="space-y-2">
                <Label>Estimated Hours</Label>
                <Input name="estimated_hours" type="number" defaultValue={editingTask?.estimated_hours} placeholder="8" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingTask ? 'Save Changes' : 'Create Task'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
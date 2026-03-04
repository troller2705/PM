import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { db } from '@/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '@/components/common/PageHeader';
import StatusBadge from '@/components/common/StatusBadge';
import Avatar from '@/components/common/Avatar';
import EmptyState from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  ArrowLeft, Clock, User, Calendar, Flag, Tag, GitBranch,
  Plus, Trash2, Link2, CheckCircle, Circle, Timer, ListTodo,
  ChevronRight, Pencil
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

const TASK_STATUSES = ['backlog', 'todo', 'in_progress', 'review', 'testing', 'done', 'blocked'];
const TASK_TYPES = ['feature', 'bug', 'improvement', 'task', 'epic', 'story', 'spike'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];

const TYPE_COLORS = {
  bug: 'bg-red-100 text-red-700',
  feature: 'bg-blue-100 text-blue-700',
  improvement: 'bg-green-100 text-green-700',
  epic: 'bg-violet-100 text-violet-700',
  story: 'bg-indigo-100 text-indigo-700',
  spike: 'bg-amber-100 text-amber-700',
  task: 'bg-slate-100 text-slate-600',
};

export default function TaskDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const taskId = urlParams.get('id');
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState(false);
  const [timeLogDialog, setTimeLogDialog] = useState(false);
  const [depDialog, setDepDialog] = useState(false);
  const [formData, setFormData] = useState({});

  const { data: task, isLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => db.tasks.filter({ id: taskId }).then(r => r[0]),
    enabled: !!taskId,
  });

  const { data: allTasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => db.tasks.list('-created_date', 300),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => db.projects.list(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => db.users.list(),
  });

  const { data: timeLogs = [] } = useQuery({
    queryKey: ['timeLogs', taskId],
    queryFn: () => db.timeLogs.filter({ task_id: taskId }),
    enabled: !!taskId,
  });

  const { data: dependencies = [] } = useQuery({
    queryKey: ['taskDeps', taskId],
    queryFn: () => db.taskDependencies.filter({ task_id: taskId }),
    enabled: !!taskId,
  });

  const { data: blockedByDeps = [] } = useQuery({
    queryKey: ['taskBlockedBy', taskId],
    queryFn: () => db.taskDependencies.filter({ depends_on_task_id: taskId }),
    enabled: !!taskId,
  });

  const updateMutation = useMutation({
    mutationFn: (data) => db.tasks.update(taskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setEditing(false);
    },
  });

  const createTimeLogMutation = useMutation({
    mutationFn: (data) => db.timeLogs.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeLogs', taskId] });
      setTimeLogDialog(false);
    },
  });

  const deleteTimeLogMutation = useMutation({
    mutationFn: (id) => db.timeLogs.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['timeLogs', taskId] }),
  });

  const createDepMutation = useMutation({
    mutationFn: (data) => db.taskDependencies.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taskDeps', taskId] });
      setDepDialog(false);
    },
  });

  const deleteDepMutation = useMutation({
    mutationFn: (id) => db.taskDependencies.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['taskDeps', taskId] }),
  });

  if (isLoading) return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <div className="grid grid-cols-3 gap-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32" />)}</div>
      <Skeleton className="h-80" />
    </div>
  );

  if (!task) return (
    <EmptyState icon={ListTodo} title="Task not found" description="This task does not exist" />
  );

  const project = projects.find(p => p.id === task.project_id);
  const assignee = users.find(u => u.id === task.assignee_id);
  const totalLogged = timeLogs.reduce((s, l) => s + (l.hours || 0), 0);
  const progressPct = task.estimated_hours > 0 ? Math.min(Math.round((totalLogged / task.estimated_hours) * 100), 100) : 0;

  const handleSave = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    updateMutation.mutate({
      title: fd.get('title'),
      description: fd.get('description'),
      status: fd.get('status'),
      priority: fd.get('priority'),
      task_type: fd.get('task_type'),
      project_id: fd.get('project_id') || null,
      assignee_id: fd.get('assignee_id') || null,
      due_date: fd.get('due_date') || null,
      estimated_hours: fd.get('estimated_hours') ? Number(fd.get('estimated_hours')) : null,
    });
  };

  const handleLogTime = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    createTimeLogMutation.mutate({
      task_id: taskId,
      project_id: task.project_id || null,
      user_id: fd.get('user_id') || null,
      hours: Number(fd.get('hours')),
      date: fd.get('date'),
      description: fd.get('description'),
    });
  };

  const handleAddDep = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    createDepMutation.mutate({
      task_id: taskId,
      depends_on_task_id: fd.get('depends_on_task_id'),
      dependency_type: fd.get('dependency_type') || 'finish_to_start',
    });
  };

  const depTasks = dependencies.map(d => ({
    dep: d,
    task: allTasks.find(t => t.id === d.depends_on_task_id),
  })).filter(x => x.task);

  const blockedByTasks = blockedByDeps.map(d => ({
    dep: d,
    task: allTasks.find(t => t.id === d.task_id),
  })).filter(x => x.task);

  const availableForDep = allTasks.filter(t =>
    t.id !== taskId && !dependencies.find(d => d.depends_on_task_id === t.id)
  );

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to={createPageUrl('Tasks')}><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div className="flex-1 min-w-0">
          {editing ? (
            <form onSubmit={handleSave} className="space-y-4">
              <Input name="title" required defaultValue={task.title} className="text-xl font-semibold h-auto py-2" />
              <Textarea name="description" defaultValue={task.description} rows={3} placeholder="Description…" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Select name="status" defaultValue={task.status}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TASK_STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g,' ')}</SelectItem>)}</SelectContent>
                </Select>
                <Select name="priority" defaultValue={task.priority}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PRIORITIES.map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}</SelectContent>
                </Select>
                <Select name="task_type" defaultValue={task.task_type}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TASK_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
                </Select>
                <Select name="assignee_id" defaultValue={task.assignee_id || ''}>
                  <SelectTrigger><SelectValue placeholder="Assignee" /></SelectTrigger>
                  <SelectContent>{users.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Due Date</Label><Input name="due_date" type="date" defaultValue={task.due_date} /></div>
                <div><Label>Estimated Hours</Label><Input name="estimated_hours" type="number" step="0.5" defaultValue={task.estimated_hours} /></div>
              </div>
              <input type="hidden" name="project_id" value={task.project_id || ''} />
              <div className="flex gap-2">
                <Button type="submit" size="sm">Save</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </form>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <h1 className="text-2xl font-semibold text-slate-900">{task.title}</h1>
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  <Pencil className="h-4 w-4 mr-2" />Edit
                </Button>
              </div>
              {task.description && <p className="text-slate-600 mt-2">{task.description}</p>}
            </>
          )}
        </div>
      </div>

      {/* Meta bar */}
      {!editing && (
        <div className="flex flex-wrap items-center gap-3 p-4 bg-slate-50 rounded-xl">
          <StatusBadge status={task.status} />
          <StatusBadge status={task.priority} />
          <Badge className={cn("border-0", TYPE_COLORS[task.task_type] || 'bg-slate-100 text-slate-600')}>{task.task_type}</Badge>
          {project && (
            <Link to={createPageUrl(`ProjectDetail?id=${project.id}`)} className="flex items-center gap-1 text-sm text-violet-600 hover:underline">
              <ChevronRight className="h-3 w-3" />{project.name}
            </Link>
          )}
          {assignee && (
            <div className="flex items-center gap-2 ml-auto">
              <Avatar name={assignee.full_name} email={assignee.email} size="sm" />
              <span className="text-sm text-slate-700">{assignee.full_name}</span>
            </div>
          )}
          {task.due_date && (
            <span className="flex items-center gap-1 text-sm text-slate-500">
              <Calendar className="h-4 w-4" />
              {format(parseISO(task.due_date), 'MMM d, yyyy')}
            </span>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Time Tracking + Dependencies */}
        <div className="lg:col-span-2 space-y-6">
          {/* Time Tracking */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2"><Timer className="h-5 w-5 text-violet-500" />Time Tracking</CardTitle>
              <Button size="sm" onClick={() => setTimeLogDialog(true)}>
                <Plus className="h-4 w-4 mr-1" />Log Time
              </Button>
            </CardHeader>
            <CardContent>
              {task.estimated_hours > 0 && (
                <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-600">Progress</span>
                    <span className="font-medium">{totalLogged}h / {task.estimated_hours}h est.</span>
                  </div>
                  <Progress value={progressPct} className="h-2" />
                  <p className="text-xs text-slate-400 mt-1">
                    {task.estimated_hours - totalLogged > 0
                      ? `${(task.estimated_hours - totalLogged).toFixed(1)}h remaining`
                      : `${(totalLogged - task.estimated_hours).toFixed(1)}h over estimate`}
                  </p>
                </div>
              )}
              {timeLogs.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">No time logged yet</p>
              ) : (
                <div className="space-y-2">
                  {timeLogs.map(log => {
                    const logUser = users.find(u => u.id === log.user_id);
                    return (
                      <div key={log.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-slate-200">
                        {logUser && <Avatar name={logUser.full_name} email={logUser.email} size="sm" />}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-800">{log.hours}h</span>
                            <span className="text-xs text-slate-500">{log.date ? format(parseISO(log.date), 'MMM d') : ''}</span>
                          </div>
                          {log.description && <p className="text-xs text-slate-500 truncate">{log.description}</p>}
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-500"
                          onClick={() => deleteTimeLogMutation.mutate(log.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dependencies */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2"><Link2 className="h-5 w-5 text-blue-500" />Dependencies</CardTitle>
              <Button size="sm" variant="outline" onClick={() => setDepDialog(true)}>
                <Plus className="h-4 w-4 mr-1" />Add
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {depTasks.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">This task depends on</p>
                  <div className="space-y-2">
                    {depTasks.map(({ dep, task: dt }) => (
                      <div key={dep.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200">
                        {dt.status === 'done'
                          ? <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                          : <Circle className="h-4 w-4 text-slate-400 shrink-0" />}
                        <Link to={createPageUrl(`TaskDetail?id=${dt.id}`)} className="flex-1 min-w-0 hover:underline">
                          <p className="text-sm font-medium text-slate-800 truncate">{dt.title}</p>
                          <p className="text-xs text-slate-400 capitalize">{dep.dependency_type.replace(/_/g, ' ')}</p>
                        </Link>
                        <StatusBadge status={dt.status} />
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-500"
                          onClick={() => deleteDepMutation.mutate(dep.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {blockedByTasks.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Blocking these tasks</p>
                  <div className="space-y-2">
                    {blockedByTasks.map(({ dep, task: bt }) => (
                      <div key={dep.id} className="flex items-center gap-3 p-3 rounded-lg border border-amber-100 bg-amber-50">
                        <Link2 className="h-4 w-4 text-amber-500 shrink-0" />
                        <Link to={createPageUrl(`TaskDetail?id=${bt.id}`)} className="flex-1 min-w-0 hover:underline">
                          <p className="text-sm font-medium text-slate-800 truncate">{bt.title}</p>
                        </Link>
                        <StatusBadge status={bt.status} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {depTasks.length === 0 && blockedByTasks.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-6">No dependencies linked</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Details sidebar */}
        <div className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              {[
                { label: 'Status', value: <StatusBadge status={task.status} /> },
                { label: 'Priority', value: <StatusBadge status={task.priority} /> },
                { label: 'Type', value: <Badge className={cn("border-0 capitalize", TYPE_COLORS[task.task_type])}>{task.task_type}</Badge> },
                { label: 'Project', value: project ? <Link to={createPageUrl(`ProjectDetail?id=${project.id}`)} className="text-violet-600 hover:underline">{project.name}</Link> : '—' },
                { label: 'Assignee', value: assignee ? <div className="flex items-center gap-2"><Avatar name={assignee.full_name} email={assignee.email} size="sm" />{assignee.full_name}</div> : '—' },
                { label: 'Due Date', value: task.due_date ? format(parseISO(task.due_date), 'MMM d, yyyy') : '—' },
                { label: 'Est. Hours', value: task.estimated_hours ? `${task.estimated_hours}h` : '—' },
                { label: 'Logged Hours', value: <span className={totalLogged > (task.estimated_hours || Infinity) ? 'text-red-600 font-medium' : 'text-emerald-600 font-medium'}>{totalLogged}h</span> },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-start justify-between gap-2">
                  <span className="text-slate-500 shrink-0">{label}</span>
                  <div className="text-right">{value}</div>
                </div>
              ))}
            </CardContent>
          </Card>

          {task.git_branch && (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <GitBranch className="h-4 w-4" />
                  <span className="font-mono truncate">{task.git_branch}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Log Time Dialog */}
      <Dialog open={timeLogDialog} onOpenChange={setTimeLogDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Log Time</DialogTitle></DialogHeader>
          <form onSubmit={handleLogTime} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hours</Label>
                <Input name="hours" type="number" step="0.25" min="0.25" required placeholder="2.5" />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input name="date" type="date" required defaultValue={format(new Date(), 'yyyy-MM-dd')} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Team Member</Label>
              <Select name="user_id" defaultValue="">
                <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
                <SelectContent>{users.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea name="description" rows={2} placeholder="What did you work on?" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setTimeLogDialog(false)}>Cancel</Button>
              <Button type="submit">Log Time</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Dependency Dialog */}
      <Dialog open={depDialog} onOpenChange={setDepDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Dependency</DialogTitle></DialogHeader>
          <form onSubmit={handleAddDep} className="space-y-4">
            <div className="space-y-2">
              <Label>This task depends on</Label>
              <Select name="depends_on_task_id" required>
                <SelectTrigger><SelectValue placeholder="Select task…" /></SelectTrigger>
                <SelectContent>
                  {availableForDep.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Dependency Type</Label>
              <Select name="dependency_type" defaultValue="finish_to_start">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="finish_to_start">Finish to Start (most common)</SelectItem>
                  <SelectItem value="start_to_start">Start to Start</SelectItem>
                  <SelectItem value="finish_to_finish">Finish to Finish</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDepDialog(false)}>Cancel</Button>
              <Button type="submit">Add Dependency</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
import React, { useState } from 'react';
import { db } from '../api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../components/common/PageHeader';
import StatusBadge from '../components/common/StatusBadge';
import SearchInput from '../components/common/SearchInput';
import EmptyState from '../components/common/EmptyState';
import Avatar from '../components/common/Avatar';
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
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
import { ScrollArea } from "../components/ui/scroll-area";
import {
  Plus,
  ListTodo,
  Clock,
  User,
  MoreVertical,
  Pencil,
  Trash2,
  GitBranch,
  AlertCircle,
  GitPullRequest,
  GitCommit
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { format } from 'date-fns';
import { cn } from "../lib/utils";

const TASK_STATUSES = ['backlog', 'todo', 'in_progress', 'review', 'testing', 'done', 'blocked'];
const TASK_TYPES = ['feature', 'bug', 'improvement', 'task', 'epic', 'story', 'spike'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];

const KANBAN_COLUMNS = [
  { id: 'backlog', name: 'Backlog', color: 'bg-slate-400' },
  { id: 'todo', name: 'To Do', color: 'bg-slate-500' },
  { id: 'in_progress', name: 'In Progress', color: 'bg-blue-500' },
  { id: 'review', name: 'Review', color: 'bg-purple-500' },
  { id: 'testing', name: 'Testing', color: 'bg-amber-500' },
  { id: 'done', name: 'Done', color: 'bg-emerald-500' },
];

export default function Tasks() {
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [viewMode, setViewMode] = useState('kanban');
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => db.tasks.list('-created_date', 200),
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setDialogOpen(false);
      setEditingTask(null);
    },
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
    return matchesSearch && matchesProject;
  });

  const getProjectById = (id) => projects.find(p => p.id === id);
  const getUserById = (id) => users.find(u => u.id === id);

  const handleStatusChange = (task, newStatus) => {
    updateMutation.mutate({ id: task.id, data: { ...task, status: newStatus } });
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
      setDialogOpen(false);
      setEditingTask(null);
    } else {
      createMutation.mutate(data);
    }
  };

  const TaskCard = ({ task }) => (
    <div className="bg-white rounded-lg border border-slate-200 p-3 hover:shadow-md transition-shadow cursor-pointer group">
      <div className="flex items-start justify-between mb-2">
        <span className={cn(
          "px-2 py-0.5 text-xs font-medium rounded",
          task.task_type === 'bug' ? "bg-red-100 text-red-700" :
          task.task_type === 'feature' ? "bg-blue-100 text-blue-700" :
          task.task_type === 'improvement' ? "bg-green-100 text-green-700" :
          "bg-slate-100 text-slate-600"
        )}>
          {task.task_type}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => { setEditingTask(task); setDialogOpen(true); }}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-red-600"
              onClick={() => deleteMutation.mutate(task.id)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <h3 className="text-sm font-medium text-slate-900 mb-2 line-clamp-2">{task.title}</h3>
      
      {task.project_id && (
        <p className="text-xs text-slate-500 mb-2">{getProjectById(task.project_id)?.name}</p>
      )}

      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2 mt-3">
          <StatusBadge status={task.priority} className="text-xs py-0" />
          
          {/* NEW: Pull Request Badge Indicator */}
          {task.pull_requests?.length > 0 && (
            <Badge variant="outline" className="text-xs gap-1 bg-blue-50 text-blue-700 border-blue-200">
              <GitPullRequest className="h-3 w-3" />
              {task.pull_requests.length} PR
            </Badge>
          )}
          
          {task.due_date && (
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {format(new Date(task.due_date), 'MMM d')}
            </span>
          )}
        </div>
        {task.assignee_id && (
          <Avatar 
            name={getUserById(task.assignee_id)?.full_name}
            email={getUserById(task.assignee_id)?.email}
            size="sm"
          />
        )}
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
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search tasks..."
            className="sm:w-64"
          />
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map(project => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Tabs value={viewMode} onValueChange={setViewMode}>
          <TabsList>
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
            <TabsTrigger value="list">List</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Kanban Board */}
      {isLoading ? (
        <div className="grid grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-96" />)}
        </div>
      ) : viewMode === 'kanban' ? (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {KANBAN_COLUMNS.map(column => {
              const columnTasks = filteredTasks.filter(t => t.status === column.id);
              return (
                <div key={column.id} className="w-72 flex-shrink-0">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={cn("w-3 h-3 rounded-full", column.color)} />
                    <h3 className="font-medium text-slate-700">{column.name}</h3>
                    <Badge variant="secondary" className="ml-auto">
                      {columnTasks.length}
                    </Badge>
                  </div>
                  <ScrollArea className="h-[calc(100vh-320px)]">
                    <div className="space-y-3 pr-2">
                      {columnTasks.map(task => (
                        <TaskCard key={task.id} task={task} />
                      ))}
                      {columnTasks.length === 0 && (
                        <div className="text-center py-8 text-slate-400 text-sm">
                          No tasks
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            {filteredTasks.length === 0 ? (
              <EmptyState
                icon={ListTodo}
                title="No tasks found"
                description="Create your first task to get started"
                action={() => setDialogOpen(true)}
                actionLabel="Create Task"
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredTasks.map(task => (
                  <div key={task.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <StatusBadge status={task.status} />
                        <div>
                          <h3 className="font-medium text-slate-900">{task.title}</h3>
                          <p className="text-sm text-slate-500">{getProjectById(task.project_id)?.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <StatusBadge status={task.priority} />
                        {task.assignee_id && (
                          <Avatar 
                            name={getUserById(task.assignee_id)?.full_name}
                            email={getUserById(task.assignee_id)?.email}
                            size="sm"
                          />
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setEditingTask(task); setDialogOpen(true); }}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => deleteMutation.mutate(task.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Edit Task' : 'Create New Task'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input 
                id="title" 
                name="title" 
                required 
                defaultValue={editingTask?.title}
                placeholder="Task title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                name="description" 
                defaultValue={editingTask?.description}
                placeholder="Task description..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="project_id">Project</Label>
                <Select name="project_id" defaultValue={editingTask?.project_id || ''}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="assignee_id">Assignee</Label>
                <Select name="assignee_id" defaultValue={editingTask?.assignee_id || ''}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select name="status" defaultValue={editingTask?.status || 'backlog'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_STATUSES.map(status => (
                      <SelectItem key={status} value={status} className="capitalize">
                        {status.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="task_type">Type</Label>
                <Select name="task_type" defaultValue={editingTask?.task_type || 'task'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_TYPES.map(type => (
                      <SelectItem key={type} value={type} className="capitalize">
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select name="priority" defaultValue={editingTask?.priority || 'medium'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map(priority => (
                      <SelectItem key={priority} value={priority} className="capitalize">
                        {priority}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date</Label>
                <Input 
                  id="due_date" 
                  name="due_date" 
                  type="date"
                  defaultValue={editingTask?.due_date}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimated_hours">Estimated Hours</Label>
                <Input 
                  id="estimated_hours" 
                  name="estimated_hours" 
                  type="number"
                  defaultValue={editingTask?.estimated_hours}
                  placeholder="8"
                />
              </div>
            </div>
            {editingTask && (
              <div className="space-y-3 pt-4 border-t border-slate-200 mt-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <GitBranch className="h-4 w-4 text-slate-500"/> 
                    Development Activity
                  </h4>
                  <Button type="button" variant="outline" size="sm" className="h-7 text-xs">
                    Create Branch
                  </Button>
                </div>
                
                <div className="bg-slate-50 rounded-md p-3 border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <GitPullRequest className="h-4 w-4 text-green-500" />
                      <a href="#" className="font-medium text-blue-600 hover:underline">
                        feat/add-auth-flow #42
                      </a>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-700">Open</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 pl-6">
                    <GitCommit className="h-3 w-3" />
                    <span>Latest commit: <code className="bg-slate-200 px-1 rounded">a1b2c3d</code> fixes login styling</span>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
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
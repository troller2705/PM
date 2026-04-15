import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { db } from '../api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../components/common/PageHeader';
import StatusBadge from '../components/common/StatusBadge';
import SearchInput from '../components/common/SearchInput';
import EmptyState from '../components/common/EmptyState';
import Avatar from '../components/common/Avatar';
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
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
  Plus, FolderKanban, Calendar, Users, MoreVertical,
  Pencil, Trash2, ExternalLink, LayoutGrid, List
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { format } from 'date-fns';
import { cn } from "../lib/utils";

const PROJECT_STATUSES = ['planning', 'pre_production', 'production', 'alpha', 'beta', 'gold', 'live', 'maintenance', 'archived'];
const PROJECT_TYPES = ['game', 'dlc', 'update', 'tool', 'prototype', 'other'];

export default function Projects() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading } = useQuery({ queryKey: ['projects'], queryFn: () => db.projects.list() });
  const { data: tasks = [] } = useQuery({ queryKey: ['tasks'], queryFn: () => db.tasks.list() });
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: () => db.users.list() });
  const { data: expenses = [] } = useQuery({ queryKey: ['expenses'], queryFn: () => db.expenses.list() });
  const { data: budgets = [] } = useQuery({ queryKey: ['budgets'], queryFn: () => db.budgets.list() });

  const createMutation = useMutation({ mutationFn: (data) => db.projects.create(data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['projects'] }); setDialogOpen(false); setEditingProject(null); } });
  const updateMutation = useMutation({ mutationFn: ({ id, data }) => db.projects.update(id, data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['projects'] }); setDialogOpen(false); setEditingProject(null); } });
  const deleteMutation = useMutation({ mutationFn: (id) => db.projects.delete(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }) });

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(search.toLowerCase()) || p.code?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getProjectProgress = (project) => {
    const projectTasks = tasks.filter(t => t.project_id === project.id);
    if (projectTasks.length === 0) return 0;
    const done = projectTasks.filter(t => t.status === 'done').length;
    return Math.round((done / projectTasks.length) * 100);
  };

  const getFinancialHealth = (project) => {
    // 1. Calculate the total budget (Project Base Budget + any dedicated Budget Entities)
    const linkedBudgets = budgets.filter(b => b.project_id === project.id);
    const dedicatedBudgetTotal = linkedBudgets.reduce((sum, b) => sum + (b.total_amount || 0), 0);
    const totalBudget = (project.budget || 0) + dedicatedBudgetTotal;
    
    if (totalBudget === 0) return null;

    // 2. Find all expenses linked either directly to the project or through one of its dedicated budgets
    const linkedBudgetIds = linkedBudgets.map(b => b.id);
    const spent = expenses.filter(e => 
      (e.project_id === project.id || linkedBudgetIds.includes(e.budget_id)) && e.status === 'paid'
    ).reduce((sum, e) => sum + (e.amount || 0), 0);
    
    const percentage = Math.round((spent / totalBudget) * 100);
    return { spent, percentage, totalBudget, status: percentage > 90 ? 'danger' : percentage > 75 ? 'warning' : 'good' };
  };

  const getUserById = (userId) => users.find(u => u.id === userId);

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      name: formData.get('name'),
      code: formData.get('code'),
      description: formData.get('description'),
      status: formData.get('status'),
      project_type: formData.get('project_type'),
      start_date: formData.get('start_date'),
      target_date: formData.get('target_date'),
      budget: formData.get('budget') ? Number(formData.get('budget')) : null,
    };
    editingProject ? updateMutation.mutate({ id: editingProject.id, data }) : createMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects Portfolio"
        subtitle="Manage development projects, progress, and financial health"
        actions={<Button onClick={() => { setEditingProject(null); setDialogOpen(true); }}><Plus className="h-4 w-4 mr-2" />New Project</Button>}
      />

      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Search projects..." className="sm:w-80" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Filter by status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {PROJECT_STATUSES.map(status => <SelectItem key={status} value={status} className="capitalize">{status.replace(/_/g, ' ')}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Tabs value={viewMode} onValueChange={setViewMode} className="hidden sm:block">
          <TabsList>
            <TabsTrigger value="grid"><LayoutGrid className="h-4 w-4 mr-2" /> Grid</TabsTrigger>
            <TabsTrigger value="list"><List className="h-4 w-4 mr-2" /> Portfolio List</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-64" />)}</div>
      ) : filteredProjects.length === 0 ? (
        <EmptyState icon={FolderKanban} title="No projects found" description="Create your first project to get started" action={() => setDialogOpen(true)} actionLabel="Create Project" />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map(project => {
            const health = getFinancialHealth(project);
            return (
              <Card key={project.id} className="border-0 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <CardContent className="p-0">
                  <div className="h-2 bg-gradient-to-r from-violet-500 to-indigo-500" />
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <Link to={createPageUrl(`ProjectDetail?id=${project.id}`)} className="text-lg font-semibold text-slate-900 hover:text-violet-600 transition-colors">{project.name}</Link>
                        <p className="text-sm text-slate-500">{project.code}</p>
                      </div>
                      <ProjectActions project={project} setEditingProject={setEditingProject} setDialogOpen={setDialogOpen} deleteMutation={deleteMutation} />
                    </div>
                    <StatusBadge status={project.status} className="mb-3" />
                    {project.description && <p className="text-sm text-slate-600 line-clamp-2 mb-4">{project.description}</p>}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Progress</span>
                        <span className="font-medium">{getProjectProgress(project)}%</span>
                      </div>
                      <Progress value={getProjectProgress(project)} className="h-2" />
                    </div>
                    {health && (
                      <div className="mt-3 text-xs flex justify-between items-center text-slate-500 bg-slate-50 p-2 rounded-md">
                        <span>Budget Burn</span>
                        <span className={health.status === 'danger' ? 'text-red-600 font-medium' : health.status === 'warning' ? 'text-amber-600 font-medium' : ''}>
                          ${health.spent.toLocaleString()} / ${health.totalBudget.toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-1 text-sm text-slate-500">
                        <Calendar className="h-4 w-4" />
                        {project.target_date ? format(new Date(project.target_date), 'MMM d') : 'No date'}
                      </div>
                      {project.lead_id && <Avatar name={getUserById(project.lead_id)?.full_name} size="sm" />}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Project</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Task Progress</th>
                    <th className="px-4 py-3 font-medium">Financial Health</th>
                    <th className="px-4 py-3 font-medium">Target Date</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProjects.map(project => {
                    const health = getFinancialHealth(project);
                    return (
                      <tr key={project.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <Link to={createPageUrl(`ProjectDetail?id=${project.id}`)} className="font-medium text-slate-900 hover:text-violet-600">{project.name}</Link>
                          <p className="text-xs text-slate-500">{project.code}</p>
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={project.status} /></td>
                        <td className="px-4 py-3 w-48">
                          <div className="flex items-center gap-2">
                            <Progress value={getProjectProgress(project)} className="h-1.5 flex-1" />
                            <span className="text-xs font-medium text-slate-600">{getProjectProgress(project)}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {health ? (
                            <div className="flex flex-col">
                              <span className={cn("text-xs font-semibold", health.status === 'danger' ? 'text-red-600' : health.status === 'warning' ? 'text-amber-600' : 'text-emerald-600')}>
                                {health.percentage}% Spent
                              </span>
                              <span className="text-[10px] text-slate-500">
                                ${health.spent.toLocaleString()} / ${health.totalBudget.toLocaleString()}
                              </span>
                            </div>
                          ) : <span className="text-xs text-slate-400">No budget set</span>}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{project.target_date ? format(new Date(project.target_date), 'MMM d, yyyy') : '-'}</td>
                        <td className="px-4 py-3 text-right"><ProjectActions project={project} setEditingProject={setEditingProject} setDialogOpen={setDialogOpen} deleteMutation={deleteMutation} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingProject ? 'Edit Project' : 'Create New Project'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Project Name</Label><Input name="name" required defaultValue={editingProject?.name} /></div>
              <div className="space-y-2"><Label>Project Code</Label><Input name="code" required defaultValue={editingProject?.code} /></div>
            </div>
            <div className="space-y-2"><Label>Description</Label><Textarea name="description" defaultValue={editingProject?.description} rows={3} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select name="status" defaultValue={editingProject?.status || 'planning'}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PROJECT_STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select name="project_type" defaultValue={editingProject?.project_type || 'game'}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PROJECT_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Start Date</Label><Input name="start_date" type="date" defaultValue={editingProject?.start_date} /></div>
              <div className="space-y-2"><Label>Target Date</Label><Input name="target_date" type="date" defaultValue={editingProject?.target_date} /></div>
            </div>
            <div className="space-y-2"><Label>Base Budget ($)</Label><Input name="budget" type="number" defaultValue={editingProject?.budget} /></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button type="submit">Save</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProjectActions({ project, setEditingProject, setDialogOpen, deleteMutation }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => { setEditingProject(project); setDialogOpen(true); }}><Pencil className="h-4 w-4 mr-2" /> Edit</DropdownMenuItem>
        <DropdownMenuItem asChild><Link to={createPageUrl(`ProjectDetail?id=${project.id}`)}><ExternalLink className="h-4 w-4 mr-2" /> View Details</Link></DropdownMenuItem>
        <DropdownMenuItem className="text-red-600" onClick={() => deleteMutation.mutate(project.id)}><Trash2 className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
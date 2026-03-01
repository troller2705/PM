import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '../api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../components/common/PageHeader';
import StatusBadge from '../components/common/StatusBadge';
import SearchInput from '../components/common/SearchInput';
import EmptyState from '../components/common/EmptyState';
import Avatar from '../components/common/Avatar';
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
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
  FolderKanban,
  Calendar,
  Users,
  GitBranch,
  MoreVertical,
  Pencil,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { format } from 'date-fns';

const PROJECT_STATUSES = [
  'planning', 'pre_production', 'production', 'alpha', 'beta', 'gold', 'live', 'maintenance', 'archived'
];

const PROJECT_TYPES = ['game', 'dlc', 'update', 'tool', 'prototype', 'other'];

export default function Projects() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-created_date', 100),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Project.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setDialogOpen(false);
      setEditingProject(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Project.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setDialogOpen(false);
      setEditingProject(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Project.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                          p.code?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getProjectProgress = (project) => {
    const projectTasks = tasks.filter(t => t.project_id === project.id);
    if (projectTasks.length === 0) return 0;
    const done = projectTasks.filter(t => t.status === 'done').length;
    return Math.round((done / projectTasks.length) * 100);
  };

  const getProjectTaskCount = (projectId) => {
    return tasks.filter(t => t.project_id === projectId).length;
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

    if (editingProject) {
      updateMutation.mutate({ id: editingProject.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        subtitle="Manage your game development projects"
        actions={
          <Button onClick={() => { setEditingProject(null); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search projects..."
          className="sm:w-80"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {PROJECT_STATUSES.map(status => (
              <SelectItem key={status} value={status} className="capitalize">
                {status.replace(/_/g, ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-64" />)}
        </div>
      ) : filteredProjects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects found"
          description={search || statusFilter !== 'all' ? "Try adjusting your filters" : "Create your first project to get started"}
          action={() => setDialogOpen(true)}
          actionLabel="Create Project"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map(project => (
            <Card key={project.id} className="border-0 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              <CardContent className="p-0">
                <div className="h-2 bg-gradient-to-r from-violet-500 to-indigo-500" />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <Link 
                        to={createPageUrl(`ProjectDetail?id=${project.id}`)}
                        className="text-lg font-semibold text-slate-900 hover:text-violet-600 transition-colors"
                      >
                        {project.name}
                      </Link>
                      <p className="text-sm text-slate-500">{project.code}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setEditingProject(project); setDialogOpen(true); }}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={createPageUrl(`ProjectDetail?id=${project.id}`)}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => deleteMutation.mutate(project.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <StatusBadge status={project.status} className="mb-3" />

                  {project.description && (
                    <p className="text-sm text-slate-600 line-clamp-2 mb-4">{project.description}</p>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Progress</span>
                      <span className="font-medium">{getProjectProgress(project)}%</span>
                    </div>
                    <Progress value={getProjectProgress(project)} className="h-2" />
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {project.target_date ? format(new Date(project.target_date), 'MMM d') : 'No date'}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {project.team_member_ids?.length || 0}
                      </div>
                    </div>
                    {project.lead_id && (
                      <Avatar 
                        name={getUserById(project.lead_id)?.full_name} 
                        email={getUserById(project.lead_id)?.email}
                        size="sm" 
                      />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingProject ? 'Edit Project' : 'Create New Project'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name</Label>
                <Input 
                  id="name" 
                  name="name" 
                  required 
                  defaultValue={editingProject?.name}
                  placeholder="My Awesome Game"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Project Code</Label>
                <Input 
                  id="code" 
                  name="code" 
                  required 
                  defaultValue={editingProject?.code}
                  placeholder="GAME01"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                name="description" 
                defaultValue={editingProject?.description}
                placeholder="Project description..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select name="status" defaultValue={editingProject?.status || 'planning'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_STATUSES.map(status => (
                      <SelectItem key={status} value={status} className="capitalize">
                        {status.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="project_type">Type</Label>
                <Select name="project_type" defaultValue={editingProject?.project_type || 'game'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_TYPES.map(type => (
                      <SelectItem key={type} value={type} className="capitalize">
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input 
                  id="start_date" 
                  name="start_date" 
                  type="date"
                  defaultValue={editingProject?.start_date}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="target_date">Target Date</Label>
                <Input 
                  id="target_date" 
                  name="target_date" 
                  type="date"
                  defaultValue={editingProject?.target_date}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget">Budget ($)</Label>
              <Input 
                id="budget" 
                name="budget" 
                type="number"
                defaultValue={editingProject?.budget}
                placeholder="100000"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingProject ? 'Save Changes' : 'Create Project'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
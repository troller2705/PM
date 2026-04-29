import React, { useState } from 'react';
import { db } from '@/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import StatusBadge from '@/components/common/StatusBadge';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  LayoutTemplate, Plus, Trash2, MoreVertical, FolderPlus,
  ListTodo, Link2, ChevronDown, ChevronRight, Layers
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

const PROJECT_STATUSES = ['planning', 'pre_production', 'production', 'alpha', 'beta', 'gold', 'live', 'maintenance'];
const PROJECT_TYPES = ['game', 'dlc', 'update', 'tool', 'prototype', 'other'];

const DEP_TYPE_LABELS = {
  finish_to_start: { label: 'FS', desc: 'Finish-to-Start', color: 'bg-orange-100 text-orange-700' },
  start_to_start: { label: 'SS', desc: 'Start-to-Start', color: 'bg-blue-100 text-blue-700' },
  finish_to_finish: { label: 'FF', desc: 'Finish-to-Finish', color: 'bg-purple-100 text-purple-700' },
};

export default function Templates() {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [useDialogOpen, setUseDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [expandedTemplate, setExpandedTemplate] = useState(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['projectTemplates'],
    queryFn: () => db.projectTemplates.list(),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => db.projects.list(),
  });

  const { data: allTasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => db.tasks.list(),
  });

  const { data: allDeps = [] } = useQuery({
    queryKey: ['taskDependencies'],
    queryFn: () => db.taskDependencies.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => db.projectTemplates.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectTemplates'] });
      toast({ title: "Template deleted" });
    },
  });

  const saveTemplateMutation = useMutation({
    mutationFn: (data) => db.projectTemplates.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectTemplates'] });
      setSaveDialogOpen(false);
      toast({ title: "Template saved successfully" });
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: async ({ projectData, template }) => {
      // 1. Create project
      const project = await db.projects.create(projectData);

      // 2. Create tasks from template, track old ref_id -> new id map
      const idMap = {};
      for (const taskTpl of (template.tasks || [])) {
        const newTask = await db.tasks.create({
          title: taskTpl.title,
          description: taskTpl.description || '',
          status: 'backlog',
          priority: taskTpl.priority || 'medium',
          task_type: taskTpl.task_type || 'task',
          estimated_hours: taskTpl.estimated_hours || null,
          labels: taskTpl.labels || [],
          project_id: project.id,
        });
        idMap[taskTpl.ref_id] = newTask.id;
      }

      // 3. Recreate dependencies
      for (const dep of (template.dependencies || [])) {
        const taskId = idMap[dep.task_ref_id];
        const depOnId = idMap[dep.depends_on_ref_id];
        if (taskId && depOnId) {
          await db.taskDependencies.create({
            task_id: taskId,
            depends_on_task_id: depOnId,
            dependency_type: dep.dependency_type || 'finish_to_start',
          });
        }
      }

      return project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['taskDependencies'] });
      setUseDialogOpen(false);
      setSelectedTemplate(null);
      toast({ title: "Project created from template!" });
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Error creating project", description: error.message });
    }
  });

  const handleSaveTemplate = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const projectId = fd.get('project_id');
    const project = projects.find(p => p.id === projectId);
    const projectTasks = allTasks.filter(t => t.project_id === projectId);
    const taskIds = projectTasks.map(t => t.id);
    const projectDeps = allDeps.filter(d => taskIds.includes(d.task_id));

    // Build tasks snapshot with ref_ids (use original task ids as ref_ids)
    const templateTasks = projectTasks.map(t => ({
      ref_id: t.id,
      title: t.title,
      description: t.description || '',
      priority: t.priority,
      task_type: t.task_type,
      estimated_hours: t.estimated_hours,
      labels: t.labels || [],
    }));

    const templateDeps = projectDeps.map(d => ({
      task_ref_id: d.task_id,
      depends_on_ref_id: d.depends_on_task_id,
      dependency_type: d.dependency_type,
    }));

    saveTemplateMutation.mutate({
      name: fd.get('name'),
      description: fd.get('description'),
      source_project_id: projectId,
      project_type: project?.project_type || 'game',
      tasks: templateTasks,
      dependencies: templateDeps,
      tags: [],
      created_date: new Date().toISOString(),
    });
  };

  const handleUseTemplate = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    createProjectMutation.mutate({
      projectData: {
        name: fd.get('name'),
        code: fd.get('code'),
        description: fd.get('description') || selectedTemplate.description || '',
        status: fd.get('status'),
        project_type: fd.get('project_type') || selectedTemplate.project_type || 'game',
        start_date: fd.get('start_date') || null,
        target_date: fd.get('target_date') || null,
        budget: 0,
        spent: 0,
        team_member_ids: [],
        department_id: null,
        lead_id: null
      },
      template: selectedTemplate,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Project Templates"
        subtitle="Save and reuse project structures, tasks, and workflows"
        actions={
          <Button onClick={() => setSaveDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />Save Template
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48" />)}
        </div>
      ) : templates.length === 0 ? (
        <EmptyState
          icon={LayoutTemplate}
          title="No templates yet"
          description="Save an existing project structure as a template to reuse it for new projects."
          action={() => setSaveDialogOpen(true)}
          actionLabel="Save Template"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map(tpl => {
            const isExpanded = expandedTemplate === tpl.id;
            return (
              <Card key={tpl.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-t-lg" />
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-violet-500" />
                        <h3 className="font-semibold text-slate-900">{tpl.name}</h3>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setSelectedTemplate(tpl); setUseDialogOpen(true); }}>
                            <FolderPlus className="h-4 w-4 mr-2" />Create Project
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => deleteMutation.mutate(tpl.id)}>
                            <Trash2 className="h-4 w-4 mr-2" />Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {tpl.description && (
                      <p className="text-sm text-slate-500 mb-3 line-clamp-2">{tpl.description}</p>
                    )}

                    <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                      <span className="flex items-center gap-1"><ListTodo className="h-3 w-3" />{tpl.tasks?.length || 0} tasks</span>
                      <span className="flex items-center gap-1"><Link2 className="h-3 w-3" />{tpl.dependencies?.length || 0} deps</span>
                      {tpl.project_type && <Badge variant="secondary" className="text-xs capitalize">{tpl.project_type.replace(/_/g, ' ')}</Badge>}
                    </div>

                    <div className="text-xs text-slate-400 mb-3">
                      {tpl.created_date ? `Saved ${format(new Date(tpl.created_date), 'MMM d, yyyy')}` : 'No date'}
                    </div>

                    {/* Expand/collapse task list */}
                    {(tpl.tasks?.length > 0) && (
                      <>
                        <button
                          onClick={() => setExpandedTemplate(isExpanded ? null : tpl.id)}
                          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition-colors"
                        >
                          {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                          {isExpanded ? 'Hide tasks' : 'Preview tasks'}
                        </button>
                        {isExpanded && (
                          <div className="mt-3 space-y-1 max-h-48 overflow-y-auto pr-2">
                            {tpl.tasks.map((t, i) => (
                              <div key={i} className="flex items-center gap-2 text-xs py-1 px-2 bg-slate-50 rounded">
                                <StatusBadge status={t.priority} className="text-[10px] py-0 px-1" />
                                <span className="truncate text-slate-700">{t.title}</span>
                                {tpl.dependencies?.some(d => d.task_ref_id === t.ref_id) && (
                                  <span className="ml-auto">
                                    {tpl.dependencies
                                      .filter(d => d.task_ref_id === t.ref_id)
                                      .map((d, di) => {
                                        const info = DEP_TYPE_LABELS[d.dependency_type];
                                        return info ? (
                                          <span key={di} className={cn("px-1 rounded text-[9px] font-bold ml-0.5", info.color)}>{info.label}</span>
                                        ) : null;
                                      })}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}

                    <Separator className="my-4" />
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => { setSelectedTemplate(tpl); setUseDialogOpen(true); }}
                    >
                      <FolderPlus className="h-4 w-4 mr-2" />Create Project from Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Save Template Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Save Project as Template</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveTemplate} className="space-y-4">
            <div className="space-y-2">
              <Label>Template Name</Label>
              <Input name="name" required placeholder="e.g. Standard Game Project" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea name="description" placeholder="Describe what this template includes..." rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Source Project</Label>
              <Select name="project_id" required>
                <SelectTrigger><SelectValue placeholder="Choose project to save as template" /></SelectTrigger>
                <SelectContent>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({allTasks.filter(t => t.project_id === p.id).length} tasks)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">Tasks, priorities, types, and dependencies will be captured.</p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saveTemplateMutation.isPending}>Save Template</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Project from Template Dialog */}
      <Dialog open={useDialogOpen} onOpenChange={setUseDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Project from "{selectedTemplate?.name}"</DialogTitle>
          </DialogHeader>
          {selectedTemplate && (
            <form onSubmit={handleUseTemplate} className="space-y-4">
              <div className="p-3 bg-violet-50 rounded-lg text-sm text-violet-800">
                This will create a new project with <strong>{selectedTemplate.tasks?.length || 0} tasks</strong> and <strong>{selectedTemplate.dependencies?.length || 0} dependencies</strong> from the template.
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Project Name</Label>
                  <Input name="name" required placeholder="My New Project" />
                </div>
                <div className="space-y-2">
                  <Label>Code</Label>
                  <Input name="code" required placeholder="PROJ01" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea name="description" placeholder="Project description..." rows={2} defaultValue={selectedTemplate?.description} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select name="status" defaultValue="planning">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PROJECT_STATUSES.map(s => (
                        <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, ' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select name="project_type" defaultValue={selectedTemplate.project_type || 'game'}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PROJECT_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input name="start_date" type="date" />
                </div>
                <div className="space-y-2">
                  <Label>Target Date</Label>
                  <Input name="target_date" type="date" />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setUseDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createProjectMutation.isPending}>
                  {createProjectMutation.isPending ? 'Creating...' : 'Create Project'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
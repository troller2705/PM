import React, { useState } from 'react';
import { base44 } from 'api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from 'components/common/PageHeader';
import StatusBadge from 'components/common/StatusBadge';
import SearchInput from 'components/common/SearchInput';
import EmptyState from 'components/common/EmptyState';
import { Button } from "components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "components/ui/card";
import { Badge } from "components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "components/ui/dialog";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { Textarea } from "components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "components/ui/select";
import { Switch } from "components/ui/switch";
import { Skeleton } from "components/ui/skeleton";
import {
  Plus,
  GitBranch,
  Github,
  Settings,
  MoreVertical,
  Pencil,
  Trash2,
  RefreshCw,
  ExternalLink,
  Link2,
  FolderGit2,
  Clock,
  Code,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "components/ui/dropdown-menu";
import { format } from 'date-fns';
import { cn } from "lib/utils";

const PROVIDERS = [
  { id: 'github', name: 'GitHub', icon: Github, color: 'bg-slate-900' },
  { id: 'gitlab', name: 'GitLab', icon: FolderGit2, color: 'bg-orange-500' },
  { id: 'gitea', name: 'Gitea', icon: FolderGit2, color: 'bg-green-600' },
];

export default function GitIntegrations() {
  const [activeTab, setActiveTab] = useState('integrations');
  const [search, setSearch] = useState('');
  const [integrationDialog, setIntegrationDialog] = useState(false);
  const [repoDialog, setRepoDialog] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState(null);
  const [editingRepo, setEditingRepo] = useState(null);
  const queryClient = useQueryClient();

  const { data: integrations = [], isLoading: integrationsLoading } = useQuery({
    queryKey: ['gitIntegrations'],
    queryFn: () => base44.entities.GitIntegration.list(),
  });

  const { data: repositories = [], isLoading: reposLoading } = useQuery({
    queryKey: ['repositories'],
    queryFn: () => base44.entities.Repository.list('-created_date', 100),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list(),
  });

  // Integration mutations
  const createIntegrationMutation = useMutation({
    mutationFn: (data) => base44.entities.GitIntegration.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gitIntegrations'] });
      setIntegrationDialog(false);
      setEditingIntegration(null);
    },
  });

  const updateIntegrationMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.GitIntegration.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gitIntegrations'] });
      setIntegrationDialog(false);
      setEditingIntegration(null);
    },
  });

  const deleteIntegrationMutation = useMutation({
    mutationFn: (id) => base44.entities.GitIntegration.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gitIntegrations'] }),
  });

  // Repository mutations
  const createRepoMutation = useMutation({
    mutationFn: (data) => base44.entities.Repository.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repositories'] });
      setRepoDialog(false);
      setEditingRepo(null);
    },
  });

  const updateRepoMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Repository.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repositories'] });
      setRepoDialog(false);
      setEditingRepo(null);
    },
  });

  const deleteRepoMutation = useMutation({
    mutationFn: (id) => base44.entities.Repository.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['repositories'] }),
  });

  const getIntegrationById = (id) => integrations.find(i => i.id === id);
  const getProjectById = (id) => projects.find(p => p.id === id);
  const getProviderInfo = (provider) => PROVIDERS.find(p => p.id === provider) || PROVIDERS[0];

  const filteredRepos = repositories.filter(r =>
    r.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleIntegrationSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      name: formData.get('name'),
      provider: formData.get('provider'),
      base_url: formData.get('base_url') || null,
      api_token: formData.get('api_token'),
      organization: formData.get('organization'),
      status: formData.get('status'),
      settings: {
        auto_link_commits: formData.get('auto_link_commits') === 'on',
        auto_create_branches: formData.get('auto_create_branches') === 'on',
        sync_issues: formData.get('sync_issues') === 'on',
      },
    };

    if (editingIntegration) {
      updateIntegrationMutation.mutate({ id: editingIntegration.id, data });
    } else {
      createIntegrationMutation.mutate(data);
    }
  };

  const handleRepoSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      name: formData.get('name'),
      full_name: formData.get('full_name'),
      integration_id: formData.get('integration_id'),
      project_id: formData.get('project_id') || null,
      url: formData.get('url'),
      clone_url: formData.get('clone_url'),
      default_branch: formData.get('default_branch') || 'main',
      description: formData.get('description'),
      is_private: formData.get('is_private') === 'on',
    };

    if (editingRepo) {
      updateRepoMutation.mutate({ id: editingRepo.id, data });
    } else {
      createRepoMutation.mutate(data);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Git Integrations"
        subtitle="Connect GitHub, GitLab, and Gitea repositories"
        actions={
          <Button onClick={() => { setEditingIntegration(null); setIntegrationDialog(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Integration
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="integrations" className="gap-2">
            <Settings className="h-4 w-4" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="repositories" className="gap-2">
            <GitBranch className="h-4 w-4" />
            Repositories
          </TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="mt-6">
          {integrationsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48" />)}
            </div>
          ) : integrations.length === 0 ? (
            <EmptyState
              icon={GitBranch}
              title="No Git integrations"
              description="Connect your first Git provider to link repositories"
              action={() => setIntegrationDialog(true)}
              actionLabel="Add Integration"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {integrations.map(integration => {
                const provider = getProviderInfo(integration.provider);
                const ProviderIcon = provider.icon;
                const repoCount = repositories.filter(r => r.integration_id === integration.id).length;

                return (
                  <Card key={integration.id} className="border-0 shadow-sm overflow-hidden">
                    <div className={cn("h-2", provider.color)} />
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={cn("p-2 rounded-lg", provider.color)}>
                            <ProviderIcon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900">{integration.name}</h3>
                            <p className="text-sm text-slate-500 capitalize">{integration.provider}</p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setEditingIntegration(integration); setIntegrationDialog(true); }}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => deleteIntegrationMutation.mutate(integration.id)}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <StatusBadge status={integration.status} className="mb-4" />

                      {integration.organization && (
                        <p className="text-sm text-slate-600 mb-2">
                          Org: <span className="font-medium">{integration.organization}</span>
                        </p>
                      )}

                      <div className="flex items-center justify-between text-sm text-slate-500 pt-3 border-t border-slate-100">
                        <span>{repoCount} repositories</span>
                        {integration.last_sync && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(integration.last_sync), 'MMM d, HH:mm')}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="repositories" className="mt-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between mb-4">
            <SearchInput value={search} onChange={setSearch} placeholder="Search repositories..." className="sm:w-64" />
            <Button onClick={() => { setEditingRepo(null); setRepoDialog(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Link Repository
            </Button>
          </div>

          {reposLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-36" />)}
            </div>
          ) : filteredRepos.length === 0 ? (
            <EmptyState
              icon={FolderGit2}
              title="No repositories"
              description={search ? "No repositories match your search" : "Link your first repository"}
              action={() => setRepoDialog(true)}
              actionLabel="Link Repository"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRepos.map(repo => {
                const integration = getIntegrationById(repo.integration_id);
                const project = getProjectById(repo.project_id);
                const provider = getProviderInfo(integration?.provider);

                return (
                  <Card key={repo.id} className="border-0 shadow-sm">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={cn("p-2 rounded-lg", provider?.color || 'bg-slate-500')}>
                            <FolderGit2 className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900">{repo.name}</h3>
                            <p className="text-sm text-slate-500 font-mono">{repo.full_name}</p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {repo.url && (
                              <DropdownMenuItem asChild>
                                <a href={repo.url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  Open in {integration?.provider}
                                </a>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => { setEditingRepo(repo); setRepoDialog(true); }}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => deleteRepoMutation.mutate(repo.id)}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Unlink
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {repo.description && (
                        <p className="text-sm text-slate-600 line-clamp-2 mb-3">{repo.description}</p>
                      )}

                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant="outline" className="gap-1">
                          <GitBranch className="h-3 w-3" />
                          {repo.default_branch}
                        </Badge>
                        {repo.language && (
                          <Badge variant="secondary" className="gap-1">
                            <Code className="h-3 w-3" />
                            {repo.language}
                          </Badge>
                        )}
                        {repo.is_private && (
                          <Badge variant="secondary">Private</Badge>
                        )}
                      </div>

                      {project && (
                        <div className="flex items-center gap-2 text-sm text-slate-600 pt-3 border-t border-slate-100">
                          <Link2 className="h-4 w-4" />
                          Linked to <span className="font-medium">{project.name}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Integration Dialog */}
      <Dialog open={integrationDialog} onOpenChange={setIntegrationDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingIntegration ? 'Edit Integration' : 'Add Git Integration'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleIntegrationSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Integration Name</Label>
              <Input id="name" name="name" required defaultValue={editingIntegration?.name} placeholder="My GitHub" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="provider">Provider</Label>
              <Select name="provider" defaultValue={editingIntegration?.provider || 'github'}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      <div className="flex items-center gap-2">
                        <p.icon className="h-4 w-4" />
                        {p.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="base_url">Base URL (for self-hosted)</Label>
              <Input id="base_url" name="base_url" defaultValue={editingIntegration?.base_url} placeholder="https://gitlab.example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="api_token">API Token</Label>
              <Input id="api_token" name="api_token" type="password" defaultValue={editingIntegration?.api_token} placeholder="ghp_xxxxxxxxxxxx" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organization">Organization/Username</Label>
              <Input id="organization" name="organization" defaultValue={editingIntegration?.organization} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select name="status" defaultValue={editingIntegration?.status || 'active'}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3 pt-2">
              <Label>Settings</Label>
              <div className="flex items-center justify-between">
                <span className="text-sm">Auto-link commits to tasks</span>
                <Switch name="auto_link_commits" defaultChecked={editingIntegration?.settings?.auto_link_commits} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Auto-create branches for tasks</span>
                <Switch name="auto_create_branches" defaultChecked={editingIntegration?.settings?.auto_create_branches} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Sync issues</span>
                <Switch name="sync_issues" defaultChecked={editingIntegration?.settings?.sync_issues} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIntegrationDialog(false)}>Cancel</Button>
              <Button type="submit">{editingIntegration ? 'Save' : 'Add'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Repository Dialog */}
      <Dialog open={repoDialog} onOpenChange={setRepoDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingRepo ? 'Edit Repository' : 'Link Repository'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRepoSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="integration_id">Integration</Label>
              <Select name="integration_id" defaultValue={editingRepo?.integration_id || ''} required>
                <SelectTrigger><SelectValue placeholder="Select integration" /></SelectTrigger>
                <SelectContent>
                  {integrations.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Repository Name</Label>
                <Input id="name" name="name" required defaultValue={editingRepo?.name} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input id="full_name" name="full_name" required defaultValue={editingRepo?.full_name} placeholder="org/repo" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">Repository URL</Label>
              <Input id="url" name="url" defaultValue={editingRepo?.url} placeholder="https://github.com/org/repo" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clone_url">Clone URL</Label>
              <Input id="clone_url" name="clone_url" defaultValue={editingRepo?.clone_url} placeholder="git@github.com:org/repo.git" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="default_branch">Default Branch</Label>
                <Input id="default_branch" name="default_branch" defaultValue={editingRepo?.default_branch || 'main'} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project_id">Link to Project</Label>
                <Select name="project_id" defaultValue={editingRepo?.project_id || ''}>
                  <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                  <SelectContent>
                    {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" defaultValue={editingRepo?.description} rows={2} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="is_private">Private Repository</Label>
              <Switch id="is_private" name="is_private" defaultChecked={editingRepo?.is_private ?? true} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRepoDialog(false)}>Cancel</Button>
              <Button type="submit">{editingRepo ? 'Save' : 'Link'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
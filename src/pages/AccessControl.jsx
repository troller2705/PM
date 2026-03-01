import React, { useState } from 'react';
import { base44 } from 'api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from 'components/common/PageHeader';
import StatusBadge from 'components/common/StatusBadge';
import SearchInput from 'components/common/SearchInput';
import EmptyState from 'components/common/EmptyState';
import Avatar from 'components/common/Avatar';
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
import { Checkbox } from "components/ui/checkbox";
import { Skeleton } from "components/ui/skeleton";
import { ScrollArea } from "components/ui/scroll-area";
import {
  Plus,
  Shield,
  Key,
  Users,
  Lock,
  MoreVertical,
  Pencil,
  Trash2,
  FolderKanban,
  UserPlus,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "components/ui/dropdown-menu";
import { cn } from "lib/utils";
import { PERMISSIONS } from 'components/common/permissions';

const ACCESS_LEVELS = [
  { value: 'none', label: 'No Access', description: 'Cannot access the project' },
  { value: 'view', label: 'View', description: 'Can view project and tasks' },
  { value: 'contribute', label: 'Contribute', description: 'Can create and update tasks' },
  { value: 'manage', label: 'Manage', description: 'Can manage tasks and team' },
  { value: 'admin', label: 'Admin', description: 'Full project access' },
];

const PERMISSION_CATEGORIES = [
  { id: 'project', name: 'Project', permissions: ['project.view', 'project.create', 'project.update', 'project.delete', 'project.manage_access'] },
  { id: 'task', name: 'Task', permissions: ['task.view', 'task.create', 'task.update', 'task.delete', 'task.assign'] },
  { id: 'budget', name: 'Budget', permissions: ['budget.view', 'budget.create', 'budget.update', 'budget.delete', 'budget.approve'] },
  { id: 'user', name: 'User', permissions: ['user.view', 'user.create', 'user.update', 'user.delete', 'user.manage_roles'] },
  { id: 'admin', name: 'Admin', permissions: ['admin.settings', 'admin.audit_log', 'admin.ldap', 'admin.git'] },
];

export default function AccessControl() {
  const [activeTab, setActiveTab] = useState('project_access');
  const [search, setSearch] = useState('');
  const [roleDialog, setRoleDialog] = useState(false);
  const [permissionDialog, setPermissionDialog] = useState(false);
  const [accessDialog, setAccessDialog] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [editingPermission, setEditingPermission] = useState(null);
  const [editingAccess, setEditingAccess] = useState(null);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const queryClient = useQueryClient();

  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: () => base44.entities.Role.list(),
  });

  const { data: permissions = [], isLoading: permissionsLoading } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => base44.entities.Permission.list(),
  });

  const { data: projectAccess = [], isLoading: accessLoading } = useQuery({
    queryKey: ['projectAccess'],
    queryFn: () => base44.entities.ProjectAccess.list('-created_date', 200),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: groups = [] } = useQuery({
    queryKey: ['ldapGroups'],
    queryFn: () => base44.entities.LDAPGroup.list(),
  });

  // Role mutations
  const createRoleMutation = useMutation({
    mutationFn: (data) => base44.entities.Role.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setRoleDialog(false);
      setEditingRole(null);
      setSelectedPermissions([]);
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Role.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setRoleDialog(false);
      setEditingRole(null);
      setSelectedPermissions([]);
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (id) => base44.entities.Role.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roles'] }),
  });

  // Permission mutations
  const createPermissionMutation = useMutation({
    mutationFn: (data) => base44.entities.Permission.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      setPermissionDialog(false);
      setEditingPermission(null);
    },
  });

  const updatePermissionMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Permission.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      setPermissionDialog(false);
      setEditingPermission(null);
    },
  });

  const deletePermissionMutation = useMutation({
    mutationFn: (id) => base44.entities.Permission.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['permissions'] }),
  });

  // Access mutations
  const createAccessMutation = useMutation({
    mutationFn: (data) => base44.entities.ProjectAccess.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectAccess'] });
      setAccessDialog(false);
      setEditingAccess(null);
    },
  });

  const updateAccessMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ProjectAccess.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectAccess'] });
      setAccessDialog(false);
      setEditingAccess(null);
    },
  });

  const deleteAccessMutation = useMutation({
    mutationFn: (id) => base44.entities.ProjectAccess.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projectAccess'] }),
  });

  const getProjectById = (id) => projects.find(p => p.id === id);
  const getUserById = (id) => users.find(u => u.id === id);
  const getGroupById = (id) => groups.find(g => g.id === id);
  const getRoleById = (id) => roles.find(r => r.id === id);

  const handleRoleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      name: formData.get('name'),
      code: formData.get('code'),
      description: formData.get('description'),
      permission_ids: selectedPermissions,
      hierarchy_level: Number(formData.get('hierarchy_level')) || 0,
    };

    if (editingRole) {
      updateRoleMutation.mutate({ id: editingRole.id, data });
    } else {
      createRoleMutation.mutate(data);
    }
  };

  const handlePermissionSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      name: formData.get('name'),
      code: formData.get('code'),
      description: formData.get('description'),
      category: formData.get('category'),
    };

    if (editingPermission) {
      updatePermissionMutation.mutate({ id: editingPermission.id, data });
    } else {
      createPermissionMutation.mutate(data);
    }
  };

  const handleAccessSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      project_id: formData.get('project_id'),
      user_id: formData.get('user_id') || null,
      group_id: formData.get('group_id') || null,
      access_level: formData.get('access_level'),
      expires_at: formData.get('expires_at') || null,
    };

    if (editingAccess) {
      updateAccessMutation.mutate({ id: editingAccess.id, data });
    } else {
      createAccessMutation.mutate(data);
    }
  };

  const openRoleDialog = (role = null) => {
    setEditingRole(role);
    setSelectedPermissions(role?.permission_ids || []);
    setRoleDialog(true);
  };

  const togglePermission = (permCode) => {
    setSelectedPermissions(prev => 
      prev.includes(permCode) 
        ? prev.filter(p => p !== permCode)
        : [...prev, permCode]
    );
  };

  const filteredAccess = projectAccess.filter(a => {
    const project = getProjectById(a.project_id);
    const user = getUserById(a.user_id);
    const searchTerm = search.toLowerCase();
    return project?.name?.toLowerCase().includes(searchTerm) ||
           user?.full_name?.toLowerCase().includes(searchTerm);
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Access Control"
        subtitle="Manage roles, permissions, and project access"
        actions={
          <Button onClick={() => setAccessDialog(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Grant Access
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="project_access" className="gap-2">
            <FolderKanban className="h-4 w-4" />
            Project Access
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-2">
            <Shield className="h-4 w-4" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="permissions" className="gap-2">
            <Key className="h-4 w-4" />
            Permissions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="project_access" className="mt-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between mb-4">
            <SearchInput value={search} onChange={setSearch} placeholder="Search by project or user..." className="sm:w-64" />
          </div>

          {accessLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : filteredAccess.length === 0 ? (
            <EmptyState
              icon={Lock}
              title="No access rules"
              description="Grant project access to users or groups"
              action={() => setAccessDialog(true)}
              actionLabel="Grant Access"
            />
          ) : (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-0 divide-y divide-slate-100">
                {filteredAccess.map(access => {
                  const project = getProjectById(access.project_id);
                  const user = getUserById(access.user_id);
                  const group = getGroupById(access.group_id);
                  const accessLevel = ACCESS_LEVELS.find(l => l.value === access.access_level);

                  return (
                    <div key={access.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-violet-100">
                          <FolderKanban className="h-4 w-4 text-violet-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{project?.name || 'Unknown Project'}</p>
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            {user && (
                              <span className="flex items-center gap-1">
                                <Avatar name={user.full_name} email={user.email} size="sm" className="h-5 w-5 text-[10px]" />
                                {user.full_name}
                              </span>
                            )}
                            {group && (
                              <span className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                {group.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="capitalize">{accessLevel?.label}</Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setEditingAccess(access); setAccessDialog(true); }}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => deleteAccessMutation.mutate(access.id)}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Revoke
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="roles" className="mt-6">
          <div className="flex justify-end mb-4">
            <Button onClick={() => openRoleDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Create Role
            </Button>
          </div>

          {rolesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40" />)}
            </div>
          ) : roles.length === 0 ? (
            <EmptyState
              icon={Shield}
              title="No roles defined"
              description="Create roles to manage user permissions"
              action={() => openRoleDialog()}
              actionLabel="Create Role"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roles.map(role => (
                <Card key={role.id} className="border-0 shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-slate-900">{role.name}</h3>
                        <p className="text-sm text-slate-500 font-mono">{role.code}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openRoleDialog(role)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => deleteRoleMutation.mutate(role.id)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {role.description && (
                      <p className="text-sm text-slate-600 line-clamp-2 mb-3">{role.description}</p>
                    )}
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Key className="h-4 w-4" />
                      {role.permission_ids?.length || 0} permissions
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="permissions" className="mt-6">
          <div className="flex justify-end mb-4">
            <Button onClick={() => { setEditingPermission(null); setPermissionDialog(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Permission
            </Button>
          </div>

          {permissionsLoading ? (
            <Skeleton className="h-96" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {PERMISSION_CATEGORIES.map(category => {
                const categoryPerms = permissions.filter(p => p.category === category.id);
                return (
                  <Card key={category.id} className="border-0 shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{category.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {categoryPerms.length === 0 ? (
                          <p className="text-sm text-slate-500">No permissions</p>
                        ) : (
                          categoryPerms.map(perm => (
                            <div key={perm.id} className="flex items-center justify-between p-2 rounded bg-slate-50">
                              <div>
                                <p className="text-sm font-medium">{perm.name}</p>
                                <p className="text-xs text-slate-500 font-mono">{perm.code}</p>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7">
                                    <MoreVertical className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => { setEditingPermission(perm); setPermissionDialog(true); }}>
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600" onClick={() => deletePermissionMutation.mutate(perm.id)}>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Role Dialog */}
      <Dialog open={roleDialog} onOpenChange={setRoleDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingRole ? 'Edit Role' : 'Create Role'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRoleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Role Name</Label>
                <Input id="name" name="name" required defaultValue={editingRole?.name} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Code</Label>
                <Input id="code" name="code" required defaultValue={editingRole?.code} placeholder="developer" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" defaultValue={editingRole?.description} rows={2} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hierarchy_level">Hierarchy Level</Label>
              <Input id="hierarchy_level" name="hierarchy_level" type="number" defaultValue={editingRole?.hierarchy_level || 0} />
            </div>
            <div className="space-y-2">
              <Label>Permissions</Label>
              <ScrollArea className="h-48 border rounded-lg p-3">
                {PERMISSION_CATEGORIES.map(category => (
                  <div key={category.id} className="mb-4">
                    <p className="text-sm font-medium text-slate-700 mb-2">{category.name}</p>
                    <div className="space-y-2 pl-2">
                      {category.permissions.map(perm => (
                        <div key={perm} className="flex items-center gap-2">
                          <Checkbox
                            id={perm}
                            checked={selectedPermissions.includes(perm)}
                            onCheckedChange={() => togglePermission(perm)}
                          />
                          <label htmlFor={perm} className="text-sm cursor-pointer">{perm}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRoleDialog(false)}>Cancel</Button>
              <Button type="submit">{editingRole ? 'Save' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Permission Dialog */}
      <Dialog open={permissionDialog} onOpenChange={setPermissionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPermission ? 'Edit Permission' : 'Add Permission'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePermissionSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Permission Name</Label>
              <Input id="name" name="name" required defaultValue={editingPermission?.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input id="code" name="code" required defaultValue={editingPermission?.code} placeholder="task.create" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select name="category" defaultValue={editingPermission?.category || 'project'}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="project">Project</SelectItem>
                  <SelectItem value="task">Task</SelectItem>
                  <SelectItem value="budget">Budget</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="git">Git</SelectItem>
                  <SelectItem value="report">Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" defaultValue={editingPermission?.description} rows={2} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPermissionDialog(false)}>Cancel</Button>
              <Button type="submit">{editingPermission ? 'Save' : 'Add'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Access Dialog */}
      <Dialog open={accessDialog} onOpenChange={setAccessDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingAccess ? 'Edit Access' : 'Grant Project Access'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAccessSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project_id">Project</Label>
              <Select name="project_id" defaultValue={editingAccess?.project_id || ''} required>
                <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>
                  {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="user_id">User</Label>
              <Select name="user_id" defaultValue={editingAccess?.user_id || ''}>
                <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                <SelectContent>
                  {users.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="group_id">Or Group</Label>
              <Select name="group_id" defaultValue={editingAccess?.group_id || ''}>
                <SelectTrigger><SelectValue placeholder="Select group" /></SelectTrigger>
                <SelectContent>
                  {groups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="access_level">Access Level</Label>
              <Select name="access_level" defaultValue={editingAccess?.access_level || 'view'}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACCESS_LEVELS.map(level => (
                    <SelectItem key={level.value} value={level.value}>
                      <div>
                        <p className="font-medium">{level.label}</p>
                        <p className="text-xs text-slate-500">{level.description}</p>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expires_at">Expires At (optional)</Label>
              <Input id="expires_at" name="expires_at" type="date" defaultValue={editingAccess?.expires_at} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAccessDialog(false)}>Cancel</Button>
              <Button type="submit">{editingAccess ? 'Save' : 'Grant'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
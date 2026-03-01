import React, { useState } from 'react';
import { base44 } from '../api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../components/common/PageHeader';
import StatusBadge from '../components/common/StatusBadge';
import SearchInput from '../components/common/SearchInput';
import EmptyState from '../components/common/EmptyState';
import Avatar from '../components/common/Avatar';
import DataTable from '../components/common/DataTable';
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
import {
  Plus,
  Users,
  Building2,
  FolderTree,
  Mail,
  MoreVertical,
  Pencil,
  Trash2,
  UserPlus,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { cn } from "../lib/utils";

export default function Team() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('users');
  const [departmentDialog, setDepartmentDialog] = useState(false);
  const [groupDialog, setGroupDialog] = useState(false);
  const [inviteDialog, setInviteDialog] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [editingGroup, setEditingGroup] = useState(null);
  const queryClient = useQueryClient();

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: departments = [], isLoading: deptsLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: () => base44.entities.Department.list(),
  });

  const { data: groups = [], isLoading: groupsLoading } = useQuery({
    queryKey: ['ldapGroups'],
    queryFn: () => base44.entities.LDAPGroup.list(),
  });

  const createDeptMutation = useMutation({
    mutationFn: (data) => base44.entities.Department.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setDepartmentDialog(false);
      setEditingDept(null);
    },
  });

  const updateDeptMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Department.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setDepartmentDialog(false);
      setEditingDept(null);
    },
  });

  const deleteDeptMutation = useMutation({
    mutationFn: (id) => base44.entities.Department.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['departments'] }),
  });

  const createGroupMutation = useMutation({
    mutationFn: (data) => base44.entities.LDAPGroup.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ldapGroups'] });
      setGroupDialog(false);
      setEditingGroup(null);
    },
  });

  const updateGroupMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.LDAPGroup.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ldapGroups'] });
      setGroupDialog(false);
      setEditingGroup(null);
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: (id) => base44.entities.LDAPGroup.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ldapGroups'] }),
  });

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredDepts = departments.filter(d =>
    d.name?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredGroups = groups.filter(g =>
    g.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDeptSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      name: formData.get('name'),
      code: formData.get('code'),
      description: formData.get('description'),
      manager_id: formData.get('manager_id') || null,
      budget_allocation: formData.get('budget_allocation') ? Number(formData.get('budget_allocation')) : null,
      status: formData.get('status'),
    };

    if (editingDept) {
      updateDeptMutation.mutate({ id: editingDept.id, data });
    } else {
      createDeptMutation.mutate(data);
    }
  };

  const handleGroupSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      name: formData.get('name'),
      cn: formData.get('cn'),
      description: formData.get('description'),
      group_type: formData.get('group_type'),
      status: formData.get('status'),
    };

    if (editingGroup) {
      updateGroupMutation.mutate({ id: editingGroup.id, data });
    } else {
      createGroupMutation.mutate(data);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const role = formData.get('role');
    
    await base44.users.inviteUser(email, role);
    setInviteDialog(false);
  };

  const userColumns = [
    {
      header: 'User',
      render: (user) => (
        <div className="flex items-center gap-3">
          <Avatar name={user.full_name} email={user.email} size="sm" />
          <div>
            <p className="font-medium text-slate-900">{user.full_name}</p>
            <p className="text-sm text-slate-500">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Role',
      render: (user) => (
        <Badge variant="secondary" className="capitalize">{user.role}</Badge>
      ),
    },
    {
      header: 'Joined',
      render: (user) => (
        <span className="text-slate-600">
          {user.created_date ? new Date(user.created_date).toLocaleDateString() : '-'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team Management"
        subtitle="Manage users, departments, and LDAP groups"
        actions={
          <Button onClick={() => setInviteDialog(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Invite User
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <TabsList>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="departments" className="gap-2">
              <Building2 className="h-4 w-4" />
              Departments
            </TabsTrigger>
            <TabsTrigger value="groups" className="gap-2">
              <FolderTree className="h-4 w-4" />
              LDAP Groups
            </TabsTrigger>
          </TabsList>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search..."
            className="w-full sm:w-64"
          />
        </div>

        <TabsContent value="users" className="mt-0">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <DataTable
                columns={userColumns}
                data={filteredUsers}
                isLoading={usersLoading}
                emptyMessage="No users found"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments" className="mt-0">
          <div className="flex justify-end mb-4">
            <Button onClick={() => { setEditingDept(null); setDepartmentDialog(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              New Department
            </Button>
          </div>
          {deptsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-40" />)}
            </div>
          ) : filteredDepts.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="No departments"
              description="Create your first department to organize your team"
              action={() => setDepartmentDialog(true)}
              actionLabel="Create Department"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDepts.map(dept => (
                <Card key={dept.id} className="border-0 shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-slate-900">{dept.name}</h3>
                        <p className="text-sm text-slate-500">{dept.code}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setEditingDept(dept); setDepartmentDialog(true); }}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => deleteDeptMutation.mutate(dept.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <StatusBadge status={dept.status} className="mb-3" />
                    {dept.description && (
                      <p className="text-sm text-slate-600 line-clamp-2 mb-3">{dept.description}</p>
                    )}
                    {dept.budget_allocation && (
                      <p className="text-sm text-slate-500">
                        Budget: ${dept.budget_allocation.toLocaleString()}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="groups" className="mt-0">
          <div className="flex justify-end mb-4">
            <Button onClick={() => { setEditingGroup(null); setGroupDialog(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              New Group
            </Button>
          </div>
          {groupsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-40" />)}
            </div>
          ) : filteredGroups.length === 0 ? (
            <EmptyState
              icon={FolderTree}
              title="No LDAP groups"
              description="Create LDAP groups to manage access control"
              action={() => setGroupDialog(true)}
              actionLabel="Create Group"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredGroups.map(group => (
                <Card key={group.id} className="border-0 shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-slate-900">{group.name}</h3>
                        <p className="text-sm text-slate-500 font-mono">{group.cn}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setEditingGroup(group); setGroupDialog(true); }}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => deleteGroupMutation.mutate(group.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex gap-2 mb-3">
                      <StatusBadge status={group.status} />
                      <Badge variant="outline" className="capitalize">{group.group_type}</Badge>
                    </div>
                    {group.description && (
                      <p className="text-sm text-slate-600 line-clamp-2 mb-3">{group.description}</p>
                    )}
                    <p className="text-sm text-slate-500">
                      {group.member_ids?.length || 0} members
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Department Dialog */}
      <Dialog open={departmentDialog} onOpenChange={setDepartmentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingDept ? 'Edit Department' : 'Create Department'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleDeptSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" required defaultValue={editingDept?.name} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Code</Label>
                <Input id="code" name="code" required defaultValue={editingDept?.code} placeholder="DEV" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" defaultValue={editingDept?.description} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="manager_id">Manager</Label>
                <Select name="manager_id" defaultValue={editingDept?.manager_id || ''}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select manager" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>{user.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select name="status" defaultValue={editingDept?.status || 'active'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget_allocation">Budget Allocation ($)</Label>
              <Input 
                id="budget_allocation" 
                name="budget_allocation" 
                type="number" 
                defaultValue={editingDept?.budget_allocation} 
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDepartmentDialog(false)}>Cancel</Button>
              <Button type="submit">{editingDept ? 'Save' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Group Dialog */}
      <Dialog open={groupDialog} onOpenChange={setGroupDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingGroup ? 'Edit LDAP Group' : 'Create LDAP Group'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleGroupSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" required defaultValue={editingGroup?.name} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cn">Common Name (CN)</Label>
                <Input id="cn" name="cn" required defaultValue={editingGroup?.cn} placeholder="cn=developers" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" defaultValue={editingGroup?.description} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="group_type">Type</Label>
                <Select name="group_type" defaultValue={editingGroup?.group_type || 'security'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="distribution">Distribution</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                    <SelectItem value="department">Department</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select name="status" defaultValue={editingGroup?.status || 'active'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="disabled">Disabled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setGroupDialog(false)}>Cancel</Button>
              <Button type="submit">{editingGroup ? 'Save' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Invite Dialog */}
      <Dialog open={inviteDialog} onOpenChange={setInviteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invite User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required placeholder="user@company.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select name="role" defaultValue="user">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setInviteDialog(false)}>Cancel</Button>
              <Button type="submit">Send Invite</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
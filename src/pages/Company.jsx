import React, { useState, useEffect } from 'react';
import DataTable from '@/components/common/DataTable';
import { db } from '@/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '@/components/common/PageHeader';
import StatusBadge from '@/components/common/StatusBadge';
import SearchInput from '@/components/common/SearchInput';
import EmptyState from '@/components/common/EmptyState';
import Avatar from '@/components/common/Avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus, Users, Building2, FolderTree, MoreVertical, Pencil, Trash2, UserPlus,
  Settings, Shield,
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const COMPANY_ROLES = [
  { value: 'user', label: 'Member', description: 'Standard team member' },
  { value: 'admin', label: 'Admin', description: 'Full system access' },
  { value: 'manager', label: 'Manager', description: 'Can manage projects and people' },
  { value: 'lead', label: 'Team Lead', description: 'Leads a team or department' },
  { value: 'viewer', label: 'Viewer', description: 'Read-only access' },
];

export default function Company() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [departmentDialog, setDepartmentDialog] = useState(false);
  const [groupDialog, setGroupDialog] = useState(false);
  const [inviteDialog, setInviteDialog] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [editingGroup, setEditingGroup] = useState(null);
  const [editRoleUser, setEditRoleUser] = useState(null);
  const [companySettings, setCompanySettings] = useState({ name: '', logo_url: '' });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    db.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const isAdmin = currentUser?.role === 'admin';

  const { data: users = [], isLoading: usersLoading } = useQuery({ queryKey: ['users'], queryFn: () => db.users.list() });
  const { data: departments = [], isLoading: deptsLoading } = useQuery({ queryKey: ['departments'], queryFn: () => db.departments.list() });
  const { data: groups = [], isLoading: groupsLoading } = useQuery({ queryKey: ['ldapGroups'], queryFn: () => db.ldapGroups.list() });
  const { data: profiles = [] } = useQuery({ queryKey: ['resourceProfiles'], queryFn: () => db.resourceProfiles.list() });
  const { data: sysSettings = [] } = useQuery({
    queryKey: ['systemSettings'],
    queryFn: () => db.systemSettings.list(), // Using list instead of filter
  });

  // Init company settings from fetched data
  useEffect(() => {
    if (sysSettings.length > 0) {
      const nameEntry = sysSettings.find(s => s.key === 'company_name');
      const logoEntry = sysSettings.find(s => s.key === 'company_logo');
      setCompanySettings({
        name: nameEntry?.value || '',
        logo_url: logoEntry?.value || '',
      });
    }
  }, [sysSettings]);

  const updateUserRoleMutation = useMutation({
    mutationFn: ({ id, role }) => db.users.update(id, { role }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); setEditRoleUser(null); },
  });

  const saveCompanySettings = async () => {
    setSettingsSaving(true);
    const upsert = async (key, value) => {
      const existing = sysSettings.find(s => s.key === key);
      if (existing) {
        await db.systemSettings.update(existing.id, { value });
      } else {
        await db.systemSettings.create({ key, value, category: 'general' });
      }
    };
    await Promise.all([
      upsert('company_name', companySettings.name),
      upsert('company_logo', companySettings.logo_url),
    ]);
    queryClient.invalidateQueries({ queryKey: ['systemSettings'] });
    setSettingsSaving(false);
  };

  const createDeptMutation = useMutation({
    mutationFn: (data) => db.departments.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['departments'] }); setDepartmentDialog(false); setEditingDept(null); },
  });
  const updateDeptMutation = useMutation({
    mutationFn: ({ id, data }) => db.departments.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['departments'] }); setDepartmentDialog(false); setEditingDept(null); },
  });
  const deleteDeptMutation = useMutation({
    mutationFn: (id) => db.departments.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['departments'] }),
  });
  const createGroupMutation = useMutation({
    mutationFn: (data) => db.ldapGroups.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['ldapGroups'] }); setGroupDialog(false); setEditingGroup(null); },
  });
  const updateGroupMutation = useMutation({
    mutationFn: ({ id, data }) => db.ldapGroups.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['ldapGroups'] }); setGroupDialog(false); setEditingGroup(null); },
  });
  const deleteGroupMutation = useMutation({
    mutationFn: (id) => db.ldapGroups.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ldapGroups'] }),
  });

  const handleDeptSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = {
      name: fd.get('name'), code: fd.get('code'), description: fd.get('description'),
      manager_id: fd.get('manager_id') || null,
      status: fd.get('status'),
    };
    editingDept ? updateDeptMutation.mutate({ id: editingDept.id, data }) : createDeptMutation.mutate(data);
  };

  const handleGroupSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = { name: fd.get('name'), cn: fd.get('cn'), description: fd.get('description'), group_type: fd.get('group_type'), status: fd.get('status') };
    editingGroup ? updateGroupMutation.mutate({ id: editingGroup.id, data }) : createGroupMutation.mutate(data);
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    // Base44 invite logic mocked
    setInviteDialog(false);
  };

  const filteredUsers = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );
  const filteredDepts = departments.filter(d => d.name?.toLowerCase().includes(search.toLowerCase()));
  const filteredGroups = groups.filter(g => g.name?.toLowerCase().includes(search.toLowerCase()));

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
      render: (user) => {
        const roleInfo = COMPANY_ROLES.find(r => r.value === user.role);
        return (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="capitalize">{roleInfo?.label || user.role}</Badge>
            {isAdmin && user.id !== currentUser?.id && (
              <Button variant="ghost" size="icon" className="h-6 w-6 opacity-60 hover:opacity-100"
                onClick={() => setEditRoleUser(user)}>
                <Pencil className="h-3 w-3" />
              </Button>
            )}
          </div>
        );
      },
    },
    {
      header: 'Department',
      render: (user) => {
        const profile = profiles.find(p => p.user_id === user.id);
        const dept = departments.find(d => d.id === profile?.department_id);
        return <span className="text-slate-600">{dept?.name || '—'}</span>;
      },
    },
    {
      header: 'Title',
      render: (user) => {
        const profile = profiles.find(p => p.user_id === user.id);
        return <span className="text-slate-600">{profile?.title || '—'}</span>;
      },
    },
    {
      header: 'Joined',
      render: (user) => <span className="text-slate-600">{user.created_date ? new Date(user.created_date).toLocaleDateString() : '-'}</span>,
    },
  ];

  const activeGroups = groups.filter(g => g.status === 'active').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Company"
        subtitle="Manage your organization — people, departments, and groups"
        actions={
          <Button onClick={() => setInviteDialog(true)}>
            <UserPlus className="h-4 w-4 mr-2" />Invite User
          </Button>
        }
      />

      {/* Overview stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-violet-100 rounded-lg"><Users className="h-5 w-5 text-violet-600" /></div>
            <div><p className="text-2xl font-bold">{users.length}</p><p className="text-xs text-slate-500">Team Members</p></div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg"><Building2 className="h-5 w-5 text-blue-600" /></div>
            <div><p className="text-2xl font-bold">{departments.length}</p><p className="text-xs text-slate-500">Departments</p></div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg"><FolderTree className="h-5 w-5 text-emerald-600" /></div>
            <div><p className="text-2xl font-bold">{activeGroups}</p><p className="text-xs text-slate-500">Active Groups</p></div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <TabsList className="bg-white border shadow-sm">
            <TabsTrigger value="overview" className="gap-2"><Users className="h-4 w-4" />Team</TabsTrigger>
            <TabsTrigger value="departments" className="gap-2"><Building2 className="h-4 w-4" />Departments</TabsTrigger>
            <TabsTrigger value="groups" className="gap-2"><FolderTree className="h-4 w-4" />LDAP Groups</TabsTrigger>
            {isAdmin && <TabsTrigger value="settings" className="gap-2"><Settings className="h-4 w-4" />Settings</TabsTrigger>}
          </TabsList>
          <SearchInput value={search} onChange={setSearch} placeholder="Search..." className="w-full sm:w-64" />
        </div>

        {/* ── TEAM ── */}
        <TabsContent value="overview" className="mt-0">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <DataTable columns={userColumns} data={filteredUsers} isLoading={usersLoading} emptyMessage="No users found" />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── DEPARTMENTS ── */}
        <TabsContent value="departments" className="mt-0">
          <div className="flex justify-end mb-4">
            <Button onClick={() => { setEditingDept(null); setDepartmentDialog(true); }}>
              <Plus className="h-4 w-4 mr-2" />New Department
            </Button>
          </div>
          {deptsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-40" />)}
            </div>
          ) : filteredDepts.length === 0 ? (
            <EmptyState icon={Building2} title="No departments" description="Create your first department" action={() => setDepartmentDialog(true)} actionLabel="Create Department" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDepts.map(dept => {
                const manager = users.find(u => u.id === dept.manager_id);
                const memberCount = profiles.filter(p => p.department_id === dept.id).length;
                return (
                  <Card key={dept.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-slate-900">{dept.name}</h3>
                          <p className="text-xs text-slate-500 font-mono">{dept.code}</p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setEditingDept(dept); setDepartmentDialog(true); }}>
                              <Pencil className="h-4 w-4 mr-2" />Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => deleteDeptMutation.mutate(dept.id)}>
                              <Trash2 className="h-4 w-4 mr-2" />Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <StatusBadge status={dept.status} className="mb-3" />
                      {dept.description && <p className="text-sm text-slate-600 line-clamp-2 mb-3">{dept.description}</p>}
                      <div className="flex items-center justify-between text-sm text-slate-500 mt-2">
                        {manager && (
                          <div className="flex items-center gap-1.5">
                            <Avatar name={manager.full_name} email={manager.email} size="sm" className="h-5 w-5 text-[9px]" />
                            <span className="text-xs">{manager.full_name?.split(' ')[0]}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-3 ml-auto">
                          <span className="text-xs">{memberCount} members</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── COMPANY SETTINGS ── */}
        {isAdmin && (
          <TabsContent value="settings" className="mt-0">
            <div className="max-w-xl space-y-6">
              <Card className="border-0 shadow-sm">
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Building2 className="h-4 w-4" />Company Identity</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Company Name</Label>
                    <Input
                      value={companySettings.name}
                      onChange={e => setCompanySettings(s => ({ ...s, name: e.target.value }))}
                      placeholder="GameStudio Inc."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Logo URL</Label>
                    <div className="flex gap-3 items-start">
                      {companySettings.logo_url && (
                        <img src={companySettings.logo_url} alt="Logo" className="h-12 w-12 rounded-lg object-cover border" />
                      )}
                      <Input
                        value={companySettings.logo_url}
                        onChange={e => setCompanySettings(s => ({ ...s, logo_url: e.target.value }))}
                        placeholder="https://example.com/logo.png"
                      />
                    </div>
                    <p className="text-xs text-slate-400">Paste a public image URL for your company logo.</p>
                  </div>
                  <Button onClick={saveCompanySettings} disabled={settingsSaving}>
                    {settingsSaving ? 'Saving…' : 'Save Settings'}
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4" />Role Descriptions</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {COMPANY_ROLES.map(r => (
                      <div key={r.value} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                        <div>
                          <p className="font-medium text-sm text-slate-800">{r.label}</p>
                          <p className="text-xs text-slate-500">{r.description}</p>
                        </div>
                        <Badge variant="outline" className="font-mono text-xs">{r.value}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}

        {/* ── LDAP GROUPS ── */}
        <TabsContent value="groups" className="mt-0">
          <div className="flex justify-end mb-4">
            <Button onClick={() => { setEditingGroup(null); setGroupDialog(true); }}>
              <Plus className="h-4 w-4 mr-2" />New Group
            </Button>
          </div>
          {groupsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-40" />)}
            </div>
          ) : filteredGroups.length === 0 ? (
            <EmptyState icon={FolderTree} title="No LDAP groups" description="Create LDAP groups to manage access control" action={() => setGroupDialog(true)} actionLabel="Create Group" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredGroups.map(group => (
                <Card key={group.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-slate-900">{group.name}</h3>
                        <p className="text-sm text-slate-500 font-mono">{group.cn}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setEditingGroup(group); setGroupDialog(true); }}>
                            <Pencil className="h-4 w-4 mr-2" />Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => deleteGroupMutation.mutate(group.id)}>
                            <Trash2 className="h-4 w-4 mr-2" />Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex gap-2 mb-3">
                      <StatusBadge status={group.status} />
                      <Badge variant="outline" className="capitalize">{group.group_type}</Badge>
                    </div>
                    {group.description && <p className="text-sm text-slate-600 line-clamp-2 mb-3">{group.description}</p>}
                    <p className="text-sm text-slate-500">{group.member_ids?.length || 0} members</p>
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
          <DialogHeader><DialogTitle>{editingDept ? 'Edit Department' : 'Create Department'}</DialogTitle></DialogHeader>
          <form onSubmit={handleDeptSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Name</Label><Input name="name" required defaultValue={editingDept?.name} /></div>
              <div className="space-y-2"><Label>Code</Label><Input name="code" required defaultValue={editingDept?.code} placeholder="DEV" /></div>
            </div>
            <div className="space-y-2"><Label>Description</Label><Textarea name="description" defaultValue={editingDept?.description} rows={2} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Manager</Label>
                <Select name="manager_id" defaultValue={editingDept?.manager_id || ''}>
                  <SelectTrigger><SelectValue placeholder="Select manager" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {users.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select name="status" defaultValue={editingDept?.status || 'active'}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
          <DialogHeader><DialogTitle>{editingGroup ? 'Edit LDAP Group' : 'Create LDAP Group'}</DialogTitle></DialogHeader>
          <form onSubmit={handleGroupSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Name</Label><Input name="name" required defaultValue={editingGroup?.name} /></div>
              <div className="space-y-2"><Label>CN</Label><Input name="cn" required defaultValue={editingGroup?.cn} placeholder="cn=devs" /></div>
            </div>
            <div className="space-y-2"><Label>Description</Label><Textarea name="description" defaultValue={editingGroup?.description} rows={2} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select name="group_type" defaultValue={editingGroup?.group_type || 'security'}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="distribution">Distribution</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                    <SelectItem value="department">Department</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select name="status" defaultValue={editingGroup?.status || 'active'}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
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

      {/* Edit Role Dialog */}
      <Dialog open={!!editRoleUser} onOpenChange={(open) => !open && setEditRoleUser(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Change Role — {editRoleUser?.full_name}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            {COMPANY_ROLES.map(r => (
              <button
                key={r.value}
                onClick={() => updateUserRoleMutation.mutate({ id: editRoleUser.id, role: r.value })}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-lg border text-left transition-colors hover:border-violet-400",
                  editRoleUser?.role === r.value ? "border-violet-500 bg-violet-50" : "border-slate-200"
                )}
              >
                <div>
                  <p className="font-medium text-sm text-slate-800">{r.label}</p>
                  <p className="text-xs text-slate-500">{r.description}</p>
                </div>
                {editRoleUser?.role === r.value && <Badge className="bg-violet-100 text-violet-700 border-0">Current</Badge>}
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRoleUser(null)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Dialog */}
      <Dialog open={inviteDialog} onOpenChange={setInviteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Invite User</DialogTitle></DialogHeader>
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="space-y-2"><Label>Email</Label><Input name="email" type="email" required placeholder="user@company.com" /></div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select name="role" defaultValue="user">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COMPANY_ROLES.map(r => (
                    <SelectItem key={r.value} value={r.value}>{r.label} — {r.description}</SelectItem>
                  ))}
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
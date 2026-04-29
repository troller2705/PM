import React, { useState } from 'react';
import { db } from '../api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../components/common/PageHeader';
import StatusBadge from '../components/common/StatusBadge';
import SearchInput from '../components/common/SearchInput';
import DataTable from '../components/common/DataTable';
import Avatar from '../components/common/Avatar';
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { Switch } from "../components/ui/switch";
import { Skeleton } from "../components/ui/skeleton";
import { ScrollArea } from "../components/ui/scroll-area";
import {
  Plus,
  Settings,
  Shield,
  FileText,
  Server,
  Database,
  MoreVertical,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
  Download,
  Users,
  Link,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { format } from 'date-fns';
import { cn } from "../lib/utils";
import { Checkbox } from '@/components/ui/checkbox';

const SETTING_CATEGORIES = [
  { id: 'general', name: 'General', icon: Settings },
  { id: 'ldap', name: 'LDAP', icon: Server },
  { id: 'git', name: 'Git', icon: Database },
  { id: 'budget', name: 'Budget', icon: Database },
  { id: 'notifications', name: 'Notifications', icon: Settings },
  { id: 'security', name: 'Security', icon: Shield },
];

export default function Admin() {
  const [activeTab, setActiveTab] = useState('roles');
  const [search, setSearch] = useState('');
  const [settingDialog, setSettingDialog] = useState(false);
  const [editingSetting, setEditingSetting] = useState(null);
  const [editingRole, setEditingRole] = useState(null);
  const [showSecrets, setShowSecrets] = useState({});
  const queryClient = useQueryClient();

  // Data Queries
  const { data: settings = [], isLoading: settingsLoading } = useQuery({ queryKey: ['systemSettings'], queryFn: () => db.systemSettings.list() });
  const { data: auditLogs = [], isLoading: logsLoading } = useQuery({ queryKey: ['auditLogs'], queryFn: () => db.auditLogs.list() });
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: () => db.users.list() });
  const { data: roles = [], isLoading: rolesLoading } = useQuery({ queryKey: ['roles'], queryFn: () => db.roles.list() });
  const { data: permissions = [], isLoading: permissionsLoading } = useQuery({ queryKey: ['permissions'], queryFn: () => db.permissions.list() });
  const { data: ldapGroups = [], isLoading: ldapLoading } = useQuery({ queryKey: ['ldapGroups'], queryFn: () => db.ldapGroups.list() });

  // Mutations
  const createSettingMutation = useMutation({ mutationFn: (data) => db.systemSettings.create(data), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['systemSettings'] }) });
  const updateSettingMutation = useMutation({ mutationFn: ({ id, data }) => db.systemSettings.update(id, data), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['systemSettings'] }) });
  const deleteSettingMutation = useMutation({ mutationFn: (id) => db.systemSettings.delete(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['systemSettings'] }) });
  const updateRoleMutation = useMutation({ mutationFn: ({ id, data }) => db.roles.update(id, data), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roles'] }) });

  const getUserById = (id) => users.find(u => u.id === id);

  const handleSettingSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    data.is_secret = data.is_secret === 'on';
    if (editingSetting) updateSettingMutation.mutate({ id: editingSetting.id, data }, { onSuccess: () => setSettingDialog(false) });
    else createSettingMutation.mutate(data, { onSuccess: () => setSettingDialog(false) });
  };

  const handleRoleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const permissionIds = permissions.filter(p => formData.get(`perm-${p.id}`) === 'on').map(p => p.id);
    const ldapGroupId = formData.get('ldap_group_id');
    
    const data = {
      name: formData.get('name'),
      description: formData.get('description'),
      ldap_group_id: ldapGroupId === 'unlinked' ? null : ldapGroupId,
      permission_ids: permissionIds,
      default_hourly_rate: formData.get('default_hourly_rate') ? parseFloat(formData.get('default_hourly_rate')) : 0,
    };
    updateRoleMutation.mutate({ id: editingRole.id, data }, { onSuccess: () => setEditingRole(null) });
  };

  const toggleShowSecret = (id) => setShowSecrets(prev => ({ ...prev, [id]: !prev[id] }));

  const auditLogColumns = [
    { header: 'Action', render: (log) => <Badge variant="outline" className="capitalize">{log.action?.replace(/_/g, ' ')}</Badge> },
    { header: 'Entity', render: (log) => <div><p className="font-medium">{log.entity_type}</p><p className="text-xs text-slate-500 font-mono">{log.entity_id?.slice(0, 8)}...</p></div> },
    { header: 'User', render: (log) => { const user = getUserById(log.user_id); return user ? <div className="flex items-center gap-2"><Avatar name={user.full_name} email={user.email} size="sm" /><span className="text-sm">{user.full_name}</span></div> : <span className="text-slate-500">{log.user_email || 'System'}</span>; } },
    { header: 'Time', render: (log) => <span className="text-sm text-slate-600">{log.created_date ? format(new Date(log.created_date), 'MMM d, HH:mm') : '-'}</span> },
    { header: 'IP', render: (log) => <span className="text-sm text-slate-500 font-mono">{log.ip_address || '-'}</span> },
  ];

  const filteredLogs = auditLogs.filter(log => log.action?.toLowerCase().includes(search.toLowerCase()) || log.entity_type?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <PageHeader title="Admin Panel" subtitle="System settings, roles, and administration" />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="roles" className="gap-2"><Shield className="h-4 w-4" /> Roles & Permissions</TabsTrigger>
          <TabsTrigger value="settings" className="gap-2"><Settings className="h-4 w-4" /> Settings</TabsTrigger>
          <TabsTrigger value="audit" className="gap-2"><FileText className="h-4 w-4" /> Audit Log</TabsTrigger>
          <TabsTrigger value="ldap" className="gap-2"><Server className="h-4 w-4" /> LDAP Config</TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="mt-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Role & Rate Management</CardTitle>
              <CardDescription>Define roles, set their default billable rates, and map them to LDAP groups and permissions.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-slate-100">
                {rolesLoading ? (
                  [...Array(4)].map((_, i) => <Skeleton key={i} className="h-20" />)
                ) : (
                  roles.map(role => {
                    const mappedGroup = ldapGroups.find(g => g.id === role.ldap_group_id);
                    return (
                      <div key={role.id} className="py-4 flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-slate-900 text-lg">{role.name}</h3>
                          <p className="text-sm text-slate-500 mt-1">{role.description}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Shield className="h-4 w-4" />
                              <span>{role.permission_ids?.length || 0} Permissions</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Link className="h-4 w-4" />
                              {mappedGroup ? (
                                <span className="font-medium">{mappedGroup.name}</span>
                              ) : (
                                <span className="text-slate-400">Not Linked</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <span className="font-mono bg-slate-100 px-1.5 rounded text-xs border border-slate-200">
                                ${role.default_hourly_rate || 0}/hr
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" onClick={() => setEditingRole(role)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit Role
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <div className="flex justify-end mb-4">
            <Button onClick={() => { setEditingSetting(null); setSettingDialog(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Setting
            </Button>
          </div>

          {settingsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40" />)}
              </div>
          ) : (
              <div className="space-y-6">
                {SETTING_CATEGORIES.map(category => {
                  const categorySettings = settings.filter(s => s.category === category.id);
                  if (categorySettings.length === 0) return null;

                  return (
                      <Card key={category.id} className="border-0 shadow-sm">
                        <CardHeader className="pb-2">
                          <div className="flex items-center gap-2">
                            <category.icon className="h-5 w-5 text-slate-600" />
                            <CardTitle className="text-lg">{category.name} Settings</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="divide-y divide-slate-100">
                            {categorySettings.map(setting => (
                                <div key={setting.id} className="py-4 flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <p className="font-medium text-slate-900">{setting.key}</p>
                                      {setting.is_secret && (
                                          <Badge variant="secondary" className="text-xs">Secret</Badge>
                                      )}
                                    </div>
                                    {setting.description && (
                                        <p className="text-sm text-slate-500 mt-1">{setting.description}</p>
                                    )}
                                    <div className="flex items-center gap-2 mt-2">
                                      {setting.is_secret ? (
                                          <>
                                            <code className="text-sm bg-slate-100 px-2 py-1 rounded">
                                              {showSecrets[setting.id] ? setting.value : '••••••••'}
                                            </code>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7"
                                                onClick={() => toggleShowSecret(setting.id)}
                                            >
                                              {showSecrets[setting.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </Button>
                                          </>
                                      ) : (
                                          <code className="text-sm bg-slate-100 px-2 py-1 rounded">{setting.value}</code>
                                      )}
                                    </div>
                                  </div>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => { setEditingSetting(setting); setSettingDialog(true); }}>
                                        <Pencil className="h-4 w-4 mr-2" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem className="text-red-600" onClick={() => deleteSettingMutation.mutate(setting.id)}>
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                  );
                })}
              </div>
          )}
        </TabsContent>

        <TabsContent value="audit" className="mt-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between mb-4">
            <SearchInput value={search} onChange={setSearch} placeholder="Search logs..." className="sm:w-64" />
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <DataTable
                  columns={auditLogColumns}
                  data={filteredLogs}
                  isLoading={logsLoading}
                  emptyMessage="No audit logs found"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ldap" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>LDAP Configuration</CardTitle>
                <CardDescription>Configure LDAP/Active Directory integration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>LDAP Server URL</Label>
                  <Input placeholder="ldap://ldap.example.com:389" />
                </div>
                <div className="space-y-2">
                  <Label>Base DN</Label>
                  <Input placeholder="dc=example,dc=com" />
                </div>
                <div className="space-y-2">
                  <Label>Bind DN</Label>
                  <Input placeholder="cn=admin,dc=example,dc=com" />
                </div>
                <div className="space-y-2">
                  <Label>Bind Password</Label>
                  <Input type="password" placeholder="••••••••" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>User Search Base</Label>
                    <Input placeholder="ou=users" />
                  </div>
                  <div className="space-y-2">
                    <Label>Group Search Base</Label>
                    <Input placeholder="ou=groups" />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4">
                  <div className="flex items-center gap-2">
                    <Switch id="ldap-enabled" />
                    <Label htmlFor="ldap-enabled">Enable LDAP Authentication</Label>
                  </div>
                  <Button>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Test Connection
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Attribute Mapping</CardTitle>
                <CardDescription>Map LDAP attributes to user fields</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Username Attribute</Label>
                  <Input defaultValue="uid" />
                </div>
                <div className="space-y-2">
                  <Label>Email Attribute</Label>
                  <Input defaultValue="mail" />
                </div>
                <div className="space-y-2">
                  <Label>Full Name Attribute</Label>
                  <Input defaultValue="cn" />
                </div>
                <div className="space-y-2">
                  <Label>Group Membership Attribute</Label>
                  <Input defaultValue="memberOf" />
                </div>
                <div className="space-y-2">
                  <Label>User Filter</Label>
                  <Input placeholder="(objectClass=person)" />
                </div>
                <div className="space-y-2">
                  <Label>Group Filter</Label>
                  <Input placeholder="(objectClass=groupOfNames)" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm lg:col-span-2">
              <CardHeader>
                <CardTitle>Group Synchronization</CardTitle>
                <CardDescription>Configure how LDAP groups sync with the system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50">
                    <div>
                      <p className="font-medium">Auto-sync groups</p>
                      <p className="text-sm text-slate-500">Sync groups on user login</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50">
                    <div>
                      <p className="font-medium">Create local groups</p>
                      <p className="text-sm text-slate-500">Auto-create missing groups</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50">
                    <div>
                      <p className="font-medium">Sync interval</p>
                      <p className="text-sm text-slate-500">Background sync every 6h</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
                <div className="flex justify-end mt-6">
                  <Button>Save LDAP Configuration</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Role Editing Dialog */}
      <Dialog open={!!editingRole} onOpenChange={() => setEditingRole(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Role: {editingRole?.name}</DialogTitle>
            <DialogDescription>{editingRole?.description}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRoleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Role Name</Label>
                  <Input id="name" name="name" defaultValue={editingRole?.name} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" defaultValue={editingRole?.description} rows={3} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="default_hourly_rate">Default Hourly Rate ($)</Label>
                  <Input id="default_hourly_rate" name="default_hourly_rate" type="number" step="0.01" min="0" defaultValue={editingRole?.default_hourly_rate || ''} placeholder="e.g. 150.00" />
                  <p className="text-xs text-slate-500">This rate applies to all users inheriting this role unless overridden by a specific resource profile.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ldap_group_id">Link to LDAP Group</Label>
                  <Select name="ldap_group_id" defaultValue={editingRole?.ldap_group_id || 'unlinked'}>
                    <SelectTrigger><SelectValue placeholder="Select an LDAP group" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unlinked">None</SelectItem>
                      {ldapGroups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Permissions</Label>
                <ScrollArea className="h-64 border rounded-md p-4">
                  <div className="space-y-3">
                    {permissionsLoading ? <Skeleton className="h-40" /> : permissions.map(perm => (
                      <div key={perm.id} className="flex items-center gap-3">
                        <Checkbox
                          id={`perm-${perm.id}`}
                          name={`perm-${perm.id}`}
                          defaultChecked={editingRole?.permission_ids?.includes(perm.id)}
                        />
                        <div>
                          <Label htmlFor={`perm-${perm.id}`} className="font-medium">{perm.name}</Label>
                          <p className="text-xs text-slate-500">{perm.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingRole(null)}>Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Setting Dialog */}
      <Dialog open={settingDialog} onOpenChange={setSettingDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSetting ? 'Edit Setting' : 'Add Setting'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSettingSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="key">Key</Label>
              <Input id="key" name="key" required defaultValue={editingSetting?.key} placeholder="SETTING_KEY" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="value">Value</Label>
              <Input id="value" name="value" required defaultValue={editingSetting?.value} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select name="category" defaultValue={editingSetting?.category || 'general'}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SETTING_CATEGORIES.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" defaultValue={editingSetting?.description} rows={2} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="is_secret">Secret Value</Label>
              <Switch id="is_secret" name="is_secret" defaultChecked={editingSetting?.is_secret} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSettingDialog(false)}>Cancel</Button>
              <Button type="submit">{editingSetting ? 'Save' : 'Add'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
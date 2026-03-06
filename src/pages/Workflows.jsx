import React, { useState } from 'react';
import { db } from '@/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import StatusBadge from '@/components/common/StatusBadge';
import Avatar from '@/components/common/Avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import {
  Zap, Plus, MoreVertical, Trash2, Pencil, ArrowRight,
  CheckCircle, XCircle, Clock, GitMerge, Bell
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const TRIGGER_EVENTS = [
  { value: 'status_change', label: 'Task Status Changes' },
  { value: 'assignee_change', label: 'Assignee Changed' },
  { value: 'task_created', label: 'Task Created' },
  { value: 'due_date_approaching', label: 'Due Date Approaching' },
];

const ACTION_TYPES = [
  { value: 'assign_to_user', label: 'Assign to User' },
  { value: 'change_status', label: 'Change Status' },
  { value: 'require_approval', label: 'Require Approval' },
];

const TASK_STATUSES = ['backlog', 'todo', 'in_progress', 'review', 'testing', 'done', 'blocked'];

function RuleCard({ rule, users, onEdit, onDelete, onToggle }) {
  const getTriggerLabel = () => TRIGGER_EVENTS.find(t => t.value === rule.trigger_event)?.label || rule.trigger_event;
  const getActionLabel = () => ACTION_TYPES.find(a => a.value === rule.action_type)?.label || rule.action_type;
  const assignee = users.find(u => u.id === rule.action_config?.user_id);

  return (
    <Card className={cn("border-0 shadow-sm transition-opacity", !rule.is_active && "opacity-60")}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", rule.is_active ? "bg-violet-50" : "bg-slate-100")}>
              <Zap className={cn("h-4 w-4", rule.is_active ? "text-violet-500" : "text-slate-400")} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">{rule.name}</h3>
              {rule.description && <p className="text-xs text-slate-500 mt-0.5">{rule.description}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={!!rule.is_active} onCheckedChange={(v) => onToggle(rule.id, v)} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(rule)}><Pencil className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                <DropdownMenuItem className="text-red-600" onClick={() => onDelete(rule.id)}><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Trigger → Action flow */}
        <div className="flex items-center gap-2 flex-wrap text-sm">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-100">
            <Bell className="h-3.5 w-3.5 text-blue-500" />
            <span className="text-blue-700 font-medium">{getTriggerLabel()}</span>
          </div>
          {rule.trigger_condition?.from_status && (
            <span className="text-xs text-slate-500">
              {rule.trigger_condition.from_status} → {rule.trigger_condition.to_status}
            </span>
          )}
          <ArrowRight className="h-4 w-4 text-slate-400" />
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-100">
            <Zap className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-emerald-700 font-medium">{getActionLabel()}</span>
          </div>
          {assignee && (
            <div className="flex items-center gap-1.5">
              <ArrowRight className="h-3 w-3 text-slate-300" />
              <Avatar name={assignee.full_name} email={assignee.email} size="sm" />
              <span className="text-xs text-slate-600">{assignee.full_name}</span>
            </div>
          )}
          {rule.action_config?.status && (
            <StatusBadge status={rule.action_config.status} />
          )}
        </div>

        {rule.execution_count > 0 && (
          <p className="text-xs text-slate-400 mt-3">Executed {rule.execution_count} time{rule.execution_count !== 1 ? 's' : ''}</p>
        )}
      </CardContent>
    </Card>
  );
}

function RuleDialog({ open, onOpenChange, rule, users, projects, onSave }) {
  const [triggerEvent, setTriggerEvent] = useState(rule?.trigger_event || 'status_change');
  const [actionType, setActionType] = useState(rule?.action_type || 'assign_to_user');

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = {
      name: fd.get('name'),
      description: fd.get('description'),
      is_active: true,
      trigger_event: triggerEvent,
      trigger_condition: {
        from_status: fd.get('from_status') || null,
        to_status: fd.get('to_status') || null,
        task_type: fd.get('task_type_cond') || null,
        project_id: fd.get('project_id_cond') || null,
        priority: fd.get('priority_cond') || null,
      },
      action_type: actionType,
      action_config: {
        user_id: fd.get('action_user_id') || null,
        status: fd.get('action_status') || null,
        approver_ids: fd.get('approver_ids') ? [fd.get('approver_ids')] : [],
        approval_message: fd.get('approval_message') || null,
      },
      execution_count: rule?.execution_count || 0,
    };
    onSave(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{rule ? 'Edit Workflow Rule' : 'Create Workflow Rule'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Rule Name</Label>
            <Input name="name" required defaultValue={rule?.name} placeholder="e.g. Auto-assign to QA on Review" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea name="description" defaultValue={rule?.description} rows={2} placeholder="What does this rule do?" />
          </div>

          <Separator />
          <p className="text-sm font-semibold text-slate-700">Trigger</p>

          <div className="space-y-2">
            <Label>When</Label>
            <Select value={triggerEvent} onValueChange={setTriggerEvent}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TRIGGER_EVENTS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {triggerEvent === 'status_change' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>From Status (optional)</Label>
                <Select name="from_status" defaultValue={rule?.trigger_condition?.from_status || ''}>
                  <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Any</SelectItem>
                    {TASK_STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g,' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>To Status</Label>
                <Select name="to_status" defaultValue={rule?.trigger_condition?.to_status || ''}>
                  <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Any</SelectItem>
                    {TASK_STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g,' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Project Filter (optional)</Label>
              <Select name="project_id_cond" defaultValue={rule?.trigger_condition?.project_id || ''}>
                <SelectTrigger><SelectValue placeholder="Any project" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Any project</SelectItem>
                  {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority Filter (optional)</Label>
              <Select name="priority_cond" defaultValue={rule?.trigger_condition?.priority || ''}>
                <SelectTrigger><SelectValue placeholder="Any priority" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Any priority</SelectItem>
                  {['low', 'medium', 'high', 'critical'].map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />
          <p className="text-sm font-semibold text-slate-700">Action</p>

          <div className="space-y-2">
            <Label>Then</Label>
            <Select value={actionType} onValueChange={setActionType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ACTION_TYPES.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {actionType === 'assign_to_user' && (
            <div className="space-y-2">
              <Label>Assign to</Label>
              <Select name="action_user_id" defaultValue={rule?.action_config?.user_id || ''}>
                <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                <SelectContent>{users.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}

          {actionType === 'change_status' && (
            <div className="space-y-2">
              <Label>Set status to</Label>
              <Select name="action_status" defaultValue={rule?.action_config?.status || ''}>
                <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>{TASK_STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g,' ')}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}

          {actionType === 'require_approval' && (
            <>
              <div className="space-y-2">
                <Label>Approver</Label>
                <Select name="approver_ids" defaultValue={rule?.action_config?.approver_ids?.[0] || ''}>
                  <SelectTrigger><SelectValue placeholder="Select approver" /></SelectTrigger>
                  <SelectContent>{users.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Approval Message</Label>
                <Textarea name="approval_message" defaultValue={rule?.action_config?.approval_message} rows={2} placeholder="Please review and approve…" />
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Save Rule</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ApprovalCard({ approval, users, onApprove, onReject }) {
  const [note, setNote] = useState('');
  const requester = users.find(u => u.id === approval.requester_id);
  const approvers = (approval.approver_ids || []).map(id => users.find(u => u.id === id)).filter(Boolean);

  const statusConfig = {
    pending: { color: 'bg-amber-100 text-amber-700', icon: Clock },
    approved: { color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
    rejected: { color: 'bg-red-100 text-red-700', icon: XCircle },
  };
  const cfg = statusConfig[approval.status] || statusConfig.pending;
  const Icon = cfg.icon;

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-slate-900">{approval.title}</h3>
            {approval.message && <p className="text-sm text-slate-500 mt-0.5">{approval.message}</p>}
          </div>
          <Badge className={cn("border-0 flex items-center gap-1", cfg.color)}>
            <Icon className="h-3 w-3" />
            <span className="capitalize">{approval.status}</span>
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
          {requester && (
            <div className="flex items-center gap-1.5">
              <Avatar name={requester.full_name} email={requester.email} size="sm" />
              <span>Requested by {requester.full_name}</span>
            </div>
          )}
          <span>{format(new Date(approval.created_date), 'MMM d, yyyy')}</span>
        </div>
        {approvers.length > 0 && (
          <p className="text-xs text-slate-400 mb-3">
            Approvers: {approvers.map(a => a.full_name).join(', ')}
          </p>
        )}
        {approval.status === 'pending' && (
          <div className="space-y-2">
            <Textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Resolution note (optional)…"
              rows={2}
              className="text-sm"
            />
            <div className="flex gap-2">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => onApprove(approval.id, note)}>
                <CheckCircle className="h-4 w-4 mr-1" />Approve
              </Button>
              <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => onReject(approval.id, note)}>
                <XCircle className="h-4 w-4 mr-1" />Reject
              </Button>
            </div>
          </div>
        )}
        {approval.resolution_note && (
          <p className="text-xs text-slate-500 mt-2 p-2 bg-slate-50 rounded">Note: {approval.resolution_note}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function Workflows() {
  const [ruleDialog, setRuleDialog] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [activeTab, setActiveTab] = useState('rules');
  const queryClient = useQueryClient();

  const { data: rules = [], isLoading: rulesLoading } = useQuery({
    queryKey: ['workflowRules'],
    queryFn: () => db.workflowRules.list('-created_date'),
  });
  const { data: approvals = [], isLoading: approvalsLoading } = useQuery({
    queryKey: ['approvalRequests'],
    queryFn: () => db.approvalRequests.list('-created_date'),
  });
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: () => db.users.list() });
  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: () => db.projects.list() });

  const createRuleMutation = useMutation({
    mutationFn: (data) => db.workflowRules.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['workflowRules'] }); setRuleDialog(false); setEditingRule(null); },
  });
  const updateRuleMutation = useMutation({
    mutationFn: ({ id, data }) => db.workflowRules.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['workflowRules'] }); setRuleDialog(false); setEditingRule(null); },
  });
  const deleteRuleMutation = useMutation({
    mutationFn: (id) => db.workflowRules.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workflowRules'] }),
  });

  const resolveApprovalMutation = useMutation({
    mutationFn: ({ id, status, note }) => db.approvalRequests.update(id, {
      status,
      resolution_note: note,
      resolved_at: new Date().toISOString(),
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['approvalRequests'] }),
  });

  const handleSaveRule = (data) => {
    if (editingRule) updateRuleMutation.mutate({ id: editingRule.id, data });
    else createRuleMutation.mutate(data);
  };

  const pendingApprovals = approvals.filter(a => a.status === 'pending');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workflow Automation"
        subtitle="Define triggers and actions to automate your project workflows"
        actions={
          <Button onClick={() => { setEditingRule(null); setRuleDialog(true); }}>
            <Plus className="h-4 w-4 mr-2" />New Rule
          </Button>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-violet-50 rounded-lg"><Zap className="h-5 w-5 text-violet-500" /></div>
            <div>
              <p className="text-2xl font-bold">{rules.filter(r => r.is_active).length}</p>
              <p className="text-xs text-slate-500">Active rules</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-lg"><Clock className="h-5 w-5 text-amber-500" /></div>
            <div>
              <p className="text-2xl font-bold">{pendingApprovals.length}</p>
              <p className="text-xs text-slate-500">Pending approvals</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg"><GitMerge className="h-5 w-5 text-emerald-500" /></div>
            <div>
              <p className="text-2xl font-bold">{rules.reduce((s, r) => s + (r.execution_count || 0), 0)}</p>
              <p className="text-xs text-slate-500">Total executions</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border shadow-sm">
          <TabsTrigger value="rules" className="gap-2">
            <Zap className="h-4 w-4" />Rules
            <Badge variant="secondary">{rules.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="approvals" className="gap-2">
            <CheckCircle className="h-4 w-4" />Approvals
            {pendingApprovals.length > 0 && (
              <Badge className="bg-amber-100 text-amber-700 border-0">{pendingApprovals.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="mt-4">
          {rulesLoading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
          ) : rules.length === 0 ? (
            <EmptyState
              icon={Zap}
              title="No workflow rules yet"
              description="Create rules to automate task assignments, status changes, and approval flows."
              action={() => setRuleDialog(true)}
              actionLabel="Create Rule"
            />
          ) : (
            <div className="space-y-3">
              {rules.map(rule => (
                <RuleCard
                  key={rule.id}
                  rule={rule}
                  users={users}
                  onEdit={(r) => { setEditingRule(r); setRuleDialog(true); }}
                  onDelete={(id) => deleteRuleMutation.mutate(id)}
                  onToggle={(id, active) => updateRuleMutation.mutate({ id, data: { is_active: active } })}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approvals" className="mt-4">
          {approvalsLoading ? (
            <div className="space-y-3">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-40" />)}</div>
          ) : approvals.length === 0 ? (
            <EmptyState icon={CheckCircle} title="No approval requests" description="Approval requests triggered by workflow rules will appear here." />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {approvals.map(approval => (
                <ApprovalCard
                  key={approval.id}
                  approval={approval}
                  users={users}
                  onApprove={(id, note) => resolveApprovalMutation.mutate({ id, status: 'approved', note })}
                  onReject={(id, note) => resolveApprovalMutation.mutate({ id, status: 'rejected', note })}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <RuleDialog
        open={ruleDialog}
        onOpenChange={setRuleDialog}
        rule={editingRule}
        users={users}
        projects={projects}
        onSave={handleSaveRule}
      />
    </div>
  );
}
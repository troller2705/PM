import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import StatusBadge from '@/components/common/StatusBadge';
import Avatar from '@/components/common/Avatar';
import { Plus, MoreVertical, Pencil, Trash2, X, Users, Calendar } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

const PRIORITY_COLORS = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-amber-100 text-amber-700',
  critical: 'bg-red-100 text-red-700',
};

const STATUS_COLORS = {
  open: 'bg-slate-100 text-slate-600',
  partially_filled: 'bg-amber-100 text-amber-700',
  filled: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-gray-100 text-gray-400',
};

export default function ForecastPanel({ forecasts, projects, users, profiles }) {
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [skillInput, setSkillInput] = useState('');
  const [reqSkills, setReqSkills] = useState([]);
  const [assigneeIds, setAssigneeIds] = useState([]);
  const queryClient = useQueryClient();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['forecasts'] });

  const createMutation = useMutation({ mutationFn: d => base44.entities.ResourceForecast.create(d), onSuccess: invalidate });
  const updateMutation = useMutation({ mutationFn: ({ id, d }) => base44.entities.ResourceForecast.update(id, d), onSuccess: invalidate });
  const deleteMutation = useMutation({ mutationFn: id => base44.entities.ResourceForecast.delete(id), onSuccess: invalidate });

  const openCreate = () => { setEditing(null); setReqSkills([]); setAssigneeIds([]); setDialog(true); };
  const openEdit = (f) => { setEditing(f); setReqSkills(f.required_skills || []); setAssigneeIds(f.assigned_user_ids || []); setDialog(true); };

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = {
      title: fd.get('title'),
      project_id: fd.get('project_id'),
      required_hours: Number(fd.get('required_hours')) || 0,
      headcount: Number(fd.get('headcount')) || 1,
      start_date: fd.get('start_date'),
      end_date: fd.get('end_date'),
      priority: fd.get('priority'),
      status: fd.get('status'),
      notes: fd.get('notes'),
      required_skills: reqSkills,
      assigned_user_ids: assigneeIds,
    };
    if (editing) {
      updateMutation.mutate({ id: editing.id, d: data });
    } else {
      createMutation.mutate(data);
    }
    setDialog(false);
  };

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !reqSkills.includes(s)) setReqSkills(prev => [...prev, s]);
    setSkillInput('');
  };

  const toggleAssignee = (uid) => {
    setAssigneeIds(prev => prev.includes(uid) ? prev.filter(i => i !== uid) : [...prev, uid]);
  };

  // Find users that match required skills for suggestions
  const getSuggestions = (forecast) => {
    if (!forecast?.required_skills?.length) return [];
    return users.filter(u => {
      const profile = profiles.find(p => p.user_id === u.id);
      return forecast.required_skills.some(skill =>
        profile?.skills?.some(s => s.name.toLowerCase().includes(skill.toLowerCase()))
      );
    }).slice(0, 4);
  };

  return (
    <>
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Resource Forecasting</CardTitle>
            <CardDescription>Plan ahead — identify future resource needs and gaps</CardDescription>
          </div>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" /> New Forecast
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {forecasts.length === 0 ? (
            <p className="text-center text-slate-400 py-10 text-sm">
              No forecasts yet — create one to plan upcoming resource needs.
            </p>
          ) : forecasts.map(f => {
            const project = projects.find(p => p.id === f.project_id);
            const assigned = (f.assigned_user_ids || []).map(id => users.find(u => u.id === id)).filter(Boolean);
            const suggestions = getSuggestions(f);
            const fillRate = f.headcount > 0 ? Math.round((assigned.length / f.headcount) * 100) : 0;

            return (
              <div key={f.id} className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-slate-900">{f.title}</h3>
                    {project && <p className="text-sm text-slate-500">{project.name}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={cn("border-0 text-xs", PRIORITY_COLORS[f.priority])}>{f.priority}</Badge>
                    <Badge className={cn("border-0 text-xs", STATUS_COLORS[f.status])}>{f.status?.replace(/_/g,' ')}</Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(f)}>
                          <Pencil className="h-4 w-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => deleteMutation.mutate(f.id)}>
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500 mb-3">
                  {f.start_date && f.end_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {format(parseISO(f.start_date), 'MMM d')} – {format(parseISO(f.end_date), 'MMM d')}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {assigned.length}/{f.headcount} assigned
                  </span>
                  {f.required_hours > 0 && <span>{f.required_hours}h needed</span>}
                </div>

                {f.required_skills?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {f.required_skills.map(s => (
                      <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                    ))}
                  </div>
                )}

                {/* Fill bar */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                    <div
                      className={cn("h-1.5 rounded-full", fillRate >= 100 ? 'bg-emerald-500' : fillRate > 0 ? 'bg-amber-400' : 'bg-slate-300')}
                      style={{ width: `${Math.min(fillRate, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 shrink-0">{fillRate}% filled</span>
                </div>

                {/* Assigned + suggestions */}
                <div className="flex items-center gap-2 flex-wrap">
                  {assigned.map(u => (
                    <div key={u.id} title={u.full_name}>
                      <Avatar name={u.full_name} email={u.email} size="sm" />
                    </div>
                  ))}
                  {assigned.length === 0 && suggestions.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <span>Suggested:</span>
                      {suggestions.map(u => (
                        <div key={u.id} title={`${u.full_name} (skill match)`} className="opacity-60 hover:opacity-100">
                          <Avatar name={u.full_name} email={u.email} size="sm" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Forecast' : 'New Resource Forecast'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input name="title" required defaultValue={editing?.title} placeholder="e.g. Q2 Engine Developers" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Project</Label>
                <Select name="project_id" defaultValue={editing?.project_id || ''} required>
                  <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                  <SelectContent>
                    {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Headcount Needed</Label>
                <Input name="headcount" type="number" min="1" defaultValue={editing?.headcount || 1} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input name="start_date" type="date" defaultValue={editing?.start_date} />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input name="end_date" type="date" defaultValue={editing?.end_date} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Required Hours</Label>
                <Input name="required_hours" type="number" defaultValue={editing?.required_hours || ''} placeholder="160" />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select name="priority" defaultValue={editing?.priority || 'medium'}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['low','medium','high','critical'].map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select name="status" defaultValue={editing?.status || 'open'}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="partially_filled">Partially Filled</SelectItem>
                    <SelectItem value="filled">Filled</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Required skills */}
            <div className="space-y-2">
              <Label>Required Skills</Label>
              <div className="flex gap-2">
                <Input value={skillInput} onChange={e => setSkillInput(e.target.value)}
                  placeholder="e.g. Unity, Unreal, C++"
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())} />
                <Button type="button" size="icon" variant="outline" onClick={addSkill}><Plus className="h-4 w-4" /></Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {reqSkills.map(s => (
                  <Badge key={s} variant="secondary" className="gap-1 pr-1">
                    {s}
                    <button type="button" onClick={() => setReqSkills(p => p.filter(x => x !== s))}><X className="h-3 w-3" /></button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Assign members */}
            <div className="space-y-2">
              <Label>Assign Team Members</Label>
              <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-lg max-h-36 overflow-y-auto">
                {users.map(u => (
                  <button key={u.id} type="button"
                    onClick={() => toggleAssignee(u.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs border transition-colors",
                      assigneeIds.includes(u.id)
                        ? 'bg-violet-600 text-white border-violet-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-violet-400'
                    )}>
                    <Avatar name={u.full_name} email={u.email} size="sm" className="h-4 w-4 text-[8px]" />
                    {u.full_name?.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea name="notes" defaultValue={editing?.notes} rows={2} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
              <Button type="submit">{editing ? 'Save' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
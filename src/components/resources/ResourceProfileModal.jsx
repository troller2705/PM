import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';

const SKILL_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'];

export default function ResourceProfileModal({ open, onOpenChange, user, profile, departments, onSave }) {
  const [skills, setSkills] = useState(profile?.skills || []);
  const [skillInput, setSkillInput] = useState('');
  const [skillLevel, setSkillLevel] = useState('intermediate');

  useEffect(() => {
    setSkills(profile?.skills || []);
  }, [profile, open]);

  const addSkill = () => {
    const name = skillInput.trim();
    if (!name || skills.find(s => s.name.toLowerCase() === name.toLowerCase())) return;
    setSkills(prev => [...prev, { name, level: skillLevel }]);
    setSkillInput('');
  };

  const removeSkill = (name) => setSkills(prev => prev.filter(s => s.name !== name));

  const updateSkillLevel = (name, level) => {
    setSkills(prev => prev.map(s => s.name === name ? { ...s, level } : s));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    onSave({
      user_id: user.id,
      title: fd.get('title'),
      department_id: fd.get('department_id') || null,
      availability_hours_per_week: Number(fd.get('availability_hours_per_week')) || 40,
      cost_per_hour: fd.get('cost_per_hour') ? Number(fd.get('cost_per_hour')) : null,
      time_zone: fd.get('time_zone'),
      status: fd.get('status'),
      notes: fd.get('notes'),
      skills,
    });
  };

  const levelColors = {
    beginner: 'bg-slate-100 text-slate-600',
    intermediate: 'bg-blue-100 text-blue-700',
    advanced: 'bg-violet-100 text-violet-700',
    expert: 'bg-emerald-100 text-emerald-700',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Resource Profile — {user?.full_name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Job Title</Label>
              <Input name="title" defaultValue={profile?.title} placeholder="e.g. Senior Developer" />
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Select name="department_id" defaultValue={profile?.department_id || ''}>
                <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Capacity (hrs/week)</Label>
              <Input name="availability_hours_per_week" type="number" defaultValue={profile?.availability_hours_per_week || 40} />
            </div>
            <div className="space-y-2">
              <Label>Cost per Hour ($)</Label>
              <Input name="cost_per_hour" type="number" step="0.01" defaultValue={profile?.cost_per_hour} placeholder="0.00" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Time Zone</Label>
              <Input name="time_zone" defaultValue={profile?.time_zone} placeholder="UTC+0" />
            </div>
            <div className="space-y-2">
              <Label>Availability Status</Label>
              <Select name="status" defaultValue={profile?.status || 'available'}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="partially_available">Partially Available</SelectItem>
                  <SelectItem value="fully_allocated">Fully Allocated</SelectItem>
                  <SelectItem value="on_leave">On Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Skills */}
          <div className="space-y-2">
            <Label>Skills</Label>
            <div className="flex gap-2">
              <Input
                value={skillInput}
                onChange={e => setSkillInput(e.target.value)}
                placeholder="e.g. Unreal Engine"
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                className="flex-1"
              />
              <Select value={skillLevel} onValueChange={setSkillLevel}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SKILL_LEVELS.map(l => <SelectItem key={l} value={l} className="capitalize">{l}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button type="button" size="icon" variant="outline" onClick={addSkill}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2 p-3 bg-slate-50 rounded-lg">
                {skills.map(s => (
                  <div key={s.name} className="flex items-center gap-1">
                    <Badge className={`${levelColors[s.level] || ''} border-0 gap-1 pr-1`}>
                      {s.name}
                      <Select value={s.level} onValueChange={lvl => updateSkillLevel(s.name, lvl)}>
                        <SelectTrigger className="h-4 w-4 border-0 p-0 bg-transparent shadow-none">
                          <span className="text-xs opacity-70">▾</span>
                        </SelectTrigger>
                        <SelectContent>
                          {SKILL_LEVELS.map(l => <SelectItem key={l} value={l} className="capitalize text-xs">{l}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <button type="button" onClick={() => removeSkill(s.name)} className="hover:text-red-500 ml-0.5">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea name="notes" defaultValue={profile?.notes} rows={2} placeholder="Availability notes, preferences…" />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Save Profile</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
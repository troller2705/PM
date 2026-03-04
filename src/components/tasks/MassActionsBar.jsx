import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, CheckSquare } from 'lucide-react';

const STATUSES = ['backlog', 'todo', 'in_progress', 'review', 'testing', 'done', 'blocked'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];

export default function MassActionsBar({ selectedIds, users, onBulkUpdate, onBulkDelete, onClear }) {
  if (selectedIds.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl">
      <div className="flex items-center gap-2 mr-2">
        <CheckSquare className="h-4 w-4 text-violet-400" />
        <span className="text-sm font-medium">{selectedIds.length} selected</span>
      </div>

      <Select onValueChange={val => onBulkUpdate({ status: val })}>
        <SelectTrigger className="h-8 bg-slate-800 border-slate-700 text-white text-xs w-36">
          <SelectValue placeholder="Set Status" />
        </SelectTrigger>
        <SelectContent>
          {STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, ' ')}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select onValueChange={val => onBulkUpdate({ priority: val })}>
        <SelectTrigger className="h-8 bg-slate-800 border-slate-700 text-white text-xs w-32">
          <SelectValue placeholder="Set Priority" />
        </SelectTrigger>
        <SelectContent>
          {PRIORITIES.map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select onValueChange={val => onBulkUpdate({ assignee_id: val })}>
        <SelectTrigger className="h-8 bg-slate-800 border-slate-700 text-white text-xs w-36">
          <SelectValue placeholder="Set Assignee" />
        </SelectTrigger>
        <SelectContent>
          {users.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>)}
        </SelectContent>
      </Select>

      <Button
        size="sm"
        variant="destructive"
        className="h-8 text-xs"
        onClick={onBulkDelete}
      >
        Delete
      </Button>

      <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-white" onClick={onClear}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
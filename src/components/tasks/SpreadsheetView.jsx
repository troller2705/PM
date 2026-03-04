import React, { useState } from 'react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StatusBadge from '@/components/common/StatusBadge';
import Avatar from '@/components/common/Avatar';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUSES = ['backlog', 'todo', 'in_progress', 'review', 'testing', 'done', 'blocked'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];

export default function SpreadsheetView({ tasks, users, projects, selectedIds, onSelectIds, onUpdate, onDelete, onEdit }) {
  const [editingCell, setEditingCell] = useState(null); // { taskId, field }
  const [cellValue, setCellValue] = useState('');

  const getUserName = (id) => users.find(u => u.id === id)?.full_name || '—';
  const getProjectName = (id) => projects.find(p => p.id === id)?.name || '—';

  const startEdit = (taskId, field, currentValue) => {
    setEditingCell({ taskId, field });
    setCellValue(currentValue || '');
  };

  const commitEdit = (task) => {
    if (!editingCell) return;
    onUpdate(task.id, { [editingCell.field]: cellValue });
    setEditingCell(null);
  };

  const isEditing = (taskId, field) => editingCell?.taskId === taskId && editingCell?.field === field;

  const allSelected = tasks.length > 0 && tasks.every(t => selectedIds.includes(t.id));
  const toggleAll = () => onSelectIds(allSelected ? [] : tasks.map(t => t.id));
  const toggleOne = (id) => onSelectIds(selectedIds.includes(id) ? selectedIds.filter(i => i !== id) : [...selectedIds, id]);

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-x-auto">
      <table className="w-full text-sm min-w-[900px]">
        <thead>
          <tr className="border-b bg-slate-50 text-slate-600 font-medium">
            <th className="p-3 w-8">
              <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
            </th>
            <th className="p-3 text-left">Title</th>
            <th className="p-3 text-left w-28">Status</th>
            <th className="p-3 text-left w-24">Priority</th>
            <th className="p-3 text-left w-36">Project</th>
            <th className="p-3 text-left w-32">Assignee</th>
            <th className="p-3 text-left w-28">Due Date</th>
            <th className="p-3 text-left w-20">Hours</th>
            <th className="p-3 w-16"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {tasks.map(task => (
            <tr key={task.id} className={cn("hover:bg-slate-50 group", selectedIds.includes(task.id) && "bg-violet-50")}>
              <td className="p-3">
                <Checkbox checked={selectedIds.includes(task.id)} onCheckedChange={() => toggleOne(task.id)} />
              </td>

              {/* Title */}
              <td className="p-3 max-w-xs" onDoubleClick={() => startEdit(task.id, 'title', task.title)}>
                {isEditing(task.id, 'title') ? (
                  <div className="flex gap-1">
                    <Input value={cellValue} onChange={e => setCellValue(e.target.value)} className="h-7 text-sm" autoFocus
                      onKeyDown={e => { if (e.key === 'Enter') commitEdit(task); if (e.key === 'Escape') setEditingCell(null); }} />
                    <Button size="icon" className="h-7 w-7" onClick={() => commitEdit(task)}><Check className="h-3 w-3" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingCell(null)}><X className="h-3 w-3" /></Button>
                  </div>
                ) : (
                  <span className="font-medium text-slate-900 truncate block cursor-text" title="Double-click to edit">{task.title}</span>
                )}
              </td>

              {/* Status */}
              <td className="p-3">
                <Select value={task.status} onValueChange={val => onUpdate(task.id, { status: val })}>
                  <SelectTrigger className="h-7 text-xs border-0 shadow-none p-0 hover:bg-slate-100 rounded px-2">
                    <StatusBadge status={task.status} />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, ' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
              </td>

              {/* Priority */}
              <td className="p-3">
                <Select value={task.priority} onValueChange={val => onUpdate(task.id, { priority: val })}>
                  <SelectTrigger className="h-7 text-xs border-0 shadow-none p-0 hover:bg-slate-100 rounded px-2">
                    <StatusBadge status={task.priority} />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </td>

              <td className="p-3 text-slate-600 truncate max-w-[140px]">{getProjectName(task.project_id)}</td>

              <td className="p-3">
                {task.assignee_id ? (
                  <div className="flex items-center gap-2">
                    <Avatar name={getUserName(task.assignee_id)} size="sm" />
                    <span className="text-xs text-slate-600 truncate">{getUserName(task.assignee_id)}</span>
                  </div>
                ) : <span className="text-slate-400">—</span>}
              </td>

              {/* Due Date */}
              <td className="p-3" onDoubleClick={() => startEdit(task.id, 'due_date', task.due_date)}>
                {isEditing(task.id, 'due_date') ? (
                  <div className="flex gap-1">
                    <Input type="date" value={cellValue} onChange={e => setCellValue(e.target.value)} className="h-7 text-xs" autoFocus
                      onKeyDown={e => { if (e.key === 'Enter') commitEdit(task); if (e.key === 'Escape') setEditingCell(null); }} />
                    <Button size="icon" className="h-7 w-7" onClick={() => commitEdit(task)}><Check className="h-3 w-3" /></Button>
                  </div>
                ) : (
                  <span className="text-slate-600 cursor-text">{task.due_date ? format(new Date(task.due_date), 'MMM d, yyyy') : '—'}</span>
                )}
              </td>

              {/* Hours */}
              <td className="p-3 text-slate-600">{task.estimated_hours || '—'}</td>

              <td className="p-3">
                <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(task)}><Pencil className="h-3 w-3" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => onDelete(task.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {tasks.length === 0 && (
        <div className="py-16 text-center text-slate-400">No tasks found</div>
      )}
    </div>
  );
}
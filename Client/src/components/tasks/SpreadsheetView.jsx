import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import StatusBadge from '@/components/common/StatusBadge';
import Avatar from '@/components/common/Avatar';
import { Pencil, Trash2, Check, X, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUSES = ['backlog', 'todo', 'in_progress', 'review', 'testing', 'done', 'blocked'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];

const formatLocalDate = (isoString, formatStr = 'MMM d, yyyy') => {
  if (!isoString) return '-';
  // Split the string at 'T' to grab just the YYYY-MM-DD, then force it to local noon
  return format(new Date(isoString.split('T')[0] + 'T12:00:00'), formatStr);
};

const TaskRow = ({ task, depth, users, projects, selectedIds, onSelect, onUpdate, onDelete, onEdit, isEditing, startEdit, commitEdit, setCellValue, cellValue, toggleCollapse, collapsedRows }) => {
  const taskId = task._id || task.id; // <-- Safely extract the MongoDB ID
  const getUserName = (id) => users.find(u => (u._id || u.id) === id)?.full_name || '—';
  const getProjectName = (id) => projects.find(p => (p._id || p.id) === id)?.name || '—';
  const isParent = task.children && task.children.length > 0;
  const isCollapsed = collapsedRows.has(taskId);

  const totalHours = useMemo(() => {
    if (!isParent) return task.estimated_hours;
    const calc = (t) => (t.estimated_hours || 0) + t.children.reduce((sum, child) => sum + calc(child), 0);
    return calc(task);
  }, [task, isParent]);

  return (
      <>
        <tr className={cn("hover:bg-slate-50 group", selectedIds.includes(taskId) && "bg-violet-50", isParent && "bg-slate-50 font-medium")}>
          <td className="p-3">
            <Checkbox checked={selectedIds.includes(taskId)} onCheckedChange={() => onSelect(taskId)} />
          </td>

          {/* Title */}
          <td className="p-3 max-w-xs">
            <div className="flex items-center gap-1" style={{ paddingLeft: `${depth * 24}px` }}>
              {isParent ? (
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleCollapse(taskId)}>
                    {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
              ) : <div className="w-6 h-6 shrink-0" />}

              {isEditing(taskId, 'title') ? (
                  <div className="flex gap-1 w-full">
                    <Input value={cellValue} onChange={e => setCellValue(e.target.value)} className="h-7 text-sm" autoFocus
                           onKeyDown={e => { if (e.key === 'Enter') commitEdit(task); if (e.key === 'Escape') startEdit(null); }} />
                    <Button size="icon" className="h-7 w-7" onClick={() => commitEdit(task)}><Check className="h-3 w-3" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(null)}><X className="h-3 w-3" /></Button>
                  </div>
              ) : (
                  <span className="truncate block cursor-text" title="Double-click to edit" onDoubleClick={() => startEdit(taskId, 'title', task.title)}>
                {task.title}
              </span>
              )}
            </div>
          </td>

          {/* Status */}
          <td className="p-3">
            <Select value={task.status} onValueChange={val => onUpdate(taskId, { status: val })}>
              <SelectTrigger className="h-7 text-xs border-0 shadow-none p-0 hover:bg-slate-100 rounded px-2 data-[state=open]:ring-2">
                <StatusBadge status={task.status} />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, ' ')}</SelectItem>)}
              </SelectContent>
            </Select>
          </td>

          {/* Priority */}
          <td className="p-3">
            <Select value={task.priority} onValueChange={val => onUpdate(taskId, { priority: val })}>
              <SelectTrigger className="h-7 text-xs border-0 shadow-none p-0 hover:bg-slate-100 rounded px-2 data-[state=open]:ring-2">
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

          <td className="p-3 text-slate-600">{formatLocalDate(task.due_date)}</td>
          <td className="p-3 text-slate-600 font-mono text-right pr-6">{totalHours || '—'}</td>

          <td className="p-3">
            <div className="flex gap-1 opacity-0 group-hover:opacity-100">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(task)}><Pencil className="h-3 w-3" /></Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => onDelete(taskId)}><Trash2 className="h-3 w-3" /></Button>
            </div>
          </td>
        </tr>
        {!isCollapsed && isParent && task.children.map(child => {
          const childId = child._id || child.id;
          return (
              <TaskRow
                  key={childId}
                  {...{ task: child, depth: depth + 1, users, projects, selectedIds, onSelect, onUpdate, onDelete, onEdit, isEditing, startEdit, commitEdit, setCellValue, cellValue, toggleCollapse, collapsedRows }}
              />
          );
        })}
      </>
  );
};


export default function SpreadsheetView({ tasks, users, projects, selectedIds, onSelectIds, onUpdate, onDelete, onEdit }) {
  const [editingCell, setEditingCell] = useState(null); // { taskId, field }
  const [cellValue, setCellValue] = useState('');
  const [collapsedRows, setCollapsedRows] = useState(new Set());

  const hierarchicalTasks = useMemo(() => {
    // Safely map all tasks using their MongoDB _id
    const taskMap = new Map(tasks.map(t => [t._id || t.id, { ...t, children: [] }]));
    const roots = [];

    tasks.forEach(t => {
      const tId = t._id || t.id;
      if (t.parent_task_id && taskMap.has(t.parent_task_id)) {
        taskMap.get(t.parent_task_id).children.push(taskMap.get(tId));
      } else {
        roots.push(taskMap.get(tId));
      }
    });
    return roots.sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [tasks]);

  const startEdit = (taskId, field, currentValue) => {
    setEditingCell({ taskId, field });
    setCellValue(currentValue || '');
  };

  const commitEdit = (task) => {
    if (!editingCell) return;
    const taskId = task._id || task.id;
    onUpdate(taskId, { [editingCell.field]: cellValue });
    setEditingCell(null);
  };

  const isEditing = (taskId, field) => editingCell?.taskId === taskId && editingCell?.field === field;

  const toggleCollapse = (taskId) => {
    const newCollapsed = new Set(collapsedRows);
    if (newCollapsed.has(taskId)) newCollapsed.delete(taskId);
    else newCollapsed.add(taskId);
    setCollapsedRows(newCollapsed);
  };

  const allSelected = tasks.length > 0 && tasks.every(t => selectedIds.includes(t._id || t.id));
  const toggleAll = () => onSelectIds(allSelected ? [] : tasks.map(t => t._id || t.id));
  const toggleOne = (id) => onSelectIds(selectedIds.includes(id) ? selectedIds.filter(i => i !== id) : [...selectedIds, id]);

  return (
      <div className="bg-white rounded-xl border shadow-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
          <tr className="border-b bg-slate-50 text-slate-600 font-medium">
            <th className="p-3 w-8"><Checkbox checked={allSelected} onCheckedChange={toggleAll} /></th>
            <th className="p-3 text-left">Title</th>
            <th className="p-3 text-left w-28">Status</th>
            <th className="p-3 text-left w-24">Priority</th>
            <th className="p-3 text-left w-36">Project</th>
            <th className="p-3 text-left w-32">Assignee</th>
            <th className="p-3 text-left w-28">Due Date</th>
            <th className="p-3 text-right w-20 pr-6">Hours</th>
            <th className="p-3 w-16"></th>
          </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
          {hierarchicalTasks.map(task => {
            const taskId = task._id || task.id;
            return (
                <TaskRow
                    key={taskId}
                    task={task}
                    depth={0}
                    users={users}
                    projects={projects}
                    selectedIds={selectedIds}
                    onSelect={toggleOne}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    isEditing={isEditing}
                    startEdit={startEdit}
                    commitEdit={commitEdit}
                    setCellValue={setCellValue}
                    cellValue={cellValue}
                    toggleCollapse={toggleCollapse}
                    collapsedRows={collapsedRows}
                />
            );
          })}
          </tbody>
        </table>
        {tasks.length === 0 && (
            <div className="py-16 text-center text-slate-400">No tasks found</div>
        )}
      </div>
  );
}
import React from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import StatusBadge from '@/components/common/StatusBadge';
import Avatar from '@/components/common/Avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, Pencil, Trash2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const KANBAN_COLUMNS = [
  { id: 'backlog', name: 'Backlog', color: 'bg-slate-400' },
  { id: 'todo', name: 'To Do', color: 'bg-slate-500' },
  { id: 'in_progress', name: 'In Progress', color: 'bg-blue-500' },
  { id: 'review', name: 'Review', color: 'bg-purple-500' },
  { id: 'testing', name: 'Testing', color: 'bg-amber-500' },
  { id: 'done', name: 'Done', color: 'bg-emerald-500' },
];

const TYPE_COLORS = {
  bug: 'bg-red-100 text-red-700',
  feature: 'bg-blue-100 text-blue-700',
  improvement: 'bg-green-100 text-green-700',
  epic: 'bg-violet-100 text-violet-700',
  story: 'bg-indigo-100 text-indigo-700',
  task: 'bg-slate-100 text-slate-600',
};

function TaskCard({ task, index, getUser, onEdit, onDelete }) {
  const user = getUser(task.assignee_id);
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            "bg-white rounded-lg border border-slate-200 p-3 group select-none",
            "transition-shadow hover:shadow-md",
            snapshot.isDragging && "shadow-xl rotate-1 ring-2 ring-violet-400"
          )}
        >
          <div className="flex items-start justify-between mb-2">
            <Link to={createPageUrl(`TaskDetail?id=${task.id}`)}>
              <span className={cn("px-2 py-0.5 text-xs font-medium rounded", TYPE_COLORS[task.task_type] || 'bg-slate-100 text-slate-600')}>
                {task.task_type}
              </span>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(task)}><Pencil className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                <DropdownMenuItem className="text-red-600" onClick={() => onDelete(task.id)}><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Link to={createPageUrl(`TaskDetail?id=${task.id}`)}>
            <h3 className="text-sm font-medium text-slate-900 mb-2 line-clamp-2 hover:text-violet-600">{task.title}</h3>
          </Link>

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <StatusBadge status={task.priority} className="text-xs py-0" />
              {task.due_date && (
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {format(new Date(task.due_date), 'MMM d')}
                </span>
              )}
            </div>
            {user && <Avatar name={user.full_name} email={user.email} size="sm" />}
          </div>
        </div>
      )}
    </Draggable>
  );
}

export default function KanbanBoard({ tasks, users, onStatusChange, onEdit, onDelete }) {
  const getUser = (id) => users.find(u => u.id === id);

  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    if (destination.droppableId !== source.droppableId) {
      const task = tasks.find(t => t.id === draggableId);
      if (task) onStatusChange(task, destination.droppableId);
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {KANBAN_COLUMNS.map(column => {
            const columnTasks = tasks.filter(t => t.status === column.id);
            return (
              <div key={column.id} className="w-72 flex-shrink-0">
                <div className="flex items-center gap-2 mb-3">
                  <div className={cn("w-3 h-3 rounded-full", column.color)} />
                  <h3 className="font-medium text-slate-700">{column.name}</h3>
                  <Badge variant="secondary" className="ml-auto">{columnTasks.length}</Badge>
                </div>
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        "min-h-[calc(100vh-320px)] rounded-xl p-2 transition-colors",
                        snapshot.isDraggingOver ? "bg-violet-50 ring-2 ring-violet-200" : "bg-slate-50"
                      )}
                    >
                      <div className="space-y-3">
                        {columnTasks.map((task, index) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            index={index}
                            getUser={getUser}
                            onEdit={onEdit}
                            onDelete={onDelete}
                          />
                        ))}
                        {provided.placeholder}
                        {columnTasks.length === 0 && !snapshot.isDraggingOver && (
                          <div className="text-center py-8 text-slate-400 text-sm">No tasks</div>
                        )}
                      </div>
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </div>
    </DragDropContext>
  );
}
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import StatusBadge from '@/components/common/StatusBadge';
import Avatar from '@/components/common/Avatar';
import { Badge } from '@/components/ui/badge';
import { format, differenceInDays } from 'date-fns';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProjectProgressTable({ projects, tasks, users }) {
  const projectData = projects.map(project => {
    const ptasks = tasks.filter(t => t.project_id === project.id);
    const done = ptasks.filter(t => t.status === 'done').length;
    const blocked = ptasks.filter(t => t.status === 'blocked').length;
    const progress = ptasks.length > 0 ? Math.round((done / ptasks.length) * 100) : 0;
    const lead = users.find(u => u.id === project.lead_id);
    const daysLeft = project.target_date
      ? differenceInDays(new Date(project.target_date), new Date())
      : null;
    const isOverdue = daysLeft !== null && daysLeft < 0;
    const isAtRisk = daysLeft !== null && daysLeft < 14 && progress < 80;

    return { project, ptasks, done, blocked, progress, lead, daysLeft, isOverdue, isAtRisk };
  });

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle>Project Progress Overview</CardTitle>
        <CardDescription>Status and completion across all active projects</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left p-4 font-medium text-slate-600">Project</th>
                <th className="text-left p-4 font-medium text-slate-600">Status</th>
                <th className="text-left p-4 font-medium text-slate-600 w-44">Progress</th>
                <th className="text-center p-4 font-medium text-slate-600">Tasks</th>
                <th className="text-center p-4 font-medium text-slate-600">Blocked</th>
                <th className="text-left p-4 font-medium text-slate-600">Lead</th>
                <th className="text-left p-4 font-medium text-slate-600">Timeline</th>
                <th className="text-center p-4 font-medium text-slate-600">Health</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projectData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">No projects found</td>
                </tr>
              ) : projectData.map(({ project, ptasks, done, blocked, progress, lead, daysLeft, isOverdue, isAtRisk }) => (
                <tr key={project.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <p className="font-medium text-slate-900">{project.name}</p>
                    <p className="text-xs text-slate-400">{project.code}</p>
                  </td>
                  <td className="p-4"><StatusBadge status={project.status} /></td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Progress value={progress} className="h-2 flex-1" />
                      <span className="text-xs text-slate-600 w-8 text-right">{progress}%</span>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className="font-medium text-slate-700">{done}</span>
                    <span className="text-slate-400">/{ptasks.length}</span>
                  </td>
                  <td className="p-4 text-center">
                    {blocked > 0 ? (
                      <Badge className="bg-red-100 text-red-700 border-0">{blocked}</Badge>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="p-4">
                    {lead ? (
                      <div className="flex items-center gap-2">
                        <Avatar name={lead.full_name} email={lead.email} size="sm" />
                        <span className="text-slate-700 truncate max-w-[80px]">{lead.full_name?.split(' ')[0]}</span>
                      </div>
                    ) : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="p-4">
                    {daysLeft !== null ? (
                      <span className={cn("text-sm", isOverdue ? "text-red-600 font-medium" : isAtRisk ? "text-amber-600" : "text-slate-600")}>
                        {isOverdue ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                      </span>
                    ) : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="p-4 text-center">
                    {isOverdue ? (
                      <span title="Overdue"><AlertTriangle className="h-4 w-4 text-red-500 mx-auto" /></span>
                    ) : isAtRisk ? (
                      <span title="At Risk"><Clock className="h-4 w-4 text-amber-500 mx-auto" /></span>
                    ) : (
                      <span title="On Track"><CheckCircle className="h-4 w-4 text-emerald-500 mx-auto" /></span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
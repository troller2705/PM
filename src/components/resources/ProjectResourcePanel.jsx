import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/api/apiClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Avatar from '@/components/common/Avatar';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { Sparkles, ExternalLink, Users, AlertTriangle, CheckCircle, TrendingUp, Loader2 } from 'lucide-react';

const STATUS_COLORS = {
  open: 'bg-slate-100 text-slate-600',
  partially_filled: 'bg-amber-100 text-amber-700',
  filled: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-gray-100 text-gray-400',
};

export default function ProjectResourcePanel({ project, tasks, milestones }) {
  const [generating, setGenerating] = useState(false);
  const queryClient = useQueryClient();

  const { data: forecasts = [], isLoading: forecastsLoading } = useQuery({
    queryKey: ['projectForecasts', project.id],
    queryFn: () => db.resourceForecasts.filter({ project_id: project.id }),
    enabled: !!project.id,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => db.users.list(),
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['resourceProfiles'],
    queryFn: () => db.resourceProfiles.list(),
  });

  const { data: allTasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => db.tasks.list('-created_date', 500),
  });

  const createMutation = useMutation({
    mutationFn: (data) => db.resourceForecasts.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projectForecasts', project.id] }),
  });

  // Workload impact: for each assigned user, how much of their weekly capacity does this project consume?
  const workloadImpact = useMemo(() => {
    const projectTasksByUser = {};
    tasks.forEach(t => {
      if (!t.assignee_id) return;
      if (!projectTasksByUser[t.assignee_id]) projectTasksByUser[t.assignee_id] = [];
      projectTasksByUser[t.assignee_id].push(t);
    });

    // also include forecast-assigned users
    const forecastUserIds = new Set(forecasts.flatMap(f => f.assigned_user_ids || []));
    const teamMemberIds = new Set([
      ...(project.team_member_ids || []),
      ...Object.keys(projectTasksByUser),
      ...forecastUserIds,
    ]);

    return [...teamMemberIds].map(userId => {
      const user = users.find(u => u.id === userId);
      if (!user) return null;
      const profile = profiles.find(p => p.user_id === userId);
      const capacity = profile?.availability_hours_per_week || 40;

      const projectHrs = (projectTasksByUser[userId] || [])
        .filter(t => t.status !== 'done')
        .reduce((s, t) => s + (t.estimated_hours || 8), 0);

      // total load across all projects
      const totalHrs = allTasks
        .filter(t => t.assignee_id === userId && t.status !== 'done')
        .reduce((s, t) => s + (t.estimated_hours || 8), 0);

      const projectPct = capacity > 0 ? Math.round((projectHrs / capacity) * 100) : 0;
      const totalPct = capacity > 0 ? Math.round((totalHrs / capacity) * 100) : 0;

      return { user, profile, projectHrs, totalHrs, capacity, projectPct, totalPct };
    }).filter(Boolean);
  }, [tasks, forecasts, users, profiles, allTasks, project]);

  // AI: pull scope & skills from project
  const handleAIPull = async () => {
    setGenerating(true);
    const prompt = `
You are a resource planning assistant for a game studio.

Given the following project info, extract resource forecasts — one per major skill area or phase.

Project name: ${project.name}
Description: ${project.description || 'No description provided'}
Status: ${project.status}
Start date: ${project.start_date || 'unknown'}
Target date: ${project.target_date || 'unknown'}
Milestones: ${milestones.map(m => m.name).join(', ') || 'none'}
Task types present: ${[...new Set(tasks.map(t => t.task_type))].join(', ') || 'none'}
Current tasks (sample): ${tasks.slice(0, 10).map(t => t.title).join('; ') || 'none'}

Generate 2–4 resource forecast objects. For each, output:
- title: short descriptive title
- required_skills: array of 1–4 skill strings
- headcount: number (1–5)
- required_hours: estimated total hours
- priority: one of low, medium, high, critical
- notes: one sentence rationale

Respond with a JSON array of forecast objects.
`;
    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          forecasts: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                required_skills: { type: 'array', items: { type: 'string' } },
                headcount: { type: 'number' },
                required_hours: { type: 'number' },
                priority: { type: 'string' },
                notes: { type: 'string' },
              },
            },
          },
        },
      },
    });

    const generated = result?.forecasts || [];
    for (const f of generated) {
      await createMutation.mutateAsync({
        ...f,
        project_id: project.id,
        status: 'open',
        ai_generated: true,
        start_date: project.start_date || null,
        end_date: project.target_date || null,
      });
    }
    setGenerating(false);
  };

  if (forecastsLoading) return <Skeleton className="h-64" />;

  return (
    <div className="space-y-6">
      {/* Workload Impact */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Team Workload Impact</CardTitle>
            <CardDescription>How this project loads each team member relative to total capacity</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to={createPageUrl('Resources?tab=workload')}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Full Heatmap
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {workloadImpact.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No team members assigned yet</p>
          ) : (
            <div className="space-y-3">
              {workloadImpact.map(({ user, profile, projectHrs, totalHrs, capacity, projectPct, totalPct }) => (
                <div key={user.id} className="flex items-center gap-3">
                  <Avatar name={user.full_name} email={user.email} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-800 truncate">{user.full_name}</span>
                      <span className="text-xs text-slate-500 ml-2 shrink-0">
                        {projectHrs}h project / {totalHrs}h total / {capacity}h cap
                      </span>
                    </div>
                    {/* Stacked bar: project portion on top of total */}
                    <div className="relative w-full bg-slate-100 rounded-full h-2">
                      {/* total bar */}
                      <div
                        className={cn("absolute left-0 top-0 h-2 rounded-full",
                          totalPct > 100 ? 'bg-red-300' : 'bg-slate-300'
                        )}
                        style={{ width: `${Math.min(totalPct, 100)}%` }}
                      />
                      {/* project portion */}
                      <div
                        className={cn("absolute left-0 top-0 h-2 rounded-full",
                          totalPct > 100 ? 'bg-red-500' : totalPct > 75 ? 'bg-amber-400' : 'bg-violet-500'
                        )}
                        style={{ width: `${Math.min(projectPct, 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-violet-600">{projectPct}% this project</span>
                      {totalPct > 100 && (
                        <span className="text-xs text-red-500 flex items-center gap-0.5">
                          <AlertTriangle className="h-3 w-3" /> Overloaded
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Forecasts linked to this project */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle>Resource Forecasts</CardTitle>
            <CardDescription>Planned resource needs for this project</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAIPull}
              disabled={generating}
            >
              {generating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              {generating ? 'Generating…' : 'AI: Pull from Project'}
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to={createPageUrl('Resources?tab=forecast')}>
                <TrendingUp className="h-4 w-4 mr-2" />
                Manage All
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {forecasts.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-sm text-slate-400 mb-3">No resource forecasts for this project yet.</p>
              <Button variant="outline" size="sm" onClick={handleAIPull} disabled={generating}>
                <Sparkles className="h-4 w-4 mr-2" />
                Auto-generate from project description
              </Button>
            </div>
          ) : (
            forecasts.map(f => {
              const milestone = milestones.find(m => m.id === f.milestone_id);
              const linkedTasks = (f.task_ids || []).map(id => tasks.find(t => t.id === id)).filter(Boolean);
              const assigned = (f.assigned_user_ids || []).map(id => users.find(u => u.id === id)).filter(Boolean);
              const fillRate = f.headcount > 0 ? Math.round((assigned.length / f.headcount) * 100) : 0;

              return (
                <div key={f.id} className="p-4 rounded-xl border border-slate-200">
                  <div className="flex items-start justify-between mb-2 flex-wrap gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900">{f.title}</h3>
                        {f.ai_generated && (
                          <Badge className="bg-violet-100 text-violet-700 border-0 text-xs gap-1">
                            <Sparkles className="h-3 w-3" /> AI
                          </Badge>
                        )}
                      </div>
                      {milestone && (
                        <p className="text-xs text-slate-500 mt-0.5">Phase: {milestone.name}</p>
                      )}
                    </div>
                    <Badge className={cn("border-0 text-xs", STATUS_COLORS[f.status])}>
                      {f.status?.replace(/_/g, ' ')}
                    </Badge>
                  </div>

                  {f.required_skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {f.required_skills.map(s => (
                        <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                      ))}
                    </div>
                  )}

                  {linkedTasks.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1">
                      {linkedTasks.slice(0, 3).map(t => (
                        <Badge key={t.id} variant="outline" className="text-xs">{t.title}</Badge>
                      ))}
                      {linkedTasks.length > 3 && (
                        <Badge variant="outline" className="text-xs">+{linkedTasks.length - 3} tasks</Badge>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                      <div
                        className={cn("h-1.5 rounded-full", fillRate >= 100 ? 'bg-emerald-500' : fillRate > 0 ? 'bg-amber-400' : 'bg-slate-300')}
                        style={{ width: `${Math.min(fillRate, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500 shrink-0">
                      <Users className="h-3 w-3 inline mr-0.5" />{assigned.length}/{f.headcount}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {assigned.map(u => (
                      <div key={u.id} title={u.full_name}>
                        <Avatar name={u.full_name} email={u.email} size="sm" />
                      </div>
                    ))}
                    {f.notes && (
                      <p className="text-xs text-slate-400 ml-auto italic">{f.notes}</p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
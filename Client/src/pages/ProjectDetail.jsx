import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { db } from '@/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import StatCard from '@/components/common/StatCard';
import StatusBadge from '@/components/common/StatusBadge';
import Avatar from '@/components/common/Avatar';
import EmptyState from '@/components/common/EmptyState';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, ListTodo, Clock, Users, Calendar, DollarSign, GitBranch, 
  Plus, UserPlus, MoreVertical, Pencil, Trash2, Target, CalendarRange, 
  GanttChartSquare, List, ArrowRight
} from 'lucide-react';
import ProjectResourcePanel from '@/components/resources/ProjectResourcePanel';
import GanttChart from '@/components/tasks/GanttChart';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format, differenceInDays } from 'date-fns';
import { cn } from "@/lib/utils";

export default function ProjectDetail() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('id');

  const [activeTab, setActiveTab] = useState('overview');
  const [milestoneView, setMilestoneView] = useState('list'); 
  const [memberDialog, setMemberDialog] = useState(false);
  const [milestoneDialog, setMilestoneDialog] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const queryClient = useQueryClient();

  const { data: project, isLoading: projectLoading } = useQuery({ queryKey: ['project', projectId], queryFn: () => db.projects.get(projectId), enabled: !!projectId });
  const { data: tasks = [] } = useQuery({ queryKey: ['projectTasks', projectId], queryFn: async () => { const allTasks = await db.tasks.list(); return allTasks.filter(t => t.project_id === projectId); }, enabled: !!projectId });
  const { data: milestones = [] } = useQuery({ queryKey: ['projectMilestones', projectId], queryFn: async () => { if (!db.milestones) return []; const allMilestones = await db.milestones.list(); return allMilestones.filter(m => m.project_id === projectId); }, enabled: !!projectId });
  const { data: allDependencies = [] } = useQuery({ queryKey: ['taskDependencies'], queryFn: () => db.taskDependencies.list() });
  const { data: repositories = [] } = useQuery({ queryKey: ['projectRepos', projectId], queryFn: async () => { if (!db.repositories) return []; const allRepos = await db.repositories.list(); return allRepos.filter(r => r.project_id === projectId); }, enabled: !!projectId });
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: () => db.users.list() });
  const { data: timeLogs = [] } = useQuery({ queryKey: ['projectTimeLogs', projectId], queryFn: async () => { if (!db.timeLogs) return []; const allLogs = await db.timeLogs.list(); return allLogs.filter(l => l.project_id === projectId); }, enabled: !!projectId });
  const { data: budgets = [] } = useQuery({ queryKey: ['budgets'], queryFn: () => db.budgets.list() });
  const { data: expenses = [] } = useQuery({ queryKey: ['expenses'], queryFn: () => db.expenses.list() });

  const updateProjectMutation = useMutation({ mutationFn: (data) => db.projects.update(projectId, data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['project', projectId] }); setMemberDialog(false); } });
  const createMilestoneMutation = useMutation({ mutationFn: (data) => db.milestones ? db.milestones.create(data) : Promise.resolve(), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['projectMilestones', projectId] }); setMilestoneDialog(false); setEditingMilestone(null); } });
  const updateMilestoneMutation = useMutation({ mutationFn: ({ id, data }) => db.milestones.update(id, data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['projectMilestones', projectId] }); setMilestoneDialog(false); setEditingMilestone(null); } });
  const deleteMilestoneMutation = useMutation({ mutationFn: (id) => db.milestones.delete(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projectMilestones', projectId] }) });

  // Transforms milestones into Gantt blocks calculating duration using start_date & due_date
  const combinedGanttTasks = React.useMemo(() => {
    const milestoneTasks = milestones.map(m => {
      let estHours = 8;
      if (m.start_date && m.due_date) {
         const days = differenceInDays(new Date(m.due_date), new Date(m.start_date));
         estHours = Math.max(1, days) * 8; // 8 hours per day of span
      }
      return {
        id: `m_${m.id}`,
        title: `🚩 ${m.name}`,
        start_date: m.start_date || project?.start_date,
        due_date: m.due_date || project?.target_date,
        status: m.status,
        estimated_hours: estHours,
        task_type: 'epic',
        parent_task_id: null,
      };
    });
    
    // We want the tasks to visually live underneath their respective milestones on the Gantt chart if they are linked.
    const mappedTasks = tasks.map(t => {
      if (t.milestone_id) {
         return { ...t, parent_task_id: `m_${t.milestone_id}` };
      }
      return t;
    });

    return [...milestoneTasks, ...mappedTasks];
  }, [milestones, tasks, project]);

  if (projectLoading) return <div className="space-y-6 p-6"><Skeleton className="h-10 w-64" /><Skeleton className="h-96" /></div>;
  if (!project) return <EmptyState icon={Target} title="Project not found" description="The project you're looking for doesn't exist" />;

  const getUserById = (id) => users.find(u => u.id === id);
  const teamMembers = (project?.team_member_ids || []).map(id => getUserById(id)).filter(Boolean);
  const lead = getUserById(project?.lead_id);

  const taskStats = { total: tasks.length, done: tasks.filter(t => t.status === 'done').length, inProgress: tasks.filter(t => t.status === 'in_progress').length, blocked: tasks.filter(t => t.status === 'blocked').length };
  const progress = taskStats.total > 0 ? Math.round((taskStats.done / taskStats.total) * 100) : 0;
  const totalLogged = timeLogs.reduce((s, l) => s + (l.hours || 0), 0);
  const totalEstimated = tasks.reduce((s, t) => s + (t.estimated_hours || 0), 0);

  const linkedBudgets = budgets.filter(b => b.project_id === projectId);
  const totalBudget = (project?.budget || 0) + linkedBudgets.reduce((sum, b) => sum + (b.total_amount || 0), 0);
  const spent = expenses.filter(e => (e.project_id === projectId || linkedBudgets.map(b => b.id).includes(e.budget_id)) && e.status === 'paid').reduce((sum, e) => sum + (e.amount || 0), 0);
  const budgetProgress = totalBudget > 0 ? Math.min(Math.round((spent / totalBudget) * 100), 100) : 0;

  const handleAddMember = (e) => { e.preventDefault(); const fd = new FormData(e.target); updateProjectMutation.mutate({ team_member_ids: [...(project?.team_member_ids || []), fd.get('user_id')].filter((v, i, a) => a.indexOf(v) === i) }); };
  const handleRemoveMember = (userId) => updateProjectMutation.mutate({ team_member_ids: (project?.team_member_ids || []).filter(id => id !== userId) });

  const handleMilestoneSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      name: formData.get('name'),
      project_id: projectId,
      description: formData.get('description'),
      start_date: formData.get('start_date') || null, // Capture start date
      due_date: formData.get('due_date') || null,
      status: formData.get('status'),
    };
    editingMilestone ? updateMilestoneMutation.mutate({ id: editingMilestone.id, data }) : createMilestoneMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild><Link to={createPageUrl('Projects')}><ArrowLeft className="h-5 w-5" /></Link></Button>
        <div className="flex-1"><div className="flex items-center gap-3"><h1 className="text-2xl font-semibold text-slate-900">{project?.name}</h1><StatusBadge status={project?.status} /></div><p className="text-slate-500">{project?.code}</p></div>
        <Button variant="outline" asChild><Link to={createPageUrl(`Tasks?project=${projectId}`)}><ListTodo className="h-4 w-4 mr-2" /> View Tasks</Link></Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard title="Progress" value={`${progress}%`} icon={Target} subtitle={`${taskStats.done}/${taskStats.total} tasks`} />
        <StatCard title="Budget Spent" value={`$${spent.toLocaleString()}`} icon={DollarSign} subtitle={totalBudget > 0 ? `${budgetProgress}% of $${totalBudget.toLocaleString()}` : 'No budget set'} />
        <StatCard title="Team Size" value={teamMembers.length} icon={Users} />
        <StatCard title="Tasks In Progress" value={taskStats.inProgress} icon={Clock} />
        <StatCard title="Blocked" value={taskStats.blocked} icon={ListTodo} />
        <StatCard title="Time Logged" value={`${totalLogged}h`} icon={Clock} subtitle={totalEstimated > 0 ? `${totalEstimated}h est.` : 'No estimate'} />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="milestones">Milestones & Timeline</TabsTrigger>
          <TabsTrigger value="resources" className="gap-1"><CalendarRange className="h-4 w-4" />Resources</TabsTrigger>
          <TabsTrigger value="repos">Repositories</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border-0 shadow-sm">
              <CardHeader><CardTitle>Project Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {project?.description && (<div><p className="text-sm font-medium text-slate-500 mb-1">Description</p><p className="text-slate-700">{project?.description}</p></div>)}
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-sm font-medium text-slate-500 mb-1">Type</p><Badge variant="outline" className="capitalize">{project?.project_type}</Badge></div>
                  <div><p className="text-sm font-medium text-slate-500 mb-1">Priority</p><StatusBadge status={project?.priority} /></div>
                  <div><p className="text-sm font-medium text-slate-500 mb-1">Start Date</p><p className="text-slate-700">{project?.start_date ? format(new Date(project.start_date), 'MMM d, yyyy') : 'Not set'}</p></div>
                  <div><p className="text-sm font-medium text-slate-500 mb-1">Target Date</p><p className="text-slate-700">{project?.target_date ? format(new Date(project.target_date), 'MMM d, yyyy') : 'Not set'}</p></div>
                  <div><p className="text-sm font-medium text-slate-500 mb-1">Budget</p><p className="text-slate-700">{totalBudget > 0 ? `$${totalBudget.toLocaleString()}` : 'Not set'}</p></div>
                  <div><p className="text-sm font-medium text-slate-500 mb-1">Lead</p>{lead ? (<div className="flex items-center gap-2"><Avatar name={lead.full_name} email={lead.email} size="sm" /><span className="text-slate-700">{lead.full_name}</span></div>) : <p className="text-slate-500">Not assigned</p>}</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle>Task Breakdown</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between"><span className="text-sm text-slate-600">Progress</span><span className="text-sm font-medium">{progress}%</span></div>
                  <Progress value={progress} className="h-2" />
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    {[
                      { label: 'Backlog', count: tasks.filter(t => t.status === 'backlog').length, color: 'bg-slate-400' },
                      { label: 'To Do', count: tasks.filter(t => t.status === 'todo').length, color: 'bg-slate-500' },
                      { label: 'In Progress', count: taskStats.inProgress, color: 'bg-blue-500' },
                      { label: 'Review', count: tasks.filter(t => t.status === 'review').length, color: 'bg-purple-500' },
                      { label: 'Testing', count: tasks.filter(t => t.status === 'testing').length, color: 'bg-amber-500' },
                      { label: 'Done', count: taskStats.done, color: 'bg-emerald-500' },
                    ].map(item => (
                      <div key={item.label} className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", item.color)} />
                        <span className="text-sm text-slate-600">{item.label}</span>
                        <span className="text-sm font-medium ml-auto">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="team" className="mt-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Team Members</CardTitle><Button onClick={() => setMemberDialog(true)}><UserPlus className="h-4 w-4 mr-2" />Add Member</Button></CardHeader>
            <CardContent>
              {teamMembers.length === 0 ? (<p className="text-center text-slate-500 py-8">No team members yet</p>) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {teamMembers.map(member => (
                    <div key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                      <div className="flex items-center gap-3"><Avatar name={member.full_name} email={member.email} /><div><p className="font-medium text-slate-900">{member.full_name}</p><p className="text-sm text-slate-500">{member.email}</p></div></div>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRemoveMember(member.id)}><Trash2 className="h-4 w-4 text-slate-400 hover:text-red-500" /></Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="milestones" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <Tabs value={milestoneView} onValueChange={setMilestoneView} className="w-[200px]">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="list"><List className="h-4 w-4 mr-2" /> List</TabsTrigger>
                <TabsTrigger value="gantt"><GanttChartSquare className="h-4 w-4 mr-2" /> Timeline</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button onClick={() => { setEditingMilestone(null); setMilestoneDialog(true); }}><Plus className="h-4 w-4 mr-2" /> Add Milestone</Button>
          </div>

          {milestoneView === 'list' ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-0">
                {milestones.length === 0 ? (
                  <EmptyState icon={Target} title="No milestones yet" description="Add project milestones to track major deliverables." action={() => setMilestoneDialog(true)} actionLabel="Add Milestone" />
                ) : (
                  <div className="p-6 space-y-4">
                    {milestones.map(milestone => (
                      <div key={milestone.id} className="p-4 rounded-lg border border-slate-200">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium text-slate-900">{milestone.name}</h3>
                            {milestone.description && <p className="text-sm text-slate-600 mt-1">{milestone.description}</p>}
                          </div>
                          <div className="flex items-center gap-2">
                            <StatusBadge status={milestone.status} />
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => { setEditingMilestone(milestone); setMilestoneDialog(true); }}><Pencil className="h-4 w-4 mr-2" /> Edit</DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600" onClick={() => deleteMilestoneMutation.mutate(milestone.id)}><Trash2 className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        {(milestone.start_date || milestone.due_date) && (
                          <div className="flex items-center gap-1 mt-3 text-sm text-slate-500">
                            <Calendar className="h-4 w-4" />
                            {milestone.start_date ? format(new Date(milestone.start_date), 'MMM d, yyyy') : 'TBD'} 
                            <ArrowRight className="h-3 w-3 mx-1" /> 
                            {milestone.due_date ? format(new Date(milestone.due_date), 'MMM d, yyyy') : 'TBD'}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <GanttChart tasks={combinedGanttTasks} dependencies={allDependencies} users={users} />
          )}
        </TabsContent>

        <TabsContent value="resources" className="mt-6"><ProjectResourcePanel project={project} tasks={tasks} milestones={milestones} /></TabsContent>
        
        <TabsContent value="repos" className="mt-6">
          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle>Linked Repositories</CardTitle></CardHeader>
            <CardContent>
              {repositories.length === 0 ? (<p className="text-center text-slate-500 py-8">No repositories linked</p>) : (
                <div className="space-y-3">
                  {repositories.map(repo => (
                    <div key={repo.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                      <div className="flex items-center gap-3"><GitBranch className="h-5 w-5 text-slate-600" /><div><p className="font-medium text-slate-900">{repo.name}</p><p className="text-sm text-slate-500 font-mono">{repo.full_name}</p></div></div>
                      {repo.url && <Button variant="ghost" size="sm" asChild><a href={repo.url} target="_blank" rel="noopener noreferrer">Open</a></Button>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={memberDialog} onOpenChange={setMemberDialog}>
        <DialogContent className="max-w-md"><DialogHeader><DialogTitle>Add Team Member</DialogTitle></DialogHeader><form onSubmit={handleAddMember} className="space-y-4"><div className="space-y-2"><Label htmlFor="user_id">Select User</Label><Select name="user_id" required><SelectTrigger><SelectValue placeholder="Select a user" /></SelectTrigger><SelectContent>{users.filter(u => !(project?.team_member_ids || []).includes(u.id)).map(user => (<SelectItem key={user.id} value={user.id}>{user.full_name}</SelectItem>))}</SelectContent></Select></div><DialogFooter><Button type="button" variant="outline" onClick={() => setMemberDialog(false)}>Cancel</Button><Button type="submit">Add Member</Button></DialogFooter></form></DialogContent>
      </Dialog>

      <Dialog open={milestoneDialog} onOpenChange={setMilestoneDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingMilestone ? 'Edit Milestone' : 'Add Milestone'}</DialogTitle></DialogHeader>
          <form onSubmit={handleMilestoneSubmit} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="name">Name</Label><Input id="name" name="name" required defaultValue={editingMilestone?.name} /></div>
            <div className="space-y-2"><Label htmlFor="description">Description</Label><Input id="description" name="description" defaultValue={editingMilestone?.description} /></div>
            <div className="grid grid-cols-2 gap-4">
              {/* Added Start Date Field */}
              <div className="space-y-2"><Label htmlFor="start_date">Start Date</Label><Input id="start_date" name="start_date" type="date" defaultValue={editingMilestone?.start_date} /></div>
              <div className="space-y-2"><Label htmlFor="due_date">Due Date</Label><Input id="due_date" name="due_date" type="date" defaultValue={editingMilestone?.due_date} /></div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select name="status" defaultValue={editingMilestone?.status || 'pending'}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="missed">Missed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setMilestoneDialog(false)}>Cancel</Button><Button type="submit">{editingMilestone ? 'Save' : 'Create'}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
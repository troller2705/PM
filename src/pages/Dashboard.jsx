import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '../api/base44Client';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '../components/common/PageHeader';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import Avatar from '../components/common/Avatar';
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { Skeleton } from "../components/ui/skeleton";
import {
  FolderKanban,
  ListTodo,
  DollarSign,
  Users,
  TrendingUp,
  Clock,
  AlertCircle,
  ArrowRight,
  GitBranch,
} from 'lucide-react';

export default function Dashboard() {
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-created_date', 50),
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('-created_date', 100),
  });

  const { data: expenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => base44.entities.Expense.list('-created_date', 50),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const isLoading = projectsLoading || tasksLoading || expensesLoading;

  // Calculate stats
  const activeProjects = projects.filter(p => !['archived', 'maintenance'].includes(p.status)).length;
  const tasksInProgress = tasks.filter(t => t.status === 'in_progress').length;
  const pendingExpenses = expenses.filter(e => e.status === 'pending').length;
  const totalSpent = expenses.filter(e => e.status === 'paid').reduce((sum, e) => sum + (e.amount || 0), 0);

  const recentTasks = tasks.slice(0, 5);
  const recentProjects = projects.slice(0, 4);

  const getProjectProgress = (project) => {
    const projectTasks = tasks.filter(t => t.project_id === project.id);
    if (projectTasks.length === 0) return 0;
    const done = projectTasks.filter(t => t.status === 'done').length;
    return Math.round((done / projectTasks.length) * 100);
  };

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Dashboard" 
        subtitle="Welcome back! Here's what's happening."
        actions={
          <Button asChild>
            <Link to={createPageUrl('Projects')}>
              View All Projects
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Projects"
          value={isLoading ? <Skeleton className="h-8 w-16" /> : activeProjects}
          icon={FolderKanban}
          subtitle={`${projects.length} total`}
        />
        <StatCard
          title="Tasks In Progress"
          value={isLoading ? <Skeleton className="h-8 w-16" /> : tasksInProgress}
          icon={ListTodo}
          subtitle={`${tasks.length} total tasks`}
        />
        <StatCard
          title="Pending Expenses"
          value={isLoading ? <Skeleton className="h-8 w-16" /> : pendingExpenses}
          icon={Clock}
          subtitle="Awaiting approval"
        />
        <StatCard
          title="Total Spent"
          value={isLoading ? <Skeleton className="h-8 w-16" /> : `$${totalSpent.toLocaleString()}`}
          icon={DollarSign}
          trend="+12% this month"
          trendUp
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Projects */}
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Active Projects</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to={createPageUrl('Projects')}>View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {projectsLoading ? (
              [...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)
            ) : recentProjects.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No projects yet</p>
            ) : (
              recentProjects.map(project => (
                <Link 
                  key={project.id} 
                  to={createPageUrl(`ProjectDetail?id=${project.id}`)}
                  className="block p-4 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-slate-900">{project.name}</h3>
                      <p className="text-sm text-slate-500">{project.code}</p>
                    </div>
                    <StatusBadge status={project.status} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>Progress</span>
                      <span>{getProjectProgress(project)}%</span>
                    </div>
                    <Progress value={getProjectProgress(project)} className="h-2" />
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Tasks */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Recent Tasks</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to={createPageUrl('Tasks')}>View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {tasksLoading ? (
              [...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full mb-2" />)
            ) : recentTasks.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No tasks yet</p>
            ) : (
              <div className="space-y-3">
                {recentTasks.map(task => (
                  <div key={task.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50">
                    <div className={`w-2 h-2 rounded-full ${
                      task.status === 'done' ? 'bg-emerald-500' :
                      task.status === 'in_progress' ? 'bg-blue-500' :
                      task.status === 'blocked' ? 'bg-red-500' :
                      'bg-slate-300'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{task.title}</p>
                      <p className="text-xs text-slate-500">{task.project_id ? 'Project task' : 'Unassigned'}</p>
                    </div>
                    <StatusBadge status={task.priority} className="text-xs" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Team Overview */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-semibold">Team Overview</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to={createPageUrl('Team')}>Manage Team</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {users.slice(0, 8).map(user => (
              <div key={user.id} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50">
                <Avatar name={user.full_name} email={user.email} size="sm" />
                <div>
                  <p className="text-sm font-medium text-slate-900">{user.full_name}</p>
                  <p className="text-xs text-slate-500 capitalize">{user.role}</p>
                </div>
              </div>
            ))}
            {users.length > 8 && (
              <div className="flex items-center justify-center p-2 rounded-lg bg-slate-100 text-slate-600 text-sm">
                +{users.length - 8} more
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
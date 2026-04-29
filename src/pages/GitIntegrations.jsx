import React, { useState } from 'react';
import { db } from '../api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../components/common/PageHeader';
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Settings,
  GitBranch,
  Webhook,
  Send,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import Avatar from '@/components/common/Avatar';

export default function GitIntegrations() {
  const [activeTab, setActiveTab] = useState('simulator');
  const [webhookUser, setWebhookUser] = useState('');
  const [webhookCommit, setWebhookCommit] = useState('feat: new login page fixes #t1 time:3.5h');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: () => db.users.list() });
  const { data: tasks = [] } = useQuery({ queryKey: ['tasks'], queryFn: () => db.tasks.list() });
  const { data: resourceProfiles = [] } = useQuery({ queryKey: ['resourceProfiles'], queryFn: () => db.resourceProfiles.list() });

  const createTimeLogMutation = useMutation({
    mutationFn: (data) => db.timeLogs.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeLogs'] });
      toast({ title: "Webhook processed", description: "Time log created successfully." });
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Webhook failed", description: error.message });
    }
  });

  const handleWebhookSubmit = () => {
    const user = users.find(u => u.id === webhookUser);
    if (!user) {
      toast({ variant: "destructive", title: "Invalid User", description: "Please select a user." });
      return;
    }

    const taskIdMatch = webhookCommit.match(/#([a-zA-Z0-9-]+)/);
    const timeMatch = webhookCommit.match(/time:([0-9.]+)h/);

    if (!taskIdMatch) {
      toast({ variant: "destructive", title: "Invalid Commit", description: "Commit message must include a task ID (e.g., #PROJ-123)." });
      return;
    }

    const taskId = taskIdMatch[1];
    const hours = timeMatch ? parseFloat(timeMatch[1]) : 0;

    if (hours <= 0) {
      toast({ variant: "destructive", title: "Invalid Time", description: "Commit message must include a time entry (e.g., time:2.5h)." });
      return;
    }

    const task = tasks.find(t => t.id === taskId);
    if (!task) {
      toast({ variant: "destructive", title: "Task not found", description: `Task with ID "${taskId}" does not exist.` });
      return;
    }

    const profile = resourceProfiles.find(p => p.user_id === user.id);
    const rate = profile?.cost_per_hour || 0;

    const newTimeLog = {
      task_id: task.id,
      project_id: task.project_id,
      user_id: user.id,
      hours: hours,
      date: new Date().toISOString(),
      description: `Automated log from Git commit: ${webhookCommit.substring(0, 50)}...`,
      billable: true,
      applied_hourly_rate: rate,
    };

    createTimeLogMutation.mutate(newTimeLog);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Git Integrations"
        subtitle="Connect providers and simulate webhooks for automation"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="integrations" className="gap-2"><Settings className="h-4 w-4" /> Integrations</TabsTrigger>
          <TabsTrigger value="repositories" className="gap-2"><GitBranch className="h-4 w-4" /> Repositories</TabsTrigger>
          <TabsTrigger value="simulator" className="gap-2"><Webhook className="h-4 w-4" /> Webhook Simulator</TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="mt-6">
          <p>Integrations management UI would go here.</p>
        </TabsContent>

        <TabsContent value="repositories" className="mt-6">
          <p>Repository management UI would go here.</p>
        </TabsContent>

        <TabsContent value="simulator" className="mt-6">
          <Card className="border-0 shadow-sm max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Git Webhook Simulator</CardTitle>
              <CardDescription>
                Mimic a commit push from a developer to automatically log time and calculate labor cost against a task.
                The commit message must contain a task ID (e.g. <code className="bg-slate-100 px-1 rounded">#t1</code>) and a time log (e.g. <code className="bg-slate-100 px-1 rounded">time:2.5h</code>).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Committer</Label>
                <Select value={webhookUser} onValueChange={setWebhookUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a user to simulate..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center gap-2">
                          <Avatar name={user.full_name} size="sm" />
                          {user.full_name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Commit Message</Label>
                <Textarea
                  value={webhookCommit}
                  onChange={(e) => setWebhookCommit(e.target.value)}
                  placeholder="feat: new login page fixes #t1 time:3.5h"
                  rows={3}
                  className="font-mono"
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={handleWebhookSubmit} disabled={createTimeLogMutation.isPending}>
                  <Send className="h-4 w-4 mr-2" />
                  {createTimeLogMutation.isPending ? 'Processing...' : 'Fire Webhook'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
import React, { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';

export default function ScheduleReportModal({ open, onOpenChange, report, onSave }) {
  const [schedule, setSchedule] = useState(report?.schedule || 'weekly');
  const [recipients, setRecipients] = useState(report?.email_recipients || []);
  const [emailInput, setEmailInput] = useState('');

  const addEmail = () => {
    const email = emailInput.trim();
    if (email && !recipients.includes(email)) {
      setRecipients(prev => [...prev, email]);
      setEmailInput('');
    }
  };

  const removeEmail = (email) => setRecipients(prev => prev.filter(e => e !== email));

  const handleSave = () => {
    onSave({ schedule, email_recipients: recipients });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Report</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          <div className="space-y-2">
            <Label>Frequency</Label>
            <Select value={schedule} onValueChange={setSchedule}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Manual only</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly (Monday)</SelectItem>
                <SelectItem value="monthly">Monthly (1st)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Email Recipients</Label>
            <div className="flex gap-2">
              <Input
                placeholder="user@company.com"
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addEmail())}
              />
              <Button type="button" size="icon" variant="outline" onClick={addEmail}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {recipients.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {recipients.map(email => (
                  <Badge key={email} variant="secondary" className="gap-1 pr-1">
                    {email}
                    <button onClick={() => removeEmail(email)} className="hover:text-red-500">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <p className="text-xs text-slate-500">
              Recipients will receive an automated email with the report attached.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Schedule</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusColors = {
  // Project statuses
  planning: "bg-slate-100 text-slate-700",
  pre_production: "bg-blue-100 text-blue-700",
  production: "bg-indigo-100 text-indigo-700",
  alpha: "bg-purple-100 text-purple-700",
  beta: "bg-violet-100 text-violet-700",
  gold: "bg-amber-100 text-amber-700",
  live: "bg-emerald-100 text-emerald-700",
  maintenance: "bg-orange-100 text-orange-700",
  archived: "bg-gray-100 text-gray-500",
  
  // Task statuses
  backlog: "bg-slate-100 text-slate-600",
  todo: "bg-slate-100 text-slate-700",
  in_progress: "bg-blue-100 text-blue-700",
  review: "bg-purple-100 text-purple-700",
  testing: "bg-amber-100 text-amber-700",
  done: "bg-emerald-100 text-emerald-700",
  blocked: "bg-red-100 text-red-700",
  
  // Budget/Expense statuses
  draft: "bg-slate-100 text-slate-600",
  pending: "bg-amber-100 text-amber-700",
  pending_approval: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  paid: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-gray-100 text-gray-500",
  active: "bg-emerald-100 text-emerald-700",
  frozen: "bg-blue-100 text-blue-700",
  closed: "bg-gray-100 text-gray-500",
  
  // General
  inactive: "bg-gray-100 text-gray-500",
  disabled: "bg-gray-100 text-gray-500",
  error: "bg-red-100 text-red-700",
  
  // Priority
  low: "bg-slate-100 text-slate-600",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};

export default function StatusBadge({ status, className }) {
  const colorClass = statusColors[status] || "bg-slate-100 text-slate-600";
  const displayStatus = status?.replace(/_/g, ' ');
  
  return (
    <Badge className={cn("font-medium capitalize border-0", colorClass, className)}>
      {displayStatus}
    </Badge>
  );
}
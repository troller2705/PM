import React from 'react';
import { cn } from "@/lib/utils";

export default function PageHeader({ title, subtitle, actions, className }) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8", className)}>
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}
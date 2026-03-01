import React from 'react';
import { cn } from "@/lib/utils";

export default function Avatar({ name, email, size = "md", className }) {
  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
    xl: "h-16 w-16 text-lg"
  };

  const getInitials = () => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return '?';
  };

  const getColor = () => {
    const str = name || email || '';
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      "bg-blue-500", "bg-emerald-500", "bg-violet-500", 
      "bg-amber-500", "bg-rose-500", "bg-cyan-500",
      "bg-indigo-500", "bg-pink-500", "bg-teal-500"
    ];
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div 
      className={cn(
        "rounded-full flex items-center justify-center text-white font-medium",
        sizeClasses[size],
        getColor(),
        className
      )}
    >
      {getInitials()}
    </div>
  );
}
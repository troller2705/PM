import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Avatar from '@/components/common/Avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

const LEVEL_CONFIG = {
  beginner:     { label: 'B', color: 'bg-slate-200 text-slate-600', full: 'Beginner' },
  intermediate: { label: 'I', color: 'bg-blue-200 text-blue-700', full: 'Intermediate' },
  advanced:     { label: 'A', color: 'bg-violet-200 text-violet-700', full: 'Advanced' },
  expert:       { label: 'E', color: 'bg-emerald-200 text-emerald-800 font-bold', full: 'Expert' },
};

export default function SkillMatrix({ users, profiles }) {
  const [search, setSearch] = useState('');

  const { allSkills, rows } = useMemo(() => {
    const skillSet = new Set();
    profiles.forEach(p => p.skills?.forEach(s => skillSet.add(s.name)));
    const allSkills = [...skillSet].sort();

    const rows = users.map(user => {
      const profile = profiles.find(p => p.user_id === user.id);
      const skillMap = {};
      profile?.skills?.forEach(s => { skillMap[s.name] = s.level; });
      return { user, profile, skillMap };
    });

    return { allSkills, rows };
  }, [users, profiles]);

  const filteredSkills = search
    ? allSkills.filter(s => s.toLowerCase().includes(search.toLowerCase()))
    : allSkills;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <CardTitle>Skill Matrix</CardTitle>
            <CardDescription>Team competency overview across all skills</CardDescription>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter skills…"
              className="pl-9 h-8 w-48 text-sm"
            />
          </div>
        </div>
        {/* Legend */}
        <div className="flex gap-3 mt-2 flex-wrap">
          {Object.entries(LEVEL_CONFIG).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className={cn("w-5 h-5 rounded text-xs flex items-center justify-center", cfg.color)}>{cfg.label}</span>
              <span className="text-xs text-slate-500">{cfg.full}</span>
            </div>
          ))}
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        {filteredSkills.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-10">
            {allSkills.length === 0 ? 'No skills added yet — edit resource profiles to add skills.' : 'No skills match your search.'}
          </p>
        ) : (
          <table className="min-w-max w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left p-3 font-medium text-slate-600 w-44 sticky left-0 bg-slate-50">Member</th>
                {filteredSkills.map(skill => (
                  <th key={skill} className="p-3 font-medium text-slate-600 text-center whitespace-nowrap">
                    <span className="block">{skill}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map(({ user, skillMap }) => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="p-3 sticky left-0 bg-white">
                    <div className="flex items-center gap-2">
                      <Avatar name={user.full_name} email={user.email} size="sm" />
                      <span className="font-medium text-slate-800 truncate max-w-[100px]">{user.full_name?.split(' ')[0]}</span>
                    </div>
                  </td>
                  {filteredSkills.map(skill => {
                    const level = skillMap[skill];
                    const cfg = level ? LEVEL_CONFIG[level] : null;
                    return (
                      <td key={skill} className="p-3 text-center">
                        {cfg ? (
                          <span title={cfg.full} className={cn(
                            "inline-flex items-center justify-center w-7 h-7 rounded-full text-xs cursor-default select-none",
                            cfg.color
                          )}>
                            {cfg.label}
                          </span>
                        ) : (
                          <span className="text-slate-200">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
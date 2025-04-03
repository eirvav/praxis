'use client';

import { CircularProgress } from "./CircularProgress";

interface ModuleStatsProps {
  completionRate: number;
  submissions: number;
  avgCompletionTime: string;
}

export const ModuleStats = ({
  completionRate,
  submissions,
  avgCompletionTime,
}: ModuleStatsProps) => {
  return (
    <div className="grid grid-cols-3 divide-x bg-transparent">
      <div className="flex items-center justify-center px-4 py-1 bg-transparent">
        <div className="text-center">
        <p className="text-sm text-muted-foreground">Completed Course</p>
          <div className="flex justify-center mb-2">
            <CircularProgress value={completionRate} />
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-center px-4 py-1">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Submissions</p>
          <p className="text-2xl font-bold mb-1">{submissions}</p>
        </div>
      </div>
      
      <div className="flex items-center justify-center px-4 py-1">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Avg. Complete Time</p>
          <p className="text-2xl font-bold mb-1">{avgCompletionTime}</p>
        </div>
      </div>
    </div>
  );
}; 
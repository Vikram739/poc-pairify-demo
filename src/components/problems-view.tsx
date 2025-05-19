// src/components/problems-view.tsx
"use client";

import type React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from 'lucide-react';

export interface CodeProblem {
  line: number;
  rule: string;
  message: string;
}

interface ProblemsViewProps {
  problems: CodeProblem[];
  loading: boolean;
}

const ProblemsView: React.FC<ProblemsViewProps> = ({ problems, loading }) => {
  if (loading) {
    return (
      <div className="space-y-2 p-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    );
  }

  if (problems.length === 0) {
    return <p className="text-muted-foreground text-sm p-2">No problems detected. Keep up the good work!</p>;
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-2 p-1">
        {problems.map((problem, index) => (
          <div key={index} className="flex items-start gap-2 p-2 rounded-md border border-destructive/30 bg-destructive/10">
            <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
            <div className="text-xs">
              <p className="font-medium text-destructive">
                Line {problem.line}: <span className="font-normal text-foreground">{problem.message}</span>
              </p>
              <Badge variant="outline" className="mt-1 text-xs border-destructive/50 text-destructive">Rule: {problem.rule}</Badge>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

export default ProblemsView;

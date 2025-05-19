// src/components/documentation-view.tsx
"use client";

import type React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

interface DocumentationViewProps {
  documentation: string;
  loading: boolean;
}

const DocumentationView: React.FC<DocumentationViewProps> = ({ documentation, loading }) => {
  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    );
  }

  if (!documentation) {
    return <p className="text-muted-foreground text-sm">Relevant documentation will appear here as you type.</p>;
  }

  return (
    <ScrollArea className="h-full">
      <pre className="whitespace-pre-wrap font-mono text-sm p-1">{documentation}</pre>
    </ScrollArea>
  );
};

export default DocumentationView;

// src/components/suggestion-display.tsx
"use client";

import type React from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

interface SuggestionDisplayProps {
  suggestions: string[];
  onSelectSuggestion: (suggestion: string) => void;
  loading: boolean;
}

const SuggestionDisplay: React.FC<SuggestionDisplayProps> = ({ suggestions, onSelectSuggestion, loading }) => {
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    );
  }

  if (suggestions.length === 0) {
    return <p className="text-muted-foreground text-sm">No suggestions available. Keep typing!</p>;
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-2">
        {suggestions.map((suggestion, index) => (
          <Button
            key={index}
            variant="ghost"
            size="sm"
            className="w-full justify-start font-mono text-sm hover:bg-accent hover:text-accent-foreground"
            onClick={() => onSelectSuggestion(suggestion)}
            aria-label={`Select suggestion: ${suggestion}`}
          >
            {suggestion}
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
};

export default SuggestionDisplay;

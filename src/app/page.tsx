
// src/app/page.tsx
"use client";

import React, { useState, useCallback, useEffect, useRef } from 'react';
import CodeEditor from '@/components/code-editor';
import SuggestionDisplay from '@/components/suggestion-display';
import DocumentationView from '@/components/documentation-view';
import ProblemsView, { type CodeProblem } from '@/components/problems-view';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { debounce } from '@/lib/utils';
import { suggestCodeCompletions, SuggestCodeCompletionsInput } from '@/ai/flows/suggest-code-completions';
import { displayRelevantDocumentation, RelevantDocumentationInput } from '@/ai/flows/display-relevant-documentation';
import { Loader2, AlertTriangle } from 'lucide-react';
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
  type PanelApi,
} from "react-resizable-panels";
import {
  SidebarProvider,
  Sidebar, 
  SidebarContent, 
  SidebarTrigger,
  useSidebar, 
} from '@/components/ui/sidebar';


const AVAILABLE_LANGUAGES = [
  { value: 'typescript', label: 'TypeScript' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'csharp', label: 'C#' },
  { value: 'go', label: 'Go' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
];

const ICON_SIDEBAR_WIDTH_PERCENTAGE = 5; 
const DEFAULT_SIDEBAR_WIDTH_PERCENTAGE = 25; 


function CodeAssistPageComponent() {
  const [code, setCode] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [documentation, setDocumentation] = useState<string>('');
  const [rules, setRules] = useState<string[]>([]);
  const [codeProblems, setCodeProblems] = useState<CodeProblem[]>([]);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState<boolean>(false);
  const [isDocumentationLoading, setIsDocumentationLoading] = useState<boolean>(false);
  const [isProblemsLoading, setIsProblemsLoading] = useState<boolean>(false);
  const [language, setLanguage] = useState<string>(AVAILABLE_LANGUAGES[0].value);
  const { toast } = useToast();

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [prefixForCurrentSuggestions, setPrefixForCurrentSuggestions] = useState<string | null>(null);

  const sidebarContext = useSidebar();
  const sidebarPanelRef = useRef<PanelApi>(null);

  useEffect(() => {
    if (!isMounted || sidebarContext.isMobile || !sidebarPanelRef.current) {
      return;
    }
    if (sidebarContext.open) {
      sidebarPanelRef.current.expand();
    } else {
      sidebarPanelRef.current.collapse();
    }
  }, [sidebarContext.open, sidebarContext.isMobile, isMounted]);

  useEffect(() => {
    async function fetchRules() {
      if (!isMounted) return;
      setIsProblemsLoading(true);
      try {
        const response = await fetch('/rules.txt');
        if (!response.ok) {
          throw new Error(`Failed to fetch rules.txt: ${response.statusText}`);
        }
        const text = await response.text();
        const loadedRules = text.split('\n')
                                .map(rule => rule.trim())
                                .filter(rule => rule.length > 0 && !rule.startsWith('//')); // Ignore empty lines and comments
        setRules(loadedRules);
      } catch (error) {
        console.error("Error fetching rules:", error);
        toast({
          title: "Error Fetching Rules",
          description: `Could not load custom rules from rules.txt. ${error instanceof Error ? error.message : ''}`,
          variant: "destructive",
        });
        setRules([]);
      } finally {
        setIsProblemsLoading(false);
      }
    }
    fetchRules();
  }, [isMounted, toast]);


  const checkCodeAgainstRules = useCallback((currentCode: string, currentRules: string[]): CodeProblem[] => {
    if (!currentRules.length || !currentCode.trim()) {
      return [];
    }
    const problems: CodeProblem[] = [];
    const lines = currentCode.split('\n');
    lines.forEach((lineText, index) => {
      currentRules.forEach(rule => {
        if (rule.startsWith('/') && rule.endsWith('/') && rule.length > 2) { // Basic regex check
          try {
            const regexPattern = rule.slice(1, -1);
            const regex = new RegExp(regexPattern);
            if (regex.test(lineText)) {
              problems.push({
                line: index + 1,
                rule: rule,
                message: `Line matches regex pattern: '${rule}'`,
              });
            }
          } catch (e) {
             // If regex is invalid, try as plain text
             if (lineText.includes(rule)) {
              problems.push({
                line: index + 1,
                rule: rule,
                message: `Contains forbidden pattern (invalid regex treated as text): '${rule}'`,
              });
            }
          }
        } else { // Simple string match
           if (lineText.includes(rule)) {
            problems.push({
              line: index + 1,
              rule: rule,
              message: `Contains forbidden pattern: '${rule}'`,
            });
          }
        }
      });
    });
    return problems;
  }, []);

  const fetchSuggestions = useCallback(async (codePrefix: string, currentLanguage: string) => {
    if (!isMounted) {
      setSuggestions([]);
      setPrefixForCurrentSuggestions(codePrefix);
      return;
    }

    if (!codePrefix.trim()) {
      setSuggestions([]);
      setPrefixForCurrentSuggestions(codePrefix);
      setIsSuggestionsLoading(false);
      return;
    }

    setIsSuggestionsLoading(true);
    try {
      const input: SuggestCodeCompletionsInput = { codePrefix, language: currentLanguage };
      const result = await suggestCodeCompletions(input);
      setSuggestions(result.suggestions || []);
      setPrefixForCurrentSuggestions(codePrefix);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      toast({
        title: "Error Fetching Suggestions",
        description: "Could not fetch code suggestions. You might be hitting API rate limits.",
        variant: "destructive",
      });
      setSuggestions([]);
      setPrefixForCurrentSuggestions(codePrefix);
    } finally {
      setIsSuggestionsLoading(false);
    }
  }, [toast, isMounted]);

  const fetchDocumentation = useCallback(async (currentCode: string) => {
    if (!isMounted || !currentCode.trim()) {
      setDocumentation('');
      return;
    }
    setIsDocumentationLoading(true);
    try {
      const input: RelevantDocumentationInput = { codeSnippet: currentCode };
      const result = await displayRelevantDocumentation(input);
      setDocumentation(result.documentation || '');
    } catch (error)      {
        console.error("Error fetching documentation:", error);
       toast({
        title: "Error Fetching Documentation",
        description: "Could not fetch documentation. You might be hitting API rate limits.",
        variant: "destructive",
      });
      setDocumentation('');
    } finally {
      setIsDocumentationLoading(false);
    }
  }, [toast, isMounted]);
  
  const debouncedFetchSuggestions = useCallback(debounce((codePrefix: string, lang: string) => fetchSuggestions(codePrefix, lang), 2000), [fetchSuggestions]);
  const debouncedFetchDocumentation = useCallback(debounce(fetchDocumentation, 4000), [fetchDocumentation]);
  const debouncedCheckRules = useCallback(debounce((newCode: string, currentRules: string[]) => {
    if(!isMounted) return;
    setIsProblemsLoading(true);
    const problems = checkCodeAgainstRules(newCode, currentRules);
    setCodeProblems(problems);
    setIsProblemsLoading(false);
  }, 1000), [checkCodeAgainstRules, isMounted, rules]); // Added 'rules' to dependency array


  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    debouncedFetchSuggestions(newCode, language);
    debouncedFetchDocumentation(newCode);
    if(rules.length > 0) { // Only check rules if they have been loaded
        debouncedCheckRules(newCode, rules);
    }
  };
  
  useEffect(() => {
    // When rules are loaded, perform an initial check on the current code
    if (isMounted && rules.length > 0 && code.trim()) {
      setIsProblemsLoading(true);
      const problems = checkCodeAgainstRules(code, rules);
      setCodeProblems(problems);
      setIsProblemsLoading(false);
    }
  }, [rules, isMounted, code, checkCodeAgainstRules]);


  const handleSuggestionSelect = (suggestion: string) => {
    const newCode = code + suggestion;
    setCode(newCode);
    debouncedFetchSuggestions(newCode, language); 
    debouncedFetchDocumentation(newCode);
    if(rules.length > 0) {
        debouncedCheckRules(newCode, rules); 
    }
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    if (code.trim()) {
      fetchSuggestions(code, newLanguage);
      fetchDocumentation(code);
    } else {
      setSuggestions([]);
      setDocumentation('');
    }
  };
  
  const isSuggestionRelevantToCurrentCode = code === prefixForCurrentSuggestions;
  const inlineSuggestionText = (isSuggestionRelevantToCurrentCode && suggestions.length > 0) ? suggestions[0] : null;

  const editorContent = (
    <Card className="flex-1 flex flex-col overflow-hidden rounded-lg bg-card border-border shadow-sm h-full">
      <CardHeader className="flex flex-row items-center justify-between p-3">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <CardTitle className="font-mono text-lg">Editor</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <Select value={language} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_LANGUAGES.map(lang => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <CodeEditor
          code={code}
          onCodeChange={handleCodeChange}
          inlineSuggestionText={inlineSuggestionText}
          language={language}
        />
      </CardContent>
    </Card>
  );

  const suggestionsPanelContent = (
    <Card className="h-full flex flex-col overflow-hidden rounded-none border-0 shadow-none bg-sidebar border-b border-sidebar-border">
      <CardHeader className="flex flex-row items-center justify-between p-3 border-b border-sidebar-border">
        <CardTitle className="font-mono text-sm text-sidebar-foreground">Suggestions</CardTitle>
        {isSuggestionsLoading && <Loader2 className="h-4 w-4 animate-spin text-sidebar-accent" />}
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-2">
        <SuggestionDisplay
          suggestions={suggestions}
          onSelectSuggestion={handleSuggestionSelect}
          loading={isSuggestionsLoading && !suggestions.length}
        />
      </CardContent>
    </Card>
  );

  const problemsPanelContent = (
    <Card className="h-full flex flex-col overflow-hidden rounded-none border-0 shadow-none bg-sidebar border-b border-sidebar-border">
      <CardHeader className="flex flex-row items-center justify-between p-3 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-sidebar-accent" />
          <CardTitle className="font-mono text-sm text-sidebar-foreground">Problems</CardTitle>
          {codeProblems.length > 0 && (
            <Badge variant="destructive" className="h-5 px-1.5 text-xs">
              {codeProblems.length}
            </Badge>
          )}
        </div>
        {(isProblemsLoading && rules.length === 0) && <Loader2 className="h-4 w-4 animate-spin text-sidebar-accent" />}
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-0">
        <ProblemsView
          problems={codeProblems}
          loading={isProblemsLoading && rules.length === 0 && code.trim() !== ""} 
        />
      </CardContent>
    </Card>
  );

  const documentationPanelContent = (
     <Card className="h-full flex flex-col overflow-hidden rounded-none border-0 shadow-none bg-sidebar">
      <CardHeader className="flex flex-row items-center justify-between p-3 border-b border-sidebar-border">
        <CardTitle className="font-mono text-sm text-sidebar-foreground">Documentation</CardTitle>
        {isDocumentationLoading && <Loader2 className="h-4 w-4 animate-spin text-sidebar-accent" />}
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-2">
        <DocumentationView
          documentation={documentation}
          loading={isDocumentationLoading && !documentation}
        />
      </CardContent>
    </Card>
  );
  
  if (!isMounted) {
    return ( 
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      <header className="p-4 bg-primary text-primary-foreground shadow-md flex items-center justify-between">
        <h1 className="text-2xl font-semibold font-mono">CodeAssist</h1>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {sidebarContext.isMobile ? (
          <>
            <Sidebar side="left" className="border-r border-border">
              <SidebarContent className="flex flex-col gap-0 p-0">
                <div className="h-1/3 flex flex-col">{suggestionsPanelContent}</div>
                <div className="h-1/3 flex flex-col border-t border-sidebar-border">{problemsPanelContent}</div>
                <div className="h-1/3 flex flex-col border-t border-sidebar-border">{documentationPanelContent}</div>
              </SidebarContent>
            </Sidebar>
            <main className="flex-1 flex flex-col p-4 overflow-hidden">
              {editorContent}
            </main>
          </>
        ) : (
          <PanelGroup direction="horizontal" className="flex-1">
            <Panel
              ref={sidebarPanelRef}
              defaultSize={DEFAULT_SIDEBAR_WIDTH_PERCENTAGE}
              minSize={15} 
              collapsible={true}
              collapsedSize={ICON_SIDEBAR_WIDTH_PERCENTAGE}
              onCollapse={() => sidebarContext.setOpen(false)}
              onExpand={() => sidebarContext.setOpen(true)}
              className="bg-sidebar text-sidebar-foreground flex flex-col" 
            >
              <PanelGroup direction="vertical" className="flex-1">
                <Panel defaultSize={33} minSize={10} className="overflow-hidden">
                  {suggestionsPanelContent}
                </Panel>
                <PanelResizeHandle />
                <Panel defaultSize={34} minSize={10} className="overflow-hidden">
                  {problemsPanelContent}
                </Panel>
                <PanelResizeHandle />
                <Panel defaultSize={33} minSize={10} className="overflow-hidden">
                  {documentationPanelContent}
                </Panel>
              </PanelGroup>
            </Panel>
            <PanelResizeHandle />
            <Panel defaultSize={100 - DEFAULT_SIDEBAR_WIDTH_PERCENTAGE} minSize={30}>
              <main className="flex-1 flex flex-col p-4 overflow-hidden h-full">
                {editorContent}
              </main>
            </Panel>
          </PanelGroup>
        )}
      </div>
      <Toaster />
    </div>
  );
}

export default function CodeAssistPage() {
  return (
    <SidebarProvider>
      <CodeAssistPageComponent />
    </SidebarProvider>
  );
}

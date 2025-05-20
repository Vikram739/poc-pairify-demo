
// src/components/code-editor.tsx
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import Editor from 'react-simple-code-editor';
import { highlight, languages as PrismLanguages } from 'prismjs/components/prism-core';
// Core and base languages first
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-markup'; // For HTML, XML, etc.
import 'prismjs/components/prism-css';

// Languages that depend on clike or markup
import 'prismjs/components/prism-javascript'; // Depends on clike
import 'prismjs/components/prism-typescript'; // Depends on clike & javascript
import 'prismjs/components/prism-jsx'; // Depends on markup & javascript
import 'prismjs/components/prism-tsx'; // Depends on markup & typescript & jsx

// Other languages
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java'; // Depends on clike
import 'prismjs/components/prism-csharp'; // Depends on clike
import 'prismjs/components/prism-go'; // Depends on clike

import { cn } from '@/lib/utils';

interface CodeEditorProps {
  code: string;
  onCodeChange: (newCode: string) => void;
  inlineSuggestionText: string | null;
  language: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ code, onCodeChange, inlineSuggestionText, language }) => {
  const [lineCount, setLineCount] = useState(1);

  useEffect(() => {
    const lines = code.split('\n').length;
    setLineCount(lines);
  }, [code]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = event.target as HTMLTextAreaElement;
    const { selectionStart, selectionEnd, value } = textarea;

    if (event.key === 'Tab' && !event.shiftKey && inlineSuggestionText) {
      event.preventDefault();
      const textBeforeCursor = value.substring(0, selectionStart);
      const textAfterCursor = value.substring(selectionEnd);
      
      const newCode = textBeforeCursor + inlineSuggestionText + textAfterCursor;
      onCodeChange(newCode);

      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = selectionStart + inlineSuggestionText.length;
      });
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();

      const lineStartIndex = value.lastIndexOf('\n', selectionStart - 1) + 1;
      // Get the full text of the line the cursor is on
      const currentLineFullText = value.substring(lineStartIndex, value.indexOf('\n', lineStartIndex) === -1 ? value.length : value.indexOf('\n', lineStartIndex));
      const baseIndentMatch = currentLineFullText.match(/^(\s*)/);
      let indent = baseIndentMatch ? baseIndentMatch[0] : '';
      
      // Get the text on the current line before the cursor position
      const textOnLineBeforeCursor = value.substring(lineStartIndex, selectionStart);
      // Check if the text before the cursor (on the current line) ends with an opening bracket/paren/brace
      if (/[{([]$/.test(textOnLineBeforeCursor.trim())) {
        indent += '  '; // Add two spaces for new block
      }

      const textToInsert = `\n${indent}`;
      const newCode = value.substring(0, selectionStart) + textToInsert + value.substring(selectionEnd);
      onCodeChange(newCode);

      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = selectionStart + textToInsert.length;
      });
      return;
    }
  }, [inlineSuggestionText, onCodeChange]);

  const mapLanguageToPrism = (lang: string) => {
    switch (lang) {
      case 'html':
        return 'markup';
      case 'javascript':
        return 'jsx';
      case 'typescript':
        return 'tsx';
      default:
        return lang;
    }
  };

  const prismLanguageKey = mapLanguageToPrism(language);
  const grammar = PrismLanguages[prismLanguageKey] || PrismLanguages.clike;

  return (
    <div className="flex w-full h-full bg-card text-foreground font-mono text-sm rounded-md overflow-auto">
      <div
        className="p-4 select-none text-right text-muted-foreground sticky left-0 bg-card z-10 shrink-0"
        style={{
          fontFamily: 'var(--font-roboto-mono)',
          fontSize: '0.875rem',
          lineHeight: '1.25rem',
          minWidth: '40px', // Adjust based on max line number width
        }}
      >
        {Array.from({ length: lineCount }, (_, i) => (
          <div key={i}>{i + 1}</div>
        ))}
      </div>
      <div className="flex-1 relative min-w-0"> {/* min-w-0 for flex item to shrink properly */}
        <Editor
          value={code}
          onValueChange={onCodeChange}
          highlight={(codeToHighlight) => {
            if (grammar && prismLanguageKey) {
              try {
                return highlight(codeToHighlight, grammar, prismLanguageKey);
              } catch (e) {
                console.error("PrismJS highlighting error:", e);
                return codeToHighlight; // fallback to unhighlighted code
              }
            }
            return codeToHighlight; 
          }}
          padding={16}
          onKeyDown={handleKeyDown}
          className="w-full h-full editor-container" 
          style={{
            fontFamily: 'var(--font-roboto-mono)',
            fontSize: '0.875rem',
            lineHeight: '1.25rem',
            minHeight: '100%', // Ensure editor takes full height for scrolling
          }}
          textareaClassName={cn(
            "focus:outline-none",
            "border-0", 
            "bg-transparent",
            "text-transparent",
            "caret-foreground",
            "w-full h-full" // Ensure textarea fills its flex container
          )}
          preClassName={cn(
            "focus:outline-none",
            "p-0 m-0",
            "w-full h-full" // Ensure pre fills its flex container
          )}
          placeholder="Start typing your code here..."
          aria-label="Code Editor"
        />
      </div>
       <style jsx global>{`
        .editor-container > textarea, .editor-container > pre {
          white-space: pre !important;
          overflow-wrap: normal !important;
        }
        .token.comment, .token.prolog, .token.doctype, .token.cdata {
            color: hsl(var(--muted-foreground) / 0.8); 
        }
      `}</style>
    </div>
  );
};

export default CodeEditor;


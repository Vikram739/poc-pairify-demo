// src/ai/flows/suggest-code-completions.ts
'use server';

/**
 * @fileOverview Provides real-time code completion suggestions using an AI model.
 *
 * - suggestCodeCompletions - A function that suggests code completions based on the given code context.
 * - SuggestCodeCompletionsInput - The input type for the suggestCodeCompletions function.
 * - SuggestCodeCompletionsOutput - The return type for the suggestCodeCompletions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestCodeCompletionsInputSchema = z.object({
  codePrefix: z
    .string()
    .describe('The current code snippet that the user has typed.'),
  language: z
    .string()
    .describe('The programming language of the code snippet.'),
});
export type SuggestCodeCompletionsInput = z.infer<typeof SuggestCodeCompletionsInputSchema>;

const SuggestCodeCompletionsOutputSchema = z.object({
  suggestions: z.array(z.string()).describe('An array of code completion suggestions. Each suggestion should be a complete, self-contained block of code (potentially multi-line, using \\n for newlines) that can be appended to the prefix.'),
});
export type SuggestCodeCompletionsOutput = z.infer<typeof SuggestCodeCompletionsOutputSchema>;

export async function suggestCodeCompletions(input: SuggestCodeCompletionsInput): Promise<SuggestCodeCompletionsOutput> {
  return suggestCodeCompletionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestCodeCompletionsPrompt',
  input: {schema: SuggestCodeCompletionsInputSchema},
  output: {schema: SuggestCodeCompletionsOutputSchema},
  prompt: `You are an AI code completion assistant. Given a code prefix and programming language, you will suggest meaningful code completions.
Each suggestion in the output array should be a complete, potentially multi-line, block of code that logically follows the prefix.
For example, if the prefix is "def my_function" in Python, a valid sugestion might be "(param1, param2):\\n    return param1 + param2".
Ensure multi-line suggestions are provided as a single string with '\\n' for newlines.

Language: {{{language}}}
Code Prefix: {{{codePrefix}}}

Provide your suggestions according to the output schema:`,
});

const suggestCodeCompletionsFlow = ai.defineFlow(
  {
    name: 'suggestCodeCompletionsFlow',
    inputSchema: SuggestCodeCompletionsInputSchema,
    outputSchema: SuggestCodeCompletionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

const promptWithDefaultLanguage = ai.definePrompt({
  name: 'suggestCodeCompletionsPrompt',
  input: {schema: SuggestCodeCompletionsInputSchema},
  output: {schema: SuggestCodeCompletionsOutputSchema},
  prompt: `You are an AI code completion assistant. Given a code prefix and programming language, python you will suggest meaningful code completions.
Each suggestion in the output array should be a complete, potentially multi-line, block of code that logically follows the prefix.
For example, if the prefix is "def my_function" in Python, a valid suggestion might be "(param1, param2):\\n    return param1 + param2".
Ensure multi-line suggestions are provided as a single string with '\\n' for newlines.

Language: {{{language}}}
Code Prefix: {{{codePrefix}}}

Provide your suggestions according to the output schema:`,
});

const suggestCodeCompletionsFlow = ai.defineFlow(
  {
    name: 'suggestCodeCompletionsFlow',
    inputSchema: SuggestCodeCompletionsInputSchema,
    outputSchema: SuggestCodeCompletionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);


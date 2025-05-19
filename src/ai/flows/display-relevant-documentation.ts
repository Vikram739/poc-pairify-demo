// use server'
'use server';

/**
 * @fileOverview Provides relevant documentation snippets based on the code being written.
 *
 * - displayRelevantDocumentation - A function that fetches and structures relevant documentation.
 * - RelevantDocumentationInput - The input type for the displayRelevantDocumentation function.
 * - RelevantDocumentationOutput - The return type for the displayRelevantDocumentation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RelevantDocumentationInputSchema = z.object({
  codeSnippet: z
    .string()
    .describe('The current code snippet the user is writing.'),
});
export type RelevantDocumentationInput = z.infer<
  typeof RelevantDocumentationInputSchema
>;

const RelevantDocumentationOutputSchema = z.object({
  documentation: z
    .string()
    .describe('Relevant documentation snippets for the code snippet.'),
});
export type RelevantDocumentationOutput = z.infer<
  typeof RelevantDocumentationOutputSchema
>;

export async function displayRelevantDocumentation(
  input: RelevantDocumentationInput
): Promise<RelevantDocumentationOutput> {
  return displayRelevantDocumentationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'relevantDocumentationPrompt',
  input: {schema: RelevantDocumentationInputSchema},
  output: {schema: RelevantDocumentationOutputSchema},
  prompt: `You are an AI assistant that provides documentation for code snippets.

  Given the following code snippet, find and provide relevant documentation snippets that would be helpful to the user.

  Code Snippet:
  {{codeSnippet}}`,
});

const displayRelevantDocumentationFlow = ai.defineFlow(
  {
    name: 'displayRelevantDocumentationFlow',
    inputSchema: RelevantDocumentationInputSchema,
    outputSchema: RelevantDocumentationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

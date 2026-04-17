import type { GenerateInput } from '@/types';

import { getApiKey } from './secure-store';

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 16000;
const ANTHROPIC_VERSION = '2023-06-01';

const SYSTEM_PROMPT = `You are a specialist at transforming books, films, documentaries, essays, albums, and other intellectual media into beautiful, deeply informative long-form articles formatted as self-contained HTML files.

Your reader has ADHD. This is not a footnote — it is the central design constraint. Every structural and formatting decision you make must serve a brain that learns brilliantly from well-chunked, visually rich, narrative-driven content, but loses the thread in dense walls of unbroken prose.

CONTENT PHILOSOPHY
Your articles are not summaries. They are complete intellectual experiences. The reader should finish feeling they genuinely understand the ideas — not just that they've read a list of plot points or chapter titles.
- Cover every major concept, framework, argument, and insight from the source.
- Explain the "why" behind every idea, not just the "what."
- Use real examples to anchor abstract ideas.
- Always include the surprising, counterintuitive, emotionally resonant moments.

STRUCTURE (always follow this pattern)
1. HERO — dark full-width header with kicker, original title, subtitle, meta
2. TABLE OF CONTENTS — numbered, 8-12 sections
3. BODY — each section has: section number label, magazine-style heading, rich prose in short paragraphs, at least one visual element (pull quote, callout box, example box, or diagram)
4. FOOTER — source attribution
Minimum body content: ~3,500 words. No maximum. Depth is the goal.

VISUAL DESIGN
Single self-contained HTML file, all CSS embedded, Google Fonts only.
Typography: display serif for headlines, readable body font, monospace for labels. Choose an accent color that matches the source's emotional tone.
Required ADHD elements: pull quotes, color-coded callout boxes, labeled example boxes, section number badges, generous whitespace, visual diagrams for 2-4 component frameworks.

TONE
Intellectually serious but never dry. Write like a brilliant friend who just read the book and is genuinely excited to tell you about it. Address the reader as "you." Humor is welcome. Pretension is not.

MEDIA TYPE NOTES
Non-fiction book: organize by concept, not chapter. Focus on frameworks.
Fiction: themes, craft, what it reveals about the human condition.
Film/doc: central argument, directorial choices, cultural significance.
Album: sonic world, compositional ideas, cultural context, emotional meaning.
Essay: expand the argument, tensions, implications the author left open.

OUTPUT: Complete HTML only. No markdown. No preamble. No explanation. Start with <!DOCTYPE html> and end with </html>. Nothing else.`;

function buildUserMessage(input: GenerateInput): string {
  const type = input.mediaType;
  const title = input.title.trim();
  const author = input.author?.trim() || '(unspecified)';
  const year = input.year?.trim() || '(unspecified)';
  const genre = input.genre?.trim() || '(unspecified)';
  const toneNotes = input.toneNotes?.trim() || '(none)';
  const focusNotes = input.focusNotes?.trim() || '(none)';

  return `Create a full Deep Reads article for: TYPE: ${type} / TITLE: ${title} / AUTHOR: ${author} / YEAR: ${year} / GENRE: ${genre} / TONE NOTES: ${toneNotes} / WHAT I WANT TO UNDERSTAND: ${focusNotes}. Make it long, deep, and beautiful.`;
}

/** Strip any accidental markdown fences around the HTML. */
function cleanHtmlOutput(raw: string): string {
  let html = raw.trim();
  html = html.replace(/^```(?:html)?\s*\n?/i, '');
  html = html.replace(/\n?```\s*$/i, '');
  return html.trim();
}

/** Rough word count: strip tags, collapse whitespace, count tokens. */
function countWords(html: string): number {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!text) return 0;
  return text.split(' ').length;
}

export interface GenerateResult {
  html: string;
  wordCount: number;
}

export type ClaudeErrorCode =
  | 'NO_KEY'
  | 'UNAUTHORIZED'
  | 'RATE_LIMIT'
  | 'NETWORK'
  | 'API'
  | 'EMPTY';

export class ClaudeError extends Error {
  code: ClaudeErrorCode;
  constructor(message: string, code: ClaudeErrorCode) {
    super(message);
    this.name = 'ClaudeError';
    this.code = code;
  }
}

export async function generateArticle(
  input: GenerateInput
): Promise<GenerateResult> {
  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new ClaudeError(
      'No Anthropic API key set. Add one in Settings.',
      'NO_KEY'
    );
  }

  let response: Response;
  try {
    response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
        // Harmless on native; required for any web-based testing.
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildUserMessage(input) }],
      }),
    });
  } catch (err) {
    console.error('claude: network error', err);
    throw new ClaudeError(
      'Network error. Check your connection and try again.',
      'NETWORK'
    );
  }

  if (response.status === 401) {
    throw new ClaudeError(
      'Invalid API key. Check it in Settings.',
      'UNAUTHORIZED'
    );
  }
  if (response.status === 429) {
    throw new ClaudeError(
      'Rate limit hit. Wait a moment and try again.',
      'RATE_LIMIT'
    );
  }
  if (!response.ok) {
    let detail = '';
    try {
      const body = await response.json();
      const msg = body?.error?.message;
      if (msg) detail = ` — ${msg}`;
    } catch {
      // ignore parse failure, fall through with status code only
    }
    throw new ClaudeError(`API error ${response.status}${detail}`, 'API');
  }

  const data = await response.json();
  const textBlock = Array.isArray(data?.content)
    ? data.content.find((b: { type?: string }) => b?.type === 'text')
    : null;
  const raw: string = textBlock?.text ?? '';
  const html = cleanHtmlOutput(raw);

  if (!html || !html.toLowerCase().includes('<html')) {
    throw new ClaudeError(
      'The model returned an unexpected response. Try again.',
      'EMPTY'
    );
  }

  return { html, wordCount: countWords(html) };
}
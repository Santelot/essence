import type { NewArticleInput } from '@/types';

// Minimal self-contained HTML articles used to populate the library on first
// launch. Once the Claude generation flow is wired up in Phase 2, these can
// be removed or kept as permanent demos.

const articleOne = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>The Design of Everyday Things</title>
<style>
:root { color-scheme: dark; }
body { font-family: Georgia, serif; background: #0d1117; color: #f2f4f7;
  padding: 32px 24px; line-height: 1.7; max-width: 720px; margin: 0 auto; }
.kicker { font-family: ui-monospace, Menlo, monospace; text-transform: uppercase;
  color: #7a92aa; letter-spacing: 0.18em; font-size: 0.72em; }
h1 { font-size: 2.2em; color: #f2f4f7; margin: 0.4em 0 0.2em; line-height: 1.15; }
.sub { color: #7a92aa; font-style: italic; margin-bottom: 2em; }
h2 { font-size: 1.3em; color: #3d8ef0; margin-top: 2em; }
blockquote { border-left: 3px solid #0fa8aa; padding: 0 0 0 18px;
  margin: 28px 0; color: #f2f4f7; font-style: italic; font-size: 1.1em; }
p { margin: 0 0 1.2em; }
</style></head><body>
<div class="kicker">Seed · Book</div>
<h1>The Design of Everyday Things</h1>
<div class="sub">Don Norman · 1988</div>
<p>Don Norman's foundational work argues that the objects around us shape our behavior far more than we realize. When a door frustrates you, the door is poorly designed — it is not your fault.</p>
<h2>The Gulf of Execution</h2>
<p>Norman introduces the idea that every interaction involves a gap between what we want to do and what a system lets us do. Good design closes this gap through <em>signifiers</em>: visible cues that tell us what to push, pull, turn, or tap.</p>
<blockquote>Good design is actually a lot harder to notice than poor design, in part because good designs fit our needs so well that the design is invisible.</blockquote>
<p>This is a short seed article. Once the Claude generation flow is live, real long-form articles will replace these.</p>
</body></html>`;

const articleTwo = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Stalker</title>
<style>
:root { color-scheme: dark; }
body { font-family: Georgia, serif; background: #0d1117; color: #f2f4f7;
  padding: 32px 24px; line-height: 1.7; max-width: 720px; margin: 0 auto; }
.kicker { font-family: ui-monospace, Menlo, monospace; text-transform: uppercase;
  color: #7a92aa; letter-spacing: 0.18em; font-size: 0.72em; }
h1 { font-size: 2.2em; margin: 0.4em 0 0.2em; line-height: 1.15; }
.sub { color: #7a92aa; font-style: italic; margin-bottom: 2em; }
h2 { font-size: 1.3em; color: #c47d14; margin-top: 2em; }
.callout { background: #1e2735; border: 1px solid #2e3d52; border-radius: 8px;
  padding: 16px 20px; margin: 24px 0; }
.callout-label { font-family: ui-monospace, Menlo, monospace; text-transform: uppercase;
  font-size: 0.7em; letter-spacing: 0.15em; color: #c47d14; margin-bottom: 8px; }
p { margin: 0 0 1.2em; }
</style></head><body>
<div class="kicker">Seed · Film</div>
<h1>Stalker</h1>
<div class="sub">Andrei Tarkovsky · 1979</div>
<p>Three men walk into a forbidden zone where reality bends and a single room allegedly grants a person's deepest wish. They never reach the room. That is the point.</p>
<h2>The Zone as Mirror</h2>
<p>Tarkovsky isn't interested in science fiction mechanics. The Zone is a pressure chamber for the soul — an environment that slowly reveals what each man actually wants, versus what he tells himself he wants.</p>
<div class="callout">
<div class="callout-label">Watch For</div>
<p>The long color shift halfway through, when the characters enter the Zone proper. It's not a gimmick — it's Tarkovsky telling you the rules of perception have changed.</p>
</div>
<p>A seed article. The real generated ones will go much deeper.</p>
</body></html>`;

const articleThree = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Kid A</title>
<style>
:root { color-scheme: dark; }
body { font-family: Georgia, serif; background: #0d1117; color: #f2f4f7;
  padding: 32px 24px; line-height: 1.7; max-width: 720px; margin: 0 auto; }
.kicker { font-family: ui-monospace, Menlo, monospace; text-transform: uppercase;
  color: #7a92aa; letter-spacing: 0.18em; font-size: 0.72em; }
h1 { font-size: 2.2em; margin: 0.4em 0 0.2em; line-height: 1.15; }
.sub { color: #7a92aa; font-style: italic; margin-bottom: 2em; }
h2 { font-size: 1.3em; color: #0fa8aa; margin-top: 2em; }
p { margin: 0 0 1.2em; }
</style></head><body>
<div class="kicker">Seed · Album</div>
<h1>Kid A</h1>
<div class="sub">Radiohead · 2000</div>
<p>After OK Computer made them the biggest rock band in the world, Radiohead responded by making an album that refused to sound like rock at all. Kid A is what happens when a band uses its peak to walk away from its own formula.</p>
<h2>Disappearing the Guitar</h2>
<p>The most radical choice on Kid A isn't any single sound — it's the absence of the thing everyone expected. Thom Yorke's voice is treated as another synth, another texture, rather than the emotional center it was on earlier records.</p>
<p>Another seed article. Generated ones will cover sonic philosophy, compositional ideas, and cultural context in much more depth.</p>
</body></html>`;

export const seedArticles: NewArticleInput[] = [
  {
    title: 'The Design of Everyday Things',
    source: 'The Design of Everyday Things',
    author: 'Don Norman',
    mediaType: 'book',
    genre: 'Design / Cognitive Science',
    html: articleOne,
    wordCount: 140,
  },
  {
    title: 'Stalker',
    source: 'Stalker',
    author: 'Andrei Tarkovsky',
    mediaType: 'film',
    genre: 'Science fiction / Drama',
    html: articleTwo,
    wordCount: 130,
  },
  {
    title: 'Kid A',
    source: 'Kid A',
    author: 'Radiohead',
    mediaType: 'album',
    genre: 'Electronic / Art rock',
    html: articleThree,
    wordCount: 120,
  },
];

# Flybridge Investment Theses

A three-page, scroll-driven site presenting two Flybridge investment theses:

- **Continual Learning** — why continual learning is a primary bottleneck on the path to recursive self improvement, and where the startup opportunity sits.
- **Agentic File Systems** — why file systems are becoming the default interface agents use to store context, and where a standalone company can defend a market position.

Visual style is modeled on Anthropic's essay ["When AI builds itself"](https://www.anthropic.com/institute/recursive-self-improvement): a long-form scroll layout, a scroll-driven timeline, large pull quotes, and restrained editorial typography. The color palette is pulled from Flybridge's own site (`#DBEAAC`, a sage green accent) on a near-black background, deliberately avoiding Anthropic's cream-and-orange look.

## Stack

Plain HTML, CSS, and vanilla JavaScript. No build step, no framework, no dependencies.

```
.
├── index.html                   Landing page
├── continual-learning.html      Thesis 01
├── agentic-file-systems.html    Thesis 02
├── css/style.css                Shared design system
├── js/main.js                   Nav, scroll reveal, timeline scroll-spy,
│                                 tabs, accordions, dial interactive,
│                                 market map, collision diagram
└── source-docs/                 Text/HTML exports of the two source .docx
                                  files, for reference
```

## Running locally

Any static file server works. From this directory:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`. Opening `index.html` directly via `file://` also works, since the site makes no network calls beyond loading two Google Fonts (Newsreader, Inter).

## Content sourcing

All company names, figures, quotes, and claims come directly from `Continual Learning Thesis.docx` and `Agentic File Systems Thesis.docx`. Copy was rewritten for the web (shorter sentences, no em dashes, minimal colons, no adverbs) but no data was invented. Where a source table needed a visual, it became either an interactive card grid, a toggleable tab comparison, or a labeled diagram with a "How to read this" caption, chosen per section based on what best serves a reader scanning quickly.

## Deploying

The site is fully static and can be pushed to any static host (Netlify, Vercel, GitHub Pages, S3 + CloudFront). No environment variables or build commands are required.

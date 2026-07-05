# VideoForge 🎬

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![npm version](https://img.shields.io/badge/npm-v0.1.0-blue.svg)]()

**VideoForge** is an open-source, local-first, AI-assisted motion graphics video generator. It turns digital input (such as a README, product description, GitHub repo, or web URL) into a short, cinematic promo video in minutes. 

Everything runs entirely on your local machine—no cloud rendering fees, no SaaS subscriptions, and zero third-party telemetry.

---

## 🚀 Quickstart

Get a fully customized, rendered promo video in under 10 minutes:

```bash
# 1. Initialize a new project directory
npx videoforge init my-promo

# 2. Open VideoForge Studio (interactive web editor)
cd my-promo
npx videoforge studio
```

Or generate and render directly using AI:

```bash
# Set your Anthropic API Key
export ANTHROPIC_API_KEY="your-api-key"

# Generate a video from a Markdown file
npx videoforge generate markdown README.md --output ./my-video.mp4
```

---

## ✨ Features

- **Built-in Starter Template Library**: Includes 7 gorgeous, responsive HTML5/CSS/GSAP scene templates:
  - `title-card` — Slide-in cinematic text headers.
  - `feature-grid` — Responsive blocks showing key product benefits.
  - `code-snippet` — Syntax-highlighted code blocks (using PrismJS).
  - `logo-reveal` — Custom SVG/PNG brand logo animation.
  - `stat-counter` — Counting numeric values with unit suffixes.
  - `quote` — Beautifully centered review blocks.
  - `outro` — Clear call-to-action slide.
- **Linear Transition System**: Browser-based HTML5 canvas opacity blending for smooth cuts and fades.
- **AI Content Analyzers**: Turn raw Markdown, URLs, or GitHub repositories directly into storyboard scenes.
- **Validate & Repair Loop**: Self-correcting AI JSON output checks to handle schema mismatches without crashing.
- **Multiple Interfaces**: CLI tools, a local REST API, a local MCP server, and a fully interactive browser editor UI.

---

## 🛠 Contributing & Dev Setup

We welcome outside contributors! Check out [CONTRIBUTING.md](CONTRIBUTING.md) to set up the workspace and get started. 

If you are looking for somewhere to start, look for issues labeled **good first issue**.

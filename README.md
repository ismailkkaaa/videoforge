# VideoForge 🎬

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![npm version](https://img.shields.io/badge/npm-v0.1.0-blue.svg)]()

**VideoForge** is an open-source, local-first, AI-assisted motion graphics video generator. It turns digital input (such as a README, product description, GitHub repo, or web URL) into a short, cinematic promo video in minutes. 

Everything runs entirely on your local machine—no cloud rendering fees, no SaaS subscriptions, and zero third-party telemetry.

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

## 🚀 Quick Start

Get a fully customized, rendered promo video in under 10 minutes:

### 1. Installation
Ensure you have **Node.js >= 18** and **FFmpeg** installed on your system.

```bash
# Clone the repository
git clone https://github.com/your-username/videoforge.git
cd videoforge

# Install dependencies and build
npm install
npm run build
```

### 2. Launch VideoForge Studio (Interactive Web Editor UI)
Starts the local Express server and launches the storyboard editor in your browser:
```bash
node dist/cli/index.js studio
```
Open `http://127.0.0.1:3000` to preview scenes in real time and edit template parameters.

### 3. Generate & Render via CLI
If you want to use AI to generate a storyboard and render it directly:
```bash
# Set your Gemini API Key and Model configuration
export GEMINI_API_KEY="your-api-key"
export GEMINI_MODEL="gemini-2.5-flash"

# Generate a video from a Markdown file
node dist/cli/index.js generate markdown README.md --output ./my-video.mp4
```

---

## 📂 Project Structure

```
videoforge/
├── src/
│   ├── ai/               # Google Gemini LLM provider & analyzers (MD, GitHub, URL)
│   ├── api/              # Local Express REST API server
│   ├── cli/              # Commander CLI scripts
│   ├── core/
│   │   ├── config/       # Schema loaders and Zod validation
│   │   ├── render/       # Playwright browser controller & FFmpeg encoder
│   │   └── templates/    # Templates registry and interfaces
│   ├── mcp/              # stdio Model Context Protocol server
│   └── templates-builtin/# Built-in HTML/CSS/GSAP scene templates
├── ui/                   # Vite + React storyboard editor frontend
├── dist/                 # Compiled JavaScript distribution and assets
└── tests/                # Comprehensive Vitest unit and integration suites
```

---

## 🎨 Motion System

VideoForge includes an advanced, 100% deterministic motion system for premium visuals:
- **Shared Motion Language**: Standardized entrance, emphasis, exit eases and duration presets.
- **Atmospheric Backgrounds**: Support for `gradient-mesh`, `particle-field`, and `grid-draw` animation base layers.
- **Style Variants**: Supports `minimal` classic lines, translucent frosted `glass` panels (backdrop blur), and saturated `bold-neon` glow accents.
- **Camera Rig**: Simulated parallax layer translations and Ken-Burns zoom drifts.
- **Transitions Library**: Over 10 custom transition effects, including `fade`, `wipeleft`, `wiperight`, `slideleft`, `slideright`, `circleopen`, `zoomin`, `dissolve`, and `cut`.

---

## 🗺 Roadmap

- [ ] **Custom Template Plugins**: Allow loading custom scene templates from remote URLs or external directories.
- [ ] **Audio/Voiceover Overlay**: Integrate local text-to-speech engine or custom background audio tracks.
- [ ] **Interactive Timeline**: Fine-grained keyframe animations control inside the Studio editor.
- [ ] **Lottie Animation Support**: Support embedding Lottie files inside templates.

---

## 🤝 Contributing

Contributions are welcome! Please check out [CONTRIBUTING.md](CONTRIBUTING.md) to set up your local development workspace.

If you find a bug or have a suggestion, feel free to open a GitHub Issue or submit a Pull Request.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

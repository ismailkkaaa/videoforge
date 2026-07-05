# VideoForge

> [!NOTE]
> This project is under active development.

VideoForge is an open-source, local-first, AI-assisted motion graphics video generator. It turns any digital input (such as a README, plain-text product description, GitHub repository, or URL) into a short, cinematic promo video.

Everything runs entirely on your local machine:
1. **AI Analysis**: Produces an animated JSON storyboard from your input text.
2. **Deterministic Frame Capture**: Animated HTML5/GSAP templates are rendered inside headless Chromium (via Playwright) to generate frame screenshots.
3. **Encoding**: FFmpeg encodes the captured frames into a final high-quality MP4.

## Prerequisites

- **Node.js**: >= 18
- **OS**: Windows, macOS, or Linux

## Installation

```bash
git clone https://github.com/your-username/videoforge.git
cd videoforge
npm install
```

## Running Tests

To run the test suite:

```bash
npm run test
```

To run TypeScript compilation/typechecking:

```bash
npm run typecheck
```

To run linting:

```bash
npm run lint
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

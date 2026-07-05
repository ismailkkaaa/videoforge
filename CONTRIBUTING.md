# Contributing to VideoForge

Thank you for contributing to **VideoForge**! We want to make contributing to this project as easy and safe as possible.

## Development Setup

To set up a local development environment:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/videoforge.git
   cd videoforge
   ```

2. **Install dependencies**:
   Install all dependencies for the workspace and the ui submodule:
   ```bash
   npm install
   cd ui && npm install && cd ..
   ```

3. **Build the project**:
   Compile the TypeScript code and generate the JSON Schema:
   ```bash
   npm run build
   ```

4. **Verify the code quality**:
   Ensure all tests, lint rules, and typechecks pass successfully:
   ```bash
   npm run lint
   npm run typecheck
   npm run test
   ```

## Adding a Custom Template

To add a new built-in template to VideoForge, follow the guidelines in [docs/TEMPLATE_AUTHORING.md](docs/TEMPLATE_AUTHORING.md).

1. Create a folder under `src/templates-builtin/your-template-name/`.
2. Implement your template class conforming to the `VideoForgeTemplate` contract.
3. Map it in the registry at [src/core/templates/registry.ts](src/core/templates/registry.ts).
4. Register the new template name and optional data structures in [src/core/config/schema.ts](src/core/config/schema.ts).

## PR and Branching Conventions

- **Branch Naming**:
  - `feat/some-feature` for new capabilities.
  - `fix/some-bug` for bug fixes.
  - `docs/some-documentation` for documentation.
- **Commit Messages**:
  We enforce the **Conventional Commits** specification. Commit messages should look like:
  - `feat(render): add transition cross-fade blender`
  - `fix(cli): exit with 1 on invalid config path`
  - `docs(api): document endpoint payloads`
  - `test(core): verify frame rate rounding logic`

## Pull Request Process

1. Fork the repository and create your branch from `master`.
2. Make your changes, ensuring no debug logs or secrets are left behind.
3. Verify that the entire test suite passes at 100%.
4. Open a Pull Request detailing the changes and linking any related issues.

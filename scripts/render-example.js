import { loadConfig, renderProject } from '../dist/index.js';
import path from 'path';

async function main() {
  const configPath = path.resolve(process.cwd(), 'examples/configs/sample-project.json');
  console.log(`Loading config from: ${configPath}`);
  const config = loadConfig(configPath);
  
  console.log(`Starting render pipeline...`);
  const start = Date.now();
  const result = await renderProject(config);
  const elapsed = ((Date.now() - start) / 1000).toFixed(2);
  
  console.log(`Render complete!`);
  console.log(`Output: ${result.outputPath}`);
  console.log(`Duration: ${result.durationSeconds}s`);
  console.log(`Time taken: ${elapsed}s`);
}

main().catch(err => {
  console.error('Render failed:', err);
  process.exit(1);
});

import fs from 'fs';
import path from 'path';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { VideoForgeConfigSchema } from '../dist/core/config/schema.js';

const schema = zodToJsonSchema(VideoForgeConfigSchema, 'VideoForgeConfig');
fs.writeFileSync(
  path.resolve(process.cwd(), 'videoforge.config.schema.json'),
  JSON.stringify(schema, null, 2)
);
console.log('JSON Schema generated successfully!');

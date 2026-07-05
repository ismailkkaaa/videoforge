import { z } from 'zod';

export const ResolutionSchema = z.object({
  width: z.number().int().positive().default(1280),
  height: z.number().int().positive().default(720),
});

export const MetaSchema = z.object({
  title: z.string().min(1, 'Title must not be empty'),
  resolution: ResolutionSchema.default({ width: 1280, height: 720 }),
  fps: z.number().int().positive().default(30),
  outputPath: z.string().default('./output/video.mp4'),
});

export const ThemeSchema = z.object({
  primaryColor: z.string().min(1, 'primaryColor must not be empty'),
  secondaryColor: z.string().min(1, 'secondaryColor must not be empty'),
  fontFamily: z.string().min(1, 'fontFamily must not be empty'),
  logoPath: z.string().optional(),
});

export const TransitionSchema = z.object({
  type: z.enum(['cut', 'fade']),
  duration: z.number().nonnegative('Transition duration must be non-negative'),
});

export const SceneSchema = z.object({
  id: z.string().min(1, 'Scene id must not be empty'),
  template: z.string().min(1, 'Scene template must not be empty'),
  duration: z.number().positive('Scene duration must be a positive number'),
  data: z.record(z.any()).default({}),
  transition: TransitionSchema.optional(),
});

export const VideoForgeConfigSchema = z.object({
  meta: MetaSchema,
  theme: ThemeSchema,
  scenes: z.array(SceneSchema).min(1, 'At least one scene is required'),
});

export type VideoForgeConfig = z.infer<typeof VideoForgeConfigSchema>;
export type Theme = z.infer<typeof ThemeSchema>;
export type Scene = z.infer<typeof SceneSchema>;

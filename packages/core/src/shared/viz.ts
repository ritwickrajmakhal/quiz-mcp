import { z } from 'zod';
import { IdSchema } from './primitives.js';

export const VizEngineSchema = z.enum([
  'mermaid',
  'graphviz',
  'svg',
  'html_canvas',
]);
export type VizEngine = z.infer<typeof VizEngineSchema>;

export const VizAttachmentSchema = z.object({
  id: IdSchema,
  type: z.literal('viz'),
  engine: VizEngineSchema.describe(
    'Rendering engine: "mermaid" for declarative diagrams/charts, "graphviz" for trees/lists/graphs/state machines, "svg" for custom vector geometry/circuits, or "html_canvas" for dynamic scripts/simulations.',
  ),
  content: z.string().describe(
    'The visualization source: Mermaid syntax, Graphviz DOT syntax, raw SVG string (<svg>...</svg>), or self-contained HTML/JS code for canvas rendering.',
  ),
  title: z
    .string()
    .optional()
    .describe('Optional caption/title displayed below the visualization.'),
  height: z
    .number()
    .int()
    .min(80)
    .max(1200)
    .optional()
    .describe('Explicit display height in pixels (defaults to auto or 320px).'),
  aspectRatio: z
    .string()
    .optional()
    .describe('Optional aspect ratio, e.g. "16/9", "4/3", "1/1".'),
});
export type VizAttachment = z.infer<typeof VizAttachmentSchema>;

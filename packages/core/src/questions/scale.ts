import { z } from 'zod';
import { BaseQuestionFields } from './_base.js';

export const ScaleQuestionSchema = z.object({
  _kind: z.literal('scale'),
  ...BaseQuestionFields,
  min: z.number(),
  max: z.number(),
  step: z.number().positive().default(1),
  minLabel: z.string().optional().describe('Label for minimum value. Supports Markdown and KaTeX math.'),
  maxLabel: z.string().optional().describe('Label for maximum value. Supports Markdown and KaTeX math.'),
});
export type ScaleQuestion = z.infer<typeof ScaleQuestionSchema>;

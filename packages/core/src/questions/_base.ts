import { z } from 'zod';
import { IdSchema } from '../shared/primitives.js';
import { AttachmentSchema } from '../shared/attachment.js';

/**
 * Shared fields spread into every question schema via `...BaseQuestionFields`.
 * Kept as a plain object (not a z.object) so each question type can combine
 * its own `_kind` literal + specifics into one flat schema.
 */
export const BaseQuestionFields = {
  id: IdSchema,
  text: z
    .string()
    .describe(
      'Question text. Supports Markdown, code blocks, and KaTeX math ($...$, $$...$$).',
    ),
  title: z
    .string()
    .optional()
    .describe('Optional question title. Supports Markdown and KaTeX math.'),
  required: z.boolean().default(false),
  score: z.number().min(0).optional(),
  attachments: z.array(z.array(AttachmentSchema)).optional(),
};

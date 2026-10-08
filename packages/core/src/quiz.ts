import { z } from 'zod';
import { IdSchema } from './shared/primitives.js';
import { QuestionSchema } from './questions/index.js';

const QuizBodyShape = {
  $schema: z.string().optional(),
  title: z.string().describe('Quiz title. Supports Markdown and KaTeX math.'),
  description: z
    .string()
    .optional()
    .describe(
      'Optional quiz description. Supports Markdown, syntax-highlighted code blocks (```lang), and KaTeX math ($...$, $$...$$).',
    ),
  timeLimitSeconds: z
    .number()
    .int()
    .positive()
    .optional()
    .describe(
      'Optional target duration in seconds (e.g. 900 for 15 minutes) for time management practice. Does not auto-submit; when time runs out, the timer shows overtime (+mm:ss) and reports total time taken to the AI.',
    ),
  questions: z.array(QuestionSchema),
} as const;

export const QuizDefinitionSchema = z.object(QuizBodyShape).passthrough();
export type QuizDefinition = z.infer<typeof QuizDefinitionSchema>;

// Property order is preserved verbatim because the published JSON Schema at
// schema/quiz.schema.json factors `id` out as the first $ref target; reordering
// would produce a noisy diff in the public artifact.
export const QuizSchema = z.object({
  $schema: QuizBodyShape.$schema,
  id: IdSchema,
  title: QuizBodyShape.title,
  description: QuizBodyShape.description,
  timeLimitSeconds: QuizBodyShape.timeLimitSeconds,
  questions: QuizBodyShape.questions,
}).passthrough();
export type Quiz = z.infer<typeof QuizSchema>;

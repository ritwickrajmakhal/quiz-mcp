import { IdSchema, type Quiz } from "@quiz-mcp/core";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import {
  AnswersReportSchema,
  QuizNotFoundError,
  toAnswersReport,
  type QuizService,
  type QuizState,
} from "@quiz-mcp/runner-api";
import { z } from "zod";

const inputSchema = z.object({
  quizId: IdSchema,
  questionId: IdSchema.optional().describe(
    "Optional question ID to fetch the answer for only that specific question.",
  ),
  offset: z
    .number()
    .int()
    .nonnegative()
    .optional()
    .describe("Optional 0-based offset for paginating through questions."),
  limit: z
    .number()
    .int()
    .positive()
    .optional()
    .describe("Optional maximum number of questions to return."),
});

export const getAnswersConfig = {
  title: "Get Quiz Answers",
  description:
    "Returns a compact pairing of each question with its submitted answer " +
    "(or null if unanswered). Each question is projected to a minimal form: " +
    "id, _kind, title, text, and the type-specific data needed to interpret " +
    "the answer (options for choice types, pairs for match, items for " +
    "sorting, min/max for scale, parts for fill_gaps, accept for upload). " +
    "Use after the user has completed or partially completed a quiz started " +
    "via start_quiz. Supports optional questionId, offset, and limit to inspect answers safely.",
  inputSchema,
  outputSchema: AnswersReportSchema.shape,
  annotations: { readOnlyHint: true },
} as const;

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

function formatSummary(quiz: Quiz, state: QuizState): string {
  const total = quiz.questions.length;
  const answered = Object.keys(state.answers).length;
  let timing = "";
  if (state.timeSpentSeconds !== undefined) {
    timing = `, time taken: ${formatDuration(state.timeSpentSeconds)}`;
    if (quiz.timeLimitSeconds !== undefined) {
      const overtime = Math.max(0, state.timeSpentSeconds - quiz.timeLimitSeconds);
      timing += ` (target: ${formatDuration(quiz.timeLimitSeconds)}${
        overtime > 0 ? `, +${formatDuration(overtime)} overtime` : " [within limit]"
      })`;
    }
  }
  return `Quiz ${quiz.id}: finished=${state.finished}, answered ${answered}/${total}${timing}`;
}

export function makeGetAnswersHandler(service: QuizService) {
  return async ({
    quizId,
    questionId,
    offset,
    limit,
  }: {
    quizId: string;
    questionId?: string;
    offset?: number;
    limit?: number;
  }): Promise<CallToolResult> => {
    try {
      const [quiz, state] = await Promise.all([
        service.getQuiz(quizId),
        service.getState(quizId),
      ]);
      let structuredContent = toAnswersReport(quiz, state);

      if (questionId) {
        structuredContent = {
          ...structuredContent,
          items: structuredContent.items.filter(
            (item) => item.question.id === questionId,
          ),
        };
      } else if (offset !== undefined || limit !== undefined) {
        const start = offset ?? 0;
        const end = limit !== undefined ? start + limit : undefined;
        structuredContent = {
          ...structuredContent,
          items: structuredContent.items.slice(start, end),
        };
      }

      const summary = formatSummary(quiz, state);
      let json = JSON.stringify(structuredContent);

      // Safeguard against client tool result truncation (e.g. 16k character limits)
      if (json.length > 15000 && structuredContent.items.length > 1) {
        const truncatedItems = [...structuredContent.items];
        while (truncatedItems.length > 1 && json.length > 15000) {
          truncatedItems.pop();
          json = JSON.stringify({ ...structuredContent, items: truncatedItems });
        }
        structuredContent = { ...structuredContent, items: truncatedItems };
        const warning = ` [Note: Truncated to first ${truncatedItems.length} items to fit within character limits. Use 'offset' and 'limit' or 'questionId' to view remaining.]`;
        const text = `${summary}${warning}\n\n${json}`;
        return {
          content: [{ type: "text" as const, text }],
          structuredContent,
        };
      }

      const text = `${summary}\n\n${json}`;
      return {
        content: [{ type: "text" as const, text }],
        structuredContent,
      };
    } catch (err) {
      if (err instanceof QuizNotFoundError) {
        return {
          content: [{ type: "text" as const, text: `Quiz ${quizId} not found` }],
          isError: true,
        };
      }
      throw err;
    }
  };
}

export function registerGetAnswers(server: McpServer, service: QuizService): void {
  server.registerTool("get_answers", getAnswersConfig, makeGetAnswersHandler(service));
}

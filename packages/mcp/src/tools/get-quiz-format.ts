import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { QuizDefinitionSchema } from "@quiz-mcp/core";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

const inputSchema = z.object({
  questionType: z
    .enum([
      "single_choice",
      "multiple_choice",
      "dropdown",
      "short_text",
      "long_text",
      "fill_gaps",
      "match",
      "scale",
      "sorting",
      "upload",
    ])
    .optional()
    .describe(
      "Optional: filter schema to a specific question type for an even more compact response.",
    ),
});

const outputSchema = z.object({
  schema: z.record(z.unknown()),
});

export const getQuizFormatConfig = {
  title: "Get Quiz Format",
  description:
    "Returns the JSON Schema for a Quiz definition. MUST be called first " +
    "before building a quiz via start_quiz — the schema describes all " +
    "supported question types and their required fields. Note: the runner " +
    "assigns the quiz id, so the definition itself does not include one. " +
    "Quiz title, description, question text, and option labels support Markdown, " +
    "syntax-highlighted code blocks (```lang), and KaTeX math ($inline$, $$block$$). " +
    "Questions support rich diagrams and visuals (Graphviz trees/graphs/lists, Mermaid, raw SVG, HTML/Canvas) via attachment type 'viz'. " +
    "Optionally pass questionType to get the schema for just that question type.",
  inputSchema,
  outputSchema,
  annotations: { readOnlyHint: true, idempotentHint: true },
} as const;

export const getQuizFormatHandler = async (
  args?: { questionType?: string },
): Promise<CallToolResult> => {
  let schema = zodToJsonSchema(QuizDefinitionSchema) as Record<string, any>;

  if (args?.questionType) {
    const questionsProp = schema.properties?.questions;
    const anyOf = questionsProp?.items?.anyOf as Array<Record<string, any>> | undefined;
    const matching = anyOf?.find(
      (item) => item?.properties?._kind?.const === args.questionType,
    );
    if (matching) {
      schema = {
        type: "object",
        properties: {
          title: schema.properties?.title,
          description: schema.properties?.description,
          questions: {
            type: "array",
            items: matching,
          },
        },
        required: ["title", "questions"],
      };
    }
  }

  const text = JSON.stringify(schema);
  return {
    content: [
      { type: "text" as const, text },
    ],
    structuredContent: { schema },
  };
};

export function registerGetQuizFormat(server: McpServer): void {
  server.registerTool(
    "get_quiz_format",
    getQuizFormatConfig,
    getQuizFormatHandler,
  );
}

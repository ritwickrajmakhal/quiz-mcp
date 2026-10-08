import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { QuizService } from "@quiz-mcp/runner-api";
import { defaultOpenBrowser, type OpenBrowser } from "./open-browser.js";
import { registerGetQuizFormat } from "./tools/get-quiz-format.js";
import { registerStartQuiz } from "./tools/start-quiz.js";
import type { ServerUrlSource } from "./tools/start-quiz.js";
import { registerGetAnswers } from "./tools/get-answers.js";

export type { ServerUrlSource } from "./tools/start-quiz.js";

export type CreateQuizMcpServerDeps = {
  openBrowser?: OpenBrowser;
};

export const QUIZ_MCP_INSTRUCTIONS =
  "The quiz runner UI natively supports rich formatting via Markdown, syntax-highlighted code blocks (```language ... ```), and LaTeX math via KaTeX ($...$ for inline math, $$...$$ for block display equations). When authoring quizzes, you can use Markdown formatting, code snippets, and mathematical formulas in the quiz title, description, question text, and option labels.\n\n" +
  "UNIVERSAL VISUALIZATION SUPPORT: Questions can include diagrams, data structures, math coordinate plots, and arbitrary visuals via the attachment type 'viz' in a question's attachments array (e.g. attachments: [[{ id: 'v1', type: 'viz', engine: '...', content: '...', title?: '...' }]]).\n" +
  "Supported engines:\n" +
  "- 'graphviz': Ideal for Computer Science structures using Graphviz DOT syntax! Use for Binary Trees, BSTs, Red-Black Trees, Heaps, Singly/Doubly Linked Lists (with NULL pointers and record labels), Stacks, Queues, Graphs (directed/weighted), and Finite State Machines.\n" +
  "- 'mermaid': Ideal for declarative diagrams using Mermaid syntax! Use for flowcharts, sequence diagrams, state machines, class diagrams, ER diagrams, Git graphs, and pie charts.\n" +
  "- 'svg': Ideal for vector graphics and geometry! Provide raw <svg viewBox=\"...\">...</svg> markup for Cartesian (x,y) coordinate function plots, geometry proofs, electric circuits, logic gates, physics free-body diagrams, and Venn diagrams.\n" +
  "- 'html_canvas': Ideal for dynamic/interactive visuals and simulations! Provide self-contained HTML/JS targeting <canvas> or standard DOM elements.";


export function createQuizMcpServer(
  service: QuizService,
  serverUrl: ServerUrlSource,
  deps: CreateQuizMcpServerDeps = {},
): McpServer {
  const openBrowser = deps.openBrowser ?? defaultOpenBrowser;
  const server = new McpServer(
    { name: "quiz-mcp", version: "0.0.0" },
    { instructions: QUIZ_MCP_INSTRUCTIONS },
  );

  registerGetQuizFormat(server);
  registerStartQuiz(server, { service, serverUrl, openBrowser });
  registerGetAnswers(server, service);

  return server;
}

export async function startMcpServer(
  service: QuizService,
  serverUrl: ServerUrlSource,
): Promise<void> {
  const server = createQuizMcpServer(service, serverUrl);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

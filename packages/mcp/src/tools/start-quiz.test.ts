import { describe, expect, it, vi } from "vitest";
import type { Answer, Quiz, QuizDefinition } from "@quiz-mcp/core";
import type { QuizService, QuizState } from "@quiz-mcp/runner-api";
import { makeStartQuizHandler, startQuizConfig } from "./start-quiz.js";

const QUIZ_DEFINITION: QuizDefinition = {
  title: "T",
  questions: [],
};

function fakeService(nextId = "generated-id") {
  const quizzes = new Map<string, Quiz>();
  const states = new Map<string, QuizState>();
  let counter = 0;
  const service: QuizService = {
    async registerQuiz(definition) {
      const id = `${nextId}${counter === 0 ? "" : `-${counter}`}`;
      counter += 1;
      const quiz: Quiz = { ...definition, id };
      quizzes.set(id, quiz);
      states.delete(id);
      return quiz;
    },
    async quizExists(id) { return quizzes.has(id); },
    async getQuiz(id) {
      const q = quizzes.get(id);
      if (!q) throw new Error(`not found: ${id}`);
      return q;
    },
    async saveAnswer() {},
    async finishQuiz(id, answers) { states.set(id, { finished: true, answers }); },
    async getState(id) { return states.get(id) ?? { finished: false, answers: {} as Record<string, Answer> }; },
  };
  return { service, quizzes, states };
}

describe("start_quiz handler", () => {
  it("registers the quiz with a service-assigned id and opens the browser when open=true", async () => {
    const { service, quizzes } = fakeService("q1");
    const openBrowser = vi.fn().mockResolvedValue(undefined);

    const handler = makeStartQuizHandler({
      service,
      serverUrl: "http://localhost:3000",
      openBrowser,
    });

    const result = await handler({ quiz: QUIZ_DEFINITION, open: true });

    expect(quizzes.get("q1")).toEqual({ ...QUIZ_DEFINITION, id: "q1" });
    expect(openBrowser).toHaveBeenCalledTimes(1);
    expect(openBrowser).toHaveBeenCalledWith("http://localhost:3000/q1");
    expect(result.structuredContent).toEqual({
      quizId: "q1",
      url: "http://localhost:3000/q1",
      opened: true,
    });
    expect(result.isError).toBeUndefined();
  });

  it("does not open the browser when open=false", async () => {
    const { service } = fakeService();
    const openBrowser = vi.fn();

    const handler = makeStartQuizHandler({
      service,
      serverUrl: "http://localhost:3000",
      openBrowser,
    });

    const result = await handler({ quiz: QUIZ_DEFINITION, open: false });

    expect(openBrowser).not.toHaveBeenCalled();
    expect(result.structuredContent).toMatchObject({ opened: false });
  });

  it("records opened=false when openBrowser throws and still succeeds", async () => {
    const { service } = fakeService();
    const openBrowser = vi.fn().mockRejectedValue(new Error("no browser"));

    const handler = makeStartQuizHandler({
      service,
      serverUrl: "http://localhost:3000",
      openBrowser,
    });

    const result = await handler({ quiz: QUIZ_DEFINITION, open: true });

    expect(openBrowser).toHaveBeenCalledTimes(1);
    expect(result.isError).toBeUndefined();
    expect(result.structuredContent).toMatchObject({ opened: false });
  });

  it("trims trailing slash from serverUrl", async () => {
    const { service } = fakeService("q1");
    const openBrowser = vi.fn().mockResolvedValue(undefined);

    const handler = makeStartQuizHandler({
      service,
      serverUrl: "http://localhost:3000/",
      openBrowser,
    });

    const result = await handler({ quiz: QUIZ_DEFINITION, open: true });

    expect(openBrowser).toHaveBeenCalledWith("http://localhost:3000/q1");
    expect(result.structuredContent).toMatchObject({
      url: "http://localhost:3000/q1",
    });
  });

  it("uses the id returned by registerQuiz, not anything from the input", async () => {
    const { service, quizzes } = fakeService("server-side");
    const openBrowser = vi.fn().mockResolvedValue(undefined);

    const handler = makeStartQuizHandler({
      service,
      serverUrl: "http://localhost:3000",
      openBrowser,
    });

    const r1 = await handler({ quiz: { ...QUIZ_DEFINITION, title: "First" }, open: false });
    const r2 = await handler({ quiz: { ...QUIZ_DEFINITION, title: "Second" }, open: false });

    expect(r1.structuredContent).toMatchObject({ quizId: "server-side" });
    expect(r2.structuredContent).toMatchObject({ quizId: "server-side-1" });
    expect(quizzes.get("server-side")?.title).toBe("First");
    expect(quizzes.get("server-side-1")?.title).toBe("Second");
  });

  it("resolves serverUrl from a function on each invocation", async () => {
    const { service } = fakeService("q1");
    const openBrowser = vi.fn().mockResolvedValue(undefined);
    const resolver = vi.fn().mockReturnValue("http://resolved.example");

    const handler = makeStartQuizHandler({
      service,
      serverUrl: resolver,
      openBrowser,
    });

    await handler({ quiz: QUIZ_DEFINITION, open: true });
    await handler({ quiz: QUIZ_DEFINITION, open: true });

    expect(resolver).toHaveBeenCalledTimes(2);
    // Both calls resolve the same configured URL; the id varies because the
    // service assigns a fresh one each call.
    expect(openBrowser).toHaveBeenNthCalledWith(1, "http://resolved.example/q1");
    expect(openBrowser).toHaveBeenNthCalledWith(2, "http://resolved.example/q1-1");
  });

  it("rejects quiz with broken Mermaid syntax and does not register or open browser", async () => {
    const { service, quizzes } = fakeService();
    const openBrowser = vi.fn();
    const handler = makeStartQuizHandler({
      service,
      serverUrl: "http://localhost:3000",
      openBrowser,
    });

    const brokenQuiz: QuizDefinition = {
      title: "Broken Mermaid Quiz",
      questions: [
        {
          _kind: "single_choice",
          id: "q-bad",
          text: "What is this?",
          mode: "list",
          required: true,
          options: [{ id: "1", label: "A" }, { id: "2", label: "B" }],
          attachments: [
            [
              {
                id: "v-bad",
                type: "viz",
                engine: "mermaid",
                content: "graph TD\n  [bad node syntax",
              },
            ],
          ],
        },
      ],
    };

    const result = await handler({ quiz: brokenQuiz, open: true });
    expect(result.isError).toBe(true);
    const firstContent = result.content[0];
    expect(firstContent.type).toBe("text");
    if (firstContent.type === "text") {
      expect(firstContent.text).toContain("Visualization compilation/syntax errors found");
      expect(firstContent.text).toContain("q-bad");
      expect(firstContent.text).toContain("v-bad");
    }
    expect(openBrowser).not.toHaveBeenCalled();
    expect(quizzes.size).toBe(0);
  });

  it("inputSchema rejects invalid Mermaid diagram via safeParseAsync", async () => {
    const brokenQuiz: QuizDefinition = {
      title: "Broken Mermaid Quiz",
      questions: [
        {
          _kind: "single_choice",
          id: "q-bad",
          text: "What is this?",
          mode: "list",
          required: true,
          options: [{ id: "1", label: "A" }, { id: "2", label: "B" }],
          attachments: [
            [
              {
                id: "v-bad",
                type: "viz",
                engine: "mermaid",
                content: "graph TD\n  [bad node syntax",
              },
            ],
          ],
        },
      ],
    };

    const parseResult = await startQuizConfig.inputSchema.safeParseAsync({
      quiz: brokenQuiz,
      open: true,
    });

    expect(parseResult.success).toBe(false);
    if (!parseResult.success) {
      expect(parseResult.error.issues[0].message).toContain("Visual syntax error");
      expect(parseResult.error.issues[0].message).toContain("q-bad");
      expect(parseResult.error.issues[0].message).toContain("v-bad");
    }
  });

  it("successfully starts quiz when Mermaid diagram is valid", async () => {
    const { service, quizzes } = fakeService("valid-quiz");
    const openBrowser = vi.fn().mockResolvedValue(undefined);
    const handler = makeStartQuizHandler({
      service,
      serverUrl: "http://localhost:3000",
      openBrowser,
    });

    const validQuiz: QuizDefinition = {
      title: "Valid Mermaid Quiz",
      questions: [
        {
          _kind: "single_choice",
          id: "q-good",
          text: "What is this?",
          mode: "list",
          required: true,
          options: [{ id: "1", label: "A" }, { id: "2", label: "B" }],
          attachments: [
            [
              {
                id: "v-good",
                type: "viz",
                engine: "mermaid",
                content: "graph TD\n  A[Start] --> B[Finish]",
              },
            ],
          ],
        },
      ],
    };

    const result = await handler({ quiz: validQuiz, open: true });
    expect(result.isError).toBeUndefined();
    expect(quizzes.get("valid-quiz")).toBeDefined();
    expect(openBrowser).toHaveBeenCalledTimes(1);
  });
});

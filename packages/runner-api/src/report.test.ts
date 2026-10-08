import { describe, expect, it } from "vitest";
import type { Answer, Quiz } from "@quiz-mcp/core";
import { toAnswersReport, AnswersReportSchema } from "./report.js";
import type { QuizState } from "./service.js";

const SHORT_TEXT_QUIZ: Quiz = {
  id: "q1",
  title: "T",
  questions: [
    { _kind: "short_text", id: "s1", text: "Name?", required: false },
  ],
};

describe("toAnswersReport", () => {
  it("reports an empty unfinished quiz", () => {
    const quiz: Quiz = { id: "q0", title: "Empty", questions: [] };
    const state: QuizState = { finished: false, answers: {} };

    expect(toAnswersReport(quiz, state)).toEqual({
      quizId: "q0",
      title: "Empty",
      finished: false,
      items: [],
    });
  });

  it("pairs each question with its answer and fills null for unanswered", () => {
    const answers: Record<string, Answer> = {
      s1: { _kind: "short_text", questionId: "s1", text: "Ada" },
    };
    const state: QuizState = { finished: true, answers };

    const report = toAnswersReport(SHORT_TEXT_QUIZ, state);

    expect(report).toEqual({
      quizId: "q1",
      title: "T",
      finished: true,
      items: [
        {
          question: { _kind: "short_text", id: "s1", text: "Name?" },
          answer: answers.s1,
        },
      ],
    });
  });

  it("drops UI-only fields from single_choice questions", () => {
    const quiz: Quiz = {
      id: "q2",
      title: "SC",
      questions: [
        {
          _kind: "single_choice",
          id: "sc",
          title: "Pick one",
          text: "Pick:",
          required: true,
          score: 1,
          mode: "list",
          options: [
            { id: "opt-a", label: "A" },
            { id: "opt-b", label: "B" },
          ],
        },
      ],
    };
    const report = toAnswersReport(quiz, { finished: false, answers: {} });

    expect(report.items[0]!.question).toEqual({
      _kind: "single_choice",
      id: "sc",
      title: "Pick one",
      text: "Pick:",
      options: [
        { id: "opt-a", label: "A" },
        { id: "opt-b", label: "B" },
      ],
    });
    expect(report.items[0]!.question).not.toHaveProperty("mode");
    expect(report.items[0]!.question).not.toHaveProperty("required");
    expect(report.items[0]!.question).not.toHaveProperty("score");
    expect(report.items[0]!.answer).toBeNull();
  });

  it("produced output parses with AnswersReportSchema", () => {
    const answers: Record<string, Answer> = {
      s1: { _kind: "short_text", questionId: "s1", text: "Ada" },
    };
    const report = toAnswersReport(SHORT_TEXT_QUIZ, {
      finished: true,
      answers,
    });

    const parsed = AnswersReportSchema.safeParse(report);
    expect(parsed.success).toBe(true);
  });

  it("includes timing fields and calculates overtime correctly", () => {
    const timedQuiz: Quiz = {
      ...SHORT_TEXT_QUIZ,
      timeLimitSeconds: 300, // 5 minutes
    };

    // Case 1: finished within time (250s)
    const reportWithin = toAnswersReport(timedQuiz, {
      finished: true,
      answers: {},
      timeSpentSeconds: 250,
    });
    expect(reportWithin.timeSpentSeconds).toBe(250);
    expect(reportWithin.targetTimeSeconds).toBe(300);
    expect(reportWithin.overtimeSeconds).toBe(0);
    expect(reportWithin.isOvertime).toBe(false);

    // Case 2: finished overtime (350s -> 50s overtime)
    const reportOvertime = toAnswersReport(timedQuiz, {
      finished: true,
      answers: {},
      timeSpentSeconds: 350,
    });
    expect(reportOvertime.timeSpentSeconds).toBe(350);
    expect(reportOvertime.targetTimeSeconds).toBe(300);
    expect(reportOvertime.overtimeSeconds).toBe(50);
    expect(reportOvertime.isOvertime).toBe(true);

    const parsed = AnswersReportSchema.safeParse(reportOvertime);
    expect(parsed.success).toBe(true);
  });
});

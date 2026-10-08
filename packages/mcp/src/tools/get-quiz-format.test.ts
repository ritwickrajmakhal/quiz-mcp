import { describe, expect, it } from "vitest";
import { getQuizFormatHandler } from "./get-quiz-format.js";

describe("get_quiz_format handler", () => {
  it("returns the Quiz definition JSON Schema as structuredContent (no id; runner assigns it)", async () => {
    const result = await getQuizFormatHandler();

    expect(result.isError).toBeUndefined();
    expect(result.structuredContent).toBeDefined();

    const schema = result.structuredContent!.schema as Record<string, unknown>;
    expect(schema).toBeDefined();
    expect(typeof schema).toBe("object");
    expect(schema.type).toBe("object");
    expect(schema).toHaveProperty("properties.title");
    expect(schema).toHaveProperty("properties.questions");
    expect(schema).not.toHaveProperty("properties.id");
  });

  it("includes a compact JSON Schema under 16000 chars in text content", async () => {
    const result = await getQuizFormatHandler();
    expect(result.content).toHaveLength(1);
    const block = result.content[0];
    expect(block.type).toBe("text");
    const text = (block as { type: "text"; text: string }).text;
    expect(text).toContain("\"type\":\"object\"");
    expect(text.length).toBeLessThan(16000);
    expect(() => JSON.parse(text)).not.toThrow();
  });

  it("filters schema by questionType when provided", async () => {
    const result = await getQuizFormatHandler({ questionType: "single_choice" });
    const text = (result.content[0] as { type: "text"; text: string }).text;
    expect(text.length).toBeLessThan(3500);
    const parsed = JSON.parse(text);
    expect(parsed.properties.questions.items.properties._kind.const).toBe("single_choice");
  });

});

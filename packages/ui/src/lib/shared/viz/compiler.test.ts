import { describe, expect, it } from 'vitest';
import type { QuizDefinition } from '@quiz-mcp/core';
import {
  compileGraphviz,
  compileHtmlCanvas,
  compileMermaid,
  compileSvg,
  compileViz,
  extractVisualAttachments,
  formatVisualErrors,
  stripCodeFences,
  validateQuizVisuals,
} from './compiler.js';

describe('viz compiler', () => {
  describe('stripCodeFences', () => {
    it('removes markdown backticks and language identifiers', () => {
      expect(stripCodeFences('```mermaid\ngraph TD\nA-->B\n```')).toBe('graph TD\nA-->B');
      expect(stripCodeFences('```dot\ndigraph { a -> b }\n```')).toBe('digraph { a -> b }');
      expect(stripCodeFences('```\nhello\n```')).toBe('hello');
      expect(stripCodeFences('  graph TD\n  A-->B  ')).toBe('graph TD\n  A-->B');
    });
  });

  describe('compileMermaid', () => {
    it('successfully compiles valid flowchart', async () => {
      const res = await compileMermaid('graph TD\n  A[Start] --> B[Finish]');
      expect(res.ok).toBe(true);
      expect(res.error).toBeUndefined();
    });

    it('successfully compiles sequenceDiagram', async () => {
      const res = await compileMermaid('sequenceDiagram\n  Alice->>Bob: Hello');
      expect(res.ok).toBe(true);
    });

    it('successfully compiles stateDiagram-v2', async () => {
      const res = await compileMermaid('stateDiagram-v2\n  [*] --> Active\n  Active --> [*]');
      expect(res.ok).toBe(true);
    });

    it('successfully compiles fenced mermaid snippet', async () => {
      const res = await compileMermaid('```mermaid\ngraph LR\n  X --> Y\n```');
      expect(res.ok).toBe(true);
    });

    it('successfully compiles diverse diagram types: class, ER, pie, gitGraph', async () => {
      const diagrams = [
        'classDiagram\n  class Animal { +int age }',
        'erDiagram\n  CUSTOMER ||--o{ ORDER : places',
        'pie title Pets\n  "Dogs" : 386\n  "Cats" : 85',
        'gitGraph\n  commit\n  branch dev\n  checkout dev\n  commit',
      ];
      for (const diag of diagrams) {
        const res = await compileMermaid(diag);
        expect(res.ok).toBe(true);
      }
    });

    it('fails on syntax errors and returns detailed compiler message', async () => {
      const res = await compileMermaid('graph TD\n  [broken node');
      expect(res.ok).toBe(false);
      expect(res.error).toBeDefined();
      expect(res.error).toMatch(/Parse error|Expecting/i);
    });

    it('fails on empty content', async () => {
      const res = await compileMermaid('   \n  ');
      expect(res.ok).toBe(false);
      expect(res.error).toContain('cannot be empty');
    });
  });

  describe('compileGraphviz', () => {
    it('successfully compiles valid DOT graph', async () => {
      const res = await compileGraphviz('digraph BST {\n  8 -> 3;\n  8 -> 10;\n}');
      expect(res.ok).toBe(true);
    });

    it('successfully compiles fenced DOT graph', async () => {
      const res = await compileGraphviz('```dot\ndigraph G { a -> b; }\n```');
      expect(res.ok).toBe(true);
    });

    it('fails on invalid DOT syntax', async () => {
      const res = await compileGraphviz('digraph G { a -> }');
      expect(res.ok).toBe(false);
      expect(res.error).toMatch(/syntax error/i);
    });

    it('fails on empty DOT content', async () => {
      const res = await compileGraphviz('   ');
      expect(res.ok).toBe(false);
      expect(res.error).toContain('cannot be empty');
    });
  });

  describe('compileSvg', () => {
    it('validates SVG element structure', async () => {
      const res = await compileSvg('<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40"/></svg>');
      expect(res.ok).toBe(true);
    });

    it('fails when SVG tags are missing', async () => {
      const res = await compileSvg('<div>Not an SVG</div>');
      expect(res.ok).toBe(false);
      expect(res.error).toContain('<svg>...</svg>');
    });
  });

  describe('compileHtmlCanvas', () => {
    it('validates non-empty canvas content', async () => {
      const res = await compileHtmlCanvas('<canvas id="sim"></canvas>');
      expect(res.ok).toBe(true);
    });

    it('fails when empty', async () => {
      const res = await compileHtmlCanvas('');
      expect(res.ok).toBe(false);
    });
  });

  describe('validateQuizVisuals', () => {
    it('validates a quiz containing valid Mermaid and Graphviz attachments', async () => {
      const quiz: QuizDefinition = {
        title: 'Valid Quiz',
        questions: [
          {
            _kind: 'single_choice',
            id: 'q1',
            text: 'Question with Mermaid',
            options: [{ id: 'opt1', label: 'Option 1' }, { id: 'opt2', label: 'Option 2' }],
            attachments: [
              [
                {
                  id: 'viz1',
                  type: 'viz',
                  engine: 'mermaid',
                  content: 'graph TD\n  Start --> Stop',
                },
              ],
            ],
          },
          {
            _kind: 'single_choice',
            id: 'q2',
            text: 'Question with Graphviz',
            options: [{ id: 'o1', label: 'A' }, { id: 'o2', label: 'B' }],
            attachments: [
              [
                {
                  id: 'viz2',
                  type: 'viz',
                  engine: 'graphviz',
                  content: 'digraph G { node1 -> node2; }',
                },
              ],
            ],
          },
        ],
      };

      const errors = await validateQuizVisuals(quiz);
      expect(errors).toHaveLength(0);
    });

    it('catches and reports Mermaid syntax error in question attachments', async () => {
      const quiz: QuizDefinition = {
        title: 'Broken Quiz',
        questions: [
          {
            _kind: 'single_choice',
            id: 'q-broken-mermaid',
            title: 'Faulty Diagram',
            text: 'What does this diagram show?',
            options: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }],
            attachments: [
              [
                {
                  id: 'viz-mermaid-bad',
                  type: 'viz',
                  engine: 'mermaid',
                  content: 'graph TD\n  A[Broken Node',
                },
              ],
            ],
          },
        ],
      };

      const errors = await validateQuizVisuals(quiz);
      expect(errors).toHaveLength(1);
      expect(errors[0].questionId).toBe('q-broken-mermaid');
      expect(errors[0].attachmentId).toBe('viz-mermaid-bad');
      expect(errors[0].engine).toBe('mermaid');
      expect(errors[0].message).toMatch(/Parse error|Expecting/i);

      const formatted = formatVisualErrors(errors);
      expect(formatted).toContain('[MERMAID]');
      expect(formatted).toContain('q-broken-mermaid');
      expect(formatted).toContain('viz-mermaid-bad');
    });

    it('catches and reports syntax errors inside option attachments', async () => {
      const quiz: QuizDefinition = {
        title: 'Option Attachment Quiz',
        questions: [
          {
            _kind: 'single_choice',
            id: 'q-opt-viz',
            text: 'Choose the correct diagram',
            options: [
              {
                id: 'opt-bad',
                label: 'Option A',
                attachment: {
                  id: 'viz-opt-1',
                  type: 'viz',
                  engine: 'mermaid',
                  content: 'stateDiagram-v2\n  [*] -->',
                },
              },
              { id: 'opt-good', label: 'Option B' },
            ],
          },
        ],
      };

      const errors = await validateQuizVisuals(quiz);
      expect(errors).toHaveLength(1);
      expect(errors[0].questionId).toBe('q-opt-viz');
      expect(errors[0].attachmentId).toBe('viz-opt-1');
    });
  });
});

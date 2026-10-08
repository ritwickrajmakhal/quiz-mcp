import { describe, expect, it } from 'vitest';
import { AttachmentSchema, VizAttachmentSchema } from './attachment.js';

describe('VizAttachmentSchema', () => {
  it('validates mermaid attachment', () => {
    const input = {
      id: 'viz-mermaid-1',
      type: 'viz',
      engine: 'mermaid',
      content: 'flowchart TD\n  A --> B',
      title: 'Simple Flow',
      height: 400,
    };
    const parsed = VizAttachmentSchema.safeParse(input);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.engine).toBe('mermaid');
    }
  });

  it('validates graphviz attachment', () => {
    const input = {
      id: 'viz-gv-1',
      type: 'viz',
      engine: 'graphviz',
      content: 'digraph BST { 5 -> 3; 5 -> 8; }',
      title: 'Binary Search Tree',
    };
    const parsed = VizAttachmentSchema.safeParse(input);
    expect(parsed.success).toBe(true);
  });

  it('validates svg attachment', () => {
    const input = {
      id: 'viz-svg-1',
      type: 'viz',
      engine: 'svg',
      content: '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" /></svg>',
    };
    const parsed = VizAttachmentSchema.safeParse(input);
    expect(parsed.success).toBe(true);
  });

  it('validates html_canvas attachment', () => {
    const input = {
      id: 'viz-canvas-1',
      type: 'viz',
      engine: 'html_canvas',
      content: '<canvas id="c"></canvas><script>console.log(1);</script>',
      height: 350,
      aspectRatio: '16/9',
    };
    const parsed = VizAttachmentSchema.safeParse(input);
    expect(parsed.success).toBe(true);
  });

  it('validates through AttachmentSchema discriminated union', () => {
    const input = {
      id: 'viz-union-1',
      type: 'viz',
      engine: 'graphviz',
      content: 'digraph G { A -> B; }',
    };
    const parsed = AttachmentSchema.safeParse(input);
    expect(parsed.success).toBe(true);
    if (parsed.success && parsed.data.type === 'viz') {
      expect(parsed.data.engine).toBe('graphviz');
    }
  });

  it('rejects invalid engine', () => {
    const input = {
      id: 'viz-bad-1',
      type: 'viz',
      engine: 'unknown_engine',
      content: 'something',
    };
    const parsed = VizAttachmentSchema.safeParse(input);
    expect(parsed.success).toBe(false);
  });
});

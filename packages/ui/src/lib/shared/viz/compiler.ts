import type { QuizDefinition, VizAttachment } from '@quiz-mcp/core';

export interface VisualSyntaxError {
  questionId: string;
  questionTitle?: string;
  attachmentId: string;
  location: string;
  engine: string;
  message: string;
}

export interface CompileVizResult {
  ok: boolean;
  diagramType?: string;
  error?: string;
}

/**
 * Strips markdown code fences (e.g. ```mermaid ... ``` or ```dot ... ```)
 * from visualization content if present.
 */
export function stripCodeFences(content: string): string {
  const trimmed = content.trim();
  const match = trimmed.match(/^```(?:[a-zA-Z0-9_-]+)?\s*\n?([\s\S]*?)\n?```$/);
  return match ? match[1].trim() : trimmed;
}

let mermaidInstance: any = null;
let mermaidInitialized = false;

async function ensureDomPurifyForNode() {
  try {
    const mod = await import('dompurify');
    const dp = mod.default ?? mod;
    if (dp && typeof (dp as any).addHook !== 'function') {
      (dp as any).addHook = () => {};
    }
    if (dp && typeof (dp as any).sanitize !== 'function') {
      (dp as any).sanitize = (s: any) => s;
    }
  } catch {
    // Ignore if DOMPurify is not present in runtime environment
  }
}

export async function getMermaidInstance() {
  if (!mermaidInstance) {
    await ensureDomPurifyForNode();
    const mod = await import('mermaid');
    mermaidInstance = mod.default ?? mod;
    if (!mermaidInitialized && typeof mermaidInstance.initialize === 'function') {
      mermaidInstance.initialize({
        startOnLoad: false,
        suppressErrorRendering: true,
        securityLevel: 'loose',
      });
      mermaidInitialized = true;
    }
  }
  return mermaidInstance;
}

export async function compileMermaid(rawContent: string): Promise<CompileVizResult> {
  const content = stripCodeFences(rawContent);
  if (!content) {
    return { ok: false, error: 'Mermaid diagram content cannot be empty.' };
  }

  try {
    const mermaid = await getMermaidInstance();
    const res = await mermaid.parse(content);
    return { ok: true, diagramType: res?.diagramType };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg };
  }
}

let graphvizInstance: any = null;

export async function getGraphvizInstance() {
  if (!graphvizInstance) {
    const { instance } = await import('@viz-js/viz');
    graphvizInstance = await instance();
  }
  return graphvizInstance;
}

export async function compileGraphviz(rawContent: string): Promise<CompileVizResult> {
  const content = stripCodeFences(rawContent);
  if (!content) {
    return { ok: false, error: 'Graphviz DOT content cannot be empty.' };
  }

  try {
    const viz = await getGraphvizInstance();
    viz.renderString(content);
    return { ok: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg };
  }
}

export async function compileSvg(rawContent: string): Promise<CompileVizResult> {
  const content = stripCodeFences(rawContent);
  if (!content) {
    return { ok: false, error: 'SVG content cannot be empty.' };
  }
  if (!content.includes('<svg') || !content.includes('</svg>')) {
    return { ok: false, error: 'SVG content must contain <svg>...</svg> elements.' };
  }
  return { ok: true };
}

export async function compileHtmlCanvas(rawContent: string): Promise<CompileVizResult> {
  const content = stripCodeFences(rawContent);
  if (!content) {
    return { ok: false, error: 'HTML/Canvas content cannot be empty.' };
  }
  return { ok: true };
}

export async function compileViz(attachment: VizAttachment): Promise<CompileVizResult> {
  switch (attachment.engine) {
    case 'mermaid':
      return compileMermaid(attachment.content);
    case 'graphviz':
      return compileGraphviz(attachment.content);
    case 'svg':
      return compileSvg(attachment.content);
    case 'html_canvas':
      return compileHtmlCanvas(attachment.content);
    default: {
      return {
        ok: false,
        error: `Unknown visualization engine: "${(attachment as any).engine}". Supported engines: mermaid, graphviz, svg, html_canvas.`,
      };
    }
  }
}

export interface VisualAttachmentLocation {
  questionId: string;
  questionTitle?: string;
  location: string;
  attachment: VizAttachment;
}

export function extractVisualAttachments(quiz: QuizDefinition): VisualAttachmentLocation[] {
  const list: VisualAttachmentLocation[] = [];

  function checkAttachment(att: unknown, qId: string, qTitle: string | undefined, loc: string) {
    if (att && typeof att === 'object' && 'type' in att && (att as any).type === 'viz') {
      list.push({
        questionId: qId,
        questionTitle: qTitle,
        location: loc,
        attachment: att as VizAttachment,
      });
    }
  }

  if (Array.isArray(quiz?.questions)) {
    for (const q of quiz.questions) {
      if (!q || typeof q !== 'object') continue;
      const qRecord = q as Record<string, unknown>;
      const qId = String(qRecord.id ?? 'unknown');
      const qTitle = typeof qRecord.title === 'string' ? qRecord.title : undefined;

      // 1. Check question attachments: array of arrays or flat array
      if (Array.isArray(qRecord.attachments)) {
        for (let rowIdx = 0; rowIdx < qRecord.attachments.length; rowIdx++) {
          const row = qRecord.attachments[rowIdx];
          if (Array.isArray(row)) {
            for (let colIdx = 0; colIdx < row.length; colIdx++) {
              checkAttachment(row[colIdx], qId, qTitle, `question "${qId}" attachments[${rowIdx}][${colIdx}]`);
            }
          } else {
            checkAttachment(row, qId, qTitle, `question "${qId}" attachments[${rowIdx}]`);
          }
        }
      }

      // 2. Check single attachment property if present
      if (qRecord.attachment) {
        checkAttachment(qRecord.attachment, qId, qTitle, `question "${qId}" attachment`);
      }

      // 3. Check options attachments
      if (Array.isArray(qRecord.options)) {
        for (let optIdx = 0; optIdx < qRecord.options.length; optIdx++) {
          const opt = qRecord.options[optIdx];
          if (opt && typeof opt === 'object') {
            const optRecord = opt as Record<string, unknown>;
            if (optRecord.attachment) {
              const optId = optRecord.id ?? optIdx;
              checkAttachment(
                optRecord.attachment,
                qId,
                qTitle,
                `question "${qId}" option "${optId}" attachment`,
              );
            }
          }
        }
      }
    }
  }

  return list;
}

export async function validateQuizVisuals(quiz: QuizDefinition): Promise<VisualSyntaxError[]> {
  const items = extractVisualAttachments(quiz);
  const errors: VisualSyntaxError[] = [];

  for (const item of items) {
    const res = await compileViz(item.attachment);
    if (!res.ok) {
      errors.push({
        questionId: item.questionId,
        questionTitle: item.questionTitle,
        attachmentId: item.attachment.id,
        location: item.location,
        engine: item.attachment.engine,
        message: res.error || 'Unknown syntax error',
      });
    }
  }

  return errors;
}

export function formatVisualErrors(errors: VisualSyntaxError[]): string {
  if (errors.length === 0) return '';
  const lines = ['Visualization compilation/syntax errors found:'];
  for (const err of errors) {
    lines.push(
      `• [${err.engine.toUpperCase()}] at ${err.location} (attachment id: "${err.attachmentId}"):`,
      `  ${err.message.split('\n').join('\n  ')}`,
    );
  }
  lines.push('Please correct the diagram syntax before starting the quiz.');
  return lines.join('\n');
}

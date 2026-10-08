import type { Quiz } from '@quiz-mcp/core';

export const MOCK_QUIZ: Quiz = {
  id: 'mock-quiz-1',
  title: 'Mock runner smoke quiz',
  description: 'Lorem ipsum dolor sit amet',
  questions: [
    {
      _kind: 'single_choice',
      id: 'q-sc-1',
      title: 'Favorite beverage',
      text: 'Pick your favorite beverage.',
      required: true,
      score: 1,
      mode: 'list',
      options: [
        { id: 'opt-tea', label: 'Tea' },
        { id: 'opt-coffee', label: 'Coffee' },
        { id: 'opt-water', label: 'Water' },
      ],
    },
    {
      _kind: 'short_text',
      id: 'q-st-1',
      title: 'Your name',
      text: 'What is your name?',
      required: true,
      score: 1,
      placeholder: 'Type your name',
      maxLength: 40,
    },
    {
      _kind: 'multiple_choice',
      id: 'q-mc-1',
      title: 'Work languages',
      text: 'Which languages do you use at work?',
      required: false,
      score: 1,
      mode: 'list',
      options: [
        { id: 'opt-ts', label: 'TypeScript' },
        { id: 'opt-go', label: 'Go' },
        { id: 'opt-py', label: 'Python' },
        { id: 'opt-rs', label: 'Rust' },
      ],
    },
    {
      _kind: 'single_choice',
      id: 'q-viz-bst',
      title: 'Binary Search Tree Traversal',
      text: 'Examine the Binary Search Tree below. What is its **in-order traversal**?',
      required: true,
      score: 2,
      mode: 'list',
      attachments: [
        [
          {
            id: 'bst-attachment',
            type: 'viz',
            engine: 'graphviz',
            title: 'Figure 1: Binary Search Tree (BST)',
            content: `digraph BST {
              graph [nodesep=0.35, ranksep=0.35, pad="0.2"];
              node [shape=circle, width=0.45, height=0.45, fixedsize=true, fontsize=12, style=filled, fillcolor="#e0e7ff", color="#4338ca", fontname="sans-serif", fontcolor="#1e1b4b", penwidth=1.5];
              edge [color="#6366f1", penwidth=1.2, arrowsize=0.7];
              bgcolor="transparent";
              8 -> 3;
              8 -> 10;
              3 -> 1;
              3 -> 6;
              6 -> 4;
              6 -> 7;
              10 -> 14;
              14 -> 13;
            }`,
          },
        ],
      ],
      options: [
        { id: 'bst-a', label: '1, 3, 4, 6, 7, 8, 10, 13, 14' },
        { id: 'bst-b', label: '8, 3, 1, 6, 4, 7, 10, 14, 13' },
        { id: 'bst-c', label: '1, 4, 7, 6, 3, 13, 14, 10, 8' },
        { id: 'bst-d', label: '8, 3, 10, 1, 6, 14, 4, 7, 13' },
      ],
    },
    {
      _kind: 'single_choice',
      id: 'q-viz-mermaid',
      title: 'State Transition Diagram',
      text: 'Based on the state machine diagram below, what is the sequence required to transition from **Pending** to **Completed**?',
      required: true,
      score: 1,
      mode: 'list',
      attachments: [
        [
          {
            id: 'state-attachment',
            type: 'viz',
            engine: 'mermaid',
            title: 'Figure 2: Task Lifecycle State Machine',
            content: `stateDiagram-v2
              [*] --> Pending
              Pending --> InProgress: Start
              InProgress --> InReview: Submit
              InReview --> InProgress: Reject
              InReview --> Completed: Approve
              Completed --> [*]`,
          },
        ],
      ],
      options: [
        { id: 'sm-a', label: 'Start -> Submit -> Approve' },
        { id: 'sm-b', label: 'Start -> Reject -> Approve' },
        { id: 'sm-c', label: 'Submit -> Start -> Approve' },
      ],
    },
    {
      _kind: 'single_choice',
      id: 'q-viz-svg',
      title: 'Cartesian Coordinate Geometry',
      text: 'The vector diagram below shows point $P(3, 4)$ on the Cartesian plane. What is the length of vector $\\vec{OP}$ from the origin?',
      required: true,
      score: 2,
      mode: 'list',
      attachments: [
        [
          {
            id: 'svg-attachment',
            type: 'viz',
            engine: 'svg',
            title: 'Figure 3: Cartesian Coordinate Vector',
            content: `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" style="background:#f8fafc; border-radius:8px;">
              <!-- Grid -->
              <defs>
                <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#e2e8f0" stroke-width="1"/>
                </pattern>
                <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b"/>
                </marker>
                <marker id="varrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6"/>
                </marker>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              <!-- Axes -->
              <line x1="50" y1="250" x2="350" y2="250" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)"/>
              <line x1="50" y1="250" x2="50" y2="30" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)"/>
              <text x="355" y="255" font-family="sans-serif" font-size="14" fill="#64748b">x</text>
              <text x="45" y="25" font-family="sans-serif" font-size="14" fill="#64748b">y</text>
              <text x="35" y="265" font-family="sans-serif" font-size="12" fill="#64748b">O</text>
              <!-- Vector OP (3 units = 90px, 4 units = 120px) -->
              <line x1="50" y1="250" x2="140" y2="130" stroke="#3b82f6" stroke-width="3" marker-end="url(#varrow)"/>
              <!-- Dashed lines -->
              <line x1="140" y1="250" x2="140" y2="130" stroke="#94a3b8" stroke-dasharray="4" stroke-width="1.5"/>
              <line x1="50" y1="130" x2="140" y2="130" stroke="#94a3b8" stroke-dasharray="4" stroke-width="1.5"/>
              <circle cx="140" cy="130" r="4" fill="#1d4ed8"/>
              <text x="150" y="125" font-family="sans-serif" font-size="13" font-weight="bold" fill="#1e293b">P(3, 4)</text>
              <text x="135" y="270" font-family="sans-serif" font-size="12" fill="#64748b">3</text>
              <text x="30" y="135" font-family="sans-serif" font-size="12" fill="#64748b">4</text>
            </svg>`,
          },
        ],
      ],
      options: [
        { id: 'v-5', label: '$5$' },
        { id: 'v-7', label: '$7$' },
        { id: 'v-25', label: '$25$' },
        { id: 'v-root7', label: '$\\sqrt{7}$' },
      ],
    },
    {
      _kind: 'single_choice',
      id: 'q-viz-canvas',
      title: 'Dynamic Data Simulation',
      text: 'The animated chart below simulates a 2D particle distribution. Which quadrant contains the center of mass?',
      required: false,
      score: 1,
      mode: 'list',
      attachments: [
        [
          {
            id: 'canvas-attachment',
            type: 'viz',
            engine: 'html_canvas',
            height: 250,
            title: 'Figure 4: Dynamic Canvas 2D Scatter Simulation',
            content: `<canvas id="sim" width="360" height="220" style="background:#0f172a; border-radius:8px;"></canvas>
            <script>
              const canvas = document.getElementById("sim");
              const ctx = canvas.getContext("2d");
              const pts = Array.from({length: 40}, () => ({
                x: 180 + (Math.random() * 120 - 40),
                y: 110 + (Math.random() * 80 - 60),
                r: Math.random() * 3 + 2,
                color: Math.random() > 0.5 ? '#38bdf8' : '#818cf8'
              }));
              function draw() {
                ctx.clearRect(0, 0, 360, 220);
                // Axes
                ctx.strokeStyle = '#334155';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(180, 0); ctx.lineTo(180, 220);
                ctx.moveTo(0, 110); ctx.lineTo(360, 110);
                ctx.stroke();
                // Points
                pts.forEach(p => {
                  ctx.fillStyle = p.color;
                  ctx.beginPath();
                  ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                  ctx.fill();
                });
              }
              draw();
            <\/script>`,
          },
        ],
      ],
      options: [
        { id: 'quad-1', label: 'Quadrant I ($x > 0, y > 0$)' },
        { id: 'quad-2', label: 'Quadrant II ($x < 0, y > 0$)' },
        { id: 'quad-3', label: 'Quadrant III ($x < 0, y < 0$)' },
        { id: 'quad-4', label: 'Quadrant IV ($x > 0, y < 0$)' },
      ],
    },
  ],
};

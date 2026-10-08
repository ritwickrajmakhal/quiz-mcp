import { useEffect, useRef, useState } from "hono/jsx/dom";

export const CalculatorWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [calcSize, setCalcSize] = useState<{ width: number; height: number }>({
    width: 465,
    height: 356,
  });

  const dragRef = useRef<{
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (!e.data || typeof e.data !== "object") return;
      const { type, dx, dy, screenX, screenY, width: w, height: h } = e.data;

      if (type === "CALCULATOR_CLOSE") {
        setIsOpen(false);
      } else if (type === "CALCULATOR_MINIMIZE") {
        setIsMinimized(true);
      } else if (type === "CALCULATOR_MAXIMIZE") {
        setIsMinimized(false);
      } else if (type === "CALCULATOR_RESIZE") {
        if (typeof w === "number" && typeof h === "number" && w > 0 && h > 0) {
          setCalcSize({ width: w, height: h });
        }
      } else if (type === "CALCULATOR_DRAG_START") {
        const el = containerRef.current;
        const rect = el ? el.getBoundingClientRect() : { left: window.innerWidth - 500, top: 100 };
        dragRef.current = {
          startX: screenX ?? 0,
          startY: screenY ?? 0,
          initialX: position?.x ?? rect.left,
          initialY: position?.y ?? rect.top,
        };
        setIsDragging(true);
      } else if (type === "CALCULATOR_DRAG_MOVE") {
        if (typeof dx === "number" && typeof dy === "number") {
          setPosition((prev) => {
            const currentEl = containerRef.current;
            const currentRect = currentEl ? currentEl.getBoundingClientRect() : { left: window.innerWidth - 500, top: 100 };
            const curX = prev?.x ?? currentRect.left;
            const curY = prev?.y ?? currentRect.top;
            const currentW = calcSize.width || (isMinimized ? 202 : 465);
            const currentH = calcSize.height || (isMinimized ? 44 : 356);
            const newX = Math.max(10, Math.min(window.innerWidth - currentW - 10, curX + dx));
            const newY = Math.max(10, Math.min(window.innerHeight - currentH - 10, curY + dy));
            return { x: newX, y: newY };
          });
        }
      } else if (type === "CALCULATOR_DRAG_END") {
        setIsDragging(false);
        dragRef.current = null;
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("message", handleMessage);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("message", handleMessage);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, position, isMinimized, calcSize]);

  return (
    <aside aria-label="Scientific Calculator" class="print:hidden">
      {/* Floating Toggle Button (icon only) */}
      <button
        type="button"
        onClick={() => {
          if (!isOpen) {
            setIsMinimized(false);
          }
          setIsOpen((prev) => !prev);
        }}
        class="fixed bottom-6 right-6 z-40 flex items-center justify-center w-12 h-12 rounded-full bg-base-100 text-base-content border border-base-300 shadow-xl hover:bg-base-200 hover:scale-105 active:scale-95 transition-all duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        title="Scientific Calculator"
        aria-label="Scientific Calculator"
        aria-expanded={isOpen}
      >
        <span class="text-2xl leading-none select-none" role="img" aria-label="calculator">
          🧮
        </span>
      </button>

      {/* Calculator Window without duplicate outer header or bottom overflow */}
      {isOpen && (
        <div
          ref={containerRef}
          class={`fixed z-50 rounded-md shadow-2xl overflow-hidden ${
            isDragging ? "cursor-move select-none opacity-90" : ""
          }`}
          style={{
            width: `${calcSize.width}px`,
            height: `${calcSize.height}px`,
            background: "transparent",
            lineHeight: 0,
            ...(position
              ? { left: `${position.x}px`, top: `${position.y}px` }
              : { bottom: "5rem", right: "1.5rem" }),
          }}
        >
          <iframe
            src="/assets/calculator/index.html"
            title="TCS iON Scientific Calculator"
            class="w-full h-full border-0 select-none block bg-transparent"
            style={{
              pointerEvents: isDragging ? "none" : "auto",
              display: "block",
            }}
          />
        </div>
      )}
    </aside>
  );
};

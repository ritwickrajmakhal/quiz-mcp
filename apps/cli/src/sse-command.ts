import http from "node:http";
import { URL } from "node:url";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { createQuizMcpServer } from "@quiz-mcp/mcp";
import { createInMemoryQuizService } from "@quiz-mcp/runner-api/in-memory";
import { createRunnerServer } from "@quiz-mcp/runner-api/server";
import { HostedService } from "./hosted-service.js";
import { RunnerHost } from "./runner-host.js";
import { registerStopRunner } from "./stop-runner-tool.js";
import { resolveBundledUiDir } from "./ui-assets.js";

export async function runMcpSse(port = 8765): Promise<void> {
  const inner = createInMemoryQuizService([]);
  const uiAssetsDir = resolveBundledUiDir();
  const host = new RunnerHost(() => createRunnerServer({ service: inner, uiAssetsDir }));
  const hosted = new HostedService(inner, host);

  const transports = new Map<string, SSEServerTransport>();

  const httpServer = http.createServer(async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept");

    if (req.method === "OPTIONS") {
      res.writeHead(200);
      res.end();
      return;
    }

    const parsedUrl = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);

    if (parsedUrl.pathname === "/sse" && req.method === "GET") {
      const transport = new SSEServerTransport("/message", res);
      const server = createQuizMcpServer(hosted, () => host.url);
      registerStopRunner(server, host);

      transports.set(transport.sessionId, transport);
      transport.onclose = () => {
        transports.delete(transport.sessionId);
      };

      await server.connect(transport);
      return;
    }

    if (parsedUrl.pathname === "/message" && req.method === "POST") {
      const sessionId = parsedUrl.searchParams.get("sessionId");
      const transport = sessionId ? transports.get(sessionId) : undefined;
      if (!transport) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Session not found");
        return;
      }
      await transport.handlePostMessage(req, res);
      return;
    }

    if (parsedUrl.pathname === "/healthz" || parsedUrl.pathname === "/") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok", port }));
      return;
    }

    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
  });

  const shutdown = async (): Promise<void> => {
    await host.stop();
    httpServer.close();
    process.exit(0);
  };
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);

  httpServer.listen(port, "0.0.0.0", () => {
    console.error(`[quiz-mcp] Persistent SSE server listening on http://127.0.0.1:${port}/sse`);
  });
}

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";
import cors from "cors";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import pg from "pg";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Load environment variables
config({ path: '../.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Setup external university Database Pool
const univDbConfig = {
  host: process.env.UNIV_DB_HOST,
  port: parseInt(process.env.UNIV_DB_PORT || "5432", 10),
  database: process.env.UNIV_DB_NAME,
  user: process.env.UNIV_DB_USER,
  password: process.env.UNIV_DB_PASS,
};

let univPool: pg.Pool | null = null;
if (univDbConfig.host && univDbConfig.user) {
  univPool = new pg.Pool(univDbConfig);
  univPool.on("error", (err) => console.error("Unexpected error on idle university DB client", err));
}

const app = express();
app.use(cors());
// Do not use global body-parser here, SSEServerTransport handles it directly in handlePostMessage or we can just pass the req.

// Maintain a global map of active transports
const transports = new Map<string, SSEServerTransport>();

// --- Authentication Middleware / Helper ---
async function authenticate(req: express.Request): Promise<string | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.split(" ")[1];

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;

  const { data: profile } = await supabase.from('profiles').select('registration_number').eq('id', user.id).single();
  return profile?.registration_number || null;
}

// --- SSE Connection Endpoint ---
app.get("/mcp/sse", async (req, res) => {
  // 1. Zero-Trust Authentication
  const userRegNo = await authenticate(req);
  if (!userRegNo) {
    res.status(401).send("Unauthorized: Invalid JWT or Registration Number not found.");
    return;
  }

  // 2. Create an isolated Server instance strictly for this user
  const server = new Server({ name: "kiliguide-mcp-secure", version: "1.2.0" }, { capabilities: { tools: {} } });

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      { name: "get_latest_notices", description: "Get the most recent university notices.", inputSchema: { type: "object", properties: { limit: { type: "number", description: "Max notices (default 5)" } } } },
      // Notice: NO registration_number argument! The AI cannot spoof it!
      { name: "get_student_grades", description: "Fetch your official grades/transcript.", inputSchema: { type: "object", properties: {} } },
      { name: "get_fee_balance", description: "Fetch your current fee balance.", inputSchema: { type: "object", properties: {} } },
      { name: "get_library_loans", description: "Fetch your borrowed books and due dates.", inputSchema: { type: "object", properties: {} } }
    ]
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    // Basic Supabase Tools
    if (request.params.name === "get_latest_notices") {
      const limit = (request.params.arguments?.limit as number) || 5;
      const { data, error } = await supabase.from('notices').select('title, content, created_at').order('created_at', { ascending: false }).limit(limit);
      if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }

    // --- High-Security University DB Tools ---
    if (["get_student_grades", "get_fee_balance", "get_library_loans"].includes(request.params.name)) {
      if (!univPool) {
        return { content: [{ type: "text", text: "University database connection is not currently configured. Please contact administration." }], isError: false };
      }

      try {
        // We use the implicitly derived, authenticated userRegNo! NEVER an argument from the AI!
        if (request.params.name === "get_student_grades") {
          const { rows } = await univPool.query("SELECT course_code, course_name, semester, grade FROM student_grades WHERE registration_number = $1 ORDER BY semester DESC", [userRegNo]);
          return { content: [{ type: "text", text: JSON.stringify(rows.length ? rows : { status: "No grades found." }, null, 2) }] };
        }
        if (request.params.name === "get_fee_balance") {
          const { rows } = await univPool.query("SELECT total_billed, total_paid, balance, last_payment_date FROM student_finances WHERE registration_number = $1", [userRegNo]);
          return { content: [{ type: "text", text: JSON.stringify(rows.length ? rows[0] : { status: "No records found." }, null, 2) }] };
        }
        if (request.params.name === "get_library_loans") {
          const { rows } = await univPool.query("SELECT book_title, borrowed_date, due_date, status FROM library_loans WHERE registration_number = $1 AND status != 'Returned'", [userRegNo]);
          return { content: [{ type: "text", text: JSON.stringify(rows.length ? rows : { status: "No active loans." }, null, 2) }] };
        }
      } catch (err: any) {
        return { content: [{ type: "text", text: `Database query failed: ${err.message}` }], isError: true };
      }
    }
    throw new Error(`Tool not found: ${request.params.name}`);
  });

  // 3. Connect the SSE Transport
  const transport = new SSEServerTransport("/mcp/messages", res);
  await server.connect(transport);
  
  transports.set(transport.sessionId, transport);

  req.on('close', () => {
    transports.delete(transport.sessionId);
  });
});

// --- Incoming Messages Endpoint ---
app.post("/mcp/messages", async (req, res) => {
  const sessionId = req.query.sessionId as string;
  const transport = transports.get(sessionId);
  if (!transport) {
    res.status(404).send("Session not found");
    return;
  }
  await transport.handlePostMessage(req, res);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`KiliGuide Secure MCP Server running on HTTP port ${PORT}`);
  console.log(`SSE Endpoint: http://localhost:${PORT}/mcp/sse`);
});

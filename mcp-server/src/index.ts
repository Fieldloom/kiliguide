#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import pg from "pg";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
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
  univPool.on("error", (err) => {
    console.error("Unexpected error on idle university DB client", err);
  });
}

const server = new Server(
  {
    name: "kiliguide-mcp",
    version: "1.1.0",
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

// 1. Resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: "kiliguide://directory/staff",
        name: "Staff Directory",
        mimeType: "text/plain",
        description: "List of staff members and their departments at DeKUT.",
      },
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  if (request.params.uri === "kiliguide://directory/staff") {
    return {
      contents: [
        {
          uri: request.params.uri,
          mimeType: "text/plain",
          text: "Dr. Smith (Computer Science) - smith@dekut.ac.ke\nProf. Jane (Engineering) - jane@dekut.ac.ke",
        },
      ],
    };
  }
  throw new Error(`Resource not found: ${request.params.uri}`);
});

// 2. Tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_latest_notices",
        description: "Get the most recent university notices and announcements.",
        inputSchema: {
          type: "object",
          properties: {
            limit: { type: "number", description: "Maximum number of notices to return (default 5)" },
          },
        },
      },
      {
        name: "get_timetable",
        description: "Get the timetable for a specific student.",
        inputSchema: {
          type: "object",
          properties: {
            student_email: { type: "string", description: "The email address of the student" },
          },
          required: ["student_email"],
        },
      },
      {
        name: "get_student_grades",
        description: "Fetch a student's official grades/transcript from the university database.",
        inputSchema: {
          type: "object",
          properties: {
            registration_number: { type: "string", description: "The student's registration number (e.g. C026-01-0000/2021)" },
          },
          required: ["registration_number"],
        },
      },
      {
        name: "get_fee_balance",
        description: "Fetch a student's current financial fee balance from the university billing system.",
        inputSchema: {
          type: "object",
          properties: {
            registration_number: { type: "string", description: "The student's registration number" },
          },
          required: ["registration_number"],
        },
      },
      {
        name: "get_library_loans",
        description: "Fetch a student's borrowed books and due dates from the library database.",
        inputSchema: {
          type: "object",
          properties: {
            registration_number: { type: "string", description: "The student's registration number" },
          },
          required: ["registration_number"],
        },
      }
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "get_latest_notices") {
    const limit = (request.params.arguments?.limit as number) || 5;
    const { data, error } = await supabase.from('notices').select('title, content, created_at').order('created_at', { ascending: false }).limit(limit);
    if (error) return { content: [{ type: "text", text: `Error fetching notices: ${error.message}` }], isError: true };
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }

  if (request.params.name === "get_timetable") {
    const email = request.params.arguments?.student_email as string;
    if (!email) return { content: [{ type: "text", text: "student_email is required" }], isError: true };
    return { content: [{ type: "text", text: `Timetable for ${email}: \nMonday 8am: Computer Networks (Room 304)\nTuesday 10am: Software Engineering (Lab 2)` }] };
  }

  // --- External University DB Tools ---

  if (request.params.name === "get_student_grades" || request.params.name === "get_fee_balance" || request.params.name === "get_library_loans") {
    const regNo = request.params.arguments?.registration_number as string;
    if (!regNo) return { content: [{ type: "text", text: "registration_number is required" }], isError: true };

    if (!univPool) {
      return { 
        content: [{ type: "text", text: `University database connection is not currently configured. Please contact administration to securely link the on-premise database.` }],
        isError: false // Returning false error so AI can answer gracefully
      };
    }

    try {
      if (request.params.name === "get_student_grades") {
        const { rows } = await univPool.query("SELECT course_code, course_name, semester, grade FROM student_grades WHERE registration_number = $1 ORDER BY semester DESC", [regNo]);
        return { content: [{ type: "text", text: JSON.stringify(rows.length ? rows : { status: "No grades found for this registration number." }, null, 2) }] };
      }
      
      if (request.params.name === "get_fee_balance") {
        const { rows } = await univPool.query("SELECT total_billed, total_paid, balance, last_payment_date FROM student_finances WHERE registration_number = $1", [regNo]);
        return { content: [{ type: "text", text: JSON.stringify(rows.length ? rows[0] : { status: "No financial records found." }, null, 2) }] };
      }

      if (request.params.name === "get_library_loans") {
        const { rows } = await univPool.query("SELECT book_title, borrowed_date, due_date, status FROM library_loans WHERE registration_number = $1 AND status != 'Returned'", [regNo]);
        return { content: [{ type: "text", text: JSON.stringify(rows.length ? rows : { status: "No active library loans." }, null, 2) }] };
      }
    } catch (err: any) {
      return { content: [{ type: "text", text: `Database query failed: ${err.message}` }], isError: true };
    }
  }

  throw new Error(`Tool not found: ${request.params.name}`);
});

// Start the server
async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("KiliGuide MCP Server running on stdio");
}

run().catch(console.error);

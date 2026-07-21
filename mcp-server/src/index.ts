#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
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

const server = new Server(
  {
    name: "kiliguide-mcp",
    version: "1.0.0",
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
    // In a real app, we'd query the DB. For now, a static or simple query.
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
            limit: {
              type: "number",
              description: "Maximum number of notices to return (default 5)",
            },
          },
        },
      },
      {
        name: "get_timetable",
        description: "Get the timetable for a specific student.",
        inputSchema: {
          type: "object",
          properties: {
            student_email: {
              type: "string",
              description: "The email address of the student",
            },
          },
          required: ["student_email"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "get_latest_notices") {
    const limit = (request.params.arguments?.limit as number) || 5;
    
    const { data, error } = await supabase
      .from('notices')
      .select('title, content, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return {
        content: [{ type: "text", text: `Error fetching notices: ${error.message}` }],
        isError: true,
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }

  if (request.params.name === "get_timetable") {
    const email = request.params.arguments?.student_email as string;
    if (!email) {
      return {
        content: [{ type: "text", text: "student_email is required" }],
        isError: true,
      };
    }

    // In a full implementation, we would query the user's courses and their timetables
    // For now, return a placeholder demonstrating the format
    return {
      content: [
        {
          type: "text",
          text: `Timetable for ${email}: \nMonday 8am: Computer Networks (Room 304)\nTuesday 10am: Software Engineering (Lab 2)`,
        },
      ],
    };
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

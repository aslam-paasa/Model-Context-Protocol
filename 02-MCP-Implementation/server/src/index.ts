import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

/* 1. Create server instance */
const server = new McpServer({
  name: "studentportal",
  version: "1.0.0",
});

/* 2. Implementing tool execution */
server.registerTool(
  "get_all_students",
  {
    description: "Get list of all students with their enrollment information",
    inputSchema: {
      limit: z
        .number()
        .optional()
        .describe("Maximum number of students to return."),
    },
  },
  
  async ({ limit }) => {

    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    const lastWeek = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
    const lastMonth = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];

    const students = [
      {
        id: "STU001",
        name: "Rahul Sharma",
        email: "rahul.sharma@gmail.com",
        joinedAt: lastMonth,
      },
      {
        id: "STU002",
        name: "Priya Patel",
        email: "priya.patel@gmail.com",
        joinedAt: lastMonth,
      },
      {
        id: "STU003",
        name: "Amit Kumar",
        email: "amit.kumar@gmail.com",
        joinedAt: lastWeek,
      },
      {
        id: "STU004",
        name: "Sneha Gupta",
        email: "sneha.gupta@gmail.com",
        joinedAt: lastWeek,
      },
      {
        id: "STU005",
        name: "Vikram Singh",
        email: "vikram.singh@gmail.com",
        joinedAt: yesterday,
      },
      {
        id: "STU006",
        name: "Anjali Verma",
        email: "anjali.verma@gmail.com",
        joinedAt: yesterday,
      },
      {
        id: "STU007",
        name: "Rohan Desai",
        email: "rohan.desai@gmail.com",
        joinedAt: today,
      },
      {
        id: "STU008",
        name: "Kavita Reddy",
        email: "kavita.reddy@gmail.com",
        joinedAt: today,
      },
      {
        id: "STU009",
        name: "Arjun Nair",
        email: "arjun.nair@gmail.com",
        joinedAt: today,
      },
      {
        id: "STU010",
        name: "Meera Joshi",
        email: "meera.joshi@gmail.com",
        joinedAt: lastWeek,
      },
      {
        id: "STU011",
        name: "Sanjay Mishra",
        email: "sanjay.mishra@gmail.com",
        joinedAt: lastMonth,
      },
      {
        id: "STU012",
        name: "Divya Saxena",
        email: "divya.saxena@gmail.com",
        joinedAt: today,
      },
    ];

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(students.slice(0, limit)),
        },
      ],
    };
  },
);


/* 3. Running the Server: npm run build */
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Student Portal MCP Server running on stdio");
  }
  
  main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
  });


/**
 * 4. Register your server with Claude Desktop:
 *    - Open VS Code 
 *    - Go to terminal & run the file: code $env:AppData\Claude\claude_desktop_config.json
 *    - New file opened:
 *      {
 *        "mcpServers": {
 *          "weather": {
 *            "command": "node",
 *            "args": ["C:\\PATH\\TO\\PARENT\\FOLDER\\weather\\build\\index.js"]
 *          }
 *        }
 *      }
 *    - Edit the file:
 *      {
 *        "mcpServers": {
 *          "studentportal": {
 *            "command": "node",
 *            "args": ["C:\Users\aslam\OneDrive\Documents\Bootcamp-1.0\Week-15\Master-the-Art-of-Building-AI-Products\17-Working-with-MCP\02-MCP-Implementation\server\dist\index.js"]
 *          }
 *        }
 *      }
 *    - Restart Claude & check connectors
 * 
 * Note: Similarly we can use MCP in other apps like Cursor App.
*/
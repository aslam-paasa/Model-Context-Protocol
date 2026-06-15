/**
 * MCP — Model Context Protocol
 * 1.  What is MCP? ..................... AI tools se connect karne ka standard
 * 2.  Problem Before MCP ............... Har tool ke liye alag integration
 * 3.  How AI Agents Work (Context) ..... Tools kaise describe karte hain
 * 4.  MCP Architecture ................. Host, Client, Server
 * 5.  MCP vs Direct API Calls .......... Fark kya hai
 * 6.  MCP Primitives ................... Tools, Resources, Prompts
 * 7.  How a Tool Call Works ............ Step by step flow
 * 8.  Real-World Example ............... File system + GitHub MCP
 * 9.  MCP Transport Layer .............. Stdio vs HTTP/SSE
 * 10. Popular MCP Servers .............. Ready-made integrations
 * 11. Golden Rules ..................... Key principles to remember
 */


/**
 * Part-1: WHAT IS MCP?
 */

/**
 * AI Assistants Ko Systems Se Jodne Ka Standard
 * ────────────────────────────────────────────────
 * 
 *   MCP = Model Context Protocol.
 *   Ye ek standard hai jo AI assistants ko real-world tools aur data se connect karta hai.
 *   Jaise USB ek standard hai — koi bhi device kisi bhi computer se connect kar lo.
 *   MCP bhi aisa hi karta hai — koi bhi AI model, kisi bhi tool se connect kar lo.
 *
 * FULL FORM: Model Context Protocol
 *
 * CREATED BY: Anthropic (2024)
 *
 * DEFINITION:
 *   MCP is a standard protocol for connecting AI assistants to the systems
 *   where data lives — including:
 *   → Content repositories (files, databases)
 *   → Business tools (GitHub, Slack, Jira, Google Drive)
 *   → Development environments (terminals, editors)
 *   → External APIs and services
 *
 * SIMPLE ANALOGY:
 *
 *   WITHOUT MCP:                             WITH MCP:
 *   ┌──────────┐                            ┌──────────┐
 *   │ AI Model │──custom code──► GitHub     │ AI Model │──MCP──► Any Tool
 *   │          │──custom code──► Slack      │          │
 *   │          │──custom code──► Files      └──────────┘
 *   │          │──custom code──► DB              │
 *   └──────────┘                            MCP Protocol
 *   (different glue for each tool)      (one standard for all)
 *
 * CORE IDEA:
 *   Instead of writing custom integration code for EVERY tool,
 *   MCP provides ONE standard way to connect AI to ANY tool.
 *   Just like HTTP is the standard for web communication —
 *   MCP is the standard for AI ↔ Tool communication.
 */


/**
 * Part-2: PROBLEM BEFORE MCP
 */

/**
 * Pehle Kya Problem Thi
 * ──────────────────────
 * 
 *   Pehle har AI tool ke liye alag custom code likhna padta tha.
 *   10 tools = 10 alag integrations = bahut maintenance.
 *   Ek tool ka API change ho → sab kuch fix karo.
 *   MCP ne ye problem solve kiya — ek standard, sab ke liye.
 *
 * BEFORE MCP — The M×N Problem:
 *
 *   M = Number of AI Models  (GPT-4, Claude, Gemini, Llama...)
 *   N = Number of Tools      (GitHub, Slack, Files, DB, Jira...)
 *
 *   Each model needed custom integration for each tool:
 *
 *   GPT-4  ──custom──► GitHub
 *   GPT-4  ──custom──► Slack
 *   GPT-4  ──custom──► Files
 *   Claude ──custom──► GitHub   ← separate code again!
 *   Claude ──custom──► Slack    ← separate code again!
 *   Gemini ──custom──► GitHub   ← separate code again!
 *
 *   M models × N tools = M×N custom integrations
 *   Example: 5 models × 20 tools = 100 custom integrations!
 *
 * PROBLEMS THIS CAUSED:
 *   → Each integration written differently
 *   → Duplicate effort for every model + tool combination
 *   → Tool API changes → must fix every integration
 *   → Hard to maintain, hard to scale
 *   → No standard for error handling, auth, streaming
 *
 * AFTER MCP — M+N Problem:
 *
 *   Each model implements MCP CLIENT  (once per model)
 *   Each tool implements MCP SERVER   (once per tool)
 *
 *   GPT-4  ──MCP──┐
 *   Claude ──MCP──┼──► MCP Server ──► GitHub
 *   Gemini ──MCP──┘
 *
 *   M models + N tools = M+N implementations
 *   Example: 5 models + 20 tools = 25 total implementations!
 *   From 100 to 25 — massive reduction in complexity.
 */


/**
 * Part-3: HOW AI AGENTS WORK — Tool Context
 */

/**
 * AI Ko Tools Ke Baare Mein Kaise Batate Hain
 * ──────────────────────────────────────────────
 * 
 *   AI model akela kuch nahi kar sakta — use batana padta hai ki kaun kaun se tools available hain.
 *   Ye "tool definitions" system prompt ya special parameter ke through diye jaate hain.
 *   Har AI provider ka apna format hai — lekin concept same hai.
 *
 * EVERY AI AGENT NEEDS "TOOL CONTEXT":
 *   The AI needs to know:
 *   → What tools are available?
 *   → What does each tool do?
 *   → What inputs does each tool need?
 *   → What output does each tool return?
 *
 * HOW DIFFERENT AI PROVIDERS ACCEPT TOOLS:
 *
 *   ┌──────────────────┬──────────────────────────────────────────┐
 *   │ Provider         │ How tools are passed                     │
 *   ├──────────────────┼──────────────────────────────────────────┤
 *   │ OpenAI (GPT)     │ tools: []  parameter in API call         │
 *   │ Google (Gemini)  │ available_tools: []  parameter           │
 *   │ Anthropic(Claude)│ functions: []  / tools: [] parameter     │
 *   └──────────────────┴──────────────────────────────────────────┘
 *
 * EXAMPLE: Telling AI about a "get_weather" tool (OpenAI format)
 *
 *   {
 *     "model": "gpt-4",
 *     "messages": [...],
 *     "tools": [
 *       {
 *         "type": "function",
 *         "function": {
 *           "name": "get_weather",
 *           "description": "Get current weather for a city",
 *           "parameters": {
 *             "type": "object",
 *             "properties": {
 *               "city": {
 *                 "type": "string",
 *                 "description": "City name, e.g. Mumbai"
 *               }
 *             },
 *             "required": ["city"]
 *           }
 *         }
 *       }
 *     ]
 *   }
 *
 * WHAT HAPPENS NEXT:
 *   1. User asks: "What's the weather in Mumbai?"
 *   2. AI reads the tool definition
 *   3. AI decides: "I should call get_weather with city='Mumbai'"
 *   4. AI returns a TOOL CALL (not a text answer)
 *   5. Your code executes the actual weather API
 *   6. Result sent back to AI
 *   7. AI formulates a natural language answer
 *
 * THE PROBLEM:
 *   Without MCP — YOU have to manually:
 *   → Write tool definitions for each tool
 *   → Execute the actual tool call
 *   → Pass results back to AI
 *   → Handle errors, retries, auth
 *
 *   With MCP — the MCP SERVER handles all of this automatically.
 */


/**
 * Part-4: MCP ARCHITECTURE
 */

/**
 * Teen Parts: Host, Client, Server
 * ──────────────────────────────────
 * 
 *   MCP ke 3 main components hain.
 *   Host = jo app AI use karta hai (Claude Desktop, VS Code).
 *   Client = MCP connection manager (host ke andar hota hai).
 *   Server = tool provider jo actual kaam karta hai.
 *
 * MCP has THREE main components:
 *
 *   ┌─────────────────────────────────────────────────────────────────┐
 *   │                        HOST APPLICATION                         │
 *   │             (Claude Desktop/VS Code/Your custom app)            │
 *   │                                                                 │
 *   │   ┌─────────────┐                                               │
 *   │   │             │   MCP Protocol                                │
 *   │   │  MCP CLIENT │◄──────────────────► MCP SERVER (GitHub)       │
 *   │   │             │   MCP Protocol                                │
 *   │   │             │◄──────────────────► MCP SERVER (Files)        │
 *   │   │             │   MCP Protocol                                │
 *   │   │             │◄──────────────────► MCP SERVER (Database)     │
 *   │   └─────────────┘                                               │
 *   │         │                                                       │
 *   │         ▼                                                       │
 *   │    AI Model (Claude/GPT/etc.)                                   │
 *   └─────────────────────────────────────────────────────────────────┘
 *
 * 1. HOST:
 *    → The APPLICATION where the user interacts with the AI
 *    → Examples: Claude Desktop, VS Code with Copilot, custom chat app
 *    → The host CONTAINS the MCP client
 *    → Manages multiple MCP server connections
 *
 * 2. MCP CLIENT:
 *    → Lives INSIDE the host application
 *    → Manages connections to MCP servers
 *    → Sends requests to MCP servers
 *    → Receives results and passes them to the AI model
 *    → One client can connect to MANY servers simultaneously
 *
 * 3. MCP SERVER:
 *    → A lightweight program that EXPOSES tools/resources/prompts
 *    → Each server specializes in one domain (GitHub, Files, DB, etc.)
 *    → Handles the actual execution (calls GitHub API, reads files, etc.)
 *    → Returns results back to the MCP client
 *    → Can be local (same machine) or remote (over network)
 *
 * REAL-WORLD MAPPING:
 *
 *   HOST               CLIENT              SERVER
 *   Claude Desktop  →  MCP Manager  →  github-mcp-server
 *                                   →  filesystem-mcp-server
 *                                   →  postgres-mcp-server
 */


/**
 * Part-5: MCP vs DIRECT API CALLS
 */

/**
 * MCP aur Direct API Calls Mein Fark
 * ─────────────────────────────────────
 * 
 *   Direct API call mein tum khud GitHub API call likhte ho.
 *   MCP mein ek server ye kaam karta hai — AI directly server se baat karta hai.
 *   AI ko API keys, endpoints, formats ka dhyan nahi — MCP server sambhalta hai.
 *
 * WITHOUT MCP (Direct API):
 *
 *   User: "Show me open PRs on my repo"
 *         │
 *         ▼
 *   AI Model
 *         │ decides to call GitHub
 *         ▼
 *   Your Code (custom):
 *     - Parse AI's intent
 *     - Build GitHub API request manually
 *     - Handle auth headers (Bearer token)
 *     - Call: GET https://api.github.com/repos/{owner}/{repo}/pulls
 *     - Handle pagination
 *     - Handle errors
 *     - Format response for AI
 *         │
 *         ▼
 *   AI Model (formats answer)
 *         │
 *         ▼
 *   User sees answer
 *
 * WITH MCP:
 *
 *   User: "Show me open PRs on my repo"
 *         │
 *         ▼
 *   AI Model (Claude/GPT)
 *         │ calls MCP tool: list_pull_requests
 *         ▼
 *   MCP Client (in host)
 *         │ forwards to GitHub MCP Server
 *         ▼
 *   GitHub MCP Server:
 *     - Already knows GitHub API
 *     - Already handles auth
 *     - Already handles pagination
 *     - Already handles errors
 *         │
 *         ▼
 *   Result back to MCP Client → AI → User
 *
 * COMPARISON:
 * ┌──────────────────────────┬──────────────────┬───────────────────────┐
 * │ Aspect                   │ Direct API       │ MCP                   │
 * ├──────────────────────────┼──────────────────┼───────────────────────┤
 * │ Who writes the API call  │ You (every time) │ MCP Server (once)     │
 * │ Auth handling            │ You              │ MCP Server            │
 * │ Error handling           │ You              │ MCP Server            │
 * │ Tool discovery           │ Manual           │ Automatic             │
 * │ Adding new tool          │ Write new code   │ Add new MCP server    │
 * │ Works with any AI model  │ NO (custom/each) │ YES (standard)        │
 * └──────────────────────────┴──────────────────┴───────────────────────┘
 */


/**
 * Part-6: MCP PRIMITIVES
 */

/**
 * MCP Ke Teen Main Building Blocks
 * ──────────────────────────────────
 * 
 *   MCP servers teen tarah ki cheezein expose karte hain.
 *   Tools = actions (kuch karo), Resources = data (kuch padho),
 *   Prompts = reusable templates (predefined instructions).
 *
 * MCP servers can expose THREE types of things (primitives):
 *
 * 1. TOOLS — Actions AI Can Take
 * ────────────────────────────────
 * 
 *   Tools = functions jo AI call kar sakta hai — kuch karne ke liye.
 *   Create file, send email, run query, push code — ye sab tools hain.
 *
 *   → Functions that the AI can CALL to perform actions
 *   → Have a name, description, and input schema
 *   → Return a result
 *
 *   Examples:
 *   ┌─────────────────────────────┬──────────────────────────────────────┐
 *   │ Tool Name                   │ What it does                         │
 *   ├─────────────────────────────┼──────────────────────────────────────┤
 *   │ create_file                 │ Creates a new file with content      │
 *   │ send_email                  │ Sends an email via Gmail/SMTP        │
 *   │ run_sql_query               │ Executes SQL on connected DB         │
 *   │ create_github_pr            │ Opens a PR on a GitHub repo          │
 *   │ search_slack_messages       │ Searches Slack workspace             │
 *   │ list_calendar_events        │ Lists upcoming Google Calendar events│
 *   └─────────────────────────────┴──────────────────────────────────────┘
 *
 * 2. RESOURCES — Data AI Can Read
 * ─────────────────────────────────
 * 
 *   Resources = data jo AI padh sakta hai — files, DB rows, logs, etc.
 *   File system ka content, database ki rows — ye sab resources hain.
 *   Read-only hote hain — AI sirf padh sakta hai, change nahi karta.
 *
 *   → Data sources the AI can READ
 *   → Identified by a URI (like a file path or URL)
 *   → Static or dynamic content
 *
 *   Examples:
 *   → file:///home/user/project/README.md
 *   → db://postgres/users_table
 *   → github://owner/repo/issues
 *   → slack://channel/general/recent_messages
 *
 * 3. PROMPTS — Reusable Prompt Templates
 * ──────────────────────────────────────
 * 
 *   Prompts = predefined instructions jo AI use kar sakta hai.
 *   Jaise "code review template" ya "bug report format" — baar baar likhne ki zaroorat nahi.
 *   MCP server ek standard template provide karta hai.
 *
 *   → Pre-built prompt templates stored in the MCP server
 *   → Can be parameterized (fill in the blanks)
 *   → Ensures consistent instructions for common tasks
 *
 *   Examples:
 *   → "review_code" prompt: template for code reviews
 *   → "write_commit_message" prompt: template for git commits
 *   → "summarize_document" prompt: template for document summaries
 *
 * MCP PRIMITIVES SUMMARY:
 * ┌────────────────┬────────────────────────────┬──────────────────────────┐
 * │ Primitive      │ Purpose                    │ Example                  │
 * ├────────────────┼────────────────────────────┼──────────────────────────┤
 * │ Tools          │ AI takes ACTION             │ create_file, send_email │
 * │ Resources      │ AI reads DATA               │ file://README.md        │
 * │ Prompts        │ AI uses TEMPLATE            │ review_code template    │
 * └────────────────┴────────────────────────────┴──────────────────────────┘
 */


/**
 * Part-7: HOW A TOOL CALL WORKS
 */

/**
 * Tool Call Ka Poora Flow
 * ─────────────────────────
 * 
 *   User kuch poochta hai → AI decide karta hai tool call karna hai →
 *   MCP client tool call server ko forward karta hai → server tool execute karta hai →
 *   result wapas AI ko jaata hai → AI natural language mein answer deta hai.
 *
 * COMPLETE FLOW:
 *
 *   Step 1: MCP Server registers tools with MCP Client
 *   ┌──────────────────────────────────────────────────────────────────┐
 *   │ GitHub MCP Server tells Client:                                  │
 *   │ "I have these tools:                                             │
 *   │   - list_repos(username)                                         │
 *   │   - create_issue(repo, title, body)                              │
 *   │   - list_pull_requests(repo, state)"                             │
 *   └──────────────────────────────────────────────────────────────────┘
 *         │
 *         ▼
 *   Step 2: MCP Client passes tool list to AI Model
 *   ┌──────────────────────────────────────────────────────────────────┐
 *   │ AI now knows: "I can call list_repos, create_issue, list_prs"    │
 *   └──────────────────────────────────────────────────────────────────┘
 *         │
 *         ▼
 *   Step 3: User sends a message
 *   ┌──────────────────────────────────────────────────────────────────┐
 *   │ User: "List all open PRs in my nodejs/express repo"              │
 *   └──────────────────────────────────────────────────────────────────┘
 *         │
 *         ▼
 *   Step 4: AI decides which tool to call
 *   ┌──────────────────────────────────────────────────────────────────┐
 *   │ AI thinks: "User wants open PRs → I should call                  │
 *   │           list_pull_requests(repo='nodejs/express', state='open')│
 *   └──────────────────────────────────────────────────────────────────┘
 *         │
 *         ▼
 *   Step 5: AI returns a TOOL CALL (not a text answer yet)
 *   ┌──────────────────────────────────────────────────────────────────┐
 *   │ AI output:                                                       │
 *   │ {                                                                │
 *   │   "tool": "list_pull_requests",                                  │
 *   │   "arguments": {                                                 │
 *   │     "repo": "nodejs/express",                                    │
 *   │     "state": "open"                                              │
 *   │   }                                                              │
 *   │ }                                                                │
 *   └──────────────────────────────────────────────────────────────────┘
 *         │
 *         ▼
 *   Step 6: MCP Client forwards call to GitHub MCP Server
 *   ┌──────────────────────────────────────────────────────────────────┐
 *   │ MCP Client → GitHub Server:                                      │
 *   │ "Execute list_pull_requests with these args"                     │
 *   └──────────────────────────────────────────────────────────────────┘
 *         │
 *         ▼
 *   Step 7: GitHub MCP Server executes the real API call
 *   ┌──────────────────────────────────────────────────────────────────┐
 *   │ GitHub Server:                                                   │
 *   │ GET https://api.github.com/repos/nodejs/express/pulls?state=open │
 *   │ Authorization: Bearer <token>                                    │
 *   └──────────────────────────────────────────────────────────────────┘
 *         │
 *         ▼
 *   Step 8: GitHub API returns data → MCP Server sends back to Client
 *   ┌──────────────────────────────────────────────────────────────────┐
 *   │ Result: [ {title: "Fix memory leak", number: 4521, ...}, ... ]   │
 *   └──────────────────────────────────────────────────────────────────┘
 *         │
 *         ▼
 *   Step 9: MCP Client passes result to AI Model
 *         │
 *         ▼
 *   Step 10: AI formulates a natural language answer
 *   ┌──────────────────────────────────────────────────────────────────┐
 *   │ AI: "Here are the open PRs in nodejs/express:                    │
 *   │      1. Fix memory leak (#4521) by john_dev                      │
 *   │      2. Add TypeScript support (#4519) by sarah_ts               │
 *   │      3. Update README (#4510) by doc_writer"                     │
 *   └──────────────────────────────────────────────────────────────────┘
 */


/**
 * Part-8: REAL-WORLD EXAMPLE
 */

/**
 * Practical Example — Developer Workflow
 * ─────────────────────────────────────────
 * 
 *   Ek developer Claude Desktop use kar raha hai.
 *   3 MCP servers connected hain: filesystem, GitHub, aur PostgreSQL.
 *   User ek complex task deta hai — AI multiple tools use karta hai.
 *
 * SETUP:
 *   Host: Claude Desktop
 *   MCP Servers connected:
 *     → filesystem-mcp-server (reads/writes local files)
 *     → github-mcp-server     (interacts with GitHub)
 *     → postgres-mcp-server   (queries the database)
 *
 * USER ASKS:
 *   "Read the schema from schema.sql file, create a GitHub issue
 *    describing any missing indexes, then run the query to
 *    show tables with most rows."
 *
 * WHAT HAPPENS:
 *
 *   Task 1: Read the file
 *   AI ──► MCP Client ──► filesystem-server
 *          Tool: read_file("schema.sql")
 *          Result: [full SQL schema content]
 *
 *   Task 2: Create GitHub issue
 *   AI analyzes schema → finds missing indexes →
 *   AI ──► MCP Client ──► github-server
 *          Tool: create_issue(
 *            repo: "myproject/backend",
 *            title: "Missing indexes on users and orders tables",
 *            body: "Found 3 tables without proper indexes..."
 *          )
 *          Result: Issue #42 created ✅
 *
 *   Task 3: Query the database
 *   AI ──► MCP Client ──► postgres-server
 *          Tool: run_query(
 *            "SELECT table_name, COUNT(*) FROM information_schema.tables..."
 *          )
 *          Result: [orders: 1.2M rows, users: 450K rows, ...]
 *
 *   AI FINAL ANSWER:
 *   "I've completed all three tasks:
 *    1. Read schema.sql — found 3 tables missing indexes
 *    2. Created GitHub issue #42 with details
 *    3. Query results: orders has 1.2M rows (largest table)"
 *
 * ALL OF THIS WITHOUT:
 *   → You writing any API integration code
 *   → Manually calling GitHub API
 *   → Manually running DB queries
 *   → Parsing and passing results between steps
 */


/**
 * Part-9: MCP TRANSPORT LAYER
 */

/**
 * MCP Client aur Server Kaise Baat Karte Hain
 * ──────────────────────────────────────────────
 * 
 *   MCP communication ke liye do transport options hain.
 *   Stdio = local machine pe (same process/pipe).
 *   HTTP + SSE = remote server pe (network ke through).
 *
 * MCP supports TWO transport mechanisms:
 *
 * 1. STDIO (Standard Input/Output) — Local Transport
 * ────────────────────────────────────────────────────
 * 
 *   Client aur server same machine pe hain.
 *   Client ek process start karta hai (MCP server) aur stdin/stdout se baat karta hai.
 *   Local tools ke liye best — filesystem, local DB, local scripts.
 *
 *   → Used when MCP server runs LOCALLY on the same machine
 *   → Client SPAWNS the server process
 *   → Communication via stdin/stdout pipes
 *   → Fast, no network overhead
 *   → Most common for local dev tools
 *
 *   Example (Claude Desktop config):
 *   {
 *     "mcpServers": {
 *       "filesystem": {
 *         "command": "npx",
 *         "args": ["-y", "@modelcontextprotocol/server-filesystem", "/home/user"]
 *       }
 *     }
 *   }
 *
 *   Flow:
 *   Claude Desktop ──spawn──► filesystem-mcp-server (process)
 *                  ──stdin──► { "method": "tools/call", ... }
 *                 ◄─stdout── { "result": [...files...] }
 *
 * 2. HTTP + SSE (Server-Sent Events) — Remote Transport
 * ───────────────────────────────────────────────────────
 * 
 *   Server alag machine pe hai — network ke through communicate karte hain.
 *   SSE = server ek open HTTP connection rakhta hai, updates push karta rehta hai.
 *   Remote tools, team-shared servers ke liye best.
 *
 *   → Used when MCP server runs on a REMOTE machine
 *   → Communication over HTTP
 *   → SSE used for server-to-client streaming
 *   → Works across networks and the internet
 *   → Good for shared team MCP servers
 *
 *   Flow:
 *   MCP Client ──HTTP POST──► Remote MCP Server
 *              ◄──SSE stream── { "result": [...] }
 *
 * COMPARISON:
 * ┌──────────────────────┬────────────────────────┬──────────────────────┐
 * │ Aspect               │ Stdio                  │ HTTP + SSE           │
 * ├──────────────────────┼────────────────────────┼──────────────────────┤
 * │ Location             │ Same machine (local)   │ Remote (network)     │
 * │ Speed                │ Very fast              │ Network dependent    │
 * │ Setup                │ Simple                 │ Needs server running │
 * │ Use case             │ Local dev tools        │ Remote/shared tools  │
 * │ Example              │ filesystem, local DB   │ SaaS APIs, team tools│
 * └──────────────────────┴────────────────────────┴──────────────────────┘
 */


/**
 * Part-10: POPULAR MCP SERVERS
 */

/**
 * Ready-Made MCP Servers — Plug and Play
 * ─────────────────────────────────────────
 * 
 *   Ye popular MCP servers hain jo already banaye ja chuke hain.
 *   Install karo, configure karo — AI inmhe directly use kar sakta hai.
 *   Khud se API integration likhne ki zaroorat nahi.
 *
 * OFFICIAL MCP SERVERS (by Anthropic & community):
 *
 * ┌──────────────────────────────┬────────────────────────────────────────┐
 * │ MCP Server                   │ What It Does                           │
 * ├──────────────────────────────┼────────────────────────────────────────┤
 * │ filesystem                   │ Read/write local files and directories │
 * │ github                       │ Repos, PRs, issues, code search        │
 * │ gitlab                       │ GitLab repos, MRs, pipelines           │
 * │ postgres                     │ Query PostgreSQL databases             │
 * │ sqlite                       │ Query SQLite databases                 │
 * │ google-drive                 │ Read/search Google Drive files         │
 * │ slack                        │ Read/send Slack messages               │
 * │ brave-search                 │ Web search via Brave Search API        │
 * │ puppeteer                    │ Browser automation and web scraping    │
 * │ memory                       │ Persistent key-value memory store      │
 * │ sequential-thinking          │ Structured step-by-step reasoning      │
 * │ fetch                        │ Fetch and parse web URLs               │
 * └──────────────────────────────┴────────────────────────────────────────┘
 *
 * HOW TO ADD A MCP SERVER (Claude Desktop example):
 *
 *   Config file: ~/Library/Application Support/Claude/claude_desktop_config.json
 *
 *   {
 *     "mcpServers": {
 *
 *       "filesystem": {
 *         "command": "npx",
 *         "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/john"]
 *       },
 *
 *       "github": {
 *         "command": "npx",
 *         "args": ["-y", "@modelcontextprotocol/server-github"],
 *         "env": {
 *           "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_xxxxxxxxxxxx"
 *         }
 *       },
 *
 *       "postgres": {
 *         "command": "npx",
 *         "args": ["-y", "@modelcontextprotocol/server-postgres",
 *                  "postgresql://localhost/mydb"]
 *       }
 *
 *     }
 *   }
 *
 * AFTER ADDING:
 *   Restart Claude Desktop → AI now has access to all configured tools.
 *   You can ask: "Read the README.md file" → filesystem server handles it.
 *   You can ask: "Show my open GitHub issues" → github server handles it.
 *   You can ask: "How many users in my DB?" → postgres server handles it.
 */


/**
 * Part-11: GOLDEN RULES
 */

/**
 * MCP ke Core Principles
 * ──────────────────────────
 *
 *  1. ✅ MCP = ONE STANDARD FOR ALL AI ↔ TOOL CONNECTIONS
 *        Har tool ke liye custom integration likhna band.
 *        Ek MCP server likho — sab AI models use kar sakte hain.
 *
 *  2. ✅ M×N PROBLEM → M+N PROBLEM
 *        5 AI models × 20 tools = 100 integrations  (without MCP)
 *        5 AI models + 20 tools = 25 implementations (with MCP)
 *        Massive reduction in complexity.
 *
 *  3. ✅ THREE COMPONENTS: HOST → CLIENT → SERVER
 *        Host: app jahan user interact karta hai
 *        Client: connection manager (host ke andar)
 *        Server: actual tool provider
 *
 *  4. ✅ THREE PRIMITIVES: TOOLS, RESOURCES, PROMPTS
 *        Tools = actions AI leta hai
 *        Resources = data AI padhta hai
 *        Prompts = reusable templates
 *
 *  5. ✅ AI NEVER CALLS APIS DIRECTLY
 *        AI only produces TOOL CALL JSON.
 *        MCP client + server execute the actual API call.
 *        Clean separation of reasoning vs execution.
 *
 *  6. ✅ LOCAL = STDIO, REMOTE = HTTP + SSE
 *        Local tools (files, local DB) → stdio transport
 *        Remote tools (GitHub, Slack, SaaS) → HTTP + SSE transport
 *
 *  7. ✅ MCP HANDLES AUTH, ERRORS, FORMATS
 *        You don't write auth headers, error handling, or response parsing.
 *        MCP server handles all of that for you.
 *
 *  8. ✅ ONE CLIENT, MANY SERVERS
 *        A single MCP client can connect to multiple servers simultaneously.
 *        AI can use filesystem + github + postgres tools in one conversation.
 *
 *  9. ✅ MCP IS STATEFUL
 *        MCP connections maintain state across multiple tool calls.
 *        Unlike REST APIs (stateless), MCP sessions persist.
 *
 * 10. ✅ PLUG AND PLAY WITH EXISTING SERVERS
 *        Don't build from scratch — use community MCP servers.
 *        filesystem, github, postgres, slack — all ready to use.
*/

/**
 * QUICK MENTAL MODEL:
 *
 *   MCP is to AI tools
 *   what HTTP is to web communication —
 *   a UNIVERSAL STANDARD that makes everything work together.
 *
 *   Without HTTP: every website would need custom browser support.
 *   Without MCP:  every AI would need custom integration per tool.
 */
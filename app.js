import express from 'express';
import http from 'http'; // Changed from https to http
// Removed fs and path imports as they're not needed for HTTP
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import cors from 'cors';

const getServer = () => {
  // Create an MCP server with implementation details
  const server = new McpServer({
    name: 'stateless-streamable-http-server',
    version: '1.0.0',
  }, { capabilities: { logging: {} } });

  // Register a simple prompt
  server.prompt(
    'greeting-template',
    'A simple greeting prompt template',
    {
      name: z.string().describe('Name to include in greeting'),
    },
    async ({ name }) => {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Please greet ${name} in a friendly manner.`,
            },
          },
        ],
      };
    }
  );

  // Register a tool specifically for testing resumability
  server.tool(
    'start-notification-stream',
    'Starts sending periodic notifications for testing resumability',
    {
      interval: z.number().describe('Interval in milliseconds between notifications').default(100),
      count: z.number().describe('Number of notifications to send (0 for 100)').default(10),
    },
    async ({ interval, count }, { sendNotification }) => {
      const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
      let counter = 0;

      while (count === 0 || counter < count) {
        counter++;
        try {
          await sendNotification({
            method: "notifications/message",
            params: {
              level: "info",
              data: `Periodic notification #${counter} at ${new Date().toISOString()}`
            }
          });
        }
        catch (error) {
          console.error("Error sending notification:", error);
        }
        // Wait for the specified interval
        await sleep(interval);
      }

      return {
        content: [
          {
            type: 'text',
            text: `Started sending periodic notifications every ${interval}ms`,
          }
        ],
      };
    }
  );

  // Create a simple resource at a fixed URI
  server.resource(
    'greeting-resource',
    'https://example.com/greetings/default',
    { mimeType: 'text/plain' },
    async () => {
      return {
        contents: [
          {
            uri: 'https://example.com/greetings/default',
            text: 'Hello, world!',
          },
        ],
      };
    }
  );
  return server;
}

const app = express();
app.use(express.json());

// Configure CORS to expose Mcp-Session-Id header for browser-based clients
app.use(cors({
  origin: '*', // Allow all origins - adjust as needed for production
  exposedHeaders: ['Mcp-Session-Id']
}));

app.post('/mcp', async (req, res) => {
  const server = getServer();
  try {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
    res.on('close', () => {
      console.log('Request closed');
      transport.close();
      server.close();
    });
  } catch (error) {
    console.error('Error handling MCP request:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error',
        },
        id: null,
      });
    }
  }
});

app.get('/mcp', async (req, res) => {
  console.log('Received GET MCP request');
  res.writeHead(405).end(JSON.stringify({
    jsonrpc: "2.0",
    error: {
      code: -32000,
      message: "Method not allowed."
    },
    id: null
  }));
});

app.delete('/mcp', async (req, res) => {
  console.log('Received DELETE MCP request');
  res.writeHead(405).end(JSON.stringify({
    jsonrpc: "2.0",
    error: {
      code: -32000,
      message: "Method not allowed."
    },
    id: null
  }));
});

// Start the HTTP server
const PORT = 3001;

// Create HTTP server (removed SSL options)
const httpServer = http.createServer(app);

httpServer.listen(PORT, (error) => {
  if (error) {
    console.error('Failed to start HTTP server:', error);
    process.exit(1);
  }
  console.log(`MCP Stateless Streamable HTTP Server listening on port ${PORT}`);
  console.log(`Server URL: http://localhost:${PORT}`);
});

// Handle server shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down HTTP server...');
  httpServer.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

import express from 'express';
import bodyParser from 'body-parser';
import nerdamer from 'nerdamer/all.min.js';

const app = express();
const PORT = 3001;

app.use(bodyParser.json());

// 🧠 Converts natural text to math expression
function parseNaturalToExpression(query) {
  query = query.toLowerCase().trim();

  if (query.includes('factorial')) {
    const num = query.match(/\d+/)?.[0];
    return `factorial(${num})`;
  }

  if (query.includes('log')) {
    const num = query.match(/\d+(\.\d+)?/)?.[0];
    return `log(${num})`;
  }

  if (query.includes('derivative')) {
    const expr = query.match(/of (.+)/)?.[1];
    return `diff(${expr}, x)`;
  }

  if (query.includes('integral')) {
    const expr = query.match(/of (.+)/)?.[1];
    return `integrate(${expr}, x)`;
  }

  if (query.includes('solve')) {
    const expr = query.match(/solve (.+)/)?.[1];
    return expr;
  }

  return query;
}

// ✅ JSON endpoint for OpenRouter tool calling
app.post('/mcp', (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: 'Missing query' });

  try {
    const parsed = parseNaturalToExpression(query);
    const result = nerdamer(parsed).toString();

    res.json({
      input: query,
      parsedExpression: parsed,
      result
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ SSE endpoint for streaming (optional)
app.get('/mcp-stream', (req, res) => {
  const query = req.query.query;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  if (!query) {
    res.write(`event: error\ndata: Missing query\n\n`);
    return res.end();
  }

  res.write(`event: message\ndata: 🔍 Received: ${query}\n\n`);

  const parsed = parseNaturalToExpression(query);
  setTimeout(() => {
    res.write(`event: message\ndata: 🧠 Parsed as: ${parsed}\n\n`);

    setTimeout(() => {
      try {
        const result = nerdamer(parsed).toString();
        res.write(`event: message\ndata: ✅ Result: ${result}\n\n`);
        res.write(`event: done\ndata: done\n\n`);
      } catch (e) {
        res.write(`event: error\ndata: ${e.message}\n\n`);
      }
      res.end();
    }, 1000);
  }, 1000);
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 MCP Server running at http://localhost:${PORT}`);
  console.log(`📩 POST /mcp`);
  console.log(`📡 GET  /mcp-stream?query=your-question`);
});

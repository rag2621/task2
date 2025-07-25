const express = require('express');
const bodyParser = require('body-parser');
const nerdamer = require('nerdamer/all.min');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

function parseNaturalToExpression(query) {
  query = query.toLowerCase().trim();

  if (query.includes('factorial')) {
    const num = query.match(/\d+/)?.[0];
    return `factorial(${num})`;
  }

  if (query.includes('log')) {
    const num = query.match(/\d+/)?.[0];
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

app.post('/mcp', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  const { query } = req.body;
  if (!query) {
    res.write(`event: error\ndata: Missing query\n\n`);
    return res.end();
  }

  try {
    const parsed = parseNaturalToExpression(query);

    res.write(`event: message\ndata: Parsing query: "${query}"\n\n`);
    setTimeout(() => {
      res.write(`event: message\ndata: Converted to expression: ${parsed}\n\n`);

      setTimeout(() => {
        const result = nerdamer(parsed).toString();
        res.write(`event: message\ndata: Result: ${result}\n\n`);

        res.write(`event: done\ndata: done\n\n`);
        res.end();

      }, 1000);

    }, 1000);
  } catch (err) {
    console.error(err);
    res.write(`event: error\ndata: ${err.message}\n\n`);
    res.end();
  }
});

app.listen(PORT, () => {
  console.log(`🔁 MCP SSE Server running on http://localhost:${PORT}`);
});

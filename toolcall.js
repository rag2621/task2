import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const OPENROUTER_API_KEY =   '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'; // Put this in your .env file ideally
const MCP_ENDPOINT = 'https://task1-7gtx.onrender.com/mcp'; // JSON POST endpoint

async function queryOpenRouter() {
  const payload = {
    model: 'openai/gpt-3.5-turbo',
    messages: [
      {
        role: 'user',
        content: 'Use this tool to solve: derivative of x^3 + 2x'
      }
    ],
    tools: [
      {
        type: 'function',
        function: {
          name: 'MCPTool',
          description: 'Solves math using a custom MCP server',
          parameters: {
            type: 'object',
            properties: {
              query: { type: 'string' }
            },
            required: ['query']
          }
        }
      }
    ],
    tool_choice: 'auto',
    tool_config: {
      MCPTool: {
        url: MCP_ENDPOINT,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    }
  };

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      payload,
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const toolCalls = response.data.choices[0]?.message?.tool_calls;
    if (toolCalls && toolCalls.length > 0) {
      const toolFunc = toolCalls[0].function;
      const toolArgs = JSON.parse(toolFunc.arguments);

      console.log('📤 Tool call received:', toolArgs);

      const toolResponse = await axios.post(MCP_ENDPOINT, toolArgs);

      console.log('\n📥 MCP Response:');
      console.log(toolResponse.data);

    } else {
      console.log('❌ No tool call made by the LLM.');
    }
  } catch (err) {
    console.error('🔥 Error:', err.response?.data || err.message);
  }
}

queryOpenRouter();

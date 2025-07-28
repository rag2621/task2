import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Mathematical helper functions
function factorial(n) {
  if (n < 0) throw new Error("Factorial not defined for negative numbers");
  if (n === 0 || n === 1) return 1;
  if (n > 170) throw new Error("Factorial too large (overflow)");
  
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b !== 0) {
    [a, b] = [b, a % b];
  }
  return a;
}

function isPrime(n) {
  if (n < 2) return false;
  if (n === 2) return true;
  if (n % 2 === 0) return false;
  
  for (let i = 3; i <= Math.sqrt(n); i += 2) {
    if (n % i === 0) return false;
  }
  return true;
}

// Create server
const server = new McpServer({
  name: "math-mcp-server",
  version: "1.0.0",
});

// Register tools using server.registerTool()
server.registerTool(
  "log",
  {
    title: "Logarithm Calculator",
    description: "Calculate logarithm (natural log by default, or specify base)",
    inputSchema: {
      number: z.number().describe("Number to calculate logarithm for"),
      base: z.number().optional().describe("Base of logarithm (optional, defaults to e for natural log)"),
    },
  },
  async ({ number, base }) => {
    if (typeof number !== "number" || number <= 0) {
      throw new Error("Number must be a positive number");
    }
    
    const logResult = base 
      ? Math.log(number) / Math.log(base)
      : Math.log(number);
    
    return {
      content: [{
        type: "text",
        text: `log_${base || 'e'}(${number}) = ${logResult}`,
      }],
    };
  }
);

server.registerTool(
  "factorial",
  {
    title: "Factorial Calculator",
    description: "Calculate factorial of a number",
    inputSchema: {
      number: z.number().int().describe("Non-negative integer to calculate factorial for"),
    },
  },
  async ({ number }) => {
    if (!Number.isInteger(number) || number < 0) {
      throw new Error("Number must be a non-negative integer");
    }
    
    const factResult = factorial(number);
    return {
      content: [{
        type: "text",
        text: `${number}! = ${factResult}`,
      }],
    };
  }
);

server.registerTool(
  "power",
  {
    title: "Power Calculator", 
    description: "Calculate power (base^exponent)",
    inputSchema: {
      base: z.number().describe("Base number"),
      exponent: z.number().describe("Exponent"),
    },
  },
  async ({ base, exponent }) => {
    if (typeof base !== "number" || typeof exponent !== "number") {
      throw new Error("Both base and exponent must be numbers");
    }
    
    const powerResult = Math.pow(base, exponent);
    return {
      content: [{
        type: "text",
        text: `${base}^${exponent} = ${powerResult}`,
      }],
    };
  }
);

server.registerTool(
  "sqrt",
  {
    title: "Square Root Calculator",
    description: "Calculate square root",
    inputSchema: {
      number: z.number().describe("Number to calculate square root for"),
    },
  },
  async ({ number }) => {
    if (typeof number !== "number" || number < 0) {
      throw new Error("Number must be a non-negative number");
    }
    
    const sqrtResult = Math.sqrt(number);
    return {
      content: [{
        type: "text",
        text: `√${number} = ${sqrtResult}`,
      }],
    };
  }
);

server.registerTool(
  "gcd",
  {
    title: "Greatest Common Divisor",
    description: "Calculate Greatest Common Divisor of two numbers",
    inputSchema: {
      a: z.number().int().describe("First integer"),
      b: z.number().int().describe("Second integer"),
    },
  },
  async ({ a, b }) => {
    if (!Number.isInteger(a) || !Number.isInteger(b)) {
      throw new Error("Both numbers must be integers");
    }
    
    const gcdResult = gcd(a, b);
    return {
      content: [{
        type: "text",
        text: `gcd(${a}, ${b}) = ${gcdResult}`,
      }],
    };
  }
);

server.registerTool(
  "is_prime",
  {
    title: "Prime Number Checker",
    description: "Check if a number is prime",
    inputSchema: {
      number: z.number().int().describe("Integer to check for primality"),
    },
  },
  async ({ number }) => {
    if (!Number.isInteger(number)) {
      throw new Error("Number must be an integer");
    }
    
    const primeResult = isPrime(number);
    return {
      content: [{
        type: "text",
        text: `${number} is ${primeResult ? "prime" : "not prime"}`,
      }],
    };
  }
);

server.registerTool(
  "trigonometry",
  {
    title: "Trigonometric Functions",
    description: "Calculate trigonometric functions (sin, cos, tan)",
    inputSchema: {
      angle: z.number().describe("Angle in radians"),
      function: z.enum(["sin", "cos", "tan", "asin", "acos", "atan"]).describe("Trigonometric function to calculate"),
    },
  },
  async ({ angle, function: trigFunction }) => {
    if (typeof angle !== "number" || !trigFunction) {
      throw new Error("Angle must be a number and function must be specified");
    }
    
    let trigResult;
    switch (trigFunction) {
      case "sin": trigResult = Math.sin(angle); break;
      case "cos": trigResult = Math.cos(angle); break;
      case "tan": trigResult = Math.tan(angle); break;
      case "asin": 
        if (angle < -1 || angle > 1) {
          throw new Error("asin input must be between -1 and 1");
        }
        trigResult = Math.asin(angle); 
        break;
      case "acos": 
        if (angle < -1 || angle > 1) {
          throw new Error("acos input must be between -1 and 1");
        }
        trigResult = Math.acos(angle); 
        break;
      case "atan": trigResult = Math.atan(angle); break;
      default:
        throw new Error("Invalid trigonometric function");
    }
    
    return {
      content: [{
        type: "text",
        text: `${trigFunction}(${angle}) = ${trigResult}`,
      }],
    };
  }
);

// Error handling
server.onerror = (error) => {
  console.error("[MCP Math Server Error]", error);
};

process.on("SIGINT", async () => {
  await server.close();
  process.exit(0);
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Mathematics MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Failed to start math server:", error);
  process.exit(1);
});
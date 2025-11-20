const { query } = require('@anthropic-ai/claude-agent-sdk');

async function test() {
  console.log('Starting simple test...');
  
  for await (const message of query({
    prompt: 'Say hello and tell me what tools you have access to',
    options: {
      maxTurns: 1,
    }
  })) {
    console.log('Message type:', message.type);
    if (message.type === 'assistant') {
      console.log('Assistant message received');
    } else if (message.type === 'result') {
      console.log('Result:', message.subtype);
    }
  }
  
  console.log('Test completed');
}

test().catch(console.error);

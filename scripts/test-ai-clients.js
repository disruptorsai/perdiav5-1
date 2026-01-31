/**
 * AI Client Connection Test Script
 * Tests Grok, Claude, and StealthGPT API connections
 *
 * Run with: node scripts/test-ai-clients.js
 */

import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse .env.local manually
function loadEnv() {
  try {
    const envPath = join(__dirname, '..', '.env.local');
    const envContent = readFileSync(envPath, 'utf-8');
    const env = {};

    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join('=').trim();
        }
      }
    }

    return env;
  } catch (error) {
    console.error('Error loading .env.local:', error.message);
    return {};
  }
}

const env = loadEnv();
const GROK_API_KEY = env.VITE_GROK_API_KEY;
const CLAUDE_API_KEY = env.VITE_CLAUDE_API_KEY;
const STEALTHGPT_API_KEY = env.VITE_STEALTHGPT_API_KEY;

console.log('\n========================================');
console.log('   AI Client Connection Test');
console.log('========================================\n');

// Check API keys exist
console.log('1. Checking API Keys...\n');

const keys = {
  'Grok (xAI)': GROK_API_KEY,
  'Claude (Anthropic)': CLAUDE_API_KEY,
  'StealthGPT': STEALTHGPT_API_KEY,
};

let allKeysPresent = true;
for (const [name, key] of Object.entries(keys)) {
  if (key && key.length > 10) {
    console.log(`   ✓ ${name}: Configured (${key.substring(0, 10)}...)`);
  } else {
    console.log(`   X ${name}: NOT CONFIGURED`);
    allKeysPresent = false;
  }
}

if (!allKeysPresent) {
  console.log('\n   Warning: Some API keys are missing. Check your .env.local file.\n');
}

// Test Grok API
async function testGrok() {
  console.log('\n2. Testing Grok API (xAI)...\n');

  if (!GROK_API_KEY) {
    console.log('   X Grok API: No API key configured');
    return false;
  }

  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-beta',
        messages: [
          { role: 'user', content: 'Say "Grok API is working!" and nothing else.' }
        ],
        max_tokens: 50,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || 'No response';

    console.log(`   ✓ Grok API: Connected successfully`);
    console.log(`   Response: "${content}"`);
    if (data.usage) {
      console.log(`   Tokens: ${data.usage.prompt_tokens} prompt, ${data.usage.completion_tokens} completion`);
    }
    return true;
  } catch (error) {
    console.log(`   X Grok API: ${error.message}`);
    if (error.message.includes('401')) {
      console.log('   Tip: Check your API key at https://console.x.ai');
    } else if (error.message.includes('429')) {
      console.log('   Tip: Rate limit exceeded. Wait a moment and try again.');
    }
    return false;
  }
}

// Test Claude API
async function testClaude() {
  console.log('\n3. Testing Claude API (Anthropic)...\n');

  if (!CLAUDE_API_KEY) {
    console.log('   X Claude API: No API key configured');
    return false;
  }

  try {
    const anthropic = new Anthropic({
      apiKey: CLAUDE_API_KEY,
    });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 50,
      messages: [
        { role: 'user', content: 'Say "Claude API is working!" and nothing else.' }
      ],
    });

    const content = response.content?.[0]?.text || 'No response';

    console.log(`   ✓ Claude API: Connected successfully`);
    console.log(`   Response: "${content}"`);
    if (response.usage) {
      console.log(`   Tokens: ${response.usage.input_tokens} input, ${response.usage.output_tokens} output`);
    }
    return true;
  } catch (error) {
    console.log(`   X Claude API: ${error.message}`);
    if (error.message.includes('401') || error.message.includes('authentication')) {
      console.log('   Tip: Check your API key at https://console.anthropic.com');
    } else if (error.message.includes('429')) {
      console.log('   Tip: Rate limit exceeded. Check your quota.');
    }
    return false;
  }
}

// Test StealthGPT API
async function testStealthGPT() {
  console.log('\n4. Testing StealthGPT API...\n');

  if (!STEALTHGPT_API_KEY) {
    console.log('   X StealthGPT API: No API key configured');
    return false;
  }

  try {
    const response = await fetch('https://stealthgpt.ai/api/stealthify', {
      method: 'POST',
      headers: {
        'api-token': STEALTHGPT_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'This is a test message to verify API connectivity.',
        rephrase: true,
        tone: 'College',
        mode: 'Low',
        business: false,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    const data = await response.json();

    console.log(`   ✓ StealthGPT API: Connected successfully`);
    if (data.result) {
      const preview = data.result.length > 80 ? data.result.substring(0, 80) + '...' : data.result;
      console.log(`   Response: "${preview}"`);
    }
    if (data.howLikelyToBeDetected !== undefined) {
      console.log(`   Detection Score: ${data.howLikelyToBeDetected}% (lower is better)`);
    }
    return true;
  } catch (error) {
    console.log(`   X StealthGPT API: ${error.message}`);
    if (error.message.includes('401') || error.message.includes('403')) {
      console.log('   Tip: Check your API token at https://stealthgpt.ai');
    } else if (error.message.includes('429')) {
      console.log('   Tip: Rate limit exceeded. Check your plan limits.');
    }
    return false;
  }
}

// Run all tests
async function runTests() {
  const results = {
    grok: await testGrok(),
    claude: await testClaude(),
    stealthgpt: await testStealthGPT(),
  };

  console.log('\n========================================');
  console.log('   Test Results Summary');
  console.log('========================================\n');

  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;

  console.log(`   Grok:       ${results.grok ? '✓ PASS' : 'X FAIL'}`);
  console.log(`   Claude:     ${results.claude ? '✓ PASS' : 'X FAIL'}`);
  console.log(`   StealthGPT: ${results.stealthgpt ? '✓ PASS' : 'X FAIL'}`);
  console.log(`\n   Total: ${passed}/${total} tests passed\n`);

  if (passed === total) {
    console.log('   All AI clients are working correctly!\n');
  } else {
    console.log('   Some tests failed. Check the errors above.\n');
  }

  console.log('========================================');
  console.log('   Security Warning');
  console.log('========================================\n');
  console.log('   API keys are exposed in client-side code.');
  console.log('   This is FOR DEVELOPMENT ONLY.');
  console.log('   For production, move AI calls to Supabase Edge Functions.\n');
}

runTests().catch(console.error);

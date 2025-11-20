import * as fs from 'fs';
import * as path from 'path';
import { ClaudeAgent } from '../agent/ClaudeAgent';
import {
  getSystemPrompt,
  getNewProductsPrompt,
  getWhitelistUpdatesPrompt,
  getInsightsPrompt,
} from '../agent/prompts';
import { ResearchResult, WhitelistConfig, ProductDiscovery, ProductUpdate, TechnicalInsight } from '../types';

/**
 * Load whitelist configuration
 */
function loadWhitelist(): WhitelistConfig {
  const configPath = path.resolve(process.cwd(), 'config/whitelist.json');
  const configData = fs.readFileSync(configPath, 'utf-8');
  return JSON.parse(configData);
}

/**
 * Parse JSON from agent response, handling markdown code blocks and empty responses
 */
function parseAgentResponse<T>(response: string, taskName: string = 'task'): T {
  // Handle empty or very short responses
  if (!response || response.trim().length < 10) {
    console.log(`   ⚠️  Empty or very short response for ${taskName}, returning empty array`);
    return [] as T;
  }

  try {
    // Try direct parse first
    return JSON.parse(response);
  } catch {
    // Try to extract JSON from markdown code block
    const jsonMatch = response.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch {
        console.log(`   ⚠️  Found code block but JSON parsing failed for ${taskName}`);
      }
    }

    // Try to find JSON array in the text
    const arrayMatch = response.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      try {
        return JSON.parse(arrayMatch[0]);
      } catch {
        console.log(`   ⚠️  Found array-like structure but JSON parsing failed for ${taskName}`);
      }
    }

    // Try to find JSON object in the text
    const objectMatch = response.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      try {
        return JSON.parse(objectMatch[0]);
      } catch {
        console.log(`   ⚠️  Found object-like structure but JSON parsing failed for ${taskName}`);
      }
    }

    // If all parsing attempts fail, return empty array
    console.log(`   ℹ️  Could not parse JSON from ${taskName} response, returning empty array`);
    console.log(`   ℹ️  Response appears to be plain text (length: ${response.length} chars)`);
    return [] as T;
  }
}

/**
 * Run comprehensive research workflow
 */
export async function runResearchWorkflow(): Promise<ResearchResult> {
  console.log('\n🔬 Starting research workflow...\n');

  const config = loadWhitelist();
  const agent = new ClaudeAgent();
  const systemPrompt = getSystemPrompt();

  // Research new products
  console.log('📦 Researching new products...');
  const newProductsPrompt = getNewProductsPrompt(config);
  const newProductsResponse = await agent.run(systemPrompt, newProductsPrompt);
  let newProducts: ProductDiscovery[] = [];

  try {
    newProducts = parseAgentResponse<ProductDiscovery[]>(newProductsResponse, 'new products');
    console.log(`   ✅ Found ${newProducts.length} new products\n`);
  } catch (error) {
    console.error('   ❌ Unexpected error parsing new products:', error);
    console.log('   📄 Raw response (first 1000 chars):', newProductsResponse.slice(0, 1000));
    console.log('   📏 Full response length:', newProductsResponse.length, 'characters\n');
    newProducts = [];
  }

  // Research whitelist updates
  console.log('🔄 Checking whitelist product updates...');
  const whitelistPrompt = getWhitelistUpdatesPrompt(config);
  const whitelistResponse = await agent.run(systemPrompt, whitelistPrompt);
  let whitelistUpdates: ProductUpdate[] = [];

  try {
    whitelistUpdates = parseAgentResponse<ProductUpdate[]>(whitelistResponse, 'whitelist updates');
    console.log(`   ✅ Found ${whitelistUpdates.length} updates\n`);
  } catch (error) {
    console.error('   ❌ Unexpected error parsing updates:', error);
    console.log('   📄 Raw response (first 1000 chars):', whitelistResponse.slice(0, 1000));
    console.log('   📏 Full response length:', whitelistResponse.length, 'characters\n');
    whitelistUpdates = [];
  }

  // Research technical insights
  console.log('💡 Gathering technical insights and opinions...');
  const insightsPrompt = getInsightsPrompt(config);
  const insightsResponse = await agent.run(systemPrompt, insightsPrompt);
  let insights: TechnicalInsight[] = [];

  try {
    insights = parseAgentResponse<TechnicalInsight[]>(insightsResponse, 'insights');
    console.log(`   ✅ Found ${insights.length} insights\n`);
  } catch (error) {
    console.error('   ❌ Unexpected error parsing insights:', error);
    console.log('   📄 Raw response (first 1000 chars):', insightsResponse.slice(0, 1000));
    console.log('   📏 Full response length:', insightsResponse.length, 'characters\n');
    insights = [];
  }

  return {
    newProducts,
    whitelistUpdates,
    insights,
    generatedAt: new Date().toISOString(),
  };
}

// Test script to check which A4F models are working
// Run with: node test-models.js

const https = require('https');

const API_KEY = process.env.A4F_API_KEY || 'your_api_key_here';
const BASE_URL = 'https://api.a4f.co/v1';

const MODELS_TO_TEST = [
  // Text Generation Models
  'provider-5/gpt-4o',
  'provider-5/gpt-4-turbo',
  'provider-3/gpt-5-chat',
  'provider-7/claude-haiku-4-5-20251001',
  'provider-7/claude-sonnet-4-5-20250929',
  'provider-5/claude-3.7-sonnet-thinking',
  'provider-5/claude-opus-4.1',
  'provider-5/grok-4',
  'provider-5/grok-code-fast-1',
  'provider-2/qwen-3-coder',
  'provider-1/glm-4.6',
  // Image Generation Models
  'provider-4/imagen-3',
  'provider-4/imagen-4',
  'provider-5/dall-e-3',
];

function testModel(model) {
  return new Promise((resolve) => {
    const data = JSON.stringify({
      model: model,
      messages: [
        { role: 'user', content: 'Say "Hello" in one word.' }
      ],
      max_tokens: 10
    });

    const options = {
      hostname: 'api.a4f.co',
      port: 443,
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          if (res.statusCode === 200 && parsed.choices && parsed.choices[0]) {
            resolve({
              model,
              status: 'SUCCESS',
              statusCode: res.statusCode,
              response: parsed.choices[0].message?.content || 'No content'
            });
          } else {
            resolve({
              model,
              status: 'FAILED',
              statusCode: res.statusCode,
              error: parsed.error?.message || 'Unknown error'
            });
          }
        } catch (error) {
          resolve({
            model,
            status: 'ERROR',
            statusCode: res.statusCode,
            error: responseData || error.message
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({
        model,
        status: 'ERROR',
        error: error.message
      });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        model,
        status: 'TIMEOUT',
        error: 'Request timeout after 10 seconds'
      });
    });

    req.write(data);
    req.end();
  });
}

async function testAllModels() {
  console.log('🧪 Testing A4F API Models...\n');
  console.log(`API Key: ${API_KEY.substring(0, 10)}...${API_KEY.substring(API_KEY.length - 4)}\n`);
  console.log('=' .repeat(80));

  const results = [];

  for (const model of MODELS_TO_TEST) {
    process.stdout.write(`Testing ${model}... `);
    const result = await testModel(model);
    results.push(result);
    
    if (result.status === 'SUCCESS') {
      console.log('✅ SUCCESS');
    } else if (result.status === 'FAILED') {
      console.log(`❌ FAILED (${result.statusCode}): ${result.error}`);
    } else {
      console.log(`⚠️  ${result.status}: ${result.error}`);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n📊 Summary:\n');

  const successful = results.filter(r => r.status === 'SUCCESS');
  const failed = results.filter(r => r.status === 'FAILED');
  const errors = results.filter(r => r.status === 'ERROR' || r.status === 'TIMEOUT');

  console.log(`✅ Successful: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);
  console.log(`⚠️  Errors: ${errors.length}`);

  if (successful.length > 0) {
    console.log('\n✅ Working Models:');
    successful.forEach(r => console.log(`   - ${r.model}`));
  }

  if (failed.length > 0) {
    console.log('\n❌ Failed Models:');
    failed.forEach(r => console.log(`   - ${r.model} (${r.statusCode}): ${r.error}`));
  }

  if (errors.length > 0) {
    console.log('\n⚠️  Error Models:');
    errors.forEach(r => console.log(`   - ${r.model}: ${r.error}`));
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n💡 Tip: Update components/Sidebar.tsx to only include working models\n');
}

// Check if API key is set
if (API_KEY === 'your_api_key_here') {
  console.error('❌ Error: Please set your A4F_API_KEY environment variable');
  console.error('Usage: A4F_API_KEY=your_key node test-models.js');
  process.exit(1);
}

testAllModels().catch(console.error);
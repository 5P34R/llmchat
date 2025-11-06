// Test script for image generation API
// Run with: node test-image-generation.js

const fs = require('fs');
const path = require('path');

// Read environment variables from .env.local
function loadEnv() {
  const envPath = path.join(__dirname, '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local file not found');
    console.log('Please create a .env.local file with your A4F_API_KEY');
    process.exit(1);
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  
  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=').replace(/^["']|["']$/g, '');
      process.env[key] = value;
    }
  });
}

loadEnv();

const A4F_API_KEY = process.env.A4F_API_KEY;
const A4F_BASE_URL = process.env.A4F_BASE_URL || 'https://api.a4f.co/v1';

// Test configurations with CORRECT model names based on API response
const testCases = [
  {
    name: 'DALL-E 3 Test (provider-3)',
    model: 'provider-3/dall-e-3',
    prompt: 'A cute baby sea otter floating on its back in crystal clear water, photorealistic, high detail',
    size: '1024x1024',
    n: 1
  },
  {
    name: 'Flux Schnell Test (provider-4)',
    model: 'provider-4/flux-schnell',
    prompt: 'A magical forest with glowing mushrooms and fireflies at night, fantasy art style',
    size: '1024x1024',
    n: 1
  }
];

async function testImageGeneration(testCase) {
  console.log(`\n🎨 Running: ${testCase.name}`);
  console.log(`Model: ${testCase.model}`);
  console.log(`Prompt: "${testCase.prompt}"`);
  console.log(`Size: ${testCase.size}`);
  
  try {
    const requestBody = {
      model: testCase.model,
      prompt: testCase.prompt,
      n: testCase.n,
      size: testCase.size,
    };
    
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(`${A4F_BASE_URL}/images/generations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${A4F_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      console.error(`❌ Failed (${response.status}):`, responseText.substring(0, 200));
      
      // Try to parse error for more details
      try {
        const errorData = JSON.parse(responseText);
        if (errorData.detail?.error?.message) {
          console.log('Error details:', errorData.detail.error.message);
        }
      } catch (e) {
        // Ignore parse errors
      }
      
      return false;
    }

    const data = JSON.parse(responseText);
    
    if (data.data && data.data.length > 0) {
      console.log('✅ Success!');
      console.log('Image URL:', data.data[0].url);
      if (data.data[0].revised_prompt) {
        console.log('Revised Prompt:', data.data[0].revised_prompt);
      }
      
      // Save the successful model configuration
      console.log('\n📝 Working configuration:');
      console.log(`Model: ${testCase.model}`);
      console.log(`This model works with the image generation endpoint!`);
      
      return true;
    } else {
      console.error('❌ No image data in response:', data);
      return false;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Image Generation API Tests');
  console.log('=====================================');
  
  if (!A4F_API_KEY) {
    console.error('❌ Error: A4F_API_KEY not found in environment variables');
    console.log('Please ensure your .env.local file contains: A4F_API_KEY=your_api_key_here');
    process.exit(1);
  }
  
  console.log('✅ API Key found');
  console.log(`📍 API Base URL: ${A4F_BASE_URL}`);
  console.log('\n📚 Using correct model formats from API documentation:');
  console.log('   - DALL-E 3: provider-3/dall-e-3 or provider-5/dall-e-3');
  console.log('   - Flux Schnell: provider-4/flux-schnell');
  
  const results = [];
  
  console.log('\n⚠️ Testing with correct provider prefixes...');
  
  for (const testCase of testCases) {
    const success = await testImageGeneration(testCase);
    results.push({ name: testCase.name, model: testCase.model, success });
    
    if (success) {
      console.log('\n✨ Found working model!');
      break; // Stop testing once we find a working model
    }
    
    // Add small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n=====================================');
  console.log('📊 Test Results Summary:');
  console.log('=====================================');
  
  let successCount = 0;
  let workingModel = null;
  
  results.forEach(result => {
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} ${result.name}`);
    if (result.success) {
      successCount++;
      workingModel = result.model;
    }
  });
  
  if (successCount > 0) {
    console.log('\n🎉 Image generation test passed!');
    console.log(`✅ Working model: ${workingModel}`);
    
    console.log('\n📝 To test in the UI:');
    console.log('1. Start the development server: npm run dev');
    console.log('2. Open http://localhost:3000');
    console.log('3. Select an image model from the dropdown (e.g., ' + workingModel + ')');
    console.log('4. Type a prompt like: "A cute baby sea otter"');
    console.log('5. Send the message');
    console.log('\n🖼️ The generated image will appear with:');
    console.log('   ✨ A styled card with "Generated Image" header');
    console.log('   ✨ The full image displayed with rounded corners');
    console.log('   ✨ Proper responsive sizing');
    console.log('   ✨ The image URL for direct access');
    console.log('\n💡 The MessageContent component (lines 717-732) handles the display!');
  } else {
    console.log('\n⚠️ All tests failed. Possible issues:');
    console.log('1. Your API key might not have image generation permissions');
    console.log('2. The image generation service might be temporarily unavailable');
    console.log('3. Rate limiting might be in effect');
    console.log('\n💡 The model names are correct based on the API response:');
    console.log('   - provider-3/dall-e-3 (or provider-5/dall-e-3)');
    console.log('   - provider-4/flux-schnell');
    console.log('\nPlease check your API key permissions or try again later.');
  }
}

// Run the tests
runTests().catch(console.error);
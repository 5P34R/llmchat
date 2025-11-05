# Model Testing Guide

## Quick Test

To test which models are working with your A4F API key:

### Method 1: Using the Test Script

```bash
# Set your API key and run the test
A4F_API_KEY=your_actual_api_key_here node test-models.js
```

Or on Windows:
```cmd
set A4F_API_KEY=your_actual_api_key_here
node test-models.js
```

### Method 2: Using curl

Test a single model:

```bash
curl https://api.a4f.co/v1/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "provider-7/claude-haiku-4-5-20251001",
    "messages": [{"role": "user", "content": "Say hello"}],
    "max_tokens": 10
  }'
```

## Test Results Interpretation

The test script will show:
- ✅ **SUCCESS** - Model is working and responding
- ❌ **FAILED** - Model returned an error (404 = not available, 500 = server error)
- ⚠️ **ERROR** - Network or connection issue
- ⏱️ **TIMEOUT** - Request took too long (>10 seconds)

## Common Status Codes

- **200** - Success, model is working
- **401** - Invalid API key
- **404** - Model not found or not available on your plan
- **429** - Rate limit exceeded
- **500** - Server error

## Based on Terminal Output

From the recent tests, these models are confirmed working:
- ✅ `provider-7/claude-sonnet-4-5-20250929` (200 OK, 3993ms)
- ✅ `provider-7/claude-haiku-4-5-20251001` (200 OK, 1520ms)

## Updating the Model List

After testing, update `components/Sidebar.tsx` to only include working models:

1. Run the test script
2. Note which models return SUCCESS (200 status)
3. Update the `AVAILABLE_MODELS` array in `components/Sidebar.tsx`
4. Remove models that consistently fail

## Example: Updating Sidebar

```typescript
const AVAILABLE_MODELS = [
  // Only include models that tested successfully
  { value: 'provider-7/claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5' },
  { value: 'provider-7/claude-sonnet-4-5-20250929', label: 'Claude Sonnet 4.5' },
  // Add other working models...
];
```

## Troubleshooting

### All Models Fail
- Check your API key is correct
- Verify your API key has credits/quota
- Check your internet connection

### Some Models Fail (404)
- These models may not be available on your plan
- Contact A4F support to check available models
- Remove unavailable models from the list

### Timeout Errors
- Your internet connection may be slow
- The model may be overloaded
- Try again later

## Automated Testing

You can add this to your package.json:

```json
{
  "scripts": {
    "test:models": "node test-models.js"
  }
}
```

Then run:
```bash
npm run test:models
```

## Rate Limits

Be aware of rate limits when testing:
- The script includes 500ms delays between requests
- Don't run the test too frequently
- Check the response headers for rate limit info

## Next Steps

1. Run the test script with your API key
2. Note which models work
3. Update the Sidebar component
4. Test the application with working models
5. Remove or comment out non-working models

## Support

If you need help:
1. Check the A4F API documentation
2. Contact A4F support for model availability
3. Review your API plan details
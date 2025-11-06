# Image Generation Guide

## Overview
The LLM Chat application supports AI image generation using various models through the A4F API endpoint.

## Working Configuration

### API Endpoint
- **URL**: `https://api.a4f.co/v1/images/generations`
- **Method**: POST
- **Authentication**: Bearer token (A4F_API_KEY)

### Verified Working Models
Based on our testing, the following models are confirmed to work:

1. **DALL-E 3**
   - Model ID: `provider-3/dall-e-3`
   - Alternative: `provider-5/dall-e-3`
   - Size: `1024x1024`
   - Best for: Photorealistic images, detailed artwork

2. **Flux Schnell** (untested but should work)
   - Model ID: `provider-4/flux-schnell`
   - Size: `1024x1024`
   - Best for: Fast generation, artistic styles

## How to Use Image Generation

### In the UI

1. **Start the application**:
   ```bash
   npm run dev
   ```

2. **Open the application**:
   - Navigate to `http://localhost:3000`

3. **Select an image model**:
   - From the model dropdown, select an image generation model
   - Look for models containing: `dall-e`, `flux`, `stable-diffusion`, etc.

4. **Enter your prompt**:
   - Type a descriptive prompt for the image you want
   - Example: "A cute baby sea otter floating on its back"

5. **Send the message**:
   - Click send or press Enter
   - The image will be generated and displayed

### Image Display Features

When an image is generated, it appears with:

✨ **Visual Features**:
- Styled card with "Generated Image" header
- Full image with rounded corners
- Responsive sizing (adapts to screen size)
- Lazy loading for performance
- Maximum height constraint for large images

📍 **Location in Code**:
- Display logic: `components/MessageContent.tsx` (lines 717-732)
- API handler: `app/api/image/route.ts`
- Chat integration: `components/ChatInterface.tsx`

## API Request Format

### Request Structure
```json
{
  "model": "provider-3/dall-e-3",
  "prompt": "Your image description here",
  "n": 1,
  "size": "1024x1024"
}
```

### Response Structure
```json
{
  "data": [
    {
      "url": "https://api.a4f.co/v1/images/serve/[image_id]",
      "revised_prompt": "Enhanced prompt (if applicable)"
    }
  ]
}
```

## Testing Image Generation

### Manual Test
Run the test script to verify image generation:
```bash
node test-image-generation.js
```

### Test Output
✅ Successful test shows:
- API key validation
- Model verification
- Image URL generation
- Working configuration details

## Troubleshooting

### Common Issues

1. **"Provider prefix missing" error**
   - Solution: Use the full model name with provider prefix
   - Example: `provider-3/dall-e-3` not just `dall-e-3`

2. **"Model is not an image generation model" error**
   - Solution: Ensure you're using the correct provider number
   - Check available providers: 3, 4, 5 for different models

3. **No image displayed in UI**
   - Check browser console for errors
   - Verify image URL is accessible
   - Check network tab for failed requests

4. **Rate limiting**
   - Add delays between requests
   - Check API usage limits
   - Consider caching generated images

## Model Selection in UI

The application detects image models by checking if the model name contains:
- `flux`
- `imagen`
- `dall-e`
- `stable-diffusion`

Code reference: `components/ChatInterface.tsx` (lines 87-92)

## Environment Configuration

Required environment variables in `.env.local`:
```env
A4F_API_KEY=your_api_key_here
A4F_BASE_URL=https://api.a4f.co/v1  # Optional, this is the default
```

## Best Practices

1. **Prompt Engineering**:
   - Be descriptive and specific
   - Include style preferences (photorealistic, cartoon, oil painting, etc.)
   - Mention important details (lighting, colors, composition)

2. **Error Handling**:
   - The app shows error messages if generation fails
   - Retry logic is built-in for transient failures
   - User-friendly error messages are displayed

3. **Performance**:
   - Images are lazy-loaded
   - Maximum display size is constrained
   - URLs are cached in the message history

## Code Architecture

### Key Components

1. **API Route** (`app/api/image/route.ts`):
   - Handles image generation requests
   - Validates input parameters
   - Forwards to A4F API
   - Returns image URLs

2. **Chat Interface** (`components/ChatInterface.tsx`):
   - Detects image models
   - Routes requests to image API
   - Manages loading states

3. **Message Content** (`components/MessageContent.tsx`):
   - Renders generated images
   - Provides image preview card
   - Handles image loading states

## Future Enhancements

Potential improvements:
- [ ] Support for different image sizes
- [ ] Image editing capabilities
- [ ] Batch generation (n > 1)
- [ ] Image-to-image generation
- [ ] Style presets
- [ ] Image download button
- [ ] Gallery view for multiple images
- [ ] Image history/favorites

## Summary

The image generation feature is fully integrated and working with:
- ✅ Proper API integration
- ✅ Beautiful UI display
- ✅ Error handling
- ✅ Multiple model support
- ✅ Responsive design

Users can generate images by simply selecting an image model and typing a prompt, with results displayed in an elegant card format within the chat interface.
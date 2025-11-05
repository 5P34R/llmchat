
# Image Generation & Code Preview Features

## 🎨 Image Generation

### Overview
The application now supports AI image generation using multiple providers through the A4F API.

### Available Image Models

1. **Flux.1 Schnell** (`provider-2/flux.1-schnell`) - Fast generation
2. **Flux.1 Dev** (`provider-2/flux.1-dev`) - High quality
3. **Imagen 3** (`provider-4/imagen-3`) - Google's model
4. **Imagen 4** (`provider-4/imagen-4`) - Latest Google model
5. **DALL-E 3** (`provider-5/dall-e-3`) - OpenAI's model
6. **Stable Diffusion XL** (`provider-5/stable-diffusion-xl`) - Open source

### How to Generate Images

1. **Select an Image Model**
   - Open the sidebar
   - Find the model dropdown
   - Select any model with 🎨 icon

2. **Enter Your Prompt**
   - Type a description of the image you want
   - Be specific and detailed for better results
   - Example: "A cute baby sea otter playing in the ocean at sunset"

3. **Generate**
   - Click Send or press Enter
   - Wait for the image to generate (usually 5-15 seconds)
   - The image will appear in the chat

### Image Generation Tips

**Good Prompts:**
- "A photorealistic portrait of a cat wearing a space helmet"
- "Abstract geometric patterns in blue and gold, digital art"
- "A cozy coffee shop interior, warm lighting, watercolor style"

**Prompt Structure:**
- Subject: What you want to see
- Style: Art style, medium, or technique
- Details: Colors, lighting, mood, composition
- Quality: "high quality", "detailed", "4k"

### API Endpoint

The image generation uses the A4F API endpoint:
```
POST https://api.a4f.co/v1/images/generations
```

Request format:
```json
{
  "model": "provider-2/flux.1-schnell",
  "prompt": "Your image description",
  "n": 1,
  "size": "1024x1024"
}
```

## 💻 Code Preview Features

### Syntax Highlighting

All code blocks in AI responses are automatically highlighted with:
- **Language detection** - Automatically detects programming language
- **Theme support** - Matches your dark/light theme
- **Line numbers** - Easy reference
- **Syntax colors** - Clear, readable highlighting

### Supported Languages

- JavaScript/TypeScript
- Python
- Java
- C/C++
- HTML/CSS
- JSON
- Markdown
- SQL
- Shell/Bash
- And many more...

### Code Actions

Each code block includes action buttons:

1. **Copy Button**
   - Click to copy code to clipboard
   - Shows "Copied" confirmation
   - Works for any code block

2. **Preview Button** (HTML/JavaScript only)
   - Live preview of HTML code
   - Runs JavaScript in sandbox
   - Safe iframe execution
   - Close button to hide preview

### Using Code Preview

1. **Ask for Code**
   ```
   "Create a simple HTML page with a button"
   ```

2. **View the Code**
   - Code appears with syntax highlighting
   - Language label at top
   - Copy and Preview buttons available

3. **Preview HTML**
   - Click "Preview" button
   - See live rendering below code
   - Interact with the result
   - Click "Close" to hide

### Code Preview Examples

**HTML Example:**
```html
<!DOCTYPE html>
<html>
<head>
    <title>Hello World</title>
</head>
<body>
    <h1>Hello, World!</h1>
    <button onclick="alert('Clicked!')">Click Me</button>
</body>
</html>
```

**JavaScript Example:**
```javascript
function fibonacci(n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(10));
```

## 🔧 Technical Implementation

### Components

1. **MessageContent.tsx**
   - Renders message content
   - Handles code highlighting
   - Manages preview state
   - Displays images

2. **app/api/image/route.ts**
   - Image generation endpoint
   - Handles A4F API calls
   - Error handling
   - Response formatting

3. **ChatInterface.tsx**
   - Detects image models
   - Routes to appropriate API
   - Handles responses
   - Updates UI

### Dependencies

```json
{
  "react-syntax-highlighter": "^15.5.0",
  "@types/react-syntax-highlighter": "^15.5.0"
}
```

### Code Highlighting Themes

- **Light Mode**: VS Code Light theme
- **Dark Mode**: VS Code Dark+ theme

## 📝 Usage Examples

### Example 1: Generate an Image

```
User: "Create an image of a futuristic city at night"

[Selects: Flux.1 Schnell]
[Clicks: Send]
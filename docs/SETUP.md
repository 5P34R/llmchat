# Setup Guide

## Quick Start

Your LLM Chat Application is now ready! Follow these steps to start using it:

### 1. Add Your API Key

Open the `.env.local` file and replace `your_actual_api_key_here` with your actual A4F API key:

```env
A4F_API_KEY=your_actual_api_key_here
A4F_BASE_URL=https://api.a4f.co/v1
A4F_MODEL=provider-1/chatgpt-4o-latest
```

### 2. Start the Development Server

The server is already running! If you need to restart it:

```bash
npm run dev
```

### 3. Open the Application

Navigate to [http://localhost:3000](http://localhost:3000) in your web browser.

## Application Features

### Chat Interface

- **Send Messages**: Type your message in the text area and press Enter or click "Send"
- **View Responses**: AI responses are displayed with markdown formatting
- **Clear Chat**: Click "Clear Chat" to start a new conversation

### File Upload & Analysis

1. Click the "📎 Upload File" button
2. Select a text-based file (up to 10MB)
3. The file name will appear above the input
4. Type your question about the file
5. Click "Send" to analyze the file

### Supported File Types

- Text files: `.txt`, `.md`, `.csv`
- Code files: `.js`, `.jsx`, `.ts`, `.tsx`, `.py`, `.java`, `.c`, `.cpp`, `.h`, `.hpp`
- Web files: `.html`, `.css`, `.xml`, `.json`

## Testing the Application

### Test 1: Basic Chat

1. Open http://localhost:3000
2. Type "Hello, can you help me?" in the input field
3. Press Enter or click "Send"
4. You should receive a response from the AI

### Test 2: File Analysis

1. Create a test file (e.g., `test.txt`) with some content
2. Click "📎 Upload File" and select the file
3. Type "What is in this file?" in the input
4. Click "Send"
5. The AI should analyze and describe the file content

### Test 3: Conversation History

1. Send multiple messages
2. Notice that the AI remembers previous messages in the conversation
3. Click "Clear Chat" to reset the conversation

## Troubleshooting

### API Key Issues

If you see errors about the API key:
- Make sure you've added your actual A4F API key to `.env.local`
- Restart the development server after changing environment variables

### Port Already in Use

If port 3000 is already in use:
```bash
# Kill the process using port 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use a different port
npm run dev -- -p 3001
```

### File Upload Issues

If file uploads aren't working:
- Check that the file is under 10MB
- Ensure the file is a text-based format
- Check browser console for error messages

## Production Deployment

To build for production:

```bash
npm run build
npm start
```

## Environment Variables

Required:
- `A4F_API_KEY`: Your A4F API key

Optional:
- `A4F_BASE_URL`: API endpoint (default: https://api.a4f.co/v1)
- `A4F_MODEL`: Model to use (default: provider-1/chatgpt-4o-latest)

## Next Steps

1. **Add your API key** to `.env.local`
2. **Test the application** by opening http://localhost:3000
3. **Customize** the UI colors and styling in `app/globals.css` and component files
4. **Deploy** to Vercel, Netlify, or your preferred hosting platform

## Support

For issues or questions:
- Check the README.md for detailed documentation
- Review the code comments in component files
- Ensure all dependencies are installed with `npm install`

Enjoy your LLM Chat Application! 🚀
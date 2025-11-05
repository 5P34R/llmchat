# LLM Chat Application - Features Documentation

## 🎨 New Features Added

### 1. Dark Theme Toggle
- **Location**: Top-right corner of the sidebar
- **Functionality**: 
  - Toggle between light and dark modes
  - System theme detection (automatically matches your OS preference)
  - Smooth transitions between themes
  - Persistent theme selection across sessions

### 2. Collapsible Sidebar
- **Features**:
  - Collapse/expand sidebar to maximize chat space
  - Collapsed view shows icon-only buttons
  - Smooth animation transitions
  - Maintains functionality in collapsed state

### 3. Multiple Model Selection
- **Available Models**:
  - GPT-4o Latest (provider-1/chatgpt-4o-latest)
  - GPT-4 Turbo (provider-1/gpt-4-turbo)
  - GPT-3.5 Turbo (provider-1/gpt-3.5-turbo)
  - Claude 3 Opus (provider-2/claude-3-opus)
  - Claude 3 Sonnet (provider-2/claude-3-sonnet)
  - Gemini Pro (provider-3/gemini-pro)

- **How to Use**:
  1. Open the sidebar
  2. Find "Model Selection" dropdown
  3. Select your preferred model
  4. All new messages will use the selected model

### 4. Conversation Management
- **Features**:
  - Multiple conversation threads
  - Automatic conversation naming (based on first message)
  - Conversation history in sidebar
  - Switch between conversations seamlessly
  - Each conversation maintains its own context

- **Actions**:
  - **New Chat**: Click the "New Chat" button to start fresh
  - **Switch Conversations**: Click on any conversation in the sidebar
  - **Auto-save**: All conversations are automatically saved

## 🎯 UI Components

### Sidebar Components
1. **Header**
   - App title
   - Theme toggle button
   - Collapse/expand button

2. **Actions Section**
   - New Chat button
   - Model selection dropdown

3. **Conversations List**
   - Recent conversations
   - Conversation titles
   - Timestamps
   - Active conversation highlight

### Main Chat Area
1. **Header**
   - Application title
   - Description

2. **Chat Interface**
   - Message display area
   - File upload section
   - Message input with send button

## 🎨 Design System

### Color Scheme (Monochrome)
- **Light Mode**:
  - Background: White (#FFFFFF)
  - Foreground: Near Black (#0A0A0A)
  - Muted: Light Gray (#F5F5F5)
  - Borders: Subtle Gray (#E5E5E5)

- **Dark Mode**:
  - Background: Near Black (#0A0A0A)
  - Foreground: Off White (#FAFAFA)
  - Muted: Dark Gray (#262626)
  - Borders: Subtle Dark Gray (#262626)

### Typography
- **Headings**: Bold, tracking-tight
- **Body**: Regular weight
- **Muted Text**: Reduced opacity for secondary information

### Spacing
- Consistent padding and margins
- Card-based layout for messages
- Proper spacing between UI elements

## 🔧 Technical Implementation

### State Management
- React hooks for local state
- Conversation state in parent component
- Message state in ChatInterface component
- Theme state managed by next-themes

### Component Structure
```
app/
├── page.tsx (Main container with sidebar)
├── layout.tsx (Theme provider wrapper)
└── api/chat/route.ts (API endpoint with model support)

components/
├── Sidebar.tsx (Navigation and settings)
├── ChatInterface.tsx (Main chat component)
├── MessageList.tsx (Message display)
├── MessageInput.tsx (Input with send button)
├── FileUpload.tsx (File handling)
├── theme-provider.tsx (Theme context)
└── theme-toggle.tsx (Theme switch button)
```

### Key Features Implementation

#### Theme Switching
- Uses `next-themes` library
- Automatic system theme detection
- Persistent storage in localStorage
- No flash of unstyled content (FOUC)

#### Model Selection
- Dropdown with predefined models
- Model parameter sent to API
- Per-conversation model tracking possible
- Easy to add new models

#### Conversation Management
- Array-based conversation storage
- Unique IDs for each conversation
- Automatic title generation
- Timestamp tracking

## 📱 Responsive Design

### Desktop (>1024px)
- Full sidebar visible
- Wide chat area
- Optimal reading width

### Tablet (768px - 1024px)
- Collapsible sidebar recommended
- Adjusted chat width
- Touch-friendly buttons

### Mobile (<768px)
- Sidebar can be collapsed
- Full-width chat area
- Mobile-optimized inputs

## 🚀 Usage Guide

### Starting a New Conversation
1. Click "New Chat" in the sidebar
2. Select your preferred model
3. Start typing your message
4. The conversation will be automatically saved

### Switching Models
1. Open the model selection dropdown
2. Choose a different model
3. New messages will use the selected model
4. Previous messages remain unchanged

### Managing Conversations
- **View History**: Scroll through the sidebar
- **Switch Context**: Click any conversation
- **Multiple Topics**: Use different conversations for different topics

### Theme Preferences
- **Auto**: Matches your system theme
- **Light**: Always use light mode
- **Dark**: Always use dark mode

## 🔐 Privacy & Data

- All conversations stored locally in component state
- No automatic cloud sync
- Messages sent to A4F API for processing
- Theme preference stored in browser localStorage

## 🎯 Best Practices

1. **Model Selection**:
   - Use GPT-4o for complex tasks
   - Use GPT-3.5 for quick responses
   - Try different models for varied perspectives

2. **Conversation Organization**:
   - Create new chats for different topics
   - Use descriptive first messages for auto-naming
   - Review conversation history regularly

3. **Theme Usage**:
   - Use dark mode for extended sessions
   - Light mode for better readability in bright environments
   - System mode for automatic adjustment

## 🐛 Troubleshooting

### Theme Not Switching
- Clear browser cache
- Check localStorage permissions
- Refresh the page

### Model Not Changing
- Verify model selection in dropdown
- Check API key configuration
- Review console for errors

### Conversations Not Saving
- Check browser console for errors
- Verify component state updates
- Ensure no infinite loops

## 🔄 Future Enhancements

Potential features for future versions:
- Conversation export/import
- Search within conversations
- Conversation tags/categories
- Custom model configurations
- Conversation sharing
- Message editing
- Regenerate responses
- Token usage tracking
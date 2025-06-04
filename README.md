# My-AI

A complete web application featuring AI chatbot and image generation capabilities with ChatGPT-style interface using Google Gemini and Hugging Face APIs.

## Features

### 🤖 AI Chatbot
- **Google Gemini Integration**: Advanced conversational AI with context retention
- **Multi-turn Conversations**: Maintains conversation history and context
- **Real-time Chat Interface**: Modern chat UI with typing indicators
- **Message History**: Persistent chat history with timestamps

### 🎨 AI Image Generation
- **Hugging Face Integration**: Text-to-image generation using Stable Diffusion XL
- **Customizable Parameters**: Size, style, negative prompts, and generation settings
- **Image Management**: Download, view fullscreen, and copy prompts
- **Generation History**: Track and manage all generated images

### 💾 Data Persistence
- **Local Storage**: Browser-based data persistence using localStorage
- **Export/Import**: JSON-based data export and import functionality
- **History Management**: View, delete, and manage chat and image history
- **Data Cleanup**: Clear individual items or all data with confirmation

### 🎨 Modern UI/UX
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Clean Interface**: Professional light theme with smooth animations
- **Toast Notifications**: User-friendly feedback for all actions
- **Loading States**: Visual feedback during API calls
- **Accessibility**: Keyboard navigation and screen reader support

## Technology Stack

### Backend (FastAPI)
- **FastAPI**: Modern Python web framework with async support
- **Pydantic**: Data validation and serialization
- **Google Generative AI**: Gemini API integration
- **Hugging Face**: Image generation API integration
- **Python-dotenv**: Environment variable management

### Frontend
- **Vanilla JavaScript**: Modern ES6+ features with class-based architecture
- **CSS Grid/Flexbox**: Responsive layout system
- **CSS Variables**: Consistent theming and styling
- **Font Awesome**: Icon library
- **Google Fonts**: Inter font family

## Installation & Setup

### Prerequisites
- Python 3.8 or higher
- pip (Python package manager)
- Modern web browser

### 1. Clone Repository
```bash
git clone https://github.com/anmol0706/My-AI.git
cd My-AI
```

### 2. Install Dependencies
```bash
# Install Python dependencies
pip install -r requirements.txt
```

### 3. Environment Configuration
Create a `.env` file based on `.env.example`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
HUGGINGFACE_API_KEY=your_huggingface_api_key_here
DEBUG=True
HOST=0.0.0.0
PORT=8000
```

### 4. Run the Application
```bash
# Start the FastAPI server
python main.py

# Or using uvicorn directly
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 5. Access the Application
Open your web browser and navigate to:
```
http://localhost:8000
```

## Project Structure

```
My-AI/
├── main.py                 # FastAPI application entry point
├── requirements.txt        # Python dependencies
├── .env.example           # Environment variables template
├── .gitignore             # Git ignore rules
├── README.md              # This file
│
├── config/                # Configuration management
│   ├── __init__.py
│   └── settings.py        # Application settings
│
├── models/                # Pydantic models
│   ├── __init__.py
│   ├── chat_models.py     # Chat-related models
│   └── image_models.py    # Image generation models
│
├── services/              # Business logic and API integrations
│   ├── __init__.py
│   ├── gemini_service.py  # Google Gemini API integration
│   └── huggingface_service.py # Hugging Face API integration
│
├── routers/               # API endpoints
│   ├── __init__.py
│   ├── chat_router.py     # Chat API endpoints
│   └── image_router.py    # Image generation endpoints
│
├── exceptions/            # Custom exception classes
│   ├── __init__.py
│   └── custom_exceptions.py
│
├── templates/             # HTML templates
│   ├── index.html         # Main chat interface
│   └── image_generator.html # Image generation interface
│
└── static/                # Static files
    ├── css/
    │   └── styles.css     # Application styles
    └── js/
        ├── app.js         # Main chat functionality
        └── image_generator.js # Image generation functionality
```

## API Endpoints

### Chat Endpoints
- `POST /api/chat/message` - Send message to AI chatbot
- `GET /api/chat/health` - Check chat service health
- `GET /api/chat/models` - Get available chat models

### Image Generation Endpoints
- `POST /api/images/generate` - Generate images from text prompts
- `GET /api/images/health` - Check image service health
- `GET /api/images/models` - Get available image models
- `GET /api/images/sizes` - Get available image sizes
- `GET /api/images/styles` - Get available image styles

### General Endpoints
- `GET /` - Main chat interface
- `GET /image-generator` - Image generation interface
- `GET /health` - Application health check

## Usage Guide

### Chat Interface
1. Navigate to the main page
2. Type your message in the input field
3. Press Enter or click the send button
4. View AI responses in real-time
5. Use "Clear Chat" to reset the conversation

### Image Generation
1. Navigate to `/image-generator`
2. Enter a descriptive prompt
3. Optionally set negative prompts and adjust settings
4. Click "Generate Image"
5. Download, view, or copy prompts from generated images

## Configuration

### Environment Variables
- `GEMINI_API_KEY`: Google Gemini API key
- `HUGGINGFACE_API_KEY`: Hugging Face API key
- `DEBUG`: Enable debug mode (default: True)
- `HOST`: Server host (default: 0.0.0.0)
- `PORT`: Server port (default: 8000)

### Customization
- Modify `static/css/styles.css` for styling changes
- Update `config/settings.py` for application settings
- Extend JavaScript files for additional functionality

## Security Features
- API keys stored securely in environment variables
- Input validation and sanitization
- CORS configuration for cross-origin requests
- Request timeout handling
- Error logging without sensitive information exposure

## Browser Compatibility
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Troubleshooting

### Common Issues
1. **API Key Errors**: Ensure API keys are correctly set in `.env`
2. **Port Conflicts**: Change the port in `.env` if 8000 is occupied
3. **Module Import Errors**: Verify all dependencies are installed
4. **Browser Compatibility**: Use a modern browser with JavaScript enabled

### Debug Mode
Enable debug mode in `.env` for detailed error messages:
```env
DEBUG=True
```

## License
This project is provided as-is for educational and demonstration purposes.

## Support
For issues or questions, please check the troubleshooting section or review the code documentation.

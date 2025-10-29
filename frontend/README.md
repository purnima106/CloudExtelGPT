# CloudExtelGPT Frontend

A modern ChatGPT-like interface built with React and Vite.

## Features

- 🎨 ChatGPT-like UI design
- 💬 Real-time chat interface
- 📱 Responsive design with mobile support
- 🎯 Conversation management
- 🔄 Sidebar with conversation history
- 🚀 Fast and optimized with Vite

## Tech Stack

- **React 18** - UI library
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Routing
- **Axios** - HTTP client
- **Lucide React** - Icons

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the frontend directory:
```
VITE_API_BASE_URL=http://localhost:8000
```

3. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Project Structure

```
frontend/
├── src/
│   ├── components/     # Reusable components
│   ├── pages/         # Page components
│   ├── context/       # React context for state management
│   ├── services/      # API services
│   └── styles/        # CSS styles
├── public/            # Static assets
└── package.json       # Dependencies
```

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.


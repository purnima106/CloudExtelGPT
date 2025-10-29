import { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../services/config';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const createNewConversation = useCallback(() => {
    const newConversation = {
      id: Date.now().toString(),
      title: 'New Chat',
      createdAt: new Date().toISOString(),
    };
    setConversations(prev => [newConversation, ...prev]);
    setCurrentConversation(newConversation);
    setMessages([]);
  }, []);

  const selectConversation = useCallback((conversationId) => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
      setCurrentConversation(conversation);
      // Load messages for this conversation
      // This would typically fetch from backend
      setMessages([]);
    }
  }, [conversations]);

  const deleteConversation = useCallback((conversationId) => {
    setConversations(prev => prev.filter(c => c.id !== conversationId));
    if (currentConversation?.id === conversationId) {
      setCurrentConversation(null);
      setMessages([]);
    }
  }, [currentConversation]);

  const renameConversation = useCallback((conversationId, newTitle) => {
    if (!newTitle.trim()) return;
    setConversations(prev =>
      prev.map(c => c.id === conversationId ? { ...c, title: newTitle.trim() } : c)
    );
    if (currentConversation?.id === conversationId) {
      setCurrentConversation(prev => ({ ...prev, title: newTitle.trim() }));
    }
  }, [currentConversation]);

  const clearCurrentConversation = useCallback(() => {
    setCurrentConversation(null);
    setMessages([]);
  }, []);

  const sendMessage = useCallback(async (content, files = []) => {
    if (!content.trim() && files.length === 0) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim() || files.length > 0 ? `Sent ${files.length} file(s)` : '',
      timestamp: new Date().toISOString(),
      files: files.map(f => ({
        name: f.name,
        size: f.size,
        type: f.type,
        preview: f.preview,
      })),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('message', content.trim() || '');
      formData.append('conversation_id', currentConversation?.id || '');

      // Append files to FormData
      files.forEach((fileObj, index) => {
        formData.append(`files`, fileObj.file);
      });

      const response = await axios.post(`${API_BASE_URL}/api/chat/message`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.response || response.data.message || 'No response received',
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Update conversation title if it's the first message
      if (currentConversation && currentConversation.title === 'New Chat' && messages.length === 0) {
        const newTitle = content.trim().slice(0, 50) || `Chat with ${files.length} file(s)`;
        setCurrentConversation(prev => ({ ...prev, title: newTitle }));
        setConversations(prev =>
          prev.map(c => c.id === currentConversation.id ? { ...c, title: newTitle } : c)
        );
      }

      // Create conversation if it doesn't exist
      if (!currentConversation) {
        const newConversation = {
          id: response.data.conversation_id || Date.now().toString(),
          title: content.trim().slice(0, 50) || `Chat with ${files.length} file(s)`,
          createdAt: new Date().toISOString(),
        };
        setCurrentConversation(newConversation);
        setConversations(prev => [newConversation, ...prev]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
        error: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [currentConversation, messages.length]);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  const value = {
    conversations,
    currentConversation,
    messages,
    isLoading,
    sidebarOpen,
    createNewConversation,
    selectConversation,
    deleteConversation,
    renameConversation,
    clearCurrentConversation,
    sendMessage,
    toggleSidebar,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};


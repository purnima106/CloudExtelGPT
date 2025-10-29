import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Send, Bot, User, Loader, Home, Edit2, Check, X as XIcon, Paperclip, File, Image, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const ChatPage = () => {
  const { messages, isLoading, sendMessage, sidebarOpen, createNewConversation, currentConversation, renameConversation, clearCurrentConversation } = useApp();
  const [input, setInput] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(currentConversation?.title || '');
  const [attachedFiles, setAttachedFiles] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const titleInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const attachedFilesRef = useRef([]);
  const navigate = useNavigate();

  useEffect(() => {
    setEditTitle(currentConversation?.title || '');
  }, [currentConversation?.title]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Update ref when attachedFiles changes
  useEffect(() => {
    attachedFilesRef.current = attachedFiles;
  }, [attachedFiles]);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      attachedFilesRef.current.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, []);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        alert(`File ${file.name} is too large. Maximum size is 10MB.`);
        return false;
      }
      return true;
    });

    const newFiles = validFiles.map(file => ({
      id: Date.now() + Math.random(),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
    }));

    setAttachedFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (fileId) => {
    setAttachedFiles(prev => {
      const fileToRemove = prev.find(f => f.id === fileId);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter(f => f.id !== fileId);
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (fileType === 'application/pdf') return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((input.trim() || attachedFiles.length > 0) && !isLoading) {
      const messageToSend = input;
      const filesToSend = attachedFiles;
      
      setInput('');
      setAttachedFiles([]);
      
      // Reset textarea height
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
      }

      // Clean up preview URLs
      filesToSend.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });

      await sendMessage(messageToSend, filesToSend);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    // Auto-resize textarea
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 128)}px`;
    }
  };

  const handleTitleEdit = () => {
    if (editTitle.trim() && editTitle.trim() !== currentConversation?.title && currentConversation) {
      renameConversation(currentConversation.id, editTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const handleTitleCancel = () => {
    setEditTitle(currentConversation?.title || '');
    setIsEditingTitle(false);
  };

  const handleGoHome = () => {
    clearCurrentConversation();
    navigate('/');
  };

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
      
      {sidebarOpen && <Sidebar />}
      <div className="flex flex-col flex-1 overflow-hidden relative z-10">
        {/* Chat Header */}
        {currentConversation && messages.length > 0 && (
          <div className="border-b border-gray-200/50 bg-white/80 backdrop-blur-md px-4 py-3 shadow-sm">
            <div className="max-w-3xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <button
                  onClick={handleGoHome}
                  className="p-2 hover:bg-gradient-to-br hover:from-blue-100 hover:to-purple-100 rounded-xl transition-all duration-200 flex-shrink-0 hover:scale-105 hover:shadow-md"
                  title="Go to home"
                >
                  <Home className="w-5 h-5 text-gray-700" />
                </button>
                {isEditingTitle ? (
                  <div className="flex items-center gap-2 flex-1 min-w-0 animate-fadeIn">
                    <input
                      ref={titleInputRef}
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleTitleEdit();
                        } else if (e.key === 'Escape') {
                          e.preventDefault();
                          handleTitleCancel();
                        }
                      }}
                      onBlur={handleTitleEdit}
                      className="flex-1 px-3 py-1.5 border-2 border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm shadow-sm transition-all"
                      maxLength={50}
                    />
                    <button
                      onClick={handleTitleEdit}
                      className="p-1.5 hover:bg-green-100 rounded-lg transition-all duration-200 hover:scale-110"
                      title="Save"
                    >
                      <Check className="w-4 h-4 text-green-600" />
                    </button>
                    <button
                      onClick={handleTitleCancel}
                      className="p-1.5 hover:bg-red-100 rounded-lg transition-all duration-200 hover:scale-110"
                      title="Cancel"
                    >
                      <XIcon className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                ) : (
                  <div className="group flex items-center gap-2 flex-1 min-w-0">
                    <h2 className="text-lg font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent truncate">{currentConversation.title}</h2>
                    <button
                      onClick={() => setIsEditingTitle(true)}
                      className="p-1.5 hover:bg-gradient-to-br hover:from-blue-100 hover:to-purple-100 rounded-lg transition-all duration-200 opacity-60 hover:opacity-100 hover:scale-110"
                      title="Rename conversation"
                    >
                      <Edit2 className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main Chat Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-8">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full mt-20 animate-fadeIn">
                <div className="text-5xl font-extrabold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  CloudExtelGPT
                </div>
                <div className="text-gray-600 text-center mb-10 text-lg">
                  Start a conversation to get help with your queries
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-2xl">
                  <div className="group p-5 border border-gray-200/50 rounded-2xl hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 hover:border-blue-300/50 bg-white/60 backdrop-blur-sm">
                    <div className="font-bold mb-2 text-gray-800 text-lg">💡 Ask Questions</div>
                    <div className="text-sm text-gray-600">Get answers to your questions about CloudExtel policies and procedures</div>
                  </div>
                  <div className="group p-5 border border-gray-200/50 rounded-2xl hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 hover:border-purple-300/50 bg-white/60 backdrop-blur-sm">
                    <div className="font-bold mb-2 text-gray-800 text-lg">📄 Document Analysis</div>
                    <div className="text-sm text-gray-600">Upload and analyze PDF documents</div>
                  </div>
                  <div className="group p-5 border border-gray-200/50 rounded-2xl hover:bg-gradient-to-br hover:from-green-50 hover:to-blue-50 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 hover:border-green-300/50 bg-white/60 backdrop-blur-sm">
                    <div className="font-bold mb-2 text-gray-800 text-lg">📊 Data Insights</div>
                    <div className="text-sm text-gray-600">Explore data and get insights</div>
                  </div>
                  <div className="group p-5 border border-gray-200/50 rounded-2xl hover:bg-gradient-to-br hover:from-orange-50 hover:to-red-50 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 hover:border-orange-300/50 bg-white/60 backdrop-blur-sm">
                    <div className="font-bold mb-2 text-gray-800 text-lg">🔍 Search</div>
                    <div className="text-sm text-gray-600">Search through your knowledge base</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((message, index) => (
                  <div
                    key={message.id}
                    className={`flex gap-4 animate-fadeIn message-enter ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg ring-2 ring-green-200">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-5 py-3 shadow-md transition-all duration-200 hover:shadow-lg ${
                        message.role === 'user'
                          ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-200/50'
                          : message.error
                          ? 'bg-red-50 text-red-800 border-2 border-red-200 shadow-red-200/50'
                          : 'bg-white/90 backdrop-blur-sm text-gray-800 border border-gray-200/50 shadow-gray-200/50'
                      }`}
                    >
                      {message.content && (
                        <div className="whitespace-pre-wrap break-words leading-relaxed mb-2">{message.content}</div>
                      )}
                      {message.files && message.files.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {message.files.map((file, idx) => (
                            <div
                              key={idx}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                                message.role === 'user'
                                  ? 'bg-white/20 backdrop-blur-sm'
                                  : 'bg-gray-100'
                              }`}
                            >
                              {file.preview ? (
                                <img
                                  src={file.preview}
                                  alt={file.name}
                                  className="w-6 h-6 object-cover rounded"
                                />
                              ) : (
                                <div className={`w-6 h-6 rounded flex items-center justify-center ${
                                  message.role === 'user' ? 'bg-white/30' : 'bg-gray-200'
                                }`}>
                                  {file.type === 'application/pdf' ? (
                                    <FileText className="w-3 h-3 text-gray-600" />
                                  ) : file.type.startsWith('image/') ? (
                                    <Image className="w-3 h-3 text-gray-600" />
                                  ) : (
                                    <File className="w-3 h-3 text-gray-600" />
                                  )}
                                </div>
                              )}
                              <span className={`text-xs ${message.role === 'user' ? 'text-white' : 'text-gray-700'}`}>
                                {file.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {message.role === 'user' && (
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg ring-2 ring-blue-200">
                        <User className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-4 justify-start animate-fadeIn">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg ring-2 ring-green-200 animate-pulse">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div className="bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-2xl px-5 py-3 shadow-md">
                      <Loader className="w-5 h-5 animate-spin text-blue-500" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200/50 bg-white/80 backdrop-blur-md shadow-lg">
          <div className="max-w-3xl mx-auto px-4 py-5">
            {/* Attached Files Preview */}
            {attachedFiles.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2 animate-fadeIn">
                {attachedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="group relative flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200/50 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    {file.preview ? (
                      <img
                        src={file.preview}
                        alt={file.name}
                        className="w-8 h-8 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-400 rounded-lg flex items-center justify-center text-white">
                        {getFileIcon(file.type)}
                      </div>
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-medium text-gray-700 truncate max-w-[120px]">
                        {file.name}
                      </span>
                      <span className="text-xs text-gray-500">{formatFileSize(file.size)}</span>
                    </div>
                    <button
                      onClick={() => removeFile(file.id)}
                      className="p-1 hover:bg-red-100 rounded-lg transition-all duration-200 hover:scale-110 opacity-0 group-hover:opacity-100"
                      title="Remove file"
                    >
                      <XIcon className="w-3 h-3 text-red-600" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleSubmit} className="relative">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="Message CloudExtelGPT..."
                rows={1}
                className="w-full pl-14 pr-14 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none overflow-y-auto bg-white/90 backdrop-blur-sm shadow-sm transition-all duration-200 placeholder:text-gray-400"
                style={{ maxHeight: '128px', height: 'auto' }}
                disabled={isLoading}
              />
              <div className="absolute left-3 bottom-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 active:scale-95 z-10"
                  title="Attach files"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
              </div>
              <button
                type="submit"
                disabled={(!input.trim() && attachedFiles.length === 0) || isLoading}
                className="absolute right-3 bottom-3 p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 disabled:hover:scale-100 z-10"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
            <div className="text-xs text-gray-500 mt-3 text-center flex items-center justify-center gap-2">
              <span>CloudExtelGPT can make mistakes.</span>
              <span className="text-gray-400">Check important info.</span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-400">Supports PDF, images, and documents up to 10MB</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;


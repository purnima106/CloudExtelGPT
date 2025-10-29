import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, MessageSquare, Trash2, Menu, X, Edit2, Check, X as XIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ConversationItem = ({ conversation, isActive, onSelect, onDelete, onRename }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(conversation.title);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleRename = () => {
    if (editValue.trim() && editValue.trim() !== conversation.title) {
      onRename(conversation.id, editValue.trim());
    }
    setIsEditing(false);
    setEditValue(conversation.title);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(conversation.title);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.stopPropagation();
      handleRename();
    } else if (e.key === 'Escape') {
      e.stopPropagation();
      handleCancel();
    }
  };

  return (
    <div
      className={`group flex items-center gap-2 p-3 rounded-xl mb-1.5 cursor-pointer transition-all duration-200 ${
        isActive 
          ? 'bg-gradient-to-r from-blue-50 to-purple-50 shadow-md ring-2 ring-blue-400/50 border border-blue-200/50' 
          : 'hover:bg-gray-100'
      }`}
      onClick={() => !isEditing && onSelect(conversation.id)}
    >
      <MessageSquare className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
      {isEditing ? (
        <input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 bg-white text-gray-800 text-sm px-3 py-1.5 rounded-lg outline-none border-2 border-blue-500 focus:border-blue-400 shadow-sm transition-all animate-fadeIn"
          onBlur={handleRename}
        />
      ) : (
        <span className={`flex-1 truncate text-sm ${isActive ? 'font-medium text-gray-800' : 'text-gray-600'}`}>{conversation.title}</span>
      )}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {!isEditing ? (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              className="p-1.5 hover:bg-gray-200 rounded-lg transition-all duration-200 hover:scale-110"
              title="Rename conversation"
            >
              <Edit2 className="w-3.5 h-3.5 text-blue-600" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm('Are you sure you want to delete this conversation?')) {
                  onDelete(conversation.id);
                }
              }}
              className="p-1.5 hover:bg-gray-200 rounded-lg transition-all duration-200 hover:scale-110"
              title="Delete conversation"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-600" />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRename();
              }}
              className="p-1.5 hover:bg-green-100 rounded-lg transition-all duration-200 hover:scale-110"
              title="Save"
            >
              <Check className="w-3.5 h-3.5 text-green-600" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCancel();
              }}
              className="p-1.5 hover:bg-red-100 rounded-lg transition-all duration-200 hover:scale-110"
              title="Cancel"
            >
              <XIcon className="w-3.5 h-3.5 text-red-600" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

const Sidebar = () => {
  const {
    conversations,
    currentConversation,
    createNewConversation,
    selectConversation,
    deleteConversation,
    renameConversation,
    clearCurrentConversation,
    sidebarOpen,
    toggleSidebar,
  } = useApp();
  const navigate = useNavigate();

  const handleHomeClick = () => {
    clearCurrentConversation();
    navigate('/');
  };

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out shadow-lg ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
          <button
            onClick={createNewConversation}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-gray-300 hover:border-blue-400 bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 text-gray-800 transition-all duration-200 w-full shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">New chat</span>
          </button>
          <button
            onClick={toggleSidebar}
            className="lg:hidden ml-2 p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:scale-110"
          >
            <X className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {conversations.length === 0 ? (
            <div className="p-4 text-gray-500 text-sm text-center">
              <div className="text-gray-400 mb-2">✨</div>
              <div>No conversations yet.</div>
              <div className="text-gray-400 text-xs mt-1">Start a new chat!</div>
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.map((conversation) => (
                <ConversationItem
                  key={conversation.id}
                  conversation={conversation}
                  isActive={currentConversation?.id === conversation.id}
                  onSelect={selectConversation}
                  onDelete={deleteConversation}
                  onRename={renameConversation}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="text-xs text-gray-500 mb-3 font-semibold uppercase tracking-wider">Navigation</div>
          <div className="space-y-1.5">
            <button
              onClick={handleHomeClick}
              className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 text-sm flex items-center gap-2 group hover:scale-[1.02] text-gray-700"
            >
              <span className="text-lg group-hover:scale-110 transition-transform">🏠</span>
              <span className="font-medium">Home</span>
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 text-sm group hover:scale-[1.02] text-gray-700"
            >
              <span className="mr-2 group-hover:scale-110 transition-transform inline-block">📊</span>
              Dashboard
            </button>
            <button
              onClick={() => navigate('/pdf')}
              className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 text-sm group hover:scale-[1.02] text-gray-700"
            >
              <span className="mr-2 group-hover:scale-110 transition-transform inline-block">📄</span>
              Documents
            </button>
            <button
              onClick={() => navigate('/data')}
              className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 text-sm group hover:scale-[1.02] text-gray-700"
            >
              <span className="mr-2 group-hover:scale-110 transition-transform inline-block">📊</span>
              Data
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 text-sm group hover:scale-[1.02] text-gray-700"
            >
              <span className="mr-2 group-hover:scale-110 transition-transform inline-block">⚙️</span>
              Settings
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Menu Button */}
      {!sidebarOpen && (
        <button
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-30 p-3 bg-white text-gray-700 rounded-xl lg:hidden shadow-2xl hover:shadow-blue-500/20 transition-all duration-200 hover:scale-110 border border-gray-200"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}
    </>
  );
};

export default Sidebar;


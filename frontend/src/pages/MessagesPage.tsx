import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { authService, Chat, Message } from '../services/auth';

const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { showError, showSuccess } = useNotification();
  
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<Chat | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatListPollingRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll to bottom function
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Get URL parameters for direct chat initialization
  const searchParams = new URLSearchParams(location.search);
  const freelancerId = searchParams.get('freelancer');
  const projectId = searchParams.get('project');
  const chatId = searchParams.get('chat');

  const loadChats = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      
      const response = await authService.getChats();
      setChats(response.chats);
      
    } catch (error) {
      console.error('Failed to load chats:', error);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []); // Remove all dependencies to prevent circular updates

  const loadMessages = async (chatId: number) => {
    try {
      const response = await authService.getChatMessages(chatId);
      
      // Update messages, but preserve optimistic messages that haven't been confirmed yet
      setMessages(prevMessages => {
        const serverMessages = response.messages;
        const optimisticMessages = prevMessages.filter(msg => 
          typeof msg.id === 'number' && msg.id > 1000000000000 // Optimistic messages have timestamp IDs
        );
        
        // Remove optimistic messages that now have server counterparts
        const filteredOptimistic = optimisticMessages.filter(optimistic => 
          !serverMessages.some(server => 
            server.content === optimistic.content && 
            server.sender_id === optimistic.sender_id &&
            Math.abs(new Date(server.created_at).getTime() - new Date(optimistic.created_at).getTime()) < 10000 // Within 10 seconds
          )
        );
        
        // Combine server messages with remaining optimistic messages
        const combined = [...serverMessages, ...filteredOptimistic];
        
        // Sort by creation time
        return combined.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      });
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const initializeChatFromParams = useCallback(async (freelancerId: number, projectId: number) => {
    try {
      // Create chat if current user is client
      if (user?.role === 'client') {
        const response = await authService.createChat({
          project_id: projectId,
          freelancer_id: freelancerId
        });
        
        // Reload the entire chat list to ensure we have the most up-to-date data
        // This prevents duplicates and ensures consistency
        await loadChats(false);
        
        // Select the chat
        setSelectedChat(response.chat);
        await loadMessages(response.chat.id);
      }
    } catch (error) {
      console.error('Failed to initialize chat:', error);
    }
  }, [user?.role, loadChats]);

  // Separate effect to update selected chat when chats are refreshed
  useEffect(() => {
    if (selectedChat && chats.length > 0) {
      const updatedSelectedChat = chats.find(chat => chat.id === selectedChat.id);
      if (updatedSelectedChat && updatedSelectedChat.unread_count !== selectedChat.unread_count) {
        setSelectedChat(updatedSelectedChat);
      }
    }
  }, [chats, selectedChat]);

  // Separate effect to handle URL parameters and chat initialization
  useEffect(() => {
    const initializeFromURL = async () => {
      // If there's a specific chat ID in URL, select it after chats are loaded
      if (chatId && chats.length > 0) {
        const chat = chats.find(c => c.id === parseInt(chatId));
        if (chat && (!selectedChat || selectedChat.id !== chat.id)) {
          setSelectedChat(chat);
          // Clear URL parameters after selecting the chat to allow manual selection
          navigate('/messages', { replace: true });
        }
      }
      // If there are URL parameters, try to find or create the chat
      else if (freelancerId && projectId && user?.role === 'client' && chats.length > 0) {
        await initializeChatFromParams(parseInt(freelancerId), parseInt(projectId));
        // Clear URL parameters after creating/selecting the chat
        navigate('/messages', { replace: true });
      }
    };

    initializeFromURL();
  }, [chats, chatId, freelancerId, projectId, user?.role, selectedChat, initializeChatFromParams, navigate]);

  useEffect(() => {
    loadChats();
    
    // Start polling for chat list updates every 15 seconds
    chatListPollingRef.current = setInterval(() => {
      loadChats(false); // Don't show loading state for background updates
    }, 15000);

    return () => {
      if (chatListPollingRef.current) {
        clearInterval(chatListPollingRef.current);
      }
    };
  }, [loadChats]);

  // Start polling for new messages when a chat is selected
  useEffect(() => {
    // Clear existing interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Start polling if a chat is selected
    if (selectedChat) {
      // Load messages immediately
      loadMessages(selectedChat.id);
      
      // Mark messages as read
      markChatAsRead(selectedChat.id);
      
      // Set up polling interval
      pollingIntervalRef.current = setInterval(() => {
        loadMessages(selectedChat.id);
      }, 3000); // Poll every 3 seconds
    }

    // Cleanup function
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [selectedChat]);

  // Auto-mark messages as read when viewing a chat
  const markChatAsRead = async (chatId: number) => {
    try {
      await authService.markMessagesAsRead(chatId);
      // Update the chat's unread count in local state
      setChats(prev => prev.map(chat => 
        chat.id === chatId ? { ...chat, unread_count: 0 } : chat
      ));
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
  };

  // Cleanup polling on component unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      if (chatListPollingRef.current) {
        clearInterval(chatListPollingRef.current);
      }
    };
  }, []);

  const handleChatSelect = (chat: Chat) => {
    setSelectedChat(chat);
    // loadMessages will be called automatically by useEffect
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedChat || sending) return;
    
    setSending(true);
    
    // Create optimistic message for immediate display
    const optimisticMessage: Message = {
      id: Date.now(), // Temporary ID
      chat_id: selectedChat.id,
      sender_id: user?.id || 0,
      sender: {
        id: user?.id || 0,
        name: user?.name || '',
        email: user?.email || '',
        role: user?.role || ''
      },
      content: newMessage,
      type: 'text',
      created_at: new Date().toISOString()
    };
    
    // Immediately add message to local state for better UX
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');
    
    try {
      await authService.sendMessage({
        chat_id: selectedChat.id,
        content: newMessage,
        type: 'text'
      });
      
      // Message sent successfully - polling will eventually replace the optimistic message with the real one
    } catch (error) {
      console.error('Failed to send message:', error);
      showError('發送失敗，請稍後再試');
      
      // Remove the optimistic message if sending failed
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      setNewMessage(optimisticMessage.content); // Restore the message content
    } finally {
      setSending(false);
    }
  };

  const handleDeleteChat = async (chat: Chat) => {
    try {
      setDeleteLoading(true);
      await authService.deleteChat(chat.id);
      
      // Remove chat from local state
      setChats(prev => prev.filter(c => c.id !== chat.id));
      
      // If this was the selected chat, clear selection
      if (selectedChat?.id === chat.id) {
        setSelectedChat(null);
        setMessages([]);
      }
      
      // Close modal and reset state
      setShowDeleteModal(false);
      setChatToDelete(null);
      
      // Show success message (you can use your notification system here)
      showSuccess('對話已隱藏！');
    } catch (error: any) {
      console.error('Failed to delete chat:', error);
      showError(error.response?.data?.error || '刪除失敗，請稍後再試');
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 1) {
      return date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return date.toLocaleDateString('zh-TW');
    }
  };

  if (!user) {
    return <div>請先登入</div>;
  }

  return (
    <div className="h-[calc(100vh-200px)] flex">
      {/* Sidebar - Chat List */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">訊息</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">載入中...</p>
            </div>
          ) : chats.length === 0 ? (
            <div className="p-4 text-center">
              <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="mt-2 text-sm text-gray-600">還沒有任何對話</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {chats.map(chat => {
                const otherUser = user.role === 'client' ? chat.freelancer : chat.client;
                const hasUnread = (chat.unread_count || 0) > 0;
                
                return (
                  <div
                    key={chat.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer relative ${
                      selectedChat?.id === chat.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                    } ${hasUnread ? 'bg-blue-25' : ''}`}
                    onClick={() => handleChatSelect(chat)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 relative">
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {otherUser.name.charAt(0)}
                          </span>
                        </div>
                        {hasUnread && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm truncate ${hasUnread ? 'font-semibold text-gray-900' : 'font-medium text-gray-900'}`}>
                            {otherUser.name}
                          </p>
                          {hasUnread && (
                            <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center ml-2">
                              {(chat.unread_count || 0) > 99 ? '99+' : chat.unread_count}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          {chat.project.title}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-700">
                      {(user.role === 'client' ? selectedChat.freelancer : selectedChat.client).name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      {(user.role === 'client' ? selectedChat.freelancer : selectedChat.client).name}
                    </h3>
                    <p className="text-xs text-gray-500">{selectedChat.project.title}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => navigate(`/projects/${selectedChat.project_id}`)}
                    className="text-blue-600 hover:text-blue-700 text-sm px-3 py-1 rounded-md hover:bg-blue-50 transition-colors"
                  >
                    查看案件
                  </button>
                  <button
                    onClick={() => {
                      setChatToDelete(selectedChat);
                      setShowDeleteModal(true);
                    }}
                    className="text-red-600 hover:text-red-700 p-2 rounded-md hover:bg-red-50 transition-colors"
                    title="隱藏對話"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map(message => {
                // Handle system messages differently
                if (message.type === 'system') {
                  return (
                    <div key={message.id} className="flex justify-center">
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 max-w-md">
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          <p className="text-sm text-yellow-800 font-medium">{message.content}</p>
                        </div>
                        <p className="text-xs text-yellow-600 mt-1 text-center">
                          {formatMessageTime(message.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                }
                
                // Handle regular messages
                return (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender_id === user.id
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          message.sender_id === user.id ? 'text-blue-100' : 'text-gray-500'
                        }`}
                      >
                        {formatMessageTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
              {/* Auto-scroll target */}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="輸入訊息..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? '發送中...' : '發送'}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">選擇對話開始聊天</h3>
              <p className="mt-1 text-sm text-gray-500">從左側列表選擇一個對話</p>
            </div>
          </div>
        )}
      </div>

      {/* Delete Chat Modal */}
      {showDeleteModal && chatToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-900">隱藏對話</h2>
              </div>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setChatToDelete(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors"
                disabled={deleteLoading}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="mb-4">
                <p className="text-gray-700 mb-2">
                  確定要隱藏與 <span className="font-semibold">{(user.role === 'client' ? chatToDelete.freelancer : chatToDelete.client).name}</span> 的對話嗎？
                </p>
                <p className="text-sm text-gray-500 mb-1">
                  案件：{chatToDelete.project.title}
                </p>
                <p className="text-sm text-yellow-600 font-medium">
                  對話將從您的列表中隱藏，但對方仍可以看到。如果對方發送新訊息，對話會重新出現在您的列表中。
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setChatToDelete(null);
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                  disabled={deleteLoading}
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteChat(chatToDelete)}
                  className={`flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors ${deleteLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>隱藏中...</span>
                    </div>
                  ) : (
                    '隱藏對話'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagesPage; 
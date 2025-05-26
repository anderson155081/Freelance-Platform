import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService, Chat, Message } from '../services/auth';

const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Get URL parameters for direct chat initialization
  const searchParams = new URLSearchParams(location.search);
  const freelancerId = searchParams.get('freelancer');
  const projectId = searchParams.get('project');
  const chatId = searchParams.get('chat');

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      setLoading(true);
      
      const response = await authService.getChats();
      setChats(response.chats);
      
      // If there's a specific chat ID in URL, select it
      if (chatId) {
        const chat = response.chats.find(c => c.id === parseInt(chatId));
        if (chat) {
          setSelectedChat(chat);
          await loadMessages(chat.id);
        }
      }
      // If there are URL parameters, try to find or create the chat
      else if (freelancerId && projectId) {
        await initializeChatFromParams(parseInt(freelancerId), parseInt(projectId));
      }
    } catch (error) {
      console.error('Failed to load chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeChatFromParams = async (freelancerId: number, projectId: number) => {
    try {
      // Create chat if current user is client
      if (user?.role === 'client') {
        const response = await authService.createChat({
          project_id: projectId,
          freelancer_id: freelancerId
        });
        
        // Add the new chat to the list and select it
        setChats(prev => [response.chat, ...prev]);
        setSelectedChat(response.chat);
        await loadMessages(response.chat.id);
      }
    } catch (error) {
      console.error('Failed to initialize chat:', error);
    }
  };

  const loadMessages = async (chatId: number) => {
    try {
      const response = await authService.getChatMessages(chatId);
      setMessages(response.messages);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleChatSelect = (chat: Chat) => {
    setSelectedChat(chat);
    loadMessages(chat.id);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedChat || sending) return;
    
    setSending(true);
    
    try {
      const response = await authService.sendMessage({
        chat_id: selectedChat.id,
        content: newMessage,
        type: 'text'
      });
      
      setMessages(prev => [...prev, response.message]);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('發送失敗，請稍後再試');
    } finally {
      setSending(false);
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
                return (
                  <div
                    key={chat.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer ${
                      selectedChat?.id === chat.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                    }`}
                    onClick={() => handleChatSelect(chat)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {otherUser.name.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {otherUser.name}
                        </p>
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
                <button
                  onClick={() => navigate(`/projects/${selectedChat.project_id}`)}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  查看案件
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map(message => (
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
              ))}
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
    </div>
  );
};

export default MessagesPage; 
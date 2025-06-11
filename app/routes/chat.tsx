import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Search, Send, MessageCircle, Bot, User, Settings, Plus, ArrowLeft } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Types
interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai' | 'contact';
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read';
}

interface Chat {
  id: string;
  name: string;
  type: 'ai' | 'contact';
  avatar: string;
  lastMessage?: Message;
  unreadCount: number;
  isOnline: boolean;
}

interface User {
  id: string;
  name: string;
  avatar: string;
}

// Mock data
const mockChats: Chat[] = [
  {
    id: '1',
    name: 'AI Assistant',
    type: 'ai',
    avatar: '🤖',
    unreadCount: 0,
    isOnline: true
  },
  {
    id: '2',
    name: 'John Doe',
    type: 'contact',
    avatar: '👨‍💼',
    unreadCount: 2,
    isOnline: true
  },
  {
    id: '3',
    name: 'Jane Smith',
    type: 'contact',
    avatar: '👩‍💻',
    unreadCount: 0,
    isOnline: false
  }
];

const currentUser: User = {
  id: 'me',
  name: 'You',
  avatar: '👤'
};

// AI Response simulation
const getAIResponse = async (message: string): Promise<string> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  const responses = [
    "That's an interesting question! Let me think about it...",
    "I understand what you're asking. Here's my perspective:",
    "Great point! Based on what you've shared, I'd suggest:",
    "Thanks for sharing that with me. Here's what I think:",
    "I appreciate you bringing this up. My analysis is:",
    "That's a complex topic. Let me break it down for you:"
  ];
  
  const randomResponse = responses[Math.floor(Math.random() * responses.length)];
  return `${randomResponse} ${message.toLowerCase().includes('hello') ? 'Hello there! How can I help you today?' : 'This is a simulated AI response to demonstrate the chat functionality.'}`;
};

// Local storage utilities
const STORAGE_KEY = 'ai-chat-messages';

const saveMessages = (messages: Record<string, Message[]>) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch (error) {
    console.error('Failed to save messages:', error);
  }
};

const loadMessages = (): Record<string, Message[]> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Failed to load messages:', error);
    return {};
  }
};

// Components
const ChatList: React.FC<{
  chats: Chat[];
  activeChat: string | null;
  onChatSelect: (chatId: string) => void;
  onNewChat: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}> = ({ chats, activeChat, onChatSelect, onNewChat, searchQuery, onSearchChange }) => {
  const filteredChats = useMemo(() => {
    return chats.filter(chat =>
      chat.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [chats, searchQuery]);

  return (
    <div className="bg-white border-r border-gray-200 w-80 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-gray-900">Telegram Clone</h1>
          <div className="flex items-center space-x-2">
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <User className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* New Chat Button */}
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={onNewChat}
          className="w-full flex items-center space-x-3 p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>New AI Chat</span>
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          <h3 className="px-2 py-1 text-sm font-medium text-gray-500 uppercase tracking-wider">
            AI Assistants
          </h3>
          {filteredChats.filter(chat => chat.type === 'ai').map(chat => (
            <ChatItem
              key={chat.id}
              chat={chat}
              isActive={activeChat === chat.id}
              onClick={() => onChatSelect(chat.id)}
            />
          ))}
        </div>
        
        <div className="p-2">
          <h3 className="px-2 py-1 text-sm font-medium text-gray-500 uppercase tracking-wider">
            Contacts
          </h3>
          {filteredChats.filter(chat => chat.type === 'contact').map(chat => (
            <ChatItem
              key={chat.id}
              chat={chat}
              isActive={activeChat === chat.id}
              onClick={() => onChatSelect(chat.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const ChatItem: React.FC<{
  chat: Chat;
  isActive: boolean;
  onClick: () => void;
}> = ({ chat, isActive, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
        isActive ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50'
      }`}
    >
      <div className="relative">
        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-xl">
          {chat.avatar}
        </div>
        {chat.isOnline && (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900 truncate">{chat.name}</h3>
          {chat.unreadCount > 0 && (
            <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
              {chat.unreadCount}
            </span>
          )}
        </div>
        {chat.lastMessage && (
          <p className="text-sm text-gray-500 truncate">
            {chat.lastMessage.text}
          </p>
        )}
      </div>
    </div>
  );
};

const ChatArea: React.FC<{
  chat: Chat | null;
  messages: Message[];
  onSendMessage: (text: string) => void;
  isTyping: boolean;
  onBack: () => void;
  isMobile: boolean;
}> = ({ chat, messages, onSendMessage, isTyping, onBack, isMobile }) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = useCallback(() => {
    if (inputText.trim()) {
      onSendMessage(inputText.trim());
      setInputText('');
      inputRef.current?.focus();
    }
  }, [inputText, onSendMessage]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-gray-600 mb-2">Select a chat to start messaging</h2>
          <p className="text-gray-500">Choose a conversation from the sidebar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center">
        {isMobile && (
          <button
            onClick={onBack}
            className="mr-3 p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-lg">
              {chat.avatar}
            </div>
            {chat.isOnline && (
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            )}
          </div>
          <div>
            <h2 className="font-medium text-gray-900">{chat.name}</h2>
            <p className="text-sm text-gray-500">
              {chat.isOnline ? 'Online' : 'Last seen recently'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        
        {isTyping && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm">
              {chat.avatar}
            </div>
            <div className="bg-white rounded-2xl rounded-bl-md px-4 py-2 shadow-sm">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              rows={1}
              className="w-full px-4 py-2 border border-gray-300 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!inputText.trim()}
            className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
  const isOwnMessage = message.sender === 'user';
  
  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
          isOwnMessage
            ? 'bg-blue-500 text-white rounded-br-md'
            : 'bg-white text-gray-900 rounded-bl-md shadow-sm'
        }`}
      >
        <p className="text-sm">{message.text}</p>
        <div className={`flex items-center justify-end space-x-1 mt-1 text-xs ${
          isOwnMessage ? 'text-blue-100' : 'text-gray-500'
        }`}>
          <span>{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          {isOwnMessage && (
            <span className="text-xs">
              {message.status === 'sent' && '✓'}
              {message.status === 'delivered' && '✓✓'}
              {message.status === 'read' && '✓✓'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// Main Chat Component
export default function Chat() {
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const queryClient = useQueryClient();

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      setShowSidebar(window.innerWidth >= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Query for chats
  const { data: chats = mockChats, isLoading: isChatsLoading, error: chatsError } = useQuery({
    queryKey: ['chats'],
    queryFn: async () => {
      // Simulate API/localStorage
      return mockChats;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Query for messages
  const { data: messages = {}, isLoading: isMessagesLoading, error: messagesError } = useQuery({
    queryKey: ['messages'],
    queryFn: async () => loadMessages(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Mutation for saving messages
  const saveMessagesMutation = useMutation({
    mutationFn: async (newMessages: Record<string, Message[]>) => {
      saveMessages(newMessages);
      return newMessages;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['messages'], data);
    },
  });

  // Mutation for sending a message
  const sendMessageMutation = useMutation({
    mutationFn: async ({ chatId, text }: { chatId: string, text: string }) => {
      const newMessage: Message = {
        id: Date.now().toString(),
        text,
        sender: 'user',
        timestamp: new Date(),
        status: 'sent',
      };
      const prevMessages = queryClient.getQueryData<Record<string, Message[]>>(['messages']) || {};
      const updated = {
        ...prevMessages,
        [chatId]: [...(prevMessages[chatId] || []), newMessage],
      };
      saveMessages(updated);
      return { chatId, newMessage, updated };
    },
    onSuccess: ({ chatId, newMessage, updated }) => {
      queryClient.setQueryData(['messages'], updated);
      // Update lastMessage in chats
      const prevChats = queryClient.getQueryData<Chat[]>(['chats']) || [];
      const updatedChats = prevChats.map(chat =>
        chat.id === chatId ? { ...chat, lastMessage: newMessage } : chat
      );
      queryClient.setQueryData(['chats'], updatedChats);
    },
  });

  const handleChatSelect = useCallback((chatId: string) => {
    setActiveChat(chatId);
    if (isMobile) {
      setShowSidebar(false);
    }
    // Mark messages as read
    const chatMessages = messages[chatId] || [];
    const updatedMessages = chatMessages.map(msg =>
      msg.sender !== 'user' ? { ...msg, status: 'read' as const } : msg
    );
    const newMessages = { ...messages, [chatId]: updatedMessages };
    saveMessagesMutation.mutate(newMessages);
    // Update unread count in chats
    const updatedChats = (chats || []).map(chat =>
      chat.id === chatId ? { ...chat, unreadCount: 0 } : chat
    );
    queryClient.setQueryData(['chats'], updatedChats);
  }, [isMobile, messages, chats, saveMessagesMutation, queryClient]);

  const handleSendMessage = useCallback(async (text: string) => {
    if (!activeChat) return;
    await sendMessageMutation.mutateAsync({ chatId: activeChat, text });
    // If it's an AI chat, get AI response
    const chat = (chats || []).find(c => c.id === activeChat);
    if (chat?.type === 'ai') {
      setIsTyping(true);
      try {
        const aiResponse = await getAIResponse(text);
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: aiResponse,
          sender: 'ai',
          timestamp: new Date(),
          status: 'delivered',
        };
        const prevMessages = queryClient.getQueryData<Record<string, Message[]>>(['messages']) || {};
        const updated = {
          ...prevMessages,
          [activeChat]: [...(prevMessages[activeChat] || []), aiMessage],
        };
        saveMessagesMutation.mutate(updated);
        // Update lastMessage in chats
        const prevChats = queryClient.getQueryData<Chat[]>(['chats']) || [];
        const updatedChats = prevChats.map(c =>
          c.id === activeChat ? { ...c, lastMessage: aiMessage } : c
        );
        queryClient.setQueryData(['chats'], updatedChats);
      } catch (error) {
        console.error('Failed to get AI response:', error);
      } finally {
        setIsTyping(false);
      }
    }
  }, [activeChat, chats, queryClient, saveMessagesMutation, sendMessageMutation]);

  const handleNewChat = useCallback(() => {
    const newChatId = `ai-${Date.now()}`;
    const newChat: Chat = {
      id: newChatId,
      name: `AI Assistant ${(chats || []).filter(c => c.type === 'ai').length + 1}`,
      type: 'ai',
      avatar: '🤖',
      unreadCount: 0,
      isOnline: true
    };
    queryClient.setQueryData(['chats'], (prevChats: Chat[] = []) => [newChat, ...prevChats]);
    setActiveChat(newChatId);
    if (isMobile) {
      setShowSidebar(false);
    }
  }, [chats, isMobile, queryClient]);

  const handleBack = useCallback(() => {
    if (isMobile) {
      setShowSidebar(true);
    }
  }, [isMobile]);

  const activeChat_obj = chats.find(chat => chat.id === activeChat);
  const chatMessages = activeChat ? messages[activeChat] || [] : [];

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Sidebar */}
      {(!isMobile || showSidebar) && (
        <ChatList
          chats={chats}
          activeChat={activeChat}
          onChatSelect={handleChatSelect}
          onNewChat={handleNewChat}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      )}

      {/* Chat Area */}
      {(!isMobile || !showSidebar) && (
        <ChatArea
          chat={activeChat_obj || null}
          messages={chatMessages}
          onSendMessage={handleSendMessage}
          isTyping={isTyping}
          onBack={handleBack}
          isMobile={isMobile}
        />
      )}
    </div>
  );
}
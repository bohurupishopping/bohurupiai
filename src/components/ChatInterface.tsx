'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Search, Settings, MoreVertical, X, Copy, Check, Trash2, Save, BookOpen } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ConversationService } from '@/services/conversationService';
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/integrations/supabase/client";
import StoryCreationPopup from './StoryCreationPopup';

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface ChatInterfaceProps {
  generateContent: (prompt: string) => Promise<string | null>;
  defaultMessage?: string;
  sessionId?: string;
}

export default function ChatInterface({ generateContent, defaultMessage, sessionId }: ChatInterfaceProps) {
  const [prompt, setPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: defaultMessage || "# Hello, Bohurupi Explorer! 👋\n\nWelcome to a world where conversations come alive! I’m here to assist you with any questions or tasks you may have. How can I help you today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    
  ])
  const [isTyping, setIsTyping] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [conversationService] = useState(() => new ConversationService(sessionId));
  const { toast } = useToast();
  const [isStoryPopupOpen, setIsStoryPopupOpen] = useState(false);

  const storyButton = (
    <Button
      variant="ghost"
      className="h-8 sm:h-10 px-3 sm:px-4 rounded-full group relative overflow-hidden bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 transition-all duration-300"
      onClick={() => setIsStoryPopupOpen(true)}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="flex items-center gap-2">
        <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 group-hover:scale-110 transition-transform duration-300" />
        <span className="hidden sm:inline text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Create Story
        </span>
      </div>
    </Button>
  );

  const handleStorySubmit = async (prompt: string) => {
    const userMessage: Message = {
      role: 'user',
      content: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setIsTyping(true);

    try {
      const response = await generateContent(prompt);
      
      if (response) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: response,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, assistantMessage]);
        await conversationService.saveConversation(prompt, response);
        window.dispatchEvent(new CustomEvent('chat-updated'));
      }
    } catch (error) {
      console.error('Error generating story:', error);
      toast({
        title: "Error",
        description: "Failed to generate story",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (sessionId) {
      loadChatSession(sessionId);
    } else {
      // Reset to default state for new chat
      setMessages([{
        role: 'assistant',
        content: defaultMessage || "# Hello, Bohurupi Explorer! 👋\n\nWelcome to a world where conversations come alive! I'm here to assist you with any questions or tasks you may have. How can I help you today?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }
  }, [sessionId, defaultMessage]);

  const loadChatSession = async (sid: string) => {
    try {
      console.log('Loading session:', sid);
      const loadedMessages = await conversationService.loadChatSession(sid);
      console.log('Loaded messages:', loadedMessages);
      
      if (loadedMessages.length > 0) {
        setMessages(loadedMessages);
      }
    } catch (error) {
      console.error('Error loading chat session:', error);
      toast({
        title: "Error",
        description: "Failed to load chat history",
        variant: "destructive",
      });
    }
  };

  const buildContextualPrompt = async (newPrompt: string) => {
    try {
      // Get the last 5 messages for context
      const recentMessages = await conversationService.getRecentConversations(5);
      
      // Build the context string
      const context = recentMessages
        .reverse() // Get messages in chronological order
        .map(msg => `User: ${msg.prompt}\nAssistant: ${msg.response}`)
        .join('\n\n');

      // Combine context with new prompt
      const contextualPrompt = context 
        ? `Previous conversation:\n${context}\n\nUser: ${newPrompt}`
        : newPrompt;

      return contextualPrompt;
    } catch (error) {
      console.error('Error building contextual prompt:', error);
      return newPrompt; // Fallback to just the new prompt if there's an error
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    const userMessage: Message = { 
      role: 'user', 
      content: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setPrompt('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      // Build contextual prompt
      const contextualPrompt = await buildContextualPrompt(prompt);
      console.log('Contextual prompt:', contextualPrompt);

      // Generate response with context
      const response = await generateContent(contextualPrompt);
      
      if (response) {
        // Save just the original prompt and response
        await conversationService.saveConversation(prompt, response);

        const assistantMessage: Message = { 
          role: 'assistant', 
          content: response,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, assistantMessage]);
        setIsTyping(false);

        // Notify that chat was updated
        window.dispatchEvent(new CustomEvent('chat-updated'));
      }
    } catch (error) {
      console.error('Error handling conversation:', error);
      toast({
        title: "Error",
        description: "Failed to generate response",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const toggleSearch = () => {
    setIsSearching(!isSearching)
    setSearchQuery('')
  }

  const filteredMessages = messages.filter(message => 
    message.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatMessage = (content: string) => {
    // Check if content contains HTML tags
    if (content.includes('<')) {
      return (
        <div 
          className="prose prose-sm sm:prose-base prose-gray max-w-none"
          dangerouslySetInnerHTML={{ 
            __html: content
              // Add additional styling to paragraphs with reduced margins
              .replace(
                /<p class="/g, 
                '<p class="font-normal text-[15px] leading-[1.8] tracking-wide my-1.5 '
              )
              // Add styling to headings with proper spacing
              .replace(
                /<h1 class="/g,
                '<h1 class="text-2xl font-bold mt-4 mb-3 text-gray-800 '
              )
              .replace(
                /<h2 class="/g,
                '<h2 class="text-xl font-semibold mt-3 mb-2 text-gray-700 '
              )
              .replace(
                /<h3 class="/g,
                '<h3 class="text-lg font-medium mt-2 mb-1.5 text-gray-600 '
              )
              // Add styling to horizontal rules for section breaks
              .replace(
                /\n---\n/g,
                '<hr class="my-3 border-t border-gray-200" />'
              )
              // Handle multiple consecutive newlines
              .replace(/\n\n+/g, '\n')
              // Add styling to lists with reduced spacing
              .replace(
                /<li class="/g,
                '<li class="my-0.5 text-[15px] leading-[1.8] '
              )
              // Add styling to blockquotes with reduced margins
              .replace(
                /<blockquote class="/g,
                '<blockquote class="italic text-gray-600 border-l-4 pl-4 my-2 '
              )
              // Add styling to code blocks with proper spacing
              .replace(
                /<pre class="/g,
                '<pre class="bg-gray-50 rounded-lg p-3 my-2 overflow-x-auto '
              )
              // Add styling to inline code
              .replace(
                /<code class="/g,
                '<code class="bg-gray-100 px-1.5 py-0.5 rounded text-sm text-blue-600 font-mono '
              )
          }} 
        />
      );
    }

    // Fallback to original formatting for non-HTML content
    const lines = content.split('\n').filter(line => line.trim() !== '');
    return lines.map((line, index) => {
      if (line.startsWith('# ')) {
        return <h1 key={index} className="text-2xl font-bold mt-4 mb-3 text-gray-800">{line.slice(2)}</h1>;
      } else if (line.startsWith('## ')) {
        return <h2 key={index} className="text-xl font-semibold mt-3 mb-2 text-gray-700">{line.slice(3)}</h2>;
      } else if (line.startsWith('- ')) {
        return <li key={index} className="ml-4 my-0.5 text-[15px] leading-[1.8]">{line.slice(2)}</li>;
      } else if (line.trim() === '---') {
        return <hr key={index} className="my-3 border-t border-gray-200" />;
      } else {
        return (
          <p key={index} className="font-normal text-[15px] leading-[1.8] tracking-wide text-gray-700 my-1.5">
            {line}
          </p>
        );
      }
    });
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  return (
    <div className="h-[90dvh] flex flex-col overflow-hidden p-1">
      <StoryCreationPopup
        isOpen={isStoryPopupOpen}
        onClose={() => setIsStoryPopupOpen(false)}
        onSubmit={handleStorySubmit}
      />
      <Card 
        className="flex-1 mx-1 my-0.5 sm:m-2 
          bg-white/60 backdrop-blur-[10px] 
          rounded-[2rem] sm:rounded-[2.5rem] 
          border border-white/20 
          shadow-[0_8px_40px_rgba(0,0,0,0.12)] 
          relative
          flex flex-col
          overflow-hidden
          h-[calc(98dvh-8px)] sm:h-[calc(98dvh-16px)]"
        style={{ 
          background: 'linear-gradient(to top, #f3e7e9 0%, #e3eeff 99%, #e3eeff 100%)'
        }}
      >
        <div className="absolute inset-0 rounded-[2rem] sm:rounded-[2.5rem] animate-glow">
          <div className="absolute inset-0 rounded-[2rem] sm:rounded-[2.5rem] 
            bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 
            blur-xl opacity-50">
          </div>
        </div>

        <CardHeader 
          className="border-b border-white/20 
            px-3 sm:px-6 py-2 sm:py-3
            flex flex-row justify-between items-center 
            bg-white/40 backdrop-blur-[10px]
            relative z-10
            h-[50px] sm:h-[60px] flex-shrink-0"
        >
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Avatar className="w-8 h-8 sm:w-10 sm:h-10">
              <AvatarImage src="/src/assets/ai-icon.png" alt="AI Avatar" />
            </Avatar>
            <span className="font-medium text-sm sm:text-base hidden sm:inline">Bohurupi AI : Your Personalized AI Assistant</span>
            <span className="font-medium text-sm sm:hidden">Bohurupi AI</span>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            {storyButton}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 sm:h-10 sm:w-10 rounded-full"
              onClick={async () => {
                try {
                  // Save current conversation
                  const currentSessionId = conversationService.getSessionId();
                  toast({
                    title: "Chat Saved",
                    description: "This conversation has been saved to your history.",
                  });
                } catch (error) {
                  toast({
                    title: "Error",
                    description: "Failed to save conversation",
                    variant: "destructive",
                  });
                }
              }}
            >
              <Save className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10 rounded-full" onClick={toggleSearch}>
              <Search className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10 rounded-full">
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10 rounded-full">
              <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 sm:h-10 sm:w-10 rounded-full text-red-500 hover:text-red-600"
              onClick={async () => {
                try {
                  await conversationService.clearConversationHistory();
                  setMessages([{
                    role: 'assistant',
                    content: defaultMessage || "Chat history cleared. How can I help you?",
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  }]);
                  toast({
                    title: "Chat Cleared",
                    description: "The conversation history has been cleared.",
                  });
                } catch (error) {
                  toast({
                    title: "Error",
                    description: "Failed to clear chat history",
                    variant: "destructive",
                  });
                }
              }}
            >
              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent 
          className="flex-1 flex flex-col overflow-hidden p-0 
            h-[calc(95dvh-90px)] sm:h-[calc(94dvh-100px)]"
        >
          {isSearching && (
            <div className="p-2 sm:p-3 border-b border-white/20 bg-white/40 backdrop-blur-[10px] flex-shrink-0">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  onClick={toggleSearch}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
          
          <div 
            className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-500/20 
              scrollbar-track-transparent hover:scrollbar-thumb-blue-500/30 
              transition-colors duration-200
              scroll-smooth"
          >
            <div className="p-3 sm:p-6 space-y-3 sm:space-y-4 relative z-10">
              <AnimatePresence>
                {(searchQuery ? filteredMessages : messages).map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-start space-x-2 sm:space-x-3 max-w-[85%] sm:max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      <Avatar className="w-6 h-6 sm:w-8 sm:h-8 mt-1">
                        <AvatarImage 
                          src={message.role === 'user' ? "/src/assets/pritam-img.png" : "/src/assets/ai-icon.png"} 
                          alt={message.role === 'user' ? "User" : "AI"} 
                        />
                      </Avatar>
                      <div className="flex flex-col space-y-1">
                        <motion.div
                          initial={{ scale: 0.95 }}
                          animate={{ scale: 1 }}
                          className={`px-3 sm:px-4 py-2.5 sm:py-3.5 rounded-2xl ${
                            message.role === 'user' 
                              ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg' 
                              : 'bg-white/50 backdrop-blur-[10px] border border-white/20 text-gray-900'
                          }`}
                          style={{
                            WebkitBackdropFilter: 'blur(10px)',
                            backdropFilter: 'blur(10px)',
                          }}
                        >
                          <div className={`whitespace-pre-wrap break-words text-xs sm:text-sm ${
                            message.role === 'user' ? 'text-white/90' : ''
                          }`}>
                            {message.role === 'user' ? (
                              <div className="text-white leading-relaxed">{message.content}</div>
                            ) : (
                              formatMessage(message.content)
                            )}
                          </div>
                          <div className="flex justify-end mt-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className={`h-6 w-6 rounded-full ${
                                      message.role === 'user' 
                                        ? 'text-white/70 hover:text-white' 
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                    onClick={() => copyToClipboard(message.content, index)}
                                  >
                                    {copiedIndex === index ? (
                                      <Check className="h-3 w-3" />
                                    ) : (
                                      <Copy className="h-3 w-3" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{copiedIndex === index ? 'Copied!' : 'Copy message'}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </motion.div>
                        <span className="text-[10px] sm:text-xs text-gray-500 px-2">
                          {message.timestamp}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="flex justify-start"
                  >
                    <div className="bg-white/50 backdrop-blur-[10px] border border-white/20 px-4 py-3.5 rounded-2xl">
                      <div className="flex space-x-2">
                        <motion.div
                          className="w-2 h-2 bg-gray-400 rounded-full"
                          animate={{ y: [0, -6, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity }}
                        />
                        <motion.div
                          className="w-2 h-2 bg-gray-400 rounded-full"
                          animate={{ y: [0, -6, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                        />
                        <motion.div
                          className="w-2 h-2 bg-gray-400 rounded-full"
                          animate={{ y: [0, -6, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} className="scroll-mt-[100px]" />
            </div>
          </div>

          <div className="border-t border-white/20 bg-transparent backdrop-blur-[10px] 
            p-2 sm:p-4 relative z-10 flex-shrink-0"
          >
            <form onSubmit={handleSubmit} className="flex items-end space-x-2 sm:space-x-3 max-w-3xl mx-auto relative">
              <div className="flex-1 relative group">
                <div className="absolute -inset-3 bg-white/40 rounded-[24px] sm:rounded-[28px] blur-lg 
                  opacity-50 group-hover:opacity-70 transition-all duration-500"></div>
                
                <div className="absolute -inset-[1px] bg-gradient-to-r from-blue-500/40 via-purple-500/40 to-pink-500/40 
                  rounded-[22px] sm:rounded-[26px] opacity-0 group-hover:opacity-100 transition-all duration-500 blur-sm">
                </div>

                <Textarea
                  ref={inputRef}
                  value={prompt}
                  onChange={(e) => {
                    setPrompt(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  className="flex-1 resize-none rounded-[20px] sm:rounded-[24px] border-white/40 
                    bg-white/80 backdrop-blur-[10px] 
                    focus:border-blue-400/50 transition-all duration-300
                    min-h-[50px] sm:min-h-[60px] 
                    px-4 sm:px-6 py-3 sm:py-4 
                    text-sm sm:text-base
                    shadow-[0_4px_20px_rgba(0,0,0,0.04)] 
                    focus:shadow-[0_8px_25px_rgba(0,0,0,0.08)]
                    hover:shadow-[0_6px_22px_rgba(0,0,0,0.06)] 
                    focus:bg-white/95
                    overflow-y-auto
                    relative z-10
                    !important"
                  style={{
                    maxHeight: '200px',
                    overflowY: 'auto',
                    lineHeight: '1.5',
                    transition: 'all 0.3s ease'
                  }}
                />

                <Button
                  type="submit"
                  disabled={!prompt.trim() || isLoading}
                  className="absolute right-2 sm:right-3 bottom-[8px] sm:bottom-[10px] 
                    rounded-[16px] sm:rounded-[20px]
                    bg-gradient-to-r from-blue-600 to-blue-500 
                    hover:from-blue-500 hover:to-purple-500 
                    text-white 
                    w-9 h-9 sm:w-12 sm:h-12 p-0 
                    shadow-lg shadow-blue-500/20 hover:shadow-purple-500/30
                    transition-all duration-300 hover:scale-105 
                    disabled:opacity-50 disabled:hover:scale-100
                    disabled:shadow-none disabled:bg-gray-400 
                    group z-20"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <Send className="w-4 h-4 sm:w-5 sm:h-5 transition-all duration-300 
                        group-hover:translate-x-0.5 
                        group-hover:translate-y-[-1px] 
                        group-hover:scale-105" 
                      />
                      <div className="absolute inset-0 rounded-[16px] sm:rounded-[20px] bg-white 
                        opacity-0 group-hover:opacity-20 transition-opacity duration-300">
                      </div>
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
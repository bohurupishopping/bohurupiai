'use client'

import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  MessageSquare, 
  LayoutDashboard,
  Code, 
  FileText, 
  Home, 
  LogOut, 
  UserRound, 
  ChevronLeft, 
  ChevronRight, 
  Settings, 
  PlusCircle,
  Pencil,
  Share2,
  ImageIcon,
  MoreHorizontal,
  Trash2,
  Eye
} from 'lucide-react'
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/components/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { motion, AnimatePresence } from 'framer-motion'
import { ConversationService, ChatSession } from '@/services/conversationService';
import { formatDistanceToNow } from 'date-fns';

const Sidebar = () => {
  const [isMobile, setIsMobile] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [conversationService] = useState(() => new ConversationService());
  const [userProfile, setUserProfile] = useState<{ display_name: string | null }>({ display_name: null })

  useEffect(() => {
    const getUserEmail = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUserEmail(session?.user?.email || null)
    }
    getUserEmail()
  }, [])

  useEffect(() => {
    const getProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('display_name')
            .eq('user_id', session.user.id)
            .maybeSingle()
          
          if (profile) {
            setUserProfile(profile)
          } else {
            // If profile doesn't exist, create it
            const { data: newProfile, error } = await supabase
              .from('user_profiles')
              .insert({
                user_id: session.user.id,
                display_name: session.user.email?.split('@')[0] || '', // Use email username as initial display name
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .select('display_name')
              .single()
            
            if (!error && newProfile) {
              setUserProfile(newProfile)
            }
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error)
        setUserProfile({ display_name: null })
      }
    }

    getProfile()

    // Listen for profile updates
    const handleProfileUpdate = () => {
      getProfile()
    }
    window.addEventListener('profile-updated', handleProfileUpdate)
    
    return () => {
      window.removeEventListener('profile-updated', handleProfileUpdate)
    }
  }, [])

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768)
      setIsCollapsed(window.innerWidth < 768)
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  useEffect(() => {
    loadChatSessions();
    window.addEventListener('chat-updated', loadChatSessions);
    return () => window.removeEventListener('chat-updated', loadChatSessions);
  }, []);

  const loadChatSessions = async () => {
    try {
      const sessions = await conversationService.getChatSessions(7);
      setChatSessions(sessions);
    } catch (error) {
      console.error('Error loading chat sessions:', error);
      toast({
        title: "Error",
        description: "Failed to load chat history",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      // Delete the session
      await conversationService.deleteChatSession(sessionId);
      
      // Remove the session from local state
      setChatSessions(prev => prev.filter(session => session.session_id !== sessionId));
      
      // If we're currently viewing this session, redirect to new chat
      const currentSessionId = new URLSearchParams(window.location.search).get('session');
      if (currentSessionId === sessionId) {
        navigate('/ai-chat');
      }

      // Show success message
      toast({
        title: "Chat Deleted",
        description: "Chat history has been permanently deleted",
      });

      // Trigger a refresh of the chat sessions
      await loadChatSessions();
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        title: "Error",
        description: "Failed to delete chat history",
        variant: "destructive",
      });
    }
  };

  const handleViewSession = async (sessionId: string) => {
    try {
      // Use state parameter in URL
      navigate(`/ai-chat?session=${sessionId}`);
      
      // Dispatch custom event to notify chat was updated
      window.dispatchEvent(new CustomEvent('chat-updated'));
      
      toast({
        title: "Chat Loaded",
        description: "Previous conversation loaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load chat history",
        variant: "destructive",
      });
    }
  };

  const menuItems = [
    { 
      icon: MessageSquare, 
      label: 'AI Chat', 
      href: '/ai-chat', 
      color: 'text-blue-400',
      description: 'Smart AI Chat Assistant'
    },
    { 
      icon: ImageIcon, 
      label: 'Imagine', 
      href: '/imagine', 
      color: 'text-indigo-400',
      description: 'AI Image Generation'
    },
  ]

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    toast({
      title: "Signed out",
      description: "Successfully signed out of your account",
    })
    navigate("/login")
  }

  const renderChatHistory = () => (
    <div className="px-2 py-4 border-t border-gray-200/30">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-500">Recent Chats</span>
      </div>
      <AnimatePresence>
        {chatSessions.map((session) => (
          <motion.div
            key={session.session_id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="mb-2"
          >
            <div className={`group relative p-2 rounded-xl hover:bg-gray-100/40 
              transition-all duration-200 cursor-pointer ${
              !isCollapsed ? 'space-y-1' : ''
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4 text-gray-400" />
                  {!isCollapsed && (
                    <span className="text-xs font-medium text-gray-600 truncate max-w-[120px]">
                      {session.last_message}
                    </span>
                  )}
                </div>
                {!isCollapsed && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={() => handleViewSession(session.session_id)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Chat
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteSession(session.session_id)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              {!isCollapsed && (
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{session.message_count} messages</span>
                  <span>{formatDistanceToNow(new Date(session.timestamp))} ago</span>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );

  return (
    <motion.div 
      className={`fixed md:relative z-50 h-screen bg-gradient-to-b from-white/80 via-white/70 to-white/60 
        backdrop-blur-xl border-r border-gray-200/30 transition-all duration-300 
        flex flex-col ${
        isCollapsed ? 'w-16' : 'w-[220px]'
      } shadow-[0_8px_40px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_50px_rgba(0,0,0,0.16)]
      md:rounded-[32px] md:m-4 md:h-[calc(100vh-32px)]`}
      initial={false}
      animate={{ 
        width: isCollapsed ? 64 : 220,
        x: isMobile && isCollapsed ? -64 : 0 
      }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="flex items-center p-3 border-b border-gray-200/30">
        <div className="flex items-center gap-2">
          <img 
            src="/public/assets/ai-icon.png" 
            alt="AI Icon" 
            className="w-8 h-8 rounded-xl shadow-sm"
          />
          <AnimatePresence>
            {!isCollapsed && (
              <motion.h1 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"
              >
                Bohurupi AI
              </motion.h1>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="p-2">
        <Button
          variant="outline"
          className={`w-full justify-center gap-2 bg-gradient-to-r from-blue-400/80 to-purple-400/80 
            hover:from-blue-500/80 hover:to-purple-500/80 text-white border-0 
            shadow-md hover:shadow-lg transition-all duration-200 backdrop-blur-sm rounded-xl ${
            isCollapsed ? 'p-2' : 'px-3 py-2'
          }`}
          onClick={() => navigate('/ai-chat')}
        >
          <PlusCircle className="h-5 w-5" />
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="text-sm font-medium"
              >
                New Chat
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </div>

      <nav className="flex-1 p-2 space-y-2 overflow-y-auto">
        {menuItems.map((item) => (
          <Button
            key={item.label}
            variant="ghost"
            className={`w-full flex items-center ${
              isCollapsed ? 'justify-center' : 'justify-start'
            } gap-3 px-3 py-2 rounded-xl transition-all duration-200 ${
              location.pathname === item.href
                ? 'bg-gray-100/60 text-gray-900 shadow-sm'
                : 'hover:bg-gray-100/40'
            }`}
            onClick={() => navigate(item.href)}
          >
            <item.icon className={`h-5 w-5 ${item.color}`} />
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="text-base font-medium whitespace-nowrap"
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        ))}
        {renderChatHistory()}
      </nav>

      <div className="p-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full hover:bg-gray-100/40 rounded-xl transition-colors duration-200 flex items-center justify-center"
        >
          <motion.div
            initial={false}
            animate={{ rotate: isCollapsed ? 180 : 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            <ChevronLeft className="h-4 w-4" />
          </motion.div>
        </Button>
      </div>

      {isMobile && (
        <motion.button
          className="absolute -right-8 top-1/2 transform -translate-y-1/2 bg-white/80 
            backdrop-blur-sm rounded-r-xl p-2 shadow-md border border-l-0 border-gray-200/30"
          onClick={() => setIsCollapsed(!isCollapsed)}
          initial={false}
          animate={{ rotate: isCollapsed ? 0 : 180 }}
        >
          <ChevronRight className="h-4 w-4 text-gray-600" />
        </motion.button>
      )}
    </motion.div>
  )
}

export default Sidebar
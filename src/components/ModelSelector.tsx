import React, { useState, useEffect } from 'react';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { mistral } from '@ai-sdk/mistral';
import { groq } from '@ai-sdk/groq';
import { openrouter } from "@openrouter/ai-sdk-provider";
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Bot, Cpu, Brain, Zap, Star } from 'lucide-react';
import { google } from '@ai-sdk/google';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserRound, Settings, LogOut } from 'lucide-react'
import { supabase } from "@/integrations/supabase/client"
import { useNavigate } from 'react-router-dom'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define model types
interface ModelOption {
  value: string;
  label: string;
  provider: string;
  color: string;
  icon?: React.ElementType;
}

// Provider icons mapping
const providerIcons = {
  'OpenAI': Sparkles,
  'Anthropic': Brain,
  'Mistral': Cpu,
  'X.AI': Bot,
  'Groq': Zap,
  'OpenRouter': Star,
  'Google': Bot,
};

const MODELS: ModelOption[] = [
  // OpenAI Models
  { 
    provider: 'OpenAI', 
    value: 'gpt35', 
    label: 'GPT-3.5', 
    color: 'text-purple-500 bg-purple-50',
  },
  { 
    provider: 'OpenAI', 
    value: 'gpt4o-mini', 
    label: 'GPT-4o Mini', 
    color: 'text-purple-600 bg-purple-50',
  },
  
  // Google Models
  { 
    provider: 'Google', 
    value: 'gemini-1.5-flash', 
    label: 'Gemini 1.5 Flash', 
    color: 'text-blue-400 bg-blue-50',
  },
  { 
    provider: 'Google', 
    value: 'gemini-1.5-pro', 
    label: 'Gemini 1.5 Pro', 
    color: 'text-blue-500 bg-blue-50',
  },
  
  // Anthropic Models via OpenRouter
  { 
    provider: 'Anthropic', 
    value: 'anthropic/claude-3-sonnet', 
    label: 'Claude 3.5 Sonnet', 
    color: 'text-blue-500 bg-blue-50',
  },
  { 
    provider: 'Anthropic', 
    value: 'anthropic/claude-3-haiku', 
    label: 'Claude 3.5 Haiku', 
    color: 'text-blue-600 bg-blue-50',
  },
  
  // Mistral Models
  { 
    provider: 'Mistral', 
    value: 'open-mistral-nemo', 
    label: 'Open Mistral Nemo', 
    color: 'text-green-500 bg-green-50',
  },
  { 
    provider: 'Mistral', 
    value: 'mistral-large', 
    label: 'Mistral Large 2407', 
    color: 'text-green-600 bg-green-50',
  },
  
  // X.AI Models
  { 
    provider: 'X.AI', 
    value: 'xai', 
    label: 'Grok', 
    color: 'text-yellow-500 bg-yellow-50',
  },
  
  // Groq Models
  { 
    provider: 'Groq', 
    value: 'groq', 
    label: 'Llama 3.2 90B Vision', 
    color: 'text-red-500 bg-red-50',
  },

  // OpenRouter Models
  { 
    provider: 'OpenRouter', 
    value: 'openai/gpt-4o-mini', 
    label: 'GPT-4o Mini', 
    color: 'text-indigo-500 bg-indigo-50',
  },
  { 
    provider: 'OpenRouter', 
    value: 'google/gemma-2-9b-it:free', 
    label: 'Gemma 2 9B IT (Free)', 
    color: 'text-indigo-600 bg-indigo-50',
  },
  { 
    provider: 'OpenRouter', 
    value: 'anthropic/claude-3.5-sonnet:beta', 
    label: 'Claude 3.5 Sonnet (Beta)', 
    color: 'text-indigo-700 bg-indigo-50',
  },
  { 
    provider: 'OpenRouter', 
    value: 'anthropic/claude-3-5-haiku-20241022', 
    label: 'Claude 3.5 Haiku', 
    color: 'text-indigo-800 bg-indigo-50',
  },
  { 
    provider: 'OpenRouter', 
    value: 'nvidia/llama-3.1-nemotron-70b-instruct', 
    label: 'Nvidia Llama 3.1 Nemotron 70B', 
    color: 'text-indigo-900 bg-indigo-50',
  },
  { 
    provider: 'OpenRouter', 
    value: 'qwen/qwen-2.5-7b-instruct', 
    label: 'Qwen 2.5 7B Instruct', 
    color: 'text-indigo-400 bg-indigo-50',
  },
  { 
    provider: 'OpenRouter', 
    value: 'meta-llama/llama-3.2-11b-vision-instruct:free', 
    label: 'Llama 3.2 11B Vision (Free)', 
    color: 'text-indigo-300 bg-indigo-50',
  },
  { 
    provider: 'OpenRouter', 
    value: 'google/gemini-pro-1.5-exp', 
    label: 'Gemini Pro 1.5 (Experimental)', 
    color: 'text-indigo-200 bg-indigo-50',
  },
  { 
    provider: 'OpenRouter', 
    value: 'google/gemini-1.5-flash-001', 
    label: 'Gemini 1.5 Flash', 
    color: 'text-indigo-500 bg-indigo-50',
  },
  { 
    provider: 'OpenRouter', 
    value: 'google/gemini-1.5-pro-001', 
    label: 'Gemini 1.5 Pro', 
    color: 'text-indigo-600 bg-indigo-50',
  }
];

// Define props interface
interface ModelSelectorProps {
  onModelChange?: (model: string) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ onModelChange }) => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [selectedProvider, setSelectedProvider] = useState('OpenAI');
  const [selectedModel, setSelectedModel] = useState('gpt35');
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<{ display_name: string | null }>({ display_name: null })

  const handleProviderChange = (provider: string) => {
    setSelectedProvider(provider);
    // Reset model to first model of the selected provider
    const firstModelOfProvider = MODELS.find(m => m.provider === provider);
    if (firstModelOfProvider) {
      setSelectedModel(firstModelOfProvider.value);
      onModelChange?.(firstModelOfProvider.value);
    }
  };

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    onModelChange?.(model);
  };

  // Get models for the selected provider
  const providerModels = MODELS.filter(m => m.provider === selectedProvider);
  const ProviderIcon = providerIcons[selectedProvider as keyof typeof providerIcons];

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
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error)
        setUserProfile({ display_name: null })
      }
    }

    getProfile()
    window.addEventListener('profile-updated', getProfile)
    return () => window.removeEventListener('profile-updated', getProfile)
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    toast({
      title: "Signed out",
      description: "Successfully signed out of your account",
    })
    navigate("/login")
  }

  return (
    <div className="flex flex-row gap-1.5 sm:gap-3 w-full items-center">
      {/* Provider and Model Selectors */}
      <div className="flex-1 flex items-center gap-1.5 sm:gap-3">
        {/* Provider Selector */}
        <Select value={selectedProvider} onValueChange={handleProviderChange}>
          <SelectTrigger 
            className="w-[140px] sm:w-[180px] bg-white/80 backdrop-blur-xl border-gray-200/50 
              transition-all duration-300 hover:border-blue-300 rounded-xl sm:rounded-2xl
              shadow-[0_2px_10px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.1)]
              px-2.5 sm:px-4 h-9 sm:h-11 text-xs sm:text-sm"
          >
            <SelectValue placeholder="Provider" />
          </SelectTrigger>
          <SelectContent 
            className="bg-white/90 backdrop-blur-xl border-gray-200/50 rounded-xl
              shadow-lg animate-in fade-in-80 slide-in-from-top-1 p-1.5 sm:p-2 
              min-w-[140px] sm:min-w-[200px]"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="space-y-0.5 sm:space-y-1"
            >
              {Array.from(new Set(MODELS.map(m => m.provider))).map(provider => {
                const Icon = providerIcons[provider as keyof typeof providerIcons];
                return (
                  <SelectItem 
                    key={provider} 
                    value={provider} 
                    className="hover:bg-blue-50/80 transition-all duration-200 rounded-lg
                      flex items-center cursor-pointer px-2 py-1.5 sm:py-2.5 group"
                  >
                    <div className="flex items-center gap-2 sm:gap-2.5 text-xs sm:text-sm font-medium">
                      <div className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-lg 
                        bg-gradient-to-br from-blue-50 to-blue-100/50 p-1 sm:p-1.5
                        group-hover:scale-110 transition-transform duration-300">
                        {Icon && <Icon className="w-full h-full text-blue-500" />}
                      </div>
                      <span className="text-gray-700">{provider}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </motion.div>
          </SelectContent>
        </Select>

        {/* Model Selector */}
        <Select value={selectedModel} onValueChange={handleModelChange}>
          <SelectTrigger 
            className="w-[180px] sm:w-[280px] bg-white/80 backdrop-blur-xl border-gray-200/50 
              transition-all duration-300 hover:border-purple-300 rounded-xl sm:rounded-2xl
              shadow-[0_2px_10px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.1)]
              px-2.5 sm:px-4 h-9 sm:h-11 text-xs sm:text-sm"
          >
            <SelectValue placeholder="Select Model" />
          </SelectTrigger>
          <SelectContent 
            className="bg-white/90 backdrop-blur-xl border-gray-200/50 rounded-xl
              shadow-lg animate-in fade-in-80 slide-in-from-top-1 p-1.5 sm:p-2 
              max-h-[250px] sm:max-h-[300px] min-w-[180px] sm:min-w-[280px]"
          >
            <SelectGroup>
              <SelectLabel className="text-xs sm:text-sm font-medium text-gray-500 px-2 py-1.5 sm:py-2 mb-1">
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <div className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-lg 
                    bg-gradient-to-br from-blue-50 to-blue-100/50 p-1 sm:p-1.5">
                    {ProviderIcon && <ProviderIcon className="w-full h-full text-blue-500" />}
                  </div>
                  <span>{selectedProvider} Models</span>
                </div>
              </SelectLabel>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="space-y-0.5 sm:space-y-1"
              >
                {providerModels.map(model => (
                  <SelectItem 
                    key={model.value} 
                    value={model.value} 
                    className={`flex items-center gap-2.5 px-2 py-1.5 sm:py-2.5 rounded-lg
                      cursor-pointer transition-all duration-200
                      hover:bg-purple-50/80 group`}
                  >
                    <div className="flex items-center gap-2 sm:gap-2.5 text-xs sm:text-sm font-medium">
                      <div className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-lg 
                        bg-gradient-to-br from-purple-50 to-purple-100/50 p-1 sm:p-1.5
                        group-hover:scale-110 transition-transform duration-300">
                        <Bot className={`w-full h-full ${model.color}`} />
                      </div>
                      <span className={`${model.color} transition-colors duration-200`}>
                        {model.label}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </motion.div>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {/* Profile Dropdown - Now positioned at far right */}
      <div className="ml-auto pl-2 sm:pl-5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="h-9 sm:h-11 px-2 hover:bg-gray-100/40 rounded-xl transition-all duration-200"
            >
              <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                <AvatarImage src="/assets/pritam-img.png" />
                <AvatarFallback>
                  <UserRound className="h-4 w-4 text-gray-400" />
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl bg-white/80 backdrop-blur-xl">
            <DropdownMenuLabel>
              <span className="block text-sm font-medium">
                {userProfile.display_name || 'Set display name'}
              </span>
              <span className="block text-xs text-gray-500">{userEmail}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/profile')} className="text-sm rounded-lg">
              <UserRound className="mr-2 h-4 w-4" />
              <span>Edit Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/settings')} className="text-sm rounded-lg">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut} className="text-sm rounded-lg">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default ModelSelector;

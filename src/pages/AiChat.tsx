import React from "react";
import { useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ChatInterface from '../components/ChatInterface';
import ModelSelector from '../components/ModelSelector';
import { useAIGeneration } from '../components/logic-ai-generation';

const AiChat: React.FC = () => {
  const { selectedModel, setSelectedModel, generateContent } = useAIGeneration();
  const location = useLocation();
  const sessionId = new URLSearchParams(location.search).get('session');

  return (
    <div className="flex h-screen bg-[#FAFAFA]">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-blue-600">Chat</h1>
            <ModelSelector 
              onModelChange={(model: string) => setSelectedModel(model)}
            />
          </div>
        </header>

        <div className="flex-1">
          <ChatInterface 
            generateContent={generateContent}
            defaultMessage="Welcome to AI Chat! I'm here to help answer your questions and assist with any tasks. What would you like to discuss?"
            sessionId={sessionId}
          />
        </div>
      </div>
    </div>
  );
};

export default AiChat; 
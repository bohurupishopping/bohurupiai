import React from "react";
import { useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import ChatInterface from '../components/ChatInterface';
import { useAIGeneration } from '../components/logic-ai-generation';

const AiChat: React.FC = () => {
  const { selectedModel, setSelectedModel, generateContent } = useAIGeneration();
  const location = useLocation();
  const sessionId = new URLSearchParams(location.search).get('session');

  return (
    <div className="flex h-screen bg-[#FAFAFA]">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header
          title="Chat"
          onModelChange={(model: string) => setSelectedModel(model)}
        />

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
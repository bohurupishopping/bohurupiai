import React from "react";
import Sidebar from '../components/Sidebar';
import ChatInterface from '../components/ChatInterface';
import ModelSelector from '../components/ModelSelector';
import { useAIGeneration } from '../components/logic-ai-generation';

const Imagine: React.FC = () => {
  const { selectedModel, setSelectedModel, generateContent } = useAIGeneration();

  return (
    <div className="flex h-screen bg-[#FAFAFA]">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-indigo-600">Imagine AI</h1>
            <ModelSelector 
              onModelChange={(model: string) => setSelectedModel(model)}
            />
          </div>
        </header>

        <div className="flex-1">
          <ChatInterface 
            generateContent={generateContent}
            defaultMessage="Welcome to Imagine AI! I can help you generate and edit images using AI. What would you like to create today?"
          />
        </div>
      </div>
    </div>
  );
};

export default Imagine; 
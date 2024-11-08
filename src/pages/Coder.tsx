import React from "react";
import Sidebar from '../components/Sidebar';
import ChatInterface from '../components/ChatInterface';
import ModelSelector from '../components/ModelSelector';
import { useAIGeneration } from '../components/logic-ai-generation';

const Coder: React.FC = () => {
  const { selectedModel, setSelectedModel, generateContent } = useAIGeneration();

  return (
    <div className="flex h-screen bg-[#FAFAFA]">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-green-600">Coder AI</h1>
            <ModelSelector 
              onModelChange={(model: string) => setSelectedModel(model)}
            />
          </div>
        </header>

        <div className="flex-1">
          <ChatInterface 
            generateContent={generateContent}
            defaultMessage="Welcome to Coder AI! I can help you with programming, debugging, and software development. What would you like to code today?"
          />
        </div>
      </div>
    </div>
  );
};

export default Coder; 
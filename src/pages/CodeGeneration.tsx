import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import ModelSelector from "@/components/ModelSelector";
import { Code, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CodeGeneration = () => {
  const [prompt, setPrompt] = useState("");
  const { toast } = useToast();

  const handleGenerate = async () => {
    // Placeholder for now - will be implemented in next step
    toast({
      title: "Coming soon!",
      description: "Code generation will be implemented in the next step.",
    });
  };

  return (
    <div className="flex-1 overflow-hidden p-6 animate-fade-in">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Code className="h-6 w-6 text-purple-500" />
            <h1 className="text-2xl font-semibold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
              Code Generation
            </h1>
          </div>
          <ModelSelector />
        </div>

        <div className="bg-white/80 backdrop-blur-lg rounded-lg shadow-lg border border-gray-200/50 p-6 space-y-4">
          <div className="space-y-2">
            <label htmlFor="prompt" className="text-sm font-medium text-gray-700">
              Describe the code you want to generate
            </label>
            <Textarea
              id="prompt"
              placeholder="E.g., Create a React component that displays a responsive image gallery with lazy loading..."
              className="min-h-[200px] bg-white/90 border-gray-200/80 focus:border-purple-300 focus:ring-purple-300 transition-all duration-200"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          <Button
            onClick={handleGenerate}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white transition-all duration-300 hover:scale-[1.02] shadow-md"
          >
            <Play className="mr-2 h-4 w-4" />
            Generate Code
          </Button>
        </div>

        <div className="bg-white/80 backdrop-blur-lg rounded-lg shadow-lg border border-gray-200/50 p-6">
          <div className="text-center text-gray-500">
            Generated code will appear here...
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeGeneration;
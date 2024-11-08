import { useState, useCallback } from 'react';
import OpenAI from 'openai';
import { generateText } from 'ai';

// Import AI SDK providers
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createMistral } from '@ai-sdk/mistral';
import { createGroq } from '@ai-sdk/groq';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useToast } from "./use-toast";

// X.AI Provider Configuration
const xai = createOpenAI({
  name: 'xai',
  baseURL: 'https://api.x.ai/v1',
  apiKey: import.meta.env.VITE_XAI_API_KEY ?? '',
});

// OpenRouter OpenAI Client
const openRouterClient = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: import.meta.env.VITE_OPEN_ROUTER_API_KEY || 'dummy-key',
  dangerouslyAllowBrowser: true,
  defaultHeaders: {
    "HTTP-Referer": window.location.origin,
    "X-Title": "Creative Scribe",
  }
});

// Initialize Google AI
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_API_KEY || '');

// Add this new text processing function
const formatAIResponse = (text: string): string => {
  try {
    let content = text;
    try {
      const jsonContent = JSON.parse(text);
      content = jsonContent.content || jsonContent.text || jsonContent.response || text;
    } catch {
      content = text;
    }

    // Process headings with adjusted spacing
    content = content
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-4 mb-2 text-gray-800">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mt-3 mb-2 text-gray-700">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-medium mt-2 mb-1 text-gray-600">$1</h3>');

    // Process text styling
    content = content
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-gray-800">$1</em>')
      .replace(/__(.*?)__/g, '<u class="underline decoration-blue-500/30">$1</u>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1.5 py-0.5 rounded text-sm text-blue-600">$1</code>');

    // Process lists with reduced spacing
    content = content
      .replace(/^\- (.*$)/gm, '<li class="ml-4 my-0.5 flex items-center before:content-["•"] before:mr-2 before:text-blue-500">$1</li>')
      .replace(/^\d\. (.*$)/gm, '<li class="ml-4 my-0.5 list-decimal">$1</li>');

    // Process code blocks with adjusted margins
    content = content.replace(/```(.*?)```/gs, (match, code) => {
      return `<pre class="bg-gray-100 p-3 rounded-lg my-2 overflow-x-auto"><code class="text-sm text-gray-800">${code.trim()}</code></pre>`;
    });

    // Process quotes with reduced margins
    content = content.replace(/^> (.*$)/gm, 
      '<blockquote class="border-l-4 border-blue-500/30 pl-4 my-2 italic text-gray-600">$1</blockquote>'
    );

    // Process paragraphs with minimal spacing
    const paragraphs = content
      .split(/\n\n+/)
      .filter(para => para.trim() !== '');

    content = paragraphs
      .map(para => {
        if (para.trim().startsWith('<')) return para;
        return `<p class="mb-2 leading-relaxed text-gray-700">${para.trim()}</p>`;
      })
      .join('\n');

    // Clean up any excessive newlines
    content = content
      .replace(/\n{3,}/g, '\n\n')
      .replace(/(<\/p>)\s*(<p)/g, '$1$2');

    return content;

  } catch (error) {
    console.error('Error formatting AI response:', error);
    return text;
  }
};

export const useAIGeneration = () => {
  const { toast } = useToast();
  const [selectedModel, setSelectedModel] = useState('gpt35');
  const [generatedContent, setGeneratedContent] = useState('');

  // Update the generateContent function to use the new formatter
  const generateContent = useCallback(async (prompt: string) => {
    try {
      let result;
      
      // Check if it's an OpenRouter model
      if (selectedModel.includes('/')) {
        const response = await openRouterClient.chat.completions.create({
          model: selectedModel,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 4096,
          temperature: 0.7,
          top_p: 0.4
        });

        const generatedText = response.choices[0]?.message?.content;

        if (!generatedText) {
          throw new Error('No content generated from OpenRouter');
        }

        // Process the response before returning
        if (generatedText) {
          const formattedText = formatAIResponse(generatedText);
          setGeneratedContent(formattedText);
          return formattedText;
        }

        throw new Error('No content generated');
      }

      // Handle Google models separately
      if (selectedModel.startsWith('gemini')) {
        let modelName;
        switch (selectedModel) {
          case 'gemini-1.5-flash':
            modelName = 'gemini-1.5-flash-001';
            break;
          case 'gemini-1.5-pro':
            modelName = 'gemini-1.5-pro-001';
            break;
          default:
            modelName = 'gemini-1.5-pro-001';
        }

        const model = genAI.getGenerativeModel({ model: modelName });
        
        // Generate content using the correct method
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const generatedText = response.text();
        
        // Process the response before returning
        if (generatedText) {
          const formattedText = formatAIResponse(generatedText);
          setGeneratedContent(formattedText);
          return formattedText;
        }

        throw new Error('No content generated');
      }

      // Handle other models
      let selectedModelInstance;
      switch (selectedModel) {
        case 'gpt35':
          selectedModelInstance = createOpenAI({
            apiKey: import.meta.env.VITE_OPENAI_API_KEY || ''
          })('gpt-3.5-turbo');
          break;
        case 'gpt4o-mini':
          selectedModelInstance = createOpenAI({
            apiKey: import.meta.env.VITE_OPENAI_API_KEY || ''
          })('gpt-4o-mini');
          break;
        case 'claude-sonnet':
          selectedModelInstance = createAnthropic({
            apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY || ''
          })('claude-3-5-sonnet-20240620');
          break;
        case 'claude-haiku':
          selectedModelInstance = createAnthropic({
            apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY || ''
          })('claude-3-5-haiku-20240620');
          break;
        case 'open-mistral-nemo':
          selectedModelInstance = createMistral({
            apiKey: import.meta.env.VITE_MISTRAL_API_KEY || ''
          })('open-mistral-nemo');
          break;
        case 'mistral-large':
          selectedModelInstance = createMistral({
            apiKey: import.meta.env.VITE_MISTRAL_API_KEY || ''
          })('mistral-large-2407');
          break;
        case 'xai':
          selectedModelInstance = xai('grok-beta');
          break;
        case 'groq':
          selectedModelInstance = createGroq({
            apiKey: import.meta.env.VITE_GROQ_API_KEY || ''
          })('llama-3.2-90b-vision-preview');
          break;
        default:
          selectedModelInstance = createOpenAI({
            apiKey: import.meta.env.VITE_OPENAI_API_KEY || ''
          })('gpt-3.5-turbo');
      }

      result = await generateText({
        model: selectedModelInstance,
        messages: [{ role: 'user', content: prompt }],
        maxTokens: 4096,
        temperature: 0.7,
        topP: 0.4,
      });

      if (!result.text) {
        throw new Error('No content generated');
      }

      // Process the response before returning
      if (result.text) {
        const formattedText = formatAIResponse(result.text);
        setGeneratedContent(formattedText);
        return formattedText;
      }

      throw new Error('No content generated');
    } catch (error) {
      console.error('Content generation error:', error);
      toast({
        title: 'Generation Error',
        description: `Failed to generate content: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive'
      });
      return null;
    }
  }, [selectedModel, toast]);

  return {
    selectedModel,
    setSelectedModel,
    generatedContent,
    generateContent
  };
}; 
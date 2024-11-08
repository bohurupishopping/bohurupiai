'use client'

import React, { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../integrations/supabase/client"
import Sidebar from '../components/Sidebar'
import { Button } from "@/components/ui/button"
import { 
  MessageSquare, 
  Code, 
  FileText, 
  Image as ImageIcon,
  ArrowRight
} from 'lucide-react'

export default function Dashboard() {
  const navigate = useNavigate()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        navigate("/login")
      }
    }
    checkUser()
  }, [navigate])

  const features = [
    {
      icon: MessageSquare,
      title: "AI Chat",
      description: "Start a conversation with our advanced AI models",
      color: "text-blue-500",
      href: "/ai-chat"
    },
    {
      icon: Code,
      title: "Code Generation",
      description: "Generate code snippets and get programming help",
      color: "text-green-500",
      href: "/code"
    },
    {
      icon: FileText,
      title: "Content Writing",
      description: "Create high-quality content for various purposes",
      color: "text-purple-500",
      href: "/write"
    },
    {
      icon: ImageIcon,
      title: "Image Generation",
      description: "Generate and edit images using AI",
      color: "text-orange-500",
      href: "/image"
    }
  ]

  return (
    <div className="flex h-screen bg-gradient-to-br from-white to-gray-100">
      <Sidebar />
      
      <div className="flex-1 overflow-auto md:ml-0">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-gray-900 mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
              Welcome to Bohurupi AI
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Your all-in-one AI platform for chat, code, content, and creativity
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {features.map((feature) => (
              <Button
                key={feature.title}
                variant="outline"
                className="h-auto p-8 flex flex-col items-center text-center hover:scale-105 transition-all duration-200 bg-white bg-opacity-50 backdrop-filter backdrop-blur-lg rounded-2xl border border-gray-200 shadow-xl"
                onClick={() => navigate(feature.href)}
              >
                <feature.icon className={`h-16 w-16 ${feature.color} mb-6`} />
                <h3 className="text-2xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-600 mb-6">{feature.description}</p>
                <ArrowRight className="h-6 w-6" />
              </Button>
            ))}
          </div>

          {/* Quick Start Section */}
          <div className="bg-white bg-opacity-50 backdrop-filter backdrop-blur-lg rounded-3xl p-10 shadow-2xl border border-gray-200">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
              Quick Start Guide
            </h2>
            <div className="space-y-6">
              {[
                { color: "blue", title: "Choose your AI model", description: "Select from our range of powerful AI models" },
                { color: "green", title: "Start a conversation", description: "Ask questions, generate content, or get creative" },
                { color: "purple", title: "Save and share", description: "Keep track of your conversations and share results" }
              ].map((step, index) => (
                <div key={index} className="flex items-start space-x-6">
                  <div className={`bg-${step.color}-100 rounded-full p-3 flex items-center justify-center w-12 h-12`}>
                    <span className={`text-${step.color}-600 font-bold text-xl`}>{index + 1}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-xl mb-2">{step.title}</h3>
                    <p className="text-gray-600">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
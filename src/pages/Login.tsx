import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/use-toast";
import { motion } from "framer-motion";
import { Sparkles } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") {
        toast({
          title: "Welcome to Bohurupi AI!",
          description: "Successfully signed in to your account",
        });
        navigate("/ai-chat");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-br from-blue-50 via-purple-50 to-white">
      {/* Header - Centered */}
      <header className="w-full py-4 px-4 sm:px-6 flex justify-center items-center border-b border-gray-200/30 backdrop-blur-sm bg-white/50">
        <div className="flex items-center gap-3">
          <img 
            src="/src/assets/ai-icon.png" 
            alt="Bohurupi AI" 
            className="w-10 h-10 rounded-xl shadow-sm"
          />
          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Bohurupi AI : Your Personalized AI Assistant
          </span>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-2 sm:p-8">
        <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left side - Hero content */}
          <div className="hidden lg:block space-y-6 pr-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl font-bold text-gray-900">
                Welcome to the Future of
                <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  AI Conversations
                </span>
              </h1>
              <p className="mt-4 text-lg text-gray-600">
                Experience seamless AI interactions with multiple models, smart conversations, and powerful features.
              </p>
              <div className="flex items-center gap-4 pt-6">
                <Sparkles className="h-5 w-5 text-blue-500" />
                <span className="text-sm text-gray-600">Powered by advanced AI models</span>
              </div>
            </motion.div>
          </div>

          {/* Right side - Login Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="w-full max-w-md mx-auto bg-white/80 backdrop-blur-xl shadow-xl border-gray-200/50 rounded-2xl">
              <CardHeader className="space-y-3 pb-6">
                <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Welcome Back
                </CardTitle>
                <p className="text-center text-gray-600 text-sm">
                  Sign in to your account to continue
                </p>
              </CardHeader>
              <CardContent>
                <Auth
                  supabaseClient={supabase}
                  appearance={{
                    theme: ThemeSupa,
                    variables: {
                      default: {
                        colors: {
                          brand: '#4F46E5',
                          brandAccent: '#4338CA',
                        },
                      },
                    },
                    className: {
                      container: 'w-full space-y-4',
                      button: `w-full px-4 py-3 rounded-xl font-medium transition-all duration-300
                        hover:opacity-90 flex items-center justify-center gap-2 bg-gradient-to-r 
                        from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700
                        transform hover:scale-[1.02] active:scale-[0.98]`,
                      label: 'text-sm font-medium text-gray-700 flex items-center gap-2',
                      input: `w-full px-4 py-3 rounded-xl border border-gray-200/50
                        focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all
                        bg-white/50 backdrop-blur-sm`,
                      loader: 'animate-spin',
                      anchor: 'text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200',
                      divider: 'bg-gray-200/50',
                      message: 'text-sm text-gray-600 rounded-lg bg-gray-50/80 p-3',
                    },
                  }}
                  providers={["google", "github"]}
                  redirectTo={`${window.location.origin}/ai-chat`}
                  magicLink={true}
                  localization={{
                    variables: {
                      sign_in: {
                        email_label: "Email Address",
                        password_label: "Password",
                        button_label: "Sign in",
                        loading_button_label: "Signing in ...",
                        social_provider_text: "Continue with {{provider}}",
                        link_text: "Don't have an account? Sign up",
                      },
                      sign_up: {
                        email_label: "Email Address",
                        password_label: "Create Password",
                        button_label: "Create Account",
                        loading_button_label: "Creating account ...",
                        social_provider_text: "Sign up with {{provider}}",
                        link_text: "Already have an account? Sign in",
                      },
                    },
                  }}
                />
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full p-6 text-center text-sm text-gray-600 border-t border-gray-200/50 bg-white/50 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <span>© 2024 Bohurupi AI. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-blue-600 transition-colors duration-200">Privacy Policy</a>
            <span className="hidden sm:inline">•</span>
            <a href="#" className="hover:text-blue-600 transition-colors duration-200">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Login;
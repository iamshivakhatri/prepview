"use client";

import { useState, useCallback, useEffect } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Menu, UserCircle, DownloadIcon, MinusSquare, PlusSquare, Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AudioControl } from "@/components";
import { ConversationStream, type Message } from "@/components/conversation-stream";
import { ContextPanel } from "@/components/context-panel";
import { ThemeToggle } from "@/components/theme-toggle";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { AIProvider, DEFAULT_PROVIDER, PROVIDER_SETTINGS } from "@/lib/ai-config";
import { getRandomUUID } from "@/lib/crypto-polyfill";

export function InterviewRoom() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [resume, setResume] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [progress, setProgress] = useState(0);
  const [autoMode, setAutoMode] = useState(true);
  const [contextPanelExpanded, setContextPanelExpanded] = useState(true);
  const [userName, setUserName] = useState("User");
  const [aiProvider, setAiProvider] = useState<AIProvider>(DEFAULT_PROVIDER);

  // Load data from local storage on component mount
  useEffect(() => {
    const storedResume = localStorage.getItem('resume');
    const storedJobDescription = localStorage.getItem('jobDescription');
    const storedAiProvider = localStorage.getItem('aiProvider') as AIProvider | null;
    
    if (storedResume) {
      setResume(storedResume);
      extractUserName(storedResume);
    }
    
    if (storedJobDescription) {
      setJobDescription(storedJobDescription);
    }
    
    if (storedAiProvider) {
      setAiProvider(storedAiProvider);
    }
  }, []);

  // Save AI provider preference to localStorage
  useEffect(() => {
    localStorage.setItem('aiProvider', aiProvider);
  }, [aiProvider]);

  // Handle AI provider change
  const handleAiProviderChange = (provider: AIProvider) => {
    setAiProvider(provider);
    toast.success(`Transcription provider changed to ${PROVIDER_SETTINGS[provider].name}`);
  };

  // Extract user name from resume
  const extractUserName = useCallback((text: string) => {
    // Simple extraction logic - look for common patterns in resumes
    const lines = text.split('\n');
    // Usually the name is at the top of the resume
    if (lines.length > 0) {
      const potentialName = lines[0].trim();
      // If first line is short (likely just a name) and doesn't contain typical headers
      if (potentialName.length > 0 && 
          potentialName.length < 40 && 
          !potentialName.toLowerCase().includes('resume') &&
          !potentialName.toLowerCase().includes('curriculum') &&
          !potentialName.match(/\b(email|phone|address|github|linkedin)\b/i)) {
        setUserName(potentialName);
        return;
      }
    }
    
    // Use regex to find name patterns (e.g., "Name: John Doe")
    const namePattern = /(?:name|full name|my name is)[:\s]+([A-Za-z\s\.]+)/i;
    const match = text.match(namePattern);
    if (match && match[1]) {
      setUserName(match[1].trim());
    }
  }, []);

  // Handle when transcription is complete
  const handleTranscriptionComplete = useCallback(async (text: string) => {
    // Add the interviewer's question to the conversation
    const newMessage: Message = {
      id: getRandomUUID(),
      role: "interviewer",
      content: text,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    // Now generate a response using the AI
    await generateAIResponse(text);
  }, []);

  // Generate AI response
  const generateAIResponse = useCallback(async (question: string) => {
    setIsProcessing(true);
    setIsTyping(true);
    setProgress(0);
    
    // Get resume and job description from local storage for most up-to-date data
    const resumeData = localStorage.getItem('resume') || resume;
    const jobDescriptionData = localStorage.getItem('jobDescription') || jobDescription;
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 500);
    
    try {
      // Only send the last 3 exchanges (max 6 messages) to keep context focused
      const recentMessages = messages.slice(-6);
      
      const response = await fetch("/api/generate-response", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
          resume: resumeData,
          jobDescription: jobDescriptionData,
          userName,
          history: recentMessages.map(msg => ({
            role: msg.role === "interviewer" ? "user" : msg.role,
            content: msg.content,
          })),
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate response");
      }
      
      const data = await response.json();
      
      // Complete the progress
      clearInterval(progressInterval);
      setProgress(100);
      
      // Add the AI response to the conversation after a small delay
      setTimeout(() => {
        const aiMessage: Message = {
          id: getRandomUUID(),
          role: "assistant",
          content: data.text,
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, aiMessage]);
        setIsTyping(false);
        setIsProcessing(false);
      }, 500);
      
    } catch (error) {
      console.error("Error generating response:", error);
      toast.error("Failed to generate a response. Please try again.");
      clearInterval(progressInterval);
      setIsTyping(false);
      setIsProcessing(false);
    }
  }, [messages, resume, jobDescription, userName]);

  // Export conversation
  const exportConversation = useCallback(() => {
    try {
      // Format the conversation
      const formattedConversation = messages.map(msg => {
        const time = new Date(msg.timestamp).toLocaleTimeString();
        const role = msg.role === "interviewer" ? "Interviewer" : 
                     msg.role === "assistant" ? "You (AI)" : "You";
        
        return `[${time}] ${role}: ${msg.content}`;
      }).join("\n\n");
      
      // Create a blob and download
      const blob = new Blob([formattedConversation], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `interview-${new Date().toISOString().split("T")[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("Interview transcript exported successfully");
    } catch (error) {
      console.error("Error exporting conversation:", error);
      toast.error("Failed to export the conversation");
    }
  }, [messages]);

  // Handle resume update from context panel
  const handleResumeUpdate = useCallback((text: string) => {
    setResume(text);
    localStorage.setItem('resume', text);
    extractUserName(text);
  }, [extractUserName]);

  // Handle job description update from context panel
  const handleJobDescriptionUpdate = useCallback((text: string) => {
    setJobDescription(text);
    localStorage.setItem('jobDescription', text);
  }, []);

  // Get user initials for avatar
  const getUserInitials = () => {
    if (userName === "User") return "U";
    
    const nameParts = userName.split(" ");
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();
    
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="border-b p-4 flex justify-between items-center bg-background">
        <div className="flex items-center">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="mr-2 lg:hidden">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
              <div className="h-full py-4">
                <ContextPanel 
                  onResumeUpdate={handleResumeUpdate}
                  onJobDescriptionUpdate={handleJobDescriptionUpdate}
                />
              </div>
            </SheetContent>
          </Sheet>
          <h1 className="font-bold text-lg">PrepView</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center mr-2">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium hidden sm:inline-block">{userName}</span>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={exportConversation}
            disabled={messages.length === 0}
          >
            <DownloadIcon className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Button
            variant={autoMode ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoMode(!autoMode)}
          >
            {autoMode ? "Auto Mode" : "Manual Mode"}
          </Button>
          <ThemeToggle />
        </div>
      </header>
      
      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Context panel (hidden on mobile) */}
        <div className="hidden lg:block w-[300px] border-r overflow-y-auto">
          <ContextPanel 
            onResumeUpdate={handleResumeUpdate}
            onJobDescriptionUpdate={handleJobDescriptionUpdate}
            expanded={contextPanelExpanded}
          />
        </div>
        
        {/* Main conversation area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Conversation */}
          <div className="flex-1 overflow-y-auto p-4" id="conversation-container">
            {isProcessing && (
              <div className="px-4 py-2">
                <Progress value={progress} className="h-1" />
              </div>
            )}
            
            <div className="flex-1 overflow-hidden">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full space-y-4 p-4">
                  <h2 className="text-xl font-semibold">Welcome to PrepView</h2>
                  <p className="text-center text-muted-foreground max-w-md">
                    {resume ? 
                      `Ready for your interview, ${userName}. ${autoMode ? 
                        "Click Start Listening to begin auto-detection of interviewer questions." : 
                        "Use the microphone to record interviewer questions."}`
                      : 
                      "Upload your resume to start practicing for your interview. The AI will generate responses based on your experience."}
                  </p>
                </div>
              ) : (
                <ConversationStream messages={messages} isTyping={isTyping} />
              )}
            </div>
            
            {/* Audio control for both modes */}
            <div className="border-t p-4">
              {isProcessing && (
                <div className="mb-2">
                  <Progress value={progress} className="h-1" />
                </div>
              )}
              
              <div className="flex items-center">
                <AudioControl
                  onTranscriptionComplete={handleTranscriptionComplete}
                  isProcessing={isProcessing || isTyping}
                  autoMode={autoMode}
                  aiProvider={aiProvider}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
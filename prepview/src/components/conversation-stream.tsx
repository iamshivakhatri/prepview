"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface Message {
  id: string;
  role: "user" | "interviewer" | "assistant";
  content: string;
  timestamp: Date;
}

interface ConversationStreamProps {
  messages: Message[];
  isTyping?: boolean;
}

const TypingIndicator = () => (
  <div className="flex gap-1.5 items-center p-3">
    <div className="h-3 w-3 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
    <div className="h-3 w-3 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
    <div className="h-3 w-3 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
  </div>
);

export function ConversationStream({ messages, isTyping = false }: ConversationStreamProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Generate color classes based on role
  const getRoleClasses = (role: string) => {
    switch (role) {
      case "interviewer":
        return "bg-muted/70 text-foreground border-muted";
      case "assistant":
        return "bg-gradient-to-r from-indigo-500/80 to-purple-500/80 text-white border-indigo-600 shadow-md";
      case "user":
        return "bg-secondary/80 text-secondary-foreground border-secondary";
      default:
        return "bg-background border-border";
    }
  };

  // Format the role name for display
  const formatRole = (role: string) => {
    switch (role) {
      case "interviewer":
        return "Interviewer";
      case "assistant":
        return "Your Response";
      case "user":
        return "You";
      default:
        return role;
    }
  };

  // Get role badge styles
  const getRoleBadgeStyles = (role: string) => {
    switch (role) {
      case "interviewer":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "assistant":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "user":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      default:
        return "";
    }
  };

  return (
    <div className="flex flex-col space-y-6 p-5 max-h-[calc(100vh-200px)] overflow-y-auto w-full">
  
      <AnimatePresence>
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className={`max-w-[95%]`}
          >
            <div className="flex flex-col">
              <div className="flex items-center mb-2">
                <Badge 
                  variant="outline" 
                  className={`text-sm font-medium py-1 px-3 ${getRoleBadgeStyles(message.role)}`}
                >
                  {formatRole(message.role)}
                </Badge>
                <span className="text-xs text-muted-foreground ml-2">
                  {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <Card 
                className={`p-4 ${getRoleClasses(message.role)} `}
              >
                <div 
                  className={`whitespace-pre-wrap ${message.role === "assistant" ? "text-xl leading-relaxed" : ""}`}
                >
                  {message.content}
                </div>
              </Card>
            </div>
          </motion.div>
        ))}
        
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center self-end"
          >
            <Badge 
              variant="outline" 
              className="text-sm font-medium py-1 px-3 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 mr-2"
            >
              Your Response
            </Badge>
            <Card className="bg-gradient-to-r from-indigo-500/80 to-purple-500/80 text-white border-indigo-600 shadow-md">
              <TypingIndicator />
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      <div ref={messagesEndRef} />
    </div>
  );
} 
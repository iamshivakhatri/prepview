"use client";

import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic } from "lucide-react";

interface FallbackInputProps {
  onSubmit: (text: string) => void;
  isDisabled?: boolean;
}

export function FallbackInput({ onSubmit, isDisabled = false }: FallbackInputProps) {
  const [text, setText] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSubmit(text.trim());
      setText("");
    }
  };

  return (
    <div>
      <div className="text-sm text-muted-foreground mb-2">
        Audio recording is not available in this browser. Please type your question instead:
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type your question here..."
          className="flex-1"
          disabled={isDisabled}
        />
        <Button type="submit" disabled={isDisabled || !text.trim()}>
          <Mic className="mr-2 h-4 w-4" />
          Ask
        </Button>
      </form>
    </div>
  );
} 
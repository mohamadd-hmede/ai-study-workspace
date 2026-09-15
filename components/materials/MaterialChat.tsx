"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";

import { chatWithMaterial } from "@/lib/material-chat";

import type { Material } from "@/types/material";
import type { ChatMessage } from "@/types/chat";

type MaterialChatProps = {
  material: Material;
};

export default function MaterialChat({ material }: MaterialChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const handleSendQuestion = async () => {
    if (!question.trim() || sending) {
      return;
    }

    const userQuestion = question.trim();

    setSending(true);
    setChatError(null);

    try {
      const answer = await chatWithMaterial(material, messages, userQuestion);

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          role: "user",
          content: userQuestion,
        },
        {
          role: "assistant",
          content: answer,
        },
      ]);

      setQuestion("");
    } catch {
      setChatError("Failed to get an AI response. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 p-4">
      <h2 className="text-xl font-semibold text-gray-900">AI Assistant</h2>

      <div className="mt-4 space-y-4">
        {messages.length === 0 ? (
          <p className="text-sm text-gray-500">
            Ask a question about this study material.
          </p>
        ) : (
          messages.map((message, index) => (
            <div key={index}>
              <p className="text-sm font-medium text-gray-900">
                {message.role === "user" ? "You" : "AI"}
              </p>

              {message.role === "assistant" ? (
                <div className="prose prose-sm mt-1 max-w-none text-gray-700">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
                  {message.content}
                </p>
              )}
            </div>
          ))
        )}
      </div>

      {chatError && <p className="mt-4 text-sm text-red-600">{chatError}</p>}

      <div className="mt-6 flex gap-2">
        <input
          type="text"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask about this material..."
          disabled={sending}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 disabled:bg-gray-100"
        />

        <button
          type="button"
          onClick={handleSendQuestion}
          disabled={sending || !question.trim()}
          className="rounded-lg bg-black px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {sending ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
}

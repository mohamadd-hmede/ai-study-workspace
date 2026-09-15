"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { getMaterialById } from "@/lib/materials";
import { chatWithMaterial } from "@/lib/material-chat";

import type { Material } from "@/types/material";
import type { ChatMessage } from "@/types/chat";

import MaterialPreview from "@/components/material-preview";
import MaterialSummary from "@/components/materials/MaterialSummary";

import ReactMarkdown from "react-markdown";

export default function MaterialPage() {
  const params = useParams<{
    courseId: string;
    materialId: string;
  }>();

  const router = useRouter();

  const [material, setMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const getFileType = (fileName: string) => {
    const extension = fileName.split(".").pop();

    return extension ? extension.toUpperCase() : "FILE";
  };

  const handleSendQuestion = async () => {
    if (!material || !question.trim() || sending) {
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

  useEffect(() => {
    let isActive = true;

    const loadMaterial = async () => {
      try {
        const currentMaterial = await getMaterialById(
          params.courseId,
          params.materialId,
        );

        if (!isActive) {
          return;
        }

        if (!currentMaterial) {
          router.replace(`/courses/${params.courseId}`);
          return;
        }

        setMaterial(currentMaterial);
      } catch {
        if (isActive) {
          setError("Failed to load material. Please try again.");
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadMaterial();

    return () => {
      isActive = false;
    };
  }, [params.courseId, params.materialId, router]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p>Loading material...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-red-600">{error}</p>
      </main>
    );
  }

  if (!material) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <Link
          href={`/courses/${params.courseId}`}
          className="text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          ← Back to Course
        </Link>

        <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6">
          <h1 className="text-3xl font-bold text-gray-900">{material.name}</h1>

          <p className="mt-3 text-gray-600">{getFileType(material.name)}</p>

          <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <div className="rounded-xl border border-gray-200 p-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Material Preview
              </h2>

              <div className="mt-4">
                <MaterialPreview material={material} />
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 p-4">
              <h2 className="text-xl font-semibold text-gray-900">
                AI Assistant
              </h2>

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

              {chatError && (
                <p className="mt-4 text-sm text-red-600">{chatError}</p>
              )}

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
                  onClick={handleSendQuestion}
                  disabled={sending || !question.trim()}
                  className="rounded-lg bg-black px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {sending ? "Sending..." : "Send"}
                </button>
              </div>
            </div>
          </div>

          <MaterialSummary material={material} />
        </div>
      </div>
    </main>
  );
}

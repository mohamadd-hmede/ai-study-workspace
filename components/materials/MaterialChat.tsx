"use client";

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { ArrowUp, Check, Copy, RefreshCw, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

import "katex/dist/katex.min.css";

import { chatWithMaterial } from "@/lib/material-chat";

import type { Material } from "@/types/material";
import type { ChatMessage } from "@/types/chat";

type MaterialChatProps = {
  material: Material;
};

function CodeBlock({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const language = className?.replace("language-", "") ?? "";
  const code = String(children).replace(/\n$/, "");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="my-4 overflow-hidden rounded-xl border border-slate-700 bg-slate-950 text-left">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2">
        <span className="text-xs font-medium text-slate-400">
          {language || "code"}
        </span>

        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-slate-400 transition hover:text-white"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              Copy
            </>
          )}
        </button>
      </div>

      <pre
        dir="ltr"
        className="overflow-x-auto p-4 font-mono text-sm leading-6 text-slate-100"
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function MaterialChat({ material }: MaterialChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [failedQuestion, setFailedQuestion] = useState<string | null>(null);
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(
    null,
  );
  const [regeneratingMessageIndex, setRegeneratingMessageIndex] = useState<
    number | null
  >(null);

  const conversationRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    const conversation = conversationRef.current;

    if (!conversation) {
      return;
    }

    conversation.scrollTo({
      top: conversation.scrollHeight,
      behavior: "smooth",
    });
  };

  const resizeTextarea = () => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 144)}px`;
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending, chatError]);

  useEffect(() => {
    resizeTextarea();
  }, [question]);

  const sendQuestion = async (
    userQuestion: string,
    conversation: ChatMessage[],
    addUserMessage: boolean,
  ) => {
    const trimmedQuestion = userQuestion.trim();

    if (!trimmedQuestion || sending) {
      return;
    }

    const userMessage: ChatMessage = {
      role: "user",
      content: trimmedQuestion,
    };

    if (addUserMessage) {
      setMessages((currentMessages) => [...currentMessages, userMessage]);
    }

    setQuestion("");
    setSending(true);
    setChatError(null);
    setFailedQuestion(null);

    try {
      const answer = await chatWithMaterial(
        material,
        conversation,
        trimmedQuestion,
      );

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          role: "assistant",
          content: answer,
        },
      ]);
    } catch {
      setChatError(
        "The AI Assistant couldn't generate a response. Please try again.",
      );
      setFailedQuestion(trimmedQuestion);
    } finally {
      setSending(false);

      window.setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    }
  };

  const handleSendQuestion = async () => {
    const userQuestion = question.trim();

    if (!userQuestion || sending) {
      return;
    }

    await sendQuestion(userQuestion, messages, true);
  };

  const handleRetry = async () => {
    if (!failedQuestion || sending) {
      return;
    }

    const conversationBeforeFailedQuestion =
      messages.at(-1)?.role === "user" ? messages.slice(0, -1) : messages;

    await sendQuestion(failedQuestion, conversationBeforeFailedQuestion, false);
  };

  const handleCopyResponse = async (content: string, messageIndex: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageIndex(messageIndex);

      window.setTimeout(() => {
        setCopiedMessageIndex((currentIndex) =>
          currentIndex === messageIndex ? null : currentIndex,
        );
      }, 1500);
    } catch {
      setCopiedMessageIndex(null);
    }
  };

  const handleRegenerateResponse = async (assistantMessageIndex: number) => {
    if (sending || regeneratingMessageIndex !== null) {
      return;
    }

    const userMessageIndex = assistantMessageIndex - 1;
    const userMessage = messages[userMessageIndex];

    if (!userMessage || userMessage.role !== "user") {
      return;
    }

    const conversationBeforeQuestion = messages.slice(0, userMessageIndex);

    setSending(true);
    setRegeneratingMessageIndex(assistantMessageIndex);
    setChatError(null);
    setFailedQuestion(null);

    try {
      const answer = await chatWithMaterial(
        material,
        conversationBeforeQuestion,
        userMessage.content,
      );

      setMessages((currentMessages) =>
        currentMessages.map((message, index) =>
          index === assistantMessageIndex
            ? {
                role: "assistant",
                content: answer,
              }
            : message,
        ),
      );
    } catch {
      setChatError(
        "The AI Assistant couldn't regenerate this response. Please try again.",
      );
    } finally {
      setSending(false);
      setRegeneratingMessageIndex(null);

      window.setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      if (!sending && question.trim()) {
        void handleSendQuestion();
      }
    }
  };

  return (
    <div className="flex min-h-[520px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white xl:h-full">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-600" />

          <h2 className="font-semibold text-slate-900">AI Assistant</h2>
        </div>

        <p className="max-w-[220px] truncate text-xs text-slate-500">
          Using:{" "}
          <span className="font-medium text-slate-700">{material.name}</span>
        </p>
      </div>
      {/* Conversation */}
      <div ref={conversationRef} className="flex-1 overflow-y-auto px-5 py-5">
        {messages.length === 0 && !sending ? (
          <div className="flex h-full items-center justify-center">
            <div className="max-w-xs text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
                <Sparkles className="h-5 w-5 text-blue-600" />
              </div>

              <p className="text-sm font-medium text-slate-700">
                Ask Learnadio AI
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                Ask about this material, request a clearer explanation, or ask
                any other question.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {messages.map((message, index) => (
              <div
                key={index}
                className={
                  message.role === "user"
                    ? "flex justify-end"
                    : "flex justify-start"
                }
              >
                {message.role === "user" ? (
                  <div
                    dir="auto"
                    className="max-w-[85%] rounded-2xl rounded-br-md bg-blue-600 px-4 py-3 text-sm leading-6 text-white"
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                ) : (
                  <div className="min-w-0 max-w-[90%]">
                    <div className="mb-2 flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50">
                        <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                      </div>

                      <span className="text-xs font-medium text-slate-500">
                        AI Assistant
                      </span>
                    </div>

                    <div className="overflow-hidden rounded-2xl rounded-bl-md bg-slate-100 px-4 py-3">
                      <div
                        dir="auto"
                        className="max-w-none text-sm leading-7 text-slate-700"
                      >
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm, remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                          components={{
                            h1: ({ children }) => (
                              <h1 className="mb-3 mt-5 text-xl font-bold text-slate-900 first:mt-0">
                                {children}
                              </h1>
                            ),

                            h2: ({ children }) => (
                              <h2 className="mb-2 mt-5 text-lg font-semibold text-slate-900 first:mt-0">
                                {children}
                              </h2>
                            ),

                            h3: ({ children }) => (
                              <h3 className="mb-2 mt-4 text-base font-semibold text-slate-900 first:mt-0">
                                {children}
                              </h3>
                            ),

                            p: ({ children }) => (
                              <p className="my-2 leading-7 first:mt-0 last:mb-0">
                                {children}
                              </p>
                            ),

                            strong: ({ children }) => (
                              <strong className="font-semibold text-slate-900">
                                {children}
                              </strong>
                            ),

                            em: ({ children }) => (
                              <em className="italic">{children}</em>
                            ),

                            ul: ({ children }) => (
                              <ul className="my-3 list-disc space-y-1 ps-6">
                                {children}
                              </ul>
                            ),

                            ol: ({ children }) => (
                              <ol className="my-3 list-decimal space-y-1 ps-6">
                                {children}
                              </ol>
                            ),

                            li: ({ children }) => (
                              <li className="ps-1">{children}</li>
                            ),

                            blockquote: ({ children }) => (
                              <blockquote className="my-4 border-s-4 border-blue-300 bg-blue-50 px-4 py-2 text-slate-700">
                                {children}
                              </blockquote>
                            ),

                            hr: () => <hr className="my-5 border-slate-200" />,

                            table: ({ children }) => (
                              <div
                                dir="auto"
                                className="my-4 overflow-x-auto rounded-lg border border-slate-200 bg-white"
                              >
                                <table className="w-full border-collapse text-start text-sm">
                                  {children}
                                </table>
                              </div>
                            ),

                            thead: ({ children }) => (
                              <thead className="bg-slate-50 text-slate-900">
                                {children}
                              </thead>
                            ),

                            th: ({ children }) => (
                              <th className="border-b border-slate-200 px-3 py-2 text-start font-semibold">
                                {children}
                              </th>
                            ),

                            td: ({ children }) => (
                              <td className="border-b border-slate-100 px-3 py-2 text-start align-top">
                                {children}
                              </td>
                            ),

                            a: ({ children, href }) => (
                              <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-blue-600 underline decoration-blue-300 underline-offset-2 transition hover:text-blue-700"
                              >
                                {children}
                              </a>
                            ),

                            pre: ({ children }) => <>{children}</>,

                            code: ({ children, className }) => {
                              const isCodeBlock = Boolean(
                                className?.startsWith("language-"),
                              );

                              if (isCodeBlock) {
                                return (
                                  <CodeBlock className={className}>
                                    {children}
                                  </CodeBlock>
                                );
                              }

                              return (
                                <code
                                  dir="ltr"
                                  className="rounded bg-slate-200/80 px-1.5 py-0.5 font-mono text-[0.9em] text-slate-800"
                                >
                                  {children}
                                </code>
                              );
                            },
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    </div>

                    {/* Response actions */}
                    <div className="mt-2 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          void handleCopyResponse(message.content, index)
                        }
                        aria-label="Copy response"
                        title="Copy response"
                        className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                      >
                        {copiedMessageIndex === index ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            Copy
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => void handleRegenerateResponse(index)}
                        disabled={sending}
                        aria-label="Regenerate response"
                        title="Regenerate response"
                        className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <RefreshCw
                          className={`h-3.5 w-3.5 ${
                            regeneratingMessageIndex === index
                              ? "animate-spin"
                              : ""
                          }`}
                        />
                        {regeneratingMessageIndex === index
                          ? "Regenerating"
                          : "Regenerate"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {sending && regeneratingMessageIndex === null && (
              <div className="flex justify-start">
                <div className="min-w-0 max-w-[90%]">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50">
                      <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                    </div>

                    <span className="text-xs font-medium text-slate-500">
                      AI Assistant
                    </span>
                  </div>

                  <div className="flex items-center gap-3 rounded-2xl rounded-bl-md bg-slate-100 px-4 py-3">
                    <div className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
                    </div>

                    <span className="text-sm text-slate-500">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            {chatError && !sending && (
              <div className="flex justify-start">
                <div className="max-w-[90%] rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-sm leading-6 text-red-700">{chatError}</p>

                  {failedQuestion && (
                    <button
                      type="button"
                      onClick={() => void handleRetry()}
                      className="mt-2 flex items-center gap-1.5 text-sm font-medium text-red-700 transition hover:text-red-800"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Try again
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Input */}
      <div className="border-t border-slate-200 bg-white p-4">
        <div className="flex items-end gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 transition focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
          <textarea
            ref={textareaRef}
            rows={1}
            dir="auto"
            value={question}
            onChange={(event) => {
              setQuestion(event.target.value);

              if (chatError) {
                setChatError(null);
                setFailedQuestion(null);
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask Learnadio AI..."
            disabled={sending}
            className="max-h-36 min-h-8 min-w-0 flex-1 resize-none overflow-y-auto bg-transparent py-1 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
          />

          <button
            type="button"
            onClick={() => void handleSendQuestion()}
            disabled={sending || !question.trim()}
            aria-label="Send question"
            className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
          <span>Enter to send · Shift + Enter for new line</span>
          <span>AI can make mistakes. Check important information.</span>
        </div>
      </div>
    </div>
  );
}

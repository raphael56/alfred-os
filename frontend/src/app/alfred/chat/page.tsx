"use client";

import { useState, useRef, useEffect } from "react";
import { chat } from "@/lib/alfred";

interface Message {
  role: "user" | "alfred";
  text: string;
  ts: Date;
}

export default function AlfredChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "alfred",
      text: "Bonjour. Je suis Alfred. Comment puis-je vous aider depuis le quartier général ?",
      ts: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text, ts: new Date() }]);
    setLoading(true);
    try {
      const reply = await chat(text);
      setMessages((m) => [...m, { role: "alfred", text: reply, ts: new Date() }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "alfred", text: "Erreur de connexion au service Alfred.", ts: new Date() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Chat Alfred</h1>
        <p className="text-gray-500 text-sm mt-0.5">Interface directe via le dashboard</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 py-2">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {m.role === "alfred" && (
              <div className="w-7 h-7 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-400 mr-2 mt-1 shrink-0">
                A
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-blue-600 text-white rounded-br-sm"
                  : "bg-gray-800 text-gray-200 rounded-bl-sm"
              }`}
            >
              {m.text}
              <div className={`text-xs mt-1 ${m.role === "user" ? "text-blue-200" : "text-gray-600"}`}>
                {m.ts.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-400 mr-2 mt-1 shrink-0">
              A
            </div>
            <div className="bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3 text-sm text-gray-500">
              <span className="inline-flex gap-1">
                <span className="animate-bounce" style={{ animationDelay: "0ms" }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: "150ms" }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: "300ms" }}>.</span>
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 mt-4">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Écrire un message... (Entrée pour envoyer)"
          rows={2}
          className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-blue-500 placeholder-gray-600 resize-none"
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white px-4 rounded-xl transition-colors flex items-center justify-center"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>
        </button>
      </div>
    </div>
  );
}

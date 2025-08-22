import { Trash2, Send, Bot, User } from "lucide-react";
import toast from "react-hot-toast";
import { useState } from "react";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
}

export default function AiAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const clearChatHistory = () => {
    setMessages([]);
    toast.success("Chat history cleared");
  };

  const sendMessage = () => {
    if (!input.trim()) return;

    const newMessage: Message = {
      id: crypto.randomUUID(),
      content: input,
      role: "user",
    };

    setMessages((prev) => [...prev, newMessage]);

    // Example "assistant response" for demo
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          content: "Here’s a helpful study tip: break sessions into small chunks and review actively.",
          role: "assistant",
        },
      ]);
    }, 800);

    setInput("");
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          MULU-AI Study Assistant
        </h1>
        {messages.length > 0 && (
          <button
            onClick={clearChatHistory}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 size={20} />
            Clear History
          </button>
        )}
      </div>

      {/* Chat Window */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 h-[65vh] overflow-y-auto p-6 mb-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-gray-500">
            <Bot className="h-12 w-12 text-indigo-400 mb-3" />
            <p className="text-lg font-medium">No messages yet</p>
            <p className="text-sm text-gray-400">Start chatting to get study tips and guidance</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "assistant" && (
                <div className="p-2 bg-indigo-100 rounded-full">
                  <Bot className="h-5 w-5 text-indigo-600" />
                </div>
              )}
              <div
                className={`max-w-[70%] px-4 py-3 rounded-2xl text-sm shadow-sm ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white rounded-br-none"
                    : "bg-gray-100 text-gray-800 rounded-bl-none"
                }`}
              >
                {msg.content}
              </div>
              {msg.role === "user" && (
                <div className="p-2 bg-indigo-100 rounded-full">
                  <User className="h-5 w-5 text-indigo-600" />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Input Box */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type your question..."
          className="flex-1 px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
        />
        <button
          onClick={sendMessage}
          className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-md"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}

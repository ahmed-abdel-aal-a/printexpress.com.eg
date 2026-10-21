"use client";

import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, User, Headset, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppContext } from "@/context/AppContext";
import {
  ChatSettings,
  ChatMessage,
  fetchChatSettings,
  getOrCreateChatConversation,
  fetchChatMessages,
  sendChatMessage,
  formatWhatsAppUrl,
} from "@/services/chatService";

export default function FloatingWidgets() {
  const { isChatOpen, setIsChatOpen, user } = useAppContext();
  const [settings, setSettings] = useState<ChatSettings>({
    isMessageEnabled: true,
    messageText: "أهلاً بك في Print Express! كيف يمكننا مساعدتك اليوم؟",
    displayLocation: "chat_only",
    themeColor: "#f59e0b",
    whatsappNumber: "01000000000",
    whatsappEnabled: true,
    whatsappDefaultMessage: "مرحباً، أود الاستفسار عن خدمات ومنتجات Print Express.",
  });

  const [conversationUuid, setConversationUuid] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Fetch Chat & WhatsApp Settings on Mount
  useEffect(() => {
    fetchChatSettings().then((data) => {
      if (data) setSettings(data);
    });
  }, []);

  // 2. Initialize or restore conversation UUID from localStorage
  useEffect(() => {
    let savedUuid = localStorage.getItem("apex_chat_uuid");
    const userName = user?.name || "زائر المتجر";

    getOrCreateChatConversation(savedUuid || undefined, userName).then((conv) => {
      if (conv?.uuid) {
        setConversationUuid(conv.uuid);
        localStorage.setItem("apex_chat_uuid", conv.uuid);
      }
    });
  }, [user]);

  // 3. Load & Poll messages when chat is open
  useEffect(() => {
    if (!conversationUuid || !isChatOpen) return;

    let isMounted = true;

    const loadMessages = async () => {
      const msgs = await fetchChatMessages(conversationUuid);
      if (isMounted) {
        setMessages(msgs);
      }
    };

    setIsLoadingMessages(true);
    loadMessages().finally(() => {
      if (isMounted) setIsLoadingMessages(false);
    });

    // Real-time polling while chat window is active (every 4 seconds)
    const interval = setInterval(loadMessages, 4000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [conversationUuid, isChatOpen]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isChatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isChatOpen]);

  // 4. Handle sending customer message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !conversationUuid || isSending) return;

    const textToSend = inputMessage.trim();
    setInputMessage("");

    // Optimistic message update
    const optimisticMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      text: textToSend,
      sender: "customer",
      time: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setIsSending(true);

    try {
      const created = await sendChatMessage(conversationUuid, textToSend);
      if (created) {
        setMessages((prev) =>
          prev.map((m) => (m.id === optimisticMsg.id ? created : m))
        );
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setIsSending(false);
    }
  };

  const whatsappLink = formatWhatsAppUrl(
    settings.whatsappNumber,
    settings.whatsappDefaultMessage
  );

  return (
    <div className="fixed bottom-24 md:bottom-8 right-4 md:right-8 z-40 flex flex-col items-end gap-4" dir="rtl">
      {/* Live Chat Window */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-[92vw] sm:w-84 md:w-96 bg-[#111111] rounded-3xl shadow-2xl shadow-black/80 overflow-hidden border border-yellow-500/20 mb-2 flex flex-col"
          >
            {/* Header */}
            <div className="bg-yellow-400 p-4 flex justify-between items-center text-slate-900 shadow-md">
              <div className="font-bold flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-slate-900 text-yellow-400 flex items-center justify-center">
                  <Headset size={18} />
                </div>
                <div>
                  <div className="text-sm font-black text-slate-900 leading-tight">خدمة العملاء المباشرة</div>
                  <div className="text-[10px] text-slate-800 font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-600 inline-block"></span>
                    فريق الدعم متصل لمساعدتك
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="hover:bg-yellow-500/30 p-1.5 rounded-full text-slate-900 transition-colors"
                title="إغلاق"
              >
                <X size={20} />
              </button>
            </div>

            {/* Chat Body */}
            <div className="h-80 p-4 overflow-y-auto bg-[#181818] flex flex-col gap-3 custom-scrollbar">
              {/* Optional Admin Welcome Message */}
              {settings.isMessageEnabled && settings.messageText && (
                <div className="bg-[#242424] border border-yellow-500/20 text-gray-200 p-3.5 rounded-2xl rounded-tr-none text-xs leading-relaxed max-w-[85%] self-start shadow-sm">
                  <div className="flex items-center gap-1.5 text-yellow-400 font-bold mb-1 text-[11px]">
                    <Headset size={13} />
                    <span>فريق Print Express</span>
                  </div>
                  {settings.messageText}
                </div>
              )}

              {/* Message History */}
              {messages.map((msg, idx) => {
                const isCustomer = msg.sender === "customer";
                return (
                  <div
                    key={msg.id || idx}
                    className={`max-w-[82%] rounded-2xl p-3 text-xs leading-relaxed ${
                      isCustomer
                        ? "bg-yellow-400 text-slate-950 font-medium self-end rounded-tl-none shadow-md shadow-yellow-500/10"
                        : "bg-[#222222] border border-white/10 text-gray-100 self-start rounded-tr-none shadow-sm"
                    }`}
                  >
                    {msg.isImage ? (
                      <img
                        src={msg.text}
                        alt="مرفق"
                        className="rounded-xl max-h-48 object-cover border border-white/10 mb-1"
                      />
                    ) : (
                      <span>{msg.text}</span>
                    )}
                    <div
                      className={`text-[9px] mt-1 text-left ${
                        isCustomer ? "text-slate-800" : "text-gray-400"
                      }`}
                    >
                      {msg.time}
                    </div>
                  </div>
                );
              })}

              {isLoadingMessages && messages.length === 0 && (
                <div className="flex items-center justify-center h-full text-gray-400 text-xs gap-2">
                  <Loader2 size={16} className="animate-spin text-yellow-400" />
                  <span>جاري تحميل المحادثة...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 bg-[#111111] border-t border-white/[0.08] flex items-center gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="اكتب استفسارك هنا..."
                className="flex-1 bg-[#202020] text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-yellow-400 border border-white/5"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isSending}
                className="bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-slate-950 p-2.5 rounded-xl font-bold transition-transform active:scale-95 flex items-center justify-center shrink-0"
              >
                {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} className="rtl:-scale-x-100" />}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Floating Action Buttons */}
      <div className="hidden md:flex flex-col gap-3">
        {/* Live Chat Toggle */}
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="w-14 h-14 bg-[#1a1a1a] text-yellow-400 rounded-full flex items-center justify-center shadow-xl shadow-black/50 border-2 border-yellow-400/40 hover:scale-110 hover:border-yellow-400 transition-all group"
          title="المحادثة المباشرة"
        >
          <MessageCircle size={26} className="group-hover:rotate-6 transition-transform" />
        </button>

        {/* WhatsApp Direct Chat */}
        {settings.whatsappEnabled && (
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-14 h-14 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-xl shadow-black/50 border-2 border-emerald-400/30 hover:scale-110 hover:bg-emerald-400 transition-all group"
            title="تواصل عبر واتساب"
          >
            <svg className="w-8 h-8 group-hover:scale-105 transition-transform" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824zm-3.423-14.416c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm.029 18.88c-1.161 0-2.305-.292-3.318-.844l-3.677.964.984-3.595c-.607-1.052-.927-2.246-.926-3.468.001-3.825 3.113-6.937 6.937-6.937 3.825 0 6.938 3.112 6.938 6.937 0 3.824-3.113 6.938-6.938 6.938z" />
            </svg>
          </a>
        )}
      </div>
    </div>
  );
}

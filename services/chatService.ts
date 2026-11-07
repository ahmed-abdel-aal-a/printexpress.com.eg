import { API_URL } from "@/lib/api";

export type ChatSettings = {
  isMessageEnabled: boolean;
  messageText: string;
  displayLocation: string;
  themeColor: string;
  whatsappNumber: string;
  whatsappEnabled: boolean;
  whatsappDefaultMessage: string;
};

export type ChatMessage = {
  id: string;
  text: string;
  sender: "agent" | "customer";
  isImage?: boolean;
  time: string;
};

export type StorefrontFAQ = {
  id: string;
  title: string;
  questions: { id: string; question: string; answer: string }[];
};

/**
 * Format phone number into WhatsApp direct chat URL
 */
export function formatWhatsAppUrl(phone?: string, text?: string): string {
  // If phone is missing, null, or placeholder 01000000000, always enforce official number 01011348890
  let targetPhone = phone;
  if (!targetPhone || targetPhone === "01000000000" || targetPhone.includes("000000")) {
    targetPhone = "01011348890";
  }
  
  // Clean phone string: remove spaces, dashes, parentheses, plus
  let cleaned = targetPhone.replace(/[^0-9]/g, "");

  // If local Egyptian mobile format (e.g. 010..., 011..., 012..., 015...), convert to international 201...
  if (cleaned.startsWith("01") && cleaned.length === 11) {
    cleaned = "2" + cleaned;
  } else if (cleaned.startsWith("1") && cleaned.length === 10) {
    cleaned = "20" + cleaned;
  }

  // Safety net against placeholder
  if (cleaned === "201000000000" || cleaned === "01000000000") {
    cleaned = "201011348890";
  }

  const query = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${cleaned}${query}`;
}

export async function fetchChatSettings(): Promise<ChatSettings> {
  try {
    const res = await fetch(`${API_URL}/storefront/chat/settings`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch chat settings");
    const json = await res.json();
    const data = json.data;
    if (!data.whatsappNumber || data.whatsappNumber === "01000000000" || data.whatsappNumber.includes("000000")) {
      data.whatsappNumber = "01011348890";
    }
    return data;
  } catch (error) {
    console.error("Error fetching chat settings:", error);
    return {
      isMessageEnabled: true,
      messageText: "مرحباً بك في Print Express! كيف يمكننا مساعدتك اليوم؟",
      displayLocation: "chat_only",
      themeColor: "#f59e0b",
      whatsappNumber: "01011348890",
      whatsappEnabled: true,
      whatsappDefaultMessage: "مرحباً، أود الاستفسار عن خدمات ومنتجات Print Express.",
    };
  }
}

export async function fetchChatFaqs(): Promise<StorefrontFAQ[]> {
  try {
    const res = await fetch(`${API_URL}/storefront/chat/faqs`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error("Failed to fetch FAQs");
    const json = await res.json();
    return json.data || [];
  } catch (error) {
    console.error("Error fetching FAQs:", error);
    return [];
  }
}

export async function getOrCreateChatConversation(uuid?: string, name?: string) {
  try {
    const res = await fetch(`${API_URL}/storefront/chat/conversations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ uuid, name }),
    });
    if (!res.ok) throw new Error("Failed to init conversation");
    const json = await res.json();
    return json.data;
  } catch (error) {
    console.error("Error creating chat conversation:", error);
    return null;
  }
}

export async function fetchChatMessages(uuid: string): Promise<ChatMessage[]> {
  try {
    const res = await fetch(`${API_URL}/storefront/chat/conversations/${uuid}/messages`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch messages");
    const json = await res.json();
    return json.data || [];
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    return [];
  }
}

export async function sendChatMessage(uuid: string, text: string): Promise<ChatMessage | null> {
  try {
    const res = await fetch(`${API_URL}/storefront/chat/conversations/${uuid}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error("Failed to send message");
    const json = await res.json();
    return json.data;
  } catch (error) {
    console.error("Error sending message:", error);
    return null;
  }
}

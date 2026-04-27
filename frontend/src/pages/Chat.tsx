/**
 * src/pages/Chat.tsx
 *
 * Live community chat powered by Socket.io (L45-48).
 *
 * Replaces Supabase Realtime postgres_changes with socket.io events:
 *   chat:message    — send / receive messages
 *   chat:typing     — typing indicator
 *   user:count      — online user count
 *
 * The socket server handles broadcast in backend/utils/socket.js.
 */

import { useEffect, useRef, useState } from "react";
import { Send, MessageCircle, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/lib/auth-context";
import { useSocket } from "@/hooks/use-socket";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatMsg {
  id: string;
  userId: string;
  username: string;
  content: string;
  createdAt: string;
}

export default function ChatPage() {
  const { user } = useAuth();
  const socket = useSocket();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [onlineCount, setOnlineCount] = useState(0);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const username =
    (user as { username?: string })?.username ||
    user?.email?.split("@")[0] ||
    "user";

  // L45-48: Register socket.io event listeners
  useEffect(() => {
    if (!socket) return;

    socket.on("chat:message", (msg: ChatMsg) => {
      setMessages((prev) => [...prev.slice(-199), msg]);
    });

    socket.on("user:count", (count: number) => setOnlineCount(count));

    socket.on("chat:typing", (name: string) => {
      setTypingUser(name);
    });
    socket.on("chat:stop-typing", () => setTypingUser(null));

    return () => {
      socket.off("chat:message");
      socket.off("user:count");
      socket.off("chat:typing");
      socket.off("chat:stop-typing");
    };
  }, [socket]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    // L45-48: typing indicator
    socket?.emit("chat:typing", username);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socket?.emit("chat:stop-typing");
    }, 1500);
  };

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !socket) return;
    socket.emit("chat:message", { content: input.trim(), username });
    setInput("");
    socket.emit("chat:stop-typing");
  };

  const myId = user?._id || user?.id;

  return (
    <main className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <MessageCircle className="h-7 w-7 text-primary" /> Live Chat
          </h1>
          
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Users className="h-4 w-4 text-success" />
          <span>{onlineCount} online</span>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="rounded-2xl border bg-card shadow-soft h-[420px] overflow-y-auto p-4 space-y-3 mb-3"
      >
        {messages.length === 0 ? (
          <div className="h-full grid place-items-center text-muted-foreground text-sm">
            No messages yet. Say hello!
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.userId === myId;
            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm shadow-soft ${
                    isMe
                      ? "bg-gradient-hero text-primary-foreground rounded-br-sm"
                      : "bg-muted rounded-bl-sm"
                  }`}
                >
                  {!isMe && (
                    <p className="text-xs font-semibold mb-1 opacity-70">
                      {msg.username}
                    </p>
                  )}
                  <p>{msg.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      isMe ? "text-primary-foreground/60" : "text-muted-foreground"
                    }`}
                  >
                    {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        {typingUser && (
          <p className="text-xs text-muted-foreground italic">{typingUser} is typing…</p>
        )}
      </div>

      {/* Input */}
      <form onSubmit={send} className="flex gap-2">
        <Input
          value={input}
          onChange={handleInputChange}
          placeholder="Type a message…"
          className="flex-1"
          autoFocus
        />
        <Button
          type="submit"
          disabled={!input.trim()}
          className="bg-gradient-hero text-primary-foreground"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </main>
  );
}

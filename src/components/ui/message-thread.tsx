"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MessageSquare, Send, Loader2 } from "lucide-react";

interface Message {
  id: string;
  body: string;
  createdAt: string;
  sender: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
}

interface MessageThreadProps {
  quoteId?: string;
  orderId?: string;
}

function roleBadge(role: string) {
  if (role === "ADMIN") return <Badge variant="default" className="text-[10px] px-1.5 py-0">Admin</Badge>;
  if (role === "SUPPLIER") return <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Supplier</Badge>;
  return <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Business</Badge>;
}

function timeAgo(dateStr: string) {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { dateStyle: "medium" });
}

export function MessageThread({ quoteId, orderId }: MessageThreadProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(() => {
    const params = new URLSearchParams();
    if (quoteId) params.set("quoteId", quoteId);
    if (orderId) params.set("orderId", orderId);

    fetch(`/api/messages?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setMessages(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [quoteId, orderId]);

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 15000);
      return () => clearInterval(interval);
    }
  }, [isOpen, fetchMessages]);

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  async function handleSend() {
    if (!newMessage.trim()) return;
    setSending(true);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteId: quoteId ?? null,
          orderId: orderId ?? null,
          body: newMessage,
        }),
      });

      if (!res.ok) {
        toast.error("Failed to send message");
        return;
      }

      const msg = await res.json();
      setMessages((prev) => [...prev, msg]);
      setNewMessage("");
    } catch {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  }

  const currentUserId = session?.user?.id;

  return (
    <Card>
      <CardHeader
        className="cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Messages
            {messages.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {messages.length}
              </Badge>
            )}
          </span>
          <span className="text-xs text-muted-foreground font-normal">
            {isOpen ? "Click to collapse" : "Click to expand"}
          </span>
        </CardTitle>
      </CardHeader>

      {isOpen && (
        <CardContent className="pt-0 space-y-4">
          <div className="max-h-80 overflow-y-auto space-y-3 border rounded-md p-3">
            {loading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading...
              </div>
            ) : messages.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                No messages yet. Start the conversation.
              </p>
            ) : (
              messages.map((msg) => {
                const isOwn = msg.sender.id === currentUserId;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col gap-1 ${isOwn ? "items-end" : "items-start"}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium">
                        {msg.sender.name || msg.sender.email}
                      </span>
                      {roleBadge(msg.sender.role)}
                      <span className="text-[10px] text-muted-foreground">
                        {timeAgo(msg.createdAt)}
                      </span>
                    </div>
                    <div
                      className={`rounded-lg px-3 py-2 text-sm max-w-[85%] ${
                        isOwn
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      {msg.body}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          <div className="flex gap-2">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              rows={2}
              className="flex-1 resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button
              size="icon"
              className="shrink-0 self-end"
              onClick={handleSend}
              disabled={sending || !newMessage.trim()}
              aria-label="Send message"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

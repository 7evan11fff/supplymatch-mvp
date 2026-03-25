"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { Bell, Check } from "lucide-react";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
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
  return `${days}d ago`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => {
        if (data.notifications) {
          setNotifications(data.notifications);
          setUnreadCount(data.unreadCount ?? 0);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "read-all" }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }

  async function markOneRead(id: string) {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen(true)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-80 sm:w-96 p-0 flex flex-col">
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <SheetTitle className="text-lg font-semibold">Notifications</SheetTitle>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllRead}>
                <Check className="h-3.5 w-3.5 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-muted-foreground">
                No notifications yet
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`px-4 py-3 text-sm transition-colors ${
                      n.read ? "opacity-60" : "bg-accent/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{n.title}</p>
                        <p className="text-muted-foreground mt-0.5 line-clamp-2">
                          {n.message}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-xs text-muted-foreground">
                            {timeAgo(n.createdAt)}
                          </span>
                          {n.link && (
                            <Link
                              href={n.link}
                              onClick={() => {
                                if (!n.read) markOneRead(n.id);
                                setOpen(false);
                              }}
                              className="text-xs text-primary hover:underline"
                            >
                              View
                            </Link>
                          )}
                        </div>
                      </div>
                      {!n.read && (
                        <button
                          onClick={() => markOneRead(n.id)}
                          className="shrink-0 mt-1 h-2 w-2 rounded-full bg-primary"
                          aria-label="Mark as read"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

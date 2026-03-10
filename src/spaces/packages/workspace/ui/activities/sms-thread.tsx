"use client";

import { useState, useRef, useEffect } from "react";
import { useThread } from "@/spaces/packages/workspace/hooks/use-thread";
import { Button } from "@/ui-primitives/ui/button";
import { Textarea } from "@/ui-primitives/ui/textarea";
import { Skeleton } from "@/ui-primitives/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import type { ThreadMessageDTO } from "@/spaces/packages/workspace/server/threads.service";

const SMS_MAX_LENGTH = 320;

function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDateSeparator(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday =
    date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) return "Today";
  if (isYesterday) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function groupByDate(msgs: ThreadMessageDTO[]) {
  const groups: { date: string; messages: ThreadMessageDTO[] }[] = [];
  let currentDate = "";

  for (const msg of msgs) {
    const d = new Date(msg.occurredAt).toDateString();
    if (d !== currentDate) {
      currentDate = d;
      groups.push({ date: msg.occurredAt, messages: [] });
    }
    groups[groups.length - 1]!.messages.push(msg);
  }

  return groups;
}

function senderName(sender: ThreadMessageDTO["sender"]): string {
  if (!sender) return "Unknown";
  if (sender.firstName || sender.lastName)
    return [sender.firstName, sender.lastName].filter(Boolean).join(" ");
  return sender.commValue || "Unknown";
}

interface SmsThreadProps {
  personId: string;
  personName: string;
  companyName?: string | null;
  onBack: () => void;
}

export function SmsThread({
  personId,
  personName,
  companyName,
  onBack,
}: SmsThreadProps) {
  const { thread, isLoading } = useThread(personId);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-16 w-3/4 ml-auto" />
        <Skeleton className="h-16 w-3/4" />
        <Skeleton className="h-16 w-3/4 ml-auto" />
      </div>
    );
  }

  const msgs = thread?.messages ?? [];
  const dateGroups = groupByDate(msgs);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 pb-3 border-b mb-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 -ml-2">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <p className="text-sm font-semibold">SMS thread</p>
          <p className="text-xs text-muted-foreground">
            {personName}
            {companyName && ` · ${companyName}`}
          </p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pb-3">
        {dateGroups.map((group) => (
          <div key={group.date}>
            <div className="flex justify-center mb-3">
              <span className="text-[10px] text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">
                {formatDateSeparator(group.date)}
              </span>
            </div>

            <div className="space-y-2">
              {group.messages.map((msg) => {
                const isOutbound = msg.sender?.role === "from";
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOutbound ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-3 py-2 ${
                        isOutbound
                          ? "bg-primary/10 text-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      {msg.body && (
                        <p className="text-sm whitespace-pre-wrap">
                          {msg.body}
                        </p>
                      )}
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-[10px] text-muted-foreground">
                          {senderName(msg.sender)}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          · {formatMessageTime(msg.occurredAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {msgs.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No messages yet
          </div>
        )}
      </div>

      <div className="border-t pt-3 space-y-2">
        <p className="text-xs font-medium text-muted-foreground">
          Compose SMS
        </p>
        <Textarea
          placeholder="Write SMS message..."
          value={draft}
          onChange={(e) => {
            if (e.target.value.length <= SMS_MAX_LENGTH) {
              setDraft(e.target.value);
            }
          }}
          className="min-h-[60px] resize-none text-sm"
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-xs h-7">
              Save draft
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 font-semibold"
              onClick={() => setDraft("")}
            >
              Cancel
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">
              {draft.length}/{SMS_MAX_LENGTH}
            </span>
            <Button
              size="sm"
              className="h-7 text-xs"
              disabled={draft.length === 0}
            >
              Send text
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

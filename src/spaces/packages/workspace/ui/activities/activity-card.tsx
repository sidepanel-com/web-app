"use client";

import type { ActivityDTO } from "@/spaces/packages/workspace/types";
import { Mail, Calendar, Phone, MessageSquare, ChevronRight } from "lucide-react";

const TYPE_ICONS: Record<string, React.ReactNode> = {
  email: <Mail className="h-4 w-4 text-muted-foreground" />,
  meeting: <Calendar className="h-4 w-4 text-muted-foreground" />,
  call: <Phone className="h-4 w-4 text-muted-foreground" />,
  message: <MessageSquare className="h-4 w-4 text-muted-foreground" />,
};

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  if (isToday) return `Today, ${time}`;
  if (isYesterday) return `Yesterday, ${time}`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function personName(person: ActivityDTO["person"]): string {
  if (!person) return "";
  return [person.firstName, person.lastName].filter(Boolean).join(" ");
}

interface ActivityCardProps {
  activity: ActivityDTO;
  onSelect?: (activity: ActivityDTO) => void;
}

export function ActivityCard({ activity, onSelect }: ActivityCardProps) {
  return (
    <button
      type="button"
      className="rounded-lg border bg-card p-4 hover:bg-muted/30 transition-colors cursor-pointer w-full text-left"
      onClick={() => onSelect?.(activity)}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <h3 className="text-sm font-semibold truncate flex-1">
          {activity.title}
        </h3>
        <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
          <span>{formatTime(activity.occurredAt)}</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
        {TYPE_ICONS[activity.type]}
        {activity.person && (
          <>
            <span className="font-medium text-foreground">
              {personName(activity.person)}
            </span>
            {activity.company && (
              <>
                <span>·</span>
                <span>{activity.company.name}</span>
              </>
            )}
          </>
        )}
      </div>

      {activity.snippet && (
        <div className="bg-muted/50 rounded-md px-3 py-2">
          <p className="text-xs text-muted-foreground line-clamp-2">
            {activity.snippet}
          </p>
        </div>
      )}
    </button>
  );
}

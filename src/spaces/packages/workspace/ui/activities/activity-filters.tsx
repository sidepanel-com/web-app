"use client";

import React from "react";
import { Button } from "@/ui-primitives/ui/button";
import type { ActivityType } from "@/spaces/packages/workspace/types";

const FILTER_OPTIONS: { label: string; value: ActivityType | undefined }[] = [
  { label: "All", value: undefined },
  { label: "Email", value: "email" },
  { label: "Meeting", value: "meeting" },
  { label: "Call", value: "call" },
  { label: "SMS", value: "message" },
];

interface ActivityFiltersProps {
  activeType: ActivityType | undefined;
  onTypeChange: (type: ActivityType | undefined) => void;
}

export function ActivityFilters({
  activeType,
  onTypeChange,
}: ActivityFiltersProps) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
      {FILTER_OPTIONS.map((opt) => (
        <Button
          key={opt.label}
          variant={activeType === opt.value ? "default" : "outline"}
          size="sm"
          className="h-7 text-xs px-3 rounded-full whitespace-nowrap"
          onClick={() => onTypeChange(opt.value)}
        >
          {opt.label}
        </Button>
      ))}
    </div>
  );
}

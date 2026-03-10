"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/ui-primitives/ui/dropdown-menu";
import { Button } from "@/ui-primitives/ui/button";
import {
  Plus,
  Mail,
  Calendar,
  Phone,
  MessageSquare,
  User,
  Building2,
} from "lucide-react";

type ActivityAction = "email" | "meeting" | "call" | "sms";
type RecordAction = "person" | "company";

interface AddActivityMenuProps {
  onAddActivity?: (type: ActivityAction) => void;
  onAddRecord?: (type: RecordAction) => void;
}

export function AddActivityMenu({
  onAddActivity,
  onAddRecord,
}: AddActivityMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" className="h-9 w-9 rounded-full">
          <Plus className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Add Activity
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onAddActivity?.("email")}>
          <Mail className="h-4 w-4 mr-2" />
          Email
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAddActivity?.("meeting")}>
          <Calendar className="h-4 w-4 mr-2" />
          Meeting
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAddActivity?.("call")}>
          <Phone className="h-4 w-4 mr-2" />
          Call
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAddActivity?.("sms")}>
          <MessageSquare className="h-4 w-4 mr-2" />
          SMS
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Add Record
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onAddRecord?.("person")}>
          <User className="h-4 w-4 mr-2" />
          Person
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAddRecord?.("company")}>
          <Building2 className="h-4 w-4 mr-2" />
          Company
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/ui-primitives/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/ui-primitives/ui/form";
import { Input } from "@/ui-primitives/ui/input";
import { Textarea } from "@/ui-primitives/ui/textarea";
import { Button } from "@/ui-primitives/ui/button";
import { Person, NewPerson } from "@db/product/types";
import { Trash2 } from "lucide-react";

const personSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  bio: z.string().optional(),
});

type PersonFormValues = z.infer<typeof personSchema>;

interface PersonFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  person: Person | null;
  onSubmit: (data: PersonFormValues) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export function PersonFormDialog({
  open,
  onOpenChange,
  person,
  onSubmit,
  onDelete,
}: PersonFormDialogProps) {
  const form = useForm<PersonFormValues>({
    resolver: zodResolver(personSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      bio: "",
    },
  });

  useEffect(() => {
    if (person) {
      form.reset({
        firstName: person.firstName || "",
        lastName: person.lastName || "",
        bio: person.bio || "",
      });
    } else {
      form.reset({
        firstName: "",
        lastName: "",
        bio: "",
      });
    }
  }, [person, form]);

  const handleSubmit = async (values: PersonFormValues) => {
    await onSubmit(values);
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (person?.id && onDelete) {
      await onDelete(person.id);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{person ? "Edit Person" : "Add New Person"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us about this person..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="flex-row gap-2 justify-between items-center pt-4">
              {person && onDelete ? (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              ) : (
                <div />
              )}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {person ? "Save Changes" : "Create Person"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


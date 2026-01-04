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
import { Company } from "@db/product/types";
import { Trash2 } from "lucide-react";

const companySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  domain: z.string().optional(),
  description: z.string().optional(),
  logoUrl: z.string().optional(),
});

type CompanyFormValues = z.infer<typeof companySchema>;

interface CompanyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: Company | null;
  onSubmit: (data: CompanyFormValues) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export function CompanyFormDialog({
  open,
  onOpenChange,
  company,
  onSubmit,
  onDelete,
}: CompanyFormDialogProps) {
  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: "",
      domain: "",
      description: "",
      logoUrl: "",
    },
  });

  useEffect(() => {
    if (company) {
      form.reset({
        name: company.name || "",
        domain: company.domain || "",
        description: company.description || "",
        logoUrl: company.logoUrl || "",
      });
    } else {
      form.reset({
        name: "",
        domain: "",
        description: "",
        logoUrl: "",
      });
    }
  }, [company, form]);

  const handleSubmit = async (values: CompanyFormValues) => {
    await onSubmit(values);
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (company?.id && onDelete) {
      await onDelete(company.id);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{company ? "Edit Company" : "Add New Company"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Inc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="domain"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Domain</FormLabel>
                  <FormControl>
                    <Input placeholder="acme.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="logoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="About this company..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="flex-row gap-2 justify-between items-center pt-4">
              {company && onDelete ? (
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
                  {company ? "Save Changes" : "Create Company"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


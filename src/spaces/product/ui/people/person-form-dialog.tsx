"use client";

import React, { useEffect, useState } from "react";
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
import { Person, Company, Comm } from "@db/product/types";
import { Trash2, Plus, X, Building2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui-primitives/ui/tabs";
import { Badge } from "@/ui-primitives/ui/badge";
import { ScrollArea } from "@/ui-primitives/ui/scroll-area";
import { useCompanies } from "@/spaces/product/hooks/use-companies";
import { formatCommValue, CommType } from "@db/product/comm-validation";

const personSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  bio: z.string().optional(),
});

type PersonFormValues = z.infer<typeof personSchema>;

interface PersonFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  person: (Person & { companies: Company[]; comms: Comm[] }) | null;
  onSubmit: (data: PersonFormValues) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onAddCompany?: (companyId: string) => Promise<void>;
  onCreateCompany?: (name: string, domain?: string) => Promise<void>;
  onRemoveCompany?: (companyId: string) => Promise<void>;
  onAddComm?: (type: string, value: any) => Promise<void>;
  onRemoveComm?: (commId: string) => Promise<void>;
}

export function PersonFormDialog({
  open,
  onOpenChange,
  person,
  onSubmit,
  onDelete,
  onAddCompany,
  onCreateCompany,
  onRemoveCompany,
  onAddComm,
  onRemoveComm,
}: PersonFormDialogProps) {
  const [activeTab, setActiveTab] = useState("details");
  const { companies: allCompanies } = useCompanies();
  const [companySearch, setCompanySearch] = useState("");
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCommType, setNewCommType] = useState<string>("email");
  const [newCommValue, setNewCommValue] = useState("");
  const [newCommExtra, setNewCommExtra] = useState("");

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
      setActiveTab("details");
    }
  }, [person, form]);

  const handleSubmit = async (values: PersonFormValues) => {
    await onSubmit(values);
    // Note: Don't auto-close if we're adding companies/comms
    if (!person) onOpenChange(false);
  };

  const handleDelete = async () => {
    if (person?.id && onDelete) {
      await onDelete(person.id);
      onOpenChange(false);
    }
  };

  const filteredAllCompanies = allCompanies.filter(c =>
    c.name.toLowerCase().includes(companySearch.toLowerCase()) &&
    !person?.companies.some(pc => pc.id === c.id)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] h-[600px] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>{person ? "Edit Person" : "Add New Person"}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-6 grid grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="companies" disabled={!person}>Companies</TabsTrigger>
            <TabsTrigger value="comms" disabled={!person}>Comms</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 px-6">
            <TabsContent value="details" className="mt-4 pb-4">
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
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="submit">
                      {person ? "Save Changes" : "Create Person"}
                    </Button>
                  </div>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="companies" className="mt-4 space-y-6 pb-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Linked Companies</h4>
                <div className="space-y-2">
                  {person?.companies.length ? person.companies.map(c => (
                    <div key={c.id} className="flex items-center justify-between p-2 border rounded-md bg-muted/30">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{c.name}</span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onRemoveCompany?.(c.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )) : (
                    <p className="text-xs text-muted-foreground italic">No companies linked.</p>
                  )}
                </div>
              </div>

              <div className="space-y-2 border-t pt-4">
                <h4 className="text-sm font-medium">Link Existing Company</h4>
                <div className="space-y-2">
                  <Input
                    placeholder="Search companies..."
                    value={companySearch}
                    onChange={e => setCompanySearch(e.target.value)}
                    className="text-xs h-8"
                  />
                  {companySearch && (
                    <div className="border rounded-md divide-y max-h-32 overflow-y-auto">
                      {filteredAllCompanies.map(c => (
                        <div key={c.id} className="flex items-center justify-between p-2 hover:bg-muted cursor-pointer" onClick={() => onAddCompany?.(c.id)}>
                          <span className="text-xs">{c.name}</span>
                          <Plus className="h-3 w-3" />
                        </div>
                      ))}
                      {!filteredAllCompanies.length && <div className="p-2 text-xs text-muted-foreground">No matches found.</div>}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2 border-t pt-4">
                <h4 className="text-sm font-medium">Create & Link New Company</h4>
                <div className="flex gap-2">
                  <Input
                    placeholder="Company name..."
                    value={newCompanyName}
                    onChange={e => setNewCompanyName(e.target.value)}
                    className="text-xs h-8"
                  />
                  <Button size="sm" onClick={() => {
                    if (newCompanyName) {
                      onCreateCompany?.(newCompanyName);
                      setNewCompanyName("");
                    }
                  }}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="comms" className="mt-4 space-y-6 pb-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Linked Comms</h4>
                <div className="space-y-2">
                  {person?.comms.length ? person.comms.map(c => (
                    <div key={c.id} className="flex items-center justify-between p-2 border rounded-md bg-muted/30">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] h-5">{c.type}</Badge>
                        <span className="text-sm font-medium">{formatCommValue(c.type as CommType, c.value)}</span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onRemoveComm?.(c.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )) : (
                    <p className="text-xs text-muted-foreground italic">No comms linked.</p>
                  )}
                </div>
              </div>

              <div className="space-y-2 border-t pt-4">
                <h4 className="text-sm font-medium">Add New Communication</h4>
                <div className="space-y-2">
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <select
                        className="flex h-8 w-32 rounded-md border border-input bg-transparent px-2 py-1 text-[10px] shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={newCommType}
                        onChange={e => {
                          setNewCommType(e.target.value);
                          setNewCommValue("");
                          setNewCommExtra("");
                        }}
                      >
                        <option value="email">Email</option>
                        <option value="phone">Phone</option>
                        <option value="linkedin">LinkedIn</option>
                        <option value="slack">Slack</option>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="other">Other</option>
                      </select>

                      {newCommType === "slack" && (
                        <Input
                          placeholder="Workspace..."
                          value={newCommExtra}
                          onChange={e => setNewCommExtra(e.target.value)}
                          className="text-xs h-8 flex-1"
                        />
                      )}

                      {newCommType === "other" && (
                        <Input
                          placeholder="Label..."
                          value={newCommExtra}
                          onChange={e => setNewCommExtra(e.target.value)}
                          className="text-xs h-8 flex-1"
                        />
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Input
                        placeholder={
                          newCommType === "email" ? "Email address..." :
                            newCommType === "phone" ? "Phone number..." :
                              newCommType === "linkedin" ? "LinkedIn URL..." :
                                newCommType === "slack" ? "Handle..." :
                                  newCommType === "whatsapp" ? "WhatsApp number..." :
                                    "Value..."
                        }
                        value={newCommValue}
                        onChange={e => setNewCommValue(e.target.value)}
                        className="text-xs h-8 flex-1"
                      />
                      <Button size="sm" onClick={() => {
                        if (newCommValue) {
                          let value: any;
                          if (newCommType === "email") value = { address: newCommValue };
                          else if (newCommType === "phone" || newCommType === "whatsapp") value = { number: newCommValue };
                          else if (newCommType === "linkedin") value = { url: newCommValue };
                          else if (newCommType === "slack") value = { handle: newCommValue, workspace: newCommExtra };
                          else if (newCommType === "other") value = { label: newCommExtra, value: newCommValue };

                          onAddComm?.(newCommType, value);
                          setNewCommValue("");
                          setNewCommExtra("");
                        }
                      }}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="p-6 pt-2 border-t flex-row gap-2 justify-between items-center">
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
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

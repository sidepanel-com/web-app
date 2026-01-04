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
import { Company, Person, Comm } from "@db/product/types";
import { Trash2, Plus, X, User } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui-primitives/ui/tabs";
import { Badge } from "@/ui-primitives/ui/badge";
import { ScrollArea } from "@/ui-primitives/ui/scroll-area";
import { usePeople } from "@/spaces/product/hooks/use-people";

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
  company: (Company & { people: Person[]; comms: Comm[] }) | null;
  onSubmit: (data: CompanyFormValues) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onAddPerson?: (personId: string) => Promise<void>;
  onCreatePerson?: (firstName: string, lastName: string) => Promise<void>;
  onRemovePerson?: (personId: string) => Promise<void>;
  onAddComm?: (type: string, value: any) => Promise<void>;
  onRemoveComm?: (commId: string) => Promise<void>;
}

export function CompanyFormDialog({
  open,
  onOpenChange,
  company,
  onSubmit,
  onDelete,
  onAddPerson,
  onCreatePerson,
  onRemovePerson,
  onAddComm,
  onRemoveComm,
}: CompanyFormDialogProps) {
  const [activeTab, setActiveTab] = useState("details");
  const { people: allPeople } = usePeople();
  const [personSearch, setPersonSearch] = useState("");
  const [newPersonFirst, setNewPersonFirst] = useState("");
  const [newPersonLast, setNewPersonLast] = useState("");
  const [newCommType, setNewCommType] = useState<string>("email");
  const [newCommValue, setNewCommValue] = useState("");

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
      setActiveTab("details");
    }
  }, [company, form]);

  const handleSubmit = async (values: CompanyFormValues) => {
    await onSubmit(values);
    if (!company) onOpenChange(false);
  };

  const handleDelete = async () => {
    if (company?.id && onDelete) {
      await onDelete(company.id);
      onOpenChange(false);
    }
  };

  const filteredAllPeople = allPeople.filter(p => 
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(personSearch.toLowerCase()) &&
    !company?.people.some(cp => cp.id === p.id)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] h-[600px] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>{company ? "Edit Company" : "Add New Company"}</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-6 grid grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="people" disabled={!company}>People</TabsTrigger>
            <TabsTrigger value="comms" disabled={!company}>Comms</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 px-6">
            <TabsContent value="details" className="mt-4 pb-4">
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
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="submit">
                      {company ? "Save Changes" : "Create Company"}
                    </Button>
                  </div>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="people" className="mt-4 space-y-6 pb-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Associated People</h4>
                <div className="space-y-2">
                  {company?.people.length ? company.people.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-2 border rounded-md bg-muted/30">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{p.firstName} {p.lastName}</span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onRemovePerson?.(p.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )) : (
                    <p className="text-xs text-muted-foreground italic">No people associated.</p>
                  )}
                </div>
              </div>

              <div className="space-y-2 border-t pt-4">
                <h4 className="text-sm font-medium">Link Existing Person</h4>
                <div className="space-y-2">
                  <Input 
                    placeholder="Search people..." 
                    value={personSearch} 
                    onChange={e => setPersonSearch(e.target.value)} 
                    className="text-xs h-8"
                  />
                  {personSearch && (
                    <div className="border rounded-md divide-y max-h-32 overflow-y-auto">
                      {filteredAllPeople.map(p => (
                        <div key={p.id} className="flex items-center justify-between p-2 hover:bg-muted cursor-pointer" onClick={() => onAddPerson?.(p.id)}>
                          <span className="text-xs">{p.firstName} {p.lastName}</span>
                          <Plus className="h-3 w-3" />
                        </div>
                      ))}
                      {!filteredAllPeople.length && <div className="p-2 text-xs text-muted-foreground">No matches found.</div>}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2 border-t pt-4">
                <h4 className="text-sm font-medium">Create & Link New Person</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Input 
                    placeholder="First name..." 
                    value={newPersonFirst} 
                    onChange={e => setNewPersonFirst(e.target.value)}
                    className="text-xs h-8"
                  />
                  <Input 
                    placeholder="Last name..." 
                    value={newPersonLast} 
                    onChange={e => setNewPersonLast(e.target.value)}
                    className="text-xs h-8"
                  />
                </div>
                <Button size="sm" className="w-full mt-2" onClick={() => {
                  if (newPersonFirst && newPersonLast) {
                    onCreatePerson?.(newPersonFirst, newPersonLast);
                    setNewPersonFirst("");
                    setNewPersonLast("");
                  }
                }}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add New Person
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="comms" className="mt-4 space-y-6 pb-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Linked Comms</h4>
                <div className="space-y-2">
                  {company?.comms.length ? company.comms.map(c => (
                    <div key={c.id} className="flex items-center justify-between p-2 border rounded-md bg-muted/30">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <Badge variant="outline" className="text-[10px] h-5 capitalize">{c.type}</Badge>
                        <span className="text-sm font-medium truncate">
                          {typeof c.value === 'string' ? c.value : 
                           typeof c.value === 'object' && c.value !== null ? 
                           (c.value as any).email || (c.value as any).number || JSON.stringify(c.value) : 
                           JSON.stringify(c.value)}
                        </span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => onRemoveComm?.(c.id)}>
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
                  <div className="flex gap-2">
                    <select 
                      className="flex h-8 w-24 rounded-md border border-input bg-transparent px-2 py-1 text-[10px] shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      value={newCommType}
                      onChange={e => setNewCommType(e.target.value)}
                    >
                      <option value="email">Email</option>
                      <option value="phone">Phone</option>
                      <option value="linkedin">LinkedIn</option>
                      <option value="slack">Slack</option>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="other">Other</option>
                    </select>
                    <Input 
                      placeholder={newCommType === 'email' ? "email@example.com" : "Value..."}
                      value={newCommValue} 
                      onChange={e => setNewCommValue(e.target.value)}
                      className="text-xs h-8 flex-1"
                    />
                    <Button size="sm" onClick={() => {
                      if (newCommValue) {
                        const value = newCommType === 'email' ? { email: newCommValue } : 
                                      newCommType === 'phone' ? { number: newCommValue } : 
                                      newCommValue;
                        onAddComm?.(newCommType, value);
                        setNewCommValue("");
                      }
                    }}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="p-6 pt-2 border-t flex-row gap-2 justify-between items-center">
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

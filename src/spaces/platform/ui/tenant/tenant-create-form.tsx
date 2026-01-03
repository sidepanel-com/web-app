"use client";

import { z } from "zod";
import { Button } from "@/ui-primitives/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui-primitives/ui/card";
import {
  Form,
  FormField,
  FormItem,
  FormMessage,
} from "@/ui-primitives/ui/form";
import { Input } from "@/ui-primitives/ui/input";
import { Label } from "@/ui-primitives/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription, AlertTitle } from "@/ui-primitives/ui/alert";
import { usePlatformUser } from "@/spaces/platform/contexts/platform-user.context";
import { cn } from "@/ui-primitives/utils";

const createTenantSchema = z.object({
  name: z
    .string()
    .min(1, "Tenant name is required")
    .max(100, "Tenant name must be less than 100 characters")
    .trim(),
});

type CreateTenantFormData = z.infer<typeof createTenantSchema>;

export function TenantCreateForm({ onCancel }: { onCancel?: () => void }) {
  const { createTenant, isLoading, createTenantError } = usePlatformUser();

  const form = useForm<CreateTenantFormData>({
    resolver: zodResolver(createTenantSchema),
    defaultValues: {
      name: "",
    },
  });

  async function onSubmit(data: CreateTenantFormData) {
    try {
      await createTenant(data.name, true);
    } catch (error) {
      console.error(error);
    }
  }

  const formLoading = form.formState.isSubmitting || isLoading;

  return (
    <Card className="w-full mx-auto ">
      <CardHeader>
        <CardTitle>Create a new tenant</CardTitle>
        <CardDescription>
          Enter a name for your tenant below to create a new tenant
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit, (errors) => {
              console.log(errors);
            })}
            className="space-y-4"
          >
            {createTenantError && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{createTenantError.message}</AlertDescription>
              </Alert>
            )}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="grid gap-2">
                  <Label htmlFor="tenantName">Tenant Name</Label>
                  <Input
                    id="tenantName"
                    type="text"
                    {...field}
                    placeholder="My tenant"
                    disabled={formLoading}
                    className={cn(
                      form.formState.errors.name &&
                        "border-destructive focus-visible:ring-destructive",
                    )}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center gap-2">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  className=""
                  onClick={onCancel}
                >
                  Cancel
                </Button>
              )}
              <Button type="submit" className="flex-1" disabled={formLoading}>
                Create
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

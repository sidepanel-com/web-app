"use client";

import { useEffect } from "react";
import { Trash2, AlertTriangle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/ui-primitives/ui/button";
import { Input } from "@/ui-primitives/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui-primitives/ui/card";
import { Separator } from "@/ui-primitives/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/ui-primitives/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/ui-primitives/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/ui-primitives/ui/alert";
import { usePlatformTenant } from "@/spaces/platform/contexts/platform-tenant.context";
import { usePlatformUser } from "@/spaces/platform/contexts/platform-user.context";

// Form schemas
const tenantNameSchema = z.object({
  name: z
    .string()
    .min(1, "Tenant name is required")
    .max(100, "Tenant name must be less than 100 characters")
    .trim(),
});

const deleteTenantSchema = z.object({
  confirmationText: z
    .string()
    .min(1, "Please type DELETE to confirm")
    .refine((val) => val === "DELETE", {
      message: "Please type DELETE to confirm",
    }),
});

type TenantNameFormValues = z.infer<typeof tenantNameSchema>;
type DeleteTenantFormValues = {
  confirmationText: string;
};

export default function TenantSettingsGeneral() {
  const { loadAvailableTenants } = usePlatformUser();
  const { tenant } = usePlatformTenant();

  // Tenant name form
  const tenantNameForm = useForm<TenantNameFormValues>({
    resolver: zodResolver(tenantNameSchema),
    defaultValues: {
      name: tenant?.name || "",
    },
  });

  // Delete tenant form
  const deleteTenantForm = useForm<DeleteTenantFormValues>({
    resolver: zodResolver(deleteTenantSchema),
    defaultValues: {
      confirmationText: "",
    },
  });

  // Update form when tenant data changes
  useEffect(() => {
    if (tenant?.name) {
      tenantNameForm.reset({ name: tenant.name });
    }
  }, [tenant, tenantNameForm]);

  const handleSaveName = async (values: TenantNameFormValues) => {
    try {
      tenantNameForm.clearErrors();
      // Todo: Update tenant name
      await loadAvailableTenants();
      // Optionally show success message or handle success state
    } catch (error) {
      tenantNameForm.setError("root", {
        type: "manual",
        message:
          error instanceof Error
            ? error.message
            : "Failed to update tenant name",
      });
    }
  };

  const handleDeleteTenant = async (values: DeleteTenantFormValues) => {
    try {
      deleteTenantForm.clearErrors();
      // Todo: Delete tenant
      deleteTenantForm.reset();
      await loadAvailableTenants();
    } catch (error) {
      deleteTenantForm.setError("root", {
        type: "manual",
        message:
          error instanceof Error ? error.message : "Failed to delete tenant",
      });
    }
  };

  const { isSubmitting: isUpdatingName } = tenantNameForm.formState;
  const { isSubmitting: isDeletingTenant } = deleteTenantForm.formState;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">General Settings</h1>
        <p className="text-muted-foreground">
          Manage your tenant&apos;s basic information and settings.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tenant Information</CardTitle>
          <CardDescription>
            Update your tenant&apos;s display name and basic information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...tenantNameForm}>
            <form
              onSubmit={tenantNameForm.handleSubmit(handleSaveName)}
              className="space-y-4"
            >
              {tenantNameForm.formState.errors.root && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    {tenantNameForm.formState.errors.root.message}
                  </AlertDescription>
                </Alert>
              )}

              <FormField
                control={tenantNameForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tenant Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter tenant name"
                        disabled={isUpdatingName}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isUpdatingName}>
                {isUpdatingName ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Separator />

      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible and destructive actions for this tenant.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="destructive" className="flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                Delete Tenant
              </Button>
            </DialogTrigger>
            <DialogContent>
              <Form {...deleteTenantForm}>
                <form
                  onSubmit={deleteTenantForm.handleSubmit(handleDeleteTenant)}
                >
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                      <AlertTriangle className="h-5 w-5" />
                      Delete Tenant
                    </DialogTitle>
                    <DialogDescription className="space-y-3">
                      <p>
                        This action cannot be undone. This will permanently
                        delete the tenant and remove all associated data from
                        our servers.
                      </p>
                    </DialogDescription>
                  </DialogHeader>

                  {deleteTenantForm.formState.errors.root && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>
                        {deleteTenantForm.formState.errors.root.message}
                      </AlertDescription>
                    </Alert>
                  )}

                  <FormField
                    control={deleteTenantForm.control}
                    name="confirmationText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Please type{" "}
                          <span className="font-mono bg-muted px-1 rounded">
                            DELETE
                          </span>{" "}
                          to confirm.
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Type DELETE to confirm"
                            disabled={isDeletingTenant}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter className="mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => deleteTenantForm.reset()}
                      disabled={isDeletingTenant}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="destructive"
                      disabled={isDeletingTenant}
                    >
                      {isDeletingTenant ? "Deleting..." : "Delete Tenant"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}

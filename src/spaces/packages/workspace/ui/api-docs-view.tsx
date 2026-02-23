"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui-primitives/ui/card";
import { Badge } from "@/ui-primitives/ui/badge";
import { ScrollArea } from "@/ui-primitives/ui/scroll-area";
import { Skeleton } from "@/ui-primitives/ui/skeleton";
import { Shield, Server } from "lucide-react";

type PathItem = {
  summary?: string;
  operationId?: string;
  tags?: string[];
  "x-scope"?: string;
};

type OpenAPISpec = {
  info?: { title?: string; description?: string; version?: string };
  servers?: Array<{ url?: string; description?: string }>;
  tags?: Array<{ name?: string; description?: string }>;
  paths?: Record<string, Record<string, PathItem>>;
};

const METHOD_COLORS: Record<string, string> = {
  get: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  post: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
  patch: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  put: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  delete: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
};

function MethodBadge({ method }: { method: string }) {
  const color =
    METHOD_COLORS[method.toLowerCase()] ??
    "bg-muted text-muted-foreground border-border";
  return (
    <Badge
      variant="outline"
      className={`font-mono text-xs font-semibold uppercase ${color}`}
    >
      {method}
    </Badge>
  );
}

export function ApiDocsView() {
  const [spec, setSpec] = useState<OpenAPISpec | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/docs/spec.json")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load spec");
        return r.json();
      })
      .then(setSpec)
      .catch(() => setError("Could not load API documentation."));
  }, []);

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="pt-6">
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!spec) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  const baseUrl = spec.servers?.[0]?.url ?? "/api/v1";
  const description = spec.info?.description?.trim() ?? "";
  const paths = spec.paths ?? {};
  const tags = spec.tags ?? [];

  // Build list of endpoints grouped by tag
  const endpointsByTag: Record<string, Array<{ method: string; path: string; summary?: string; scope?: string }>> = {};
  for (const [path, methods] of Object.entries(paths)) {
    if (typeof methods !== "object" || methods === null) continue;
    for (const [method, op] of Object.entries(methods)) {
      if (method.startsWith("x-") || typeof op !== "object" || op === null)
        continue;
      const summary = "summary" in op ? String(op.summary) : undefined;
      const scope = op["x-scope"];
      const tagList = Array.isArray(op.tags) ? op.tags : ["Other"];
      for (const tag of tagList) {
        if (!endpointsByTag[tag]) endpointsByTag[tag] = [];
        endpointsByTag[tag].push({
          method: method.toUpperCase(),
          path,
          summary,
          scope,
        });
      }
    }
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-8 pr-4">
        {/* Hero */}
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6 dark:bg-emerald-950/20">
          <h2 className="text-lg font-semibold text-emerald-800 dark:text-emerald-200">
            {spec.info?.title ?? "API"}
          </h2>
          {spec.info?.version && (
            <Badge variant="secondary" className="mt-1 font-mono text-xs">
              v{spec.info.version}
            </Badge>
          )}
          {description && (
            <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
              {description}
            </p>
          )}
          <div className="mt-4 flex items-center gap-2 text-sm">
            <Server className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <code className="rounded bg-muted px-2 py-1 font-mono text-xs">
              {baseUrl}
            </code>
          </div>
        </div>

        {/* Auth */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Authentication
            </CardTitle>
            <CardDescription>
              Use a session cookie (browser) or an API key for programmatic access.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <strong>Tenant:</strong> Send{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                X-Tenant-Slug
              </code>{" "}
              header or <code className="rounded bg-muted px-1.5 py-0.5 text-xs">tenantSlug</code> query
              param on every request.
            </p>
            <p>
              <strong>API key:</strong>{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                X-Api-Key
              </code>{" "}
              or <code className="rounded bg-muted px-1.5 py-0.5 text-xs">Authorization: Bearer &lt;key&gt;</code>.
            </p>
          </CardContent>
        </Card>

        {/* Endpoints by tag */}
        {tags.length > 0
          ? tags.map((tag) => {
              const name = tag.name ?? "Other";
              const endpoints = endpointsByTag[name] ?? [];
              if (endpoints.length === 0) return null;
              return (
                <Card key={name}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{name}</CardTitle>
                    {tag.description && (
                      <CardDescription>{tag.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {endpoints.map((ep, i) => (
                      <div
                        key={`${ep.method}-${ep.path}-${i}`}
                        className="flex flex-wrap items-start gap-2 rounded-lg border bg-muted/30 p-3"
                      >
                        <MethodBadge method={ep.method} />
                        <code className="break-all font-mono text-sm">
                          {baseUrl}
                          {ep.path}
                        </code>
                        {ep.summary && (
                          <span className="w-full text-sm text-muted-foreground sm:w-auto">
                            — {ep.summary}
                          </span>
                        )}
                        {ep.scope && (
                          <Badge variant="outline" className="text-xs font-normal">
                            {ep.scope}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })
          : Object.entries(endpointsByTag).map(([name, endpoints]) => (
              <Card key={name}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {endpoints.map((ep, i) => (
                    <div
                      key={`${ep.method}-${ep.path}-${i}`}
                      className="flex flex-wrap items-start gap-2 rounded-lg border bg-muted/30 p-3"
                    >
                      <MethodBadge method={ep.method} />
                      <code className="break-all font-mono text-sm">
                        {baseUrl}
                        {ep.path}
                      </code>
                      {ep.summary && (
                        <span className="w-full text-sm text-muted-foreground sm:w-auto">
                          — {ep.summary}
                        </span>
                      )}
                      {ep.scope && (
                        <Badge variant="outline" className="text-xs font-normal">
                          {ep.scope}
                        </Badge>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
      </div>
    </ScrollArea>
  );
}

/**
 * Admin UI — Odoo Category Sync
 * Route: /app/odoo-categories
 *
 * Shows:
 * - Last sync time
 * - Current category count (total / root / children)
 * - "Sync Now" button to trigger immediate sync from Odoo
 * - Result message after sync
 */

import { useState, useEffect } from "react"
import { Button, Heading, Text } from "@medusajs/ui"
import { ArrowPathMini, CheckCircle, ExclamationCircle } from "@medusajs/icons"

const API_BASE = "/admin/odoo/sync-categories"

interface SyncStatus {
  last_sync: string | null
  next_auto_sync: string
  categories: {
    total: number
    root: number
    children: number
  }
}

interface SyncResult {
  success: boolean
  message?: string
  error?: string
  total_odoo_categories?: number
  created?: number
  updated?: number
  errors?: number
  error_details?: string[]
  elapsed_ms?: number
}

export default function OdooCategoriesSyncPage() {
  const [status, setStatus] = useState<SyncStatus | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [result, setResult] = useState<SyncResult | null>(null)
  const [loadingStatus, setLoadingStatus] = useState(true)

  const fetchStatus = async () => {
    setLoadingStatus(true)
    try {
      const res = await fetch(API_BASE, {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      })
      const data = await res.json()
      if (data.success) setStatus(data)
    } catch (e) {
      // ignore
    } finally {
      setLoadingStatus(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  const handleSync = async () => {
    setSyncing(true)
    setResult(null)
    try {
      const res = await fetch(API_BASE, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      })
      const data = await res.json()
      setResult(data)
      // Refresh status after sync
      if (data.success) {
        await fetchStatus()
      }
    } catch (e: any) {
      setResult({ success: false, error: e.message })
    } finally {
      setSyncing(false)
    }
  }

  const formatDate = (iso: string | null) => {
    if (!iso) return "Never synced"
    return new Date(iso).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    })
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Heading level="h1">Odoo Category Sync</Heading>
          <Text className="text-ui-fg-subtle mt-1">
            Categories sync instantly via webhook + every 5 min backup. Click Sync Now for immediate full sync.
          </Text>
        </div>
        <Button
          variant="primary"
          size="base"
          isLoading={syncing}
          onClick={handleSync}
          disabled={syncing}
        >
          <ArrowPathMini className="mr-2" />
          {syncing ? "Syncing..." : "Sync Now"}
        </Button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Last Sync */}
        <div className="rounded-lg border border-ui-border-base bg-ui-bg-base p-4">
          <Text className="text-xs font-medium text-ui-fg-subtle uppercase tracking-wider">
            Last Sync
          </Text>
          <Text className="mt-1 text-lg font-semibold text-ui-fg-base">
            {loadingStatus ? "..." : formatDate(status?.last_sync || null)}
          </Text>
        </div>

        {/* Auto Sync */}
        <div className="rounded-lg border border-ui-border-base bg-ui-bg-base p-4">
          <Text className="text-xs font-medium text-ui-fg-subtle uppercase tracking-wider">
            Sync Method
          </Text>
          <Text className="mt-1 text-lg font-semibold text-ui-fg-base">
            ⚡ Instant Webhook + 5min Backup
          </Text>
        </div>

        {/* Category Count */}
        <div className="rounded-lg border border-ui-border-base bg-ui-bg-base p-4">
          <Text className="text-xs font-medium text-ui-fg-subtle uppercase tracking-wider">
            Categories in Medusa
          </Text>
          {loadingStatus ? (
            <Text className="mt-1 text-lg font-semibold">...</Text>
          ) : (
            <div className="mt-1 flex gap-3">
              <div>
                <Text className="text-2xl font-bold text-ui-fg-base">{status?.categories.total ?? "—"}</Text>
                <Text className="text-xs text-ui-fg-subtle">Total</Text>
              </div>
              <div className="border-l border-ui-border-base pl-3">
                <Text className="text-xl font-semibold text-ui-fg-base">{status?.categories.root ?? "—"}</Text>
                <Text className="text-xs text-ui-fg-subtle">Parents</Text>
              </div>
              <div className="border-l border-ui-border-base pl-3">
                <Text className="text-xl font-semibold text-ui-fg-base">{status?.categories.children ?? "—"}</Text>
                <Text className="text-xs text-ui-fg-subtle">Subcategories</Text>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sync Result */}
      {result && (
        <div
          className={`rounded-lg border p-4 ${
            result.success
              ? "border-ui-tag-green-border bg-ui-tag-green-bg"
              : "border-ui-tag-red-border bg-ui-tag-red-bg"
          }`}
        >
          <div className="flex items-start gap-2">
            {result.success ? (
              <CheckCircle className="mt-0.5 text-ui-tag-green-icon" />
            ) : (
              <ExclamationCircle className="mt-0.5 text-ui-tag-red-icon" />
            )}
            <div>
              <Text className="font-semibold">
                {result.success ? "Sync Successful" : "Sync Failed"}
              </Text>
              <Text className="text-sm mt-1">
                {result.message || result.error}
              </Text>
              {result.success && (
                <div className="mt-2 flex gap-4 text-sm">
                  <span>
                    <strong>{result.total_odoo_categories}</strong> from Odoo
                  </span>
                  <span className="text-ui-tag-green-icon">
                    <strong>+{result.created}</strong> created
                  </span>
                  <span>
                    <strong>{result.updated}</strong> updated
                  </span>
                  {(result.errors || 0) > 0 && (
                    <span className="text-ui-tag-red-icon">
                      <strong>{result.errors}</strong> errors
                    </span>
                  )}
                  <span className="text-ui-fg-subtle">
                    {result.elapsed_ms}ms
                  </span>
                </div>
              )}
              {result.error_details && result.error_details.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm text-ui-fg-subtle">
                    Show error details ({result.error_details.length})
                  </summary>
                  <ul className="mt-1 list-disc pl-4 text-xs text-ui-fg-subtle">
                    {result.error_details.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="rounded-lg border border-ui-border-base bg-ui-bg-subtle p-4">
        <Heading level="h3" className="mb-2">How it works</Heading>
        <ul className="list-disc pl-5 space-y-1 text-sm text-ui-fg-subtle">
          <li>
            <strong>⚡ Instant Webhook:</strong> When Odoo developer creates/updates a category, Odoo fires a webhook to <code>POST /odoo/webhooks/categories</code> and it syncs in 1-2 seconds.
          </li>
          <li>
            <strong>🔄 Backup Cron:</strong> Every 5 minutes, a scheduled job pulls ALL categories from Odoo as a safety net — catches anything the webhook missed.
          </li>
          <li>
            <strong>Manual:</strong> Click <em>Sync Now</em> above to trigger an immediate full sync.
          </li>
          <li>
            <strong>Parent–child:</strong> Parent categories are created first, then subcategories are linked automatically.
          </li>
          <li>
            <strong>Images:</strong> Category images from Odoo are saved to <code>/static/uploads/categories/</code>.
          </li>
          <li>
            <strong>No data loss:</strong> Existing categories are <em>updated</em> (not deleted). Only new categories are created.
          </li>
        </ul>
        <div className="mt-3 p-3 bg-ui-bg-base rounded border border-ui-border-base">
          <Text className="text-xs font-mono text-ui-fg-subtle">
            <strong>Webhook URL for Odoo:</strong> https://your-domain.com/odoo/webhooks/categories<br/>
            <strong>Secret:</strong> Set <code>ODOO_WEBHOOK_SECRET</code> in .env (default: marqa-odoo-webhook-2026)
          </Text>
        </div>
      </div>
    </div>
  )
}

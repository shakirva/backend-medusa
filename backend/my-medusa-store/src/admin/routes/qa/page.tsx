import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ChatBubble, Check, Trash, XMark } from "@medusajs/icons"
import { Badge, Button, Container, Heading, Input, Text } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { sdk } from "../../lib/sdk"

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type QAItem = {
  id: string
  product_id: string
  customer_name: string
  question: string
  answer: string | null
  answered_by: string | null
  answered_at: string | null
  status: "pending" | "approved" | "answered"
  created_at: string
}

type QAResponse = {
  questions: QAItem[]
  total: number
  pending_count: number
  page: number
  limit: number
  has_more: boolean
}

// ─────────────────────────────────────────────
// Answer Modal
// ─────────────────────────────────────────────
const AnswerModal = ({
  item,
  onClose,
}: {
  item: QAItem
  onClose: () => void
}) => {
  const queryClient = useQueryClient()
  const [answer, setAnswer] = useState(item.answer || "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = async () => {
    if (!answer.trim()) return
    setSaving(true)
    setError(null)
    try {
      const res = await sdk.client.fetch("/admin/qa", {
        method: "PATCH",
        body: { id: item.id, answer: answer.trim(), answered_by: "Admin" },
      })
      if (!(res as any).success) throw new Error("Save failed")
      await queryClient.invalidateQueries({ queryKey: ["admin-qa"] })
      onClose()
    } catch (err: any) {
      setError(err.message || "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-ui-bg-base rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-ui-border-base">
          <Heading level="h2">Answer Question</Heading>
          <button
            onClick={onClose}
            className="p-1 hover:bg-ui-bg-subtle rounded-full transition-colors"
          >
            <XMark className="w-5 h-5 text-ui-fg-subtle" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="p-4 bg-ui-bg-subtle rounded-lg border border-ui-border-base">
            <Text size="xsmall" weight="plus" className="text-ui-fg-subtle uppercase tracking-wide mb-1">
              Question from {item.customer_name}
            </Text>
            <Text className="text-ui-fg-base mt-1">{item.question}</Text>
          </div>

          <div>
            <label className="block text-sm font-medium text-ui-fg-base mb-1">
              Your Answer *
            </label>
            <textarea
              rows={5}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your answer here..."
              className="w-full border border-ui-border-base rounded-lg px-4 py-2 text-sm text-ui-fg-base bg-ui-bg-field focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {error && (
            <Text className="text-ui-fg-error text-sm">{error}</Text>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-ui-border-base bg-ui-bg-subtle">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={save}
            disabled={!answer.trim() || saving}
          >
            {saving ? "Saving..." : "Post Answer"}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
const QAPage = () => {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [page, setPage] = useState(1)
  const [answerItem, setAnswerItem] = useState<QAItem | null>(null)
  const [productSearch, setProductSearch] = useState("")

  const { data, isLoading, error } = useQuery<QAResponse>({
    queryKey: ["admin-qa", statusFilter, page, productSearch],
    queryFn: () => {
      const params = new URLSearchParams()
      if (statusFilter !== "all") params.set("status", statusFilter)
      if (productSearch) params.set("product_id", productSearch)
      params.set("page", String(page))
      params.set("limit", "20")
      return sdk.client.fetch(`/admin/qa?${params.toString()}`, { method: "GET" })
    },
    refetchInterval: 30_000, // auto-refresh every 30s
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      sdk.client.fetch("/admin/qa", {
        method: "DELETE",
        body: { id },
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-qa"] }),
  })

  const approveMutation = useMutation({
    mutationFn: (id: string) =>
      sdk.client.fetch("/admin/qa", {
        method: "PATCH",
        body: { id, status: "approved" },
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-qa"] }),
  })

  const pendingCount = data?.pending_count || 0

  return (
    <>
      {answerItem && (
        <AnswerModal item={answerItem} onClose={() => setAnswerItem(null)} />
      )}

      <div className="flex flex-col gap-y-4 p-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Heading level="h1">Product Q&A</Heading>
            {pendingCount > 0 && (
              <Badge color="orange">{pendingCount} pending</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Filter by product ID..."
              value={productSearch}
              onChange={(e) => {
                setProductSearch(e.target.value)
                setPage(1)
              }}
              className="w-56"
              size="small"
            />
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex gap-2 border-b border-gray-200 pb-1">
          {(["all", "pending", "approved", "answered"] as const).map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1) }}
              className={`px-4 py-1.5 rounded-t text-sm font-medium capitalize transition-colors ${
                statusFilter === s
                  ? "bg-white border border-b-white border-gray-200 text-blue-600 -mb-px"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {s === "all" ? "All Questions" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* Table */}
        <Container className="overflow-hidden p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <Text className="text-ui-fg-subtle">Loading questions...</Text>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <Text className="text-ui-fg-error">Failed to load questions</Text>
            </div>
          ) : !data?.questions.length ? (
            <div className="p-12 flex flex-col items-center text-center gap-3">
              <ChatBubble className="w-12 h-12 text-ui-fg-muted" />
              <Text className="text-ui-fg-subtle">No questions yet</Text>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ui-border-base bg-ui-bg-subtle text-left">
                  <th className="px-4 py-3 font-semibold text-ui-fg-base w-1/3">Question</th>
                  <th className="px-4 py-3 font-semibold text-ui-fg-base w-1/6">Customer</th>
                  <th className="px-4 py-3 font-semibold text-ui-fg-base w-1/4">Answer</th>
                  <th className="px-4 py-3 font-semibold text-ui-fg-base w-28">Status</th>
                  <th className="px-4 py-3 font-semibold text-ui-fg-base w-32">Date</th>
                  <th className="px-4 py-3 font-semibold text-ui-fg-base w-36">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.questions.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-ui-border-base hover:bg-ui-bg-subtle transition-colors"
                  >
                    <td className="px-4 py-3 align-top">
                      <Text className="text-ui-fg-base font-medium line-clamp-2">
                        {item.question}
                      </Text>
                      <Text size="xsmall" className="text-ui-fg-muted mt-0.5 font-mono truncate">
                        {item.product_id}
                      </Text>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <Text className="text-ui-fg-base">{item.customer_name || "Anonymous"}</Text>
                    </td>
                    <td className="px-4 py-3 align-top">
                      {item.answer ? (
                        <Text className="text-ui-fg-base line-clamp-3">{item.answer}</Text>
                      ) : (
                        <Text className="text-ui-fg-muted italic">No answer yet</Text>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <Badge
                        color={
                          item.status === "answered"
                            ? "green"
                            : item.status === "approved"
                            ? "blue"
                            : "orange"
                        }
                      >
                        {item.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <Text size="xsmall" className="text-ui-fg-subtle">
                        {new Date(item.created_at).toLocaleDateString()}
                      </Text>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center gap-2">
                        {/* Answer / Edit */}
                        <button
                          onClick={() => setAnswerItem(item)}
                          title={item.answer ? "Edit Answer" : "Answer"}
                          className="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors"
                        >
                          <ChatBubble className="w-4 h-4" />
                        </button>

                        {/* Approve (for pending) */}
                        {item.status === "pending" && (
                          <button
                            onClick={() => approveMutation.mutate(item.id)}
                            title="Approve"
                            className="p-1.5 rounded hover:bg-green-50 text-green-600 transition-colors"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}

                        {/* Delete */}
                        <button
                          onClick={() => {
                            if (confirm("Delete this question?")) {
                              deleteMutation.mutate(item.id)
                            }
                          }}
                          title="Delete"
                          className="p-1.5 rounded hover:bg-red-50 text-red-500 transition-colors"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Container>

        {/* Pagination */}
        {data && data.total > 20 && (
          <div className="flex items-center justify-between">
            <Text size="small" className="text-ui-fg-subtle">
              Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, data.total)} of {data.total}
            </Text>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="small"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="small"
                disabled={!data.has_more}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

// Register as a custom admin route with sidebar navigation
export const config = defineRouteConfig({
  label: "Q&A",
  icon: ChatBubble,
})

export default QAPage

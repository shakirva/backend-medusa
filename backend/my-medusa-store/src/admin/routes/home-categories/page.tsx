import { defineRouteConfig } from "@medusajs/admin-sdk"
import { TagSolid } from "@medusajs/icons"
import { Button, Container, Heading, Input, Switch } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { sdk } from "../../lib/sdk"

type HomeCategory = {
  id: string
  name: string
  handle?: string | null
  home_enabled: boolean
  home_order: number | null
  discount: number | null
}

type HomeCategoriesResponse = {
  categories: HomeCategory[]
  count: number
}

const HomeCategoriesPage = () => {
  const { data, isLoading, refetch } = useQuery<HomeCategoriesResponse>({
    queryKey: [["admin-home-categories"]],
    queryFn: () => sdk.client.fetch("/admin/home-categories"),
  })

  const [savingId, setSavingId] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<string, Partial<HomeCategory>>>({})

  const categories = useMemo(() => data?.categories || [], [data?.categories])

  const setDraft = (id: string, patch: Partial<HomeCategory>) => {
    setDrafts((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), ...patch } }))
  }

  const getValue = (row: HomeCategory, key: keyof HomeCategory) => {
    const d = drafts[row.id]
    if (d && key in d) return d[key]
    return row[key]
  }

  const saveRow = async (row: HomeCategory) => {
    const d = drafts[row.id] || {}
    if (!Object.keys(d).length) return
    setSavingId(row.id)
    try {
      await sdk.client.fetch(`/admin/home-categories/${row.id}`, {
        method: "PATCH",
        body: {
          home_enabled: Boolean(getValue(row, "home_enabled")),
          home_order: Number(getValue(row, "home_order") || 0),
          discount: Number(getValue(row, "discount") || 0),
        },
      })
      setDrafts((prev) => {
        const next = { ...prev }
        delete next[row.id]
        return next
      })
      await refetch()
    } finally {
      setSavingId(null)
    }
  }

  return (
    <Container className="p-6">
      <div className="mb-6">
        <Heading level="h1">Home Categories</Heading>
        <p className="text-ui-fg-subtle mt-2 text-sm">
          Manage categories shown under hero banner and set OFF % discount value.
        </p>
      </div>

      {isLoading ? (
        <p className="text-ui-fg-subtle text-sm">Loading categories...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-2 text-left">Category</th>
                <th className="p-2 text-left">Handle</th>
                <th className="p-2 text-left">Show On Home</th>
                <th className="p-2 text-left">Order</th>
                <th className="p-2 text-left">Off %</th>
                <th className="p-2 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((row) => {
                const enabled = Boolean(getValue(row, "home_enabled"))
                const order = Number(getValue(row, "home_order") || 0)
                const discount = Number(getValue(row, "discount") || 0)
                return (
                  <tr key={row.id} className="border-b">
                    <td className="p-2 font-medium">{row.name}</td>
                    <td className="p-2 text-ui-fg-subtle">{row.handle || "-"}</td>
                    <td className="p-2">
                      <Switch
                        checked={enabled}
                        onCheckedChange={(checked) => setDraft(row.id, { home_enabled: checked })}
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        value={String(order)}
                        onChange={(e) => setDraft(row.id, { home_order: Number(e.target.value || 0) })}
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        min={0}
                        max={99}
                        value={String(discount)}
                        onChange={(e) => setDraft(row.id, { discount: Number(e.target.value || 0) })}
                      />
                    </td>
                    <td className="p-2">
                      <Button
                        size="small"
                        onClick={() => saveRow(row)}
                        isLoading={savingId === row.id}
                      >
                        Save
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Home Categories",
  icon: TagSolid,
})

export default HomeCategoriesPage

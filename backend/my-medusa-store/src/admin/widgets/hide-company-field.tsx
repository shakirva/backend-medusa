import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useEffect } from "react"

/**
 * Widget that hides the "Company" row from the customer detail page.
 * Medusa admin renders customer info as rows with labels.
 * We find the row that contains "Company" and hide it via DOM manipulation.
 */
const HideCompanyField = () => {
  useEffect(() => {
    const hideCompanyRow = () => {
      // Find all text elements that say "Company" in the customer detail section
      const allElements = document.querySelectorAll("dt, span, label, p, div")
      allElements.forEach((el) => {
        const text = el.textContent?.trim()
        if (text === "Company" || text === "Company name") {
          // Hide the parent row (usually a div or dd/dt pair)
          const row = el.closest("div.grid") || el.closest("div[class]") || el.parentElement
          if (row && row.parentElement) {
            ;(row as HTMLElement).style.display = "none"
          }
        }
      })
    }

    // Run immediately and also observe for dynamic content loading
    hideCompanyRow()

    const observer = new MutationObserver(() => {
      hideCompanyRow()
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    return () => observer.disconnect()
  }, [])

  return null
}

export const config = defineWidgetConfig({
  zone: "customer.details.before",
})

export default HideCompanyField

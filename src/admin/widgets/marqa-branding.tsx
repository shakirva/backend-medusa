import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container } from "@medusajs/ui"
import { useEffect } from "react"

// Import custom styles
import "../style.css"

const MarqaSouqBranding = () => {
  useEffect(() => {
    // Update page title
    if (!document.title.includes("Marqa Souq")) {
      document.title = document.title.replace("Medusa", "Marqa Souq")
    }
    
    // Add custom favicon
    let favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement
    if (!favicon) {
      favicon = document.createElement("link")
      favicon.rel = "icon"
      document.head.appendChild(favicon)
    }
    favicon.href = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23E63946'/%3E%3Cstop offset='100%25' style='stop-color:%23C62828'/%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle cx='50' cy='50' r='45' fill='url(%23grad)'/%3E%3Ctext x='50' y='62' font-family='Arial,sans-serif' font-size='36' font-weight='bold' fill='white' text-anchor='middle'%3EM%3C/text%3E%3C/svg%3E"
  }, [])

  return (
    <Container className="hidden">
      {/* Hidden container to load styles */}
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.before",
})

export default MarqaSouqBranding

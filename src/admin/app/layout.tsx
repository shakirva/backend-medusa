import "@medusajs/ui/styles.css"
import "./globals.css"
import { useEffect } from "react"

// Branding script that runs on every page
function useBranding() {
  useEffect(() => {
    const applyBranding = () => {
      const isLogin = window.location.pathname.includes('/login')
      
      // Always update title
      if (document.title.includes('Medusa')) {
        document.title = document.title.replace('Medusa', 'marqasouq')
      }
      if (!document.title.includes('marqasouq')) {
        document.title = 'marqasouq Admin'
      }
      
      // Update favicon
      let favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement
      if (favicon) {
        favicon.href = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23E63946'/%3E%3Cstop offset='100%25' style='stop-color:%23C62828'/%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle cx='50' cy='50' r='45' fill='url(%23grad)'/%3E%3Ctext x='50' y='65' font-family='Arial,sans-serif' font-size='40' font-weight='bold' fill='white' text-anchor='middle'%3Em%3C/text%3E%3C/svg%3E"
      }
      
      if (isLogin) {
        // Replace headings containing "Welcome" or "Medusa"
        document.querySelectorAll('h1, h2, [class*="Heading"]').forEach((h) => {
          const el = h as HTMLElement
          if (el.textContent && /Welcome|Medusa/i.test(el.textContent) && !el.dataset.branded) {
            el.dataset.branded = 'true'
            el.textContent = 'marqasouq'
            el.style.cssText = 'font-size:2rem;font-weight:800;background:linear-gradient(135deg,#E63946,#C62828);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:1px;'
          }
        })
        
        // Replace subtitle
        document.querySelectorAll('p').forEach((p) => {
          const el = p as HTMLElement
          if (el.textContent && /Sign in/i.test(el.textContent) && !el.dataset.branded) {
            el.dataset.branded = 'true'
            el.textContent = 'Your Premium Marketplace'
            el.style.color = '#94a3b8'
          }
        })
        
        // Replace SVG logo
        document.querySelectorAll('svg').forEach((svg) => {
          const parent = svg.parentElement
          if (parent && !svg.closest('button') && !svg.closest('input') && !parent.dataset.logoDone) {
            const rect = svg.getBoundingClientRect()
            if (rect.width >= 30 && rect.width <= 60) {
              parent.dataset.logoDone = 'true'
              svg.outerHTML = '<div style="width:64px;height:64px;background:linear-gradient(135deg,#E63946,#C62828);border-radius:16px;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(230,57,70,0.3);"><span style="color:white;font-size:2rem;font-weight:800;">m</span></div>'
            }
          }
        })
      }
    }
    
    // Run immediately and on interval to catch React re-renders
    applyBranding()
    const interval = setInterval(applyBranding, 200)
    
    return () => clearInterval(interval)
  }, [])
}

export default function App({ children }: { children: React.ReactNode }) {
  useBranding()
  return children
}

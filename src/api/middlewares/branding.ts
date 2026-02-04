import type { MedusaRequest, MedusaResponse, MedusaNextFunction } from "@medusajs/framework/http"

/**
 * Middleware to inject marqasouq branding into admin pages
 * This is the PERMANENT solution - it cannot be overwritten by Medusa builds
 */
export async function injectBranding(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  // Only inject on admin HTML pages
  const isAdminPage = req.path.startsWith('/app')
  
  if (!isAdminPage) {
    return next()
  }

  // Store original send
  const originalSend = res.send.bind(res)
  
  // Override send to inject our script
  res.send = function(body: any) {
    if (typeof body === 'string' && body.includes('</body>')) {
      const brandingScript = `
<script>
/* marqasouq permanent branding */
(function(){
  var style = document.createElement('style');
  style.textContent = \`
    body { background: #0b0f14 !important; }
    .topbar, header, .bg-ui-bg-surface, .bg-ui-bg-contrast { background: transparent !important; background-image: none !important; }
    button[type="submit"] { background: linear-gradient(135deg, #E63946 0%, #C62828 100%) !important; border: none !important; }
    .marqa-sidebar-item { display:flex; align-items:center; gap:8px; padding:8px 12px; color:#e6eef8; cursor:pointer; margin-left:8px; }
    .marqa-sidebar-item:hover { background: rgba(230,57,70,0.1); }
  \`;
  document.head.appendChild(style);
  
  function applyBranding() {
    // Update title
    if (document.title.includes('Medusa')) {
      document.title = document.title.replace('Medusa', 'marqasouq');
    }
    
    // Login page branding
    if (window.location.pathname.includes('/login')) {
      document.querySelectorAll('h1, h2').forEach(function(h) {
        if (h.textContent && /Welcome|Medusa/i.test(h.textContent)) {
          h.textContent = 'marqasouq';
          h.style.cssText = 'font-size:2rem;font-weight:800;background:linear-gradient(135deg,#E63946,#C62828);-webkit-background-clip:text;-webkit-text-fill-color:transparent;';
        }
      });
      document.querySelectorAll('p').forEach(function(p) {
        if (p.textContent && /Sign in/i.test(p.textContent)) {
          p.textContent = 'Your Premium Marketplace';
          p.style.color = '#94a3b8';
        }
      });
      // Replace logo
      document.querySelectorAll('svg').forEach(function(svg) {
        if (!svg.closest('button') && !svg.closest('input') && svg.parentElement && !svg.parentElement.classList.contains('marqa-done')) {
          var parent = svg.parentElement;
          if (parent.children.length === 1) {
            parent.classList.add('marqa-done');
            svg.outerHTML = '<div style="width:80px;height:80px;background:linear-gradient(135deg,#E63946,#C62828);border-radius:20px;display:flex;align-items:center;justify-content:center;box-shadow:0 10px 30px rgba(230,57,70,0.3);margin:0 auto 1rem;"><span style="color:white;font-size:2.5rem;font-weight:800;">m</span></div>';
          }
        }
      });
    }
    
    // Add Extras to sidebar
    if (!document.querySelector('.marqa-sidebar-item')) {
      var allLinks = Array.from(document.querySelectorAll('a, button'));
      var banners = allLinks.find(function(n) { return n.textContent && n.textContent.trim().toLowerCase() === 'banners'; });
      if (banners) {
        var parent = banners.parentElement;
        while (parent && !parent.matches('li, [class*="item"]')) parent = parent.parentElement;
        if (parent && parent.parentElement) {
          var li = document.createElement('div');
          li.className = 'marqa-sidebar-item';
          li.innerHTML = '<span style="width:8px;height:8px;border-radius:50%;background:linear-gradient(135deg,#E63946,#C62828);"></span><span>Extras</span>';
          li.onclick = function() { window.location.href = '/app/extras'; };
          parent.parentElement.insertBefore(li, parent.nextSibling);
        }
      }
    }
  }
  
  setInterval(applyBranding, 200);
  document.addEventListener('DOMContentLoaded', applyBranding);
})();
</script>
`
      body = body.replace('</body>', brandingScript + '</body>')
    }
    return originalSend(body)
  }
  
  next()
}

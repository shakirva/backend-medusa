import { listBanners } from "@lib/data/media"

const BannerStrip = async () => {
  const banners = await listBanners()
  if (!banners || !banners.length) return null

  return (
    <div className="w-full overflow-hidden">
      <ul className="flex gap-4 items-center">
        {banners.map((b: any) => (
          <li key={b.id} className="flex-shrink-0 w-full">
            <a href={b.link || '#'}>
              <img src={b.media?.url || b.image_url || ""} alt={b.title || "banner"} className="w-full h-auto object-cover" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default BannerStrip

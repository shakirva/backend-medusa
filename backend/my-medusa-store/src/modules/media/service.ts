import { MedusaService } from "@medusajs/framework/utils"
import Media from "./models/media"
import Gallery from "./models/gallery"
import GalleryMedia from "./models/gallery_media"
import Banner from "./models/banner"

class MediaService extends MedusaService({ Media, Gallery, GalleryMedia, Banner }) {
  async addMediaToGallery(gallery_id: string, media_id: string, display_order = 0) {
    // Prevent duplicates
    const existing = await this.listGalleryMedias({ gallery_id, media_id })
    if (existing.length) return existing[0]
    return this.createGalleryMedias({ gallery_id, media_id, display_order })
  }

  async listGalleryMediaIds(gallery_id: string) {
    const items = await this.listGalleryMedias({ gallery_id })
    return items.map((i: any) => i.media_id)
  }
}

export default MediaService

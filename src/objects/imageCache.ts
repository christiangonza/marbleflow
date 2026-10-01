const cache = new Map<string, HTMLImageElement>()

/** Returns a cached <img>, kicking off the load on first request. Check `.complete` before drawing. */
export function loadImage(url: string): HTMLImageElement {
  let image = cache.get(url)
  if (!image) {
    image = new Image()
    image.src = url
    cache.set(url, image)
  }
  return image
}

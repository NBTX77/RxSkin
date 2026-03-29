/**
 * Capture a screenshot of the current viewport.
 * Returns a base64 data URL (image/png) or null on failure.
 * Excludes the feedback modal itself from the capture.
 */
export async function captureScreenshot(): Promise<string | null> {
  try {
    const html2canvas = (await import('html2canvas')).default
    const canvas = await html2canvas(document.body, {
      ignoreElements: (el: Element) => el.closest('[data-feedback-modal]') !== null,
      scale: 0.5,
      logging: false,
      useCORS: true,
    })
    const dataUrl = canvas.toDataURL('image/png', 0.7)
    // Enforce max size (~500KB base64)
    if (dataUrl.length > 700_000) {
      return canvas.toDataURL('image/jpeg', 0.4)
    }
    return dataUrl
  } catch {
    console.warn('[feedback] Screenshot capture failed')
    return null
  }
}

import { useState, useEffect, useCallback } from 'react'

/**
 * Reusable PDF preview state and lifecycle.
 * Use with <PdfPreviewModal /> for a full preview experience.
 *
 * @returns {{
 *   openPreview: (source: File | string, label: string) => void,
 *   closePreview: () => void,
 *   isOpen: boolean,
 *   url: string | null,
 *   label: string | null
 * }}
 */
export function usePdfPreview() {
  const [preview, setPreview] = useState({ url: null, label: null, isBlob: false })

  const openPreview = useCallback((source, label) => {
    if (source == null || label == null) return
    setPreview((prev) => {
      if (prev.isBlob && prev.url) URL.revokeObjectURL(prev.url)
      const url = typeof source === 'string' ? source : URL.createObjectURL(source)
      const isBlob = typeof source !== 'string'
      return { url, label, isBlob }
    })
  }, [])

  const closePreview = useCallback(() => {
    setPreview((prev) => {
      if (prev.isBlob && prev.url) URL.revokeObjectURL(prev.url)
      return { url: null, label: null, isBlob: false }
    })
  }, [])

  useEffect(() => {
    return () => {
      if (preview.isBlob && preview.url) URL.revokeObjectURL(preview.url)
    }
  }, [preview.url, preview.isBlob])

  return {
    openPreview,
    closePreview,
    isOpen: Boolean(preview.url),
    url: preview.url,
    label: preview.label,
  }
}

/**
 * Конвертирует изображение (любой формат, любой размер — типичный скриншот
 * с телефона) в компактный base64 JPEG без префикса data-URL.
 * Нужно, чтобы всегда совпадать с media_type: 'image/jpeg', который
 * жёстко ожидает /api/verify-screenshots, и чтобы не гонять по сети
 * оригиналы в 5-10 МБ.
 */
export function fileToJpegBase64(file: File, maxDimension = 1280): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      let { width, height } = img
      if (width > maxDimension || height > maxDimension) {
        const scale = maxDimension / Math.max(width, height)
        width = Math.round(width * scale)
        height = Math.round(height * scale)
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('Canvas недоступен'))

      ctx.drawImage(img, 0, 0, width, height)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.82)
      resolve(dataUrl.split(',')[1]) // убираем "data:image/jpeg;base64,"
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Не удалось прочитать изображение'))
    }

    img.src = objectUrl
  })
}

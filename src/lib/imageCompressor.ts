/**
 * Client-Side Image Compressor & EXIF Stripper
 *
 * Renders user-uploaded participant photos onto an off-screen HTML5 Canvas.
 * This naturally strips all EXIF metadata, GPS locations, camera hardware tags,
 * and timestamps, and compresses the image to a lightweight JPEG (~30KB - 50KB)
 * for fast database storage and crisp gate pass rendering.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.0 to 1.0
}

export async function compressAndStripExif(
  file: File,
  options: CompressionOptions = {}
): Promise<string> {
  const { maxWidth = 480, maxHeight = 600, quality = 0.82 } = options;

  if (!file.type.startsWith('image/')) {
    throw new Error('Please select a valid image file (JPEG, PNG, or WebP).');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Failed to read image file.'));

    reader.onload = (readerEvent) => {
      const img = new Image();

      img.onerror = () => reject(new Error('Failed to decode image data.'));

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect-ratio preserving dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        // Create canvas for pixel-only rendering (strips all EXIF/metadata)
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('HTML5 Canvas 2D context not available.'));
          return;
        }

        // Fill white background in case of transparent PNGs
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        // Smooth image rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Export clean JPEG with zero metadata
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };

      if (typeof readerEvent.target?.result === 'string') {
        img.src = readerEvent.target.result;
      } else {
        reject(new Error('Failed to process image buffer.'));
      }
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Captures a live frame from an HTMLVideoElement webcam feed, renders onto an
 * off-screen canvas, strips all metadata, and returns a compressed JPEG data URL.
 */
export function captureVideoFrameAndCompress(
  video: HTMLVideoElement,
  options: CompressionOptions = {}
): string {
  const { maxWidth = 480, maxHeight = 600, quality = 0.82 } = options;

  let width = video.videoWidth || 640;
  let height = video.videoHeight || 480;

  if (width === 0 || height === 0) {
    throw new Error('Camera video stream is not ready yet.');
  }

  // Calculate aspect-ratio preserving dimensions
  if (width > height) {
    if (width > maxWidth) {
      height = Math.round((height * maxWidth) / width);
      width = maxWidth;
    }
  } else {
    if (height > maxHeight) {
      width = Math.round((width * maxHeight) / height);
      height = maxHeight;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('HTML5 Canvas 2D context not available.');
  }

  // Fill white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Draw video frame onto canvas (no metadata copied)
  ctx.drawImage(video, 0, 0, width, height);

  // Return clean, compressed JPEG
  return canvas.toDataURL('image/jpeg', quality);
}

/**
 * Audio Utilities
 * 
 * Helper functions for processing audio streams, Blobs, and base64 conversions.
 */

/**
 * Converts an audio Blob into a base64 encoded string.
 * Strips data URI prefix (e.g. "data:audio/webm;codecs=opus;base64,") so that
 * a clean base64 data string is returned.
 *
 * @param blob The audio Blob to convert
 * @returns Promise resolving to the base64-encoded string
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    if (!blob) {
      return resolve('');
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        // Strip data:mime/type;base64, prefix if present
        const base64 = reader.result.includes(',')
          ? reader.result.split(',')[1]
          : reader.result;
        resolve(base64 || '');
      } else {
        reject(new Error('Failed to convert audio Blob to base64 string.'));
      }
    };

    reader.onerror = () => {
      reject(
        reader.error ||
          new Error('FileReader encountered an error while converting Blob.')
      );
    };

    reader.readAsDataURL(blob);
  });
}

/**
 * Converts a Blob to a full data URL string including MIME type prefix.
 *
 * @param blob The audio Blob to convert
 * @returns Promise resolving to the full data URL
 */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    if (!blob) {
      return resolve('');
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert Blob to data URL.'));
      }
    };

    reader.onerror = () => {
      reject(reader.error || new Error('FileReader encountered an error.'));
    };

    reader.readAsDataURL(blob);
  });
}

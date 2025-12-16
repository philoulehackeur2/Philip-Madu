
export const fileToBase64 = (file: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = error => reject(error);
  });
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15);
};

export const resizeImage = (file: File, maxDimension: number = 1024): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    // Check if it is an image
    if (!file.type.startsWith('image/')) {
        resolve(file); // Don't resize non-images
        return;
    }

    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;

    img.onload = () => {
      let { width, height } = img;
      
      // Calculate new dimensions if needed
      if (width > maxDimension || height > maxDimension) {
        const aspectRatio = width / height;
        if (width > height) {
          width = maxDimension;
          height = Math.round(maxDimension / aspectRatio);
        } else {
          height = maxDimension;
          width = Math.round(maxDimension * aspectRatio);
        }
      } else {
          // No resize needed, resolve original
          resolve(file);
          return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // High quality JPEG output for consistency and compression
      canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Image resizing failed"));
      }, 'image/jpeg', 0.85);
    };
    
    img.onerror = reject;
    
    reader.readAsDataURL(file);
  });
};

// --- COLOR UTILS ---

export const hslToHex = (h: number, s: number, l: number): string => {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

export const hexToHsl = (hex: string): { h: number; s: number; l: number } => {
  let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 0, s: 0, l: 0 };
  let r = parseInt(result[1], 16);
  let g = parseInt(result[2], 16);
  let b = parseInt(result[3], 16);
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
};

export const DATA_SAVER_DEFAULTS = {
  dataSaverMode: true,
  uploadQuality: 'medium',
};

export const QUALITY_PRESETS = {
  low: { maxWidth: 960, quality: 0.62 },
  medium: { maxWidth: 1280, quality: 0.76 },
  high: { maxWidth: 1600, quality: 0.88 },
};

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = (error) => {
      URL.revokeObjectURL(objectUrl);
      reject(error);
    };
    image.src = objectUrl;
  });
}

function calculateResizedDimensions(width, height, maxWidth) {
  if (!width || !height) return { width: maxWidth, height: maxWidth };
  if (width <= maxWidth) return { width, height };
  const ratio = maxWidth / width;
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
}

function getByteSizeFromDataUrl(dataUrl) {
  const base64 = String(dataUrl || '').split(',')[1] || '';
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return Math.max(0, Math.floor((base64.length * 3) / 4) - padding);
}

export function formatBytes(bytes) {
  if (!bytes) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(kb < 100 ? 1 : 0)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export async function compressImageFile(file, settings = DATA_SAVER_DEFAULTS) {
  const nextSettings = {
    ...DATA_SAVER_DEFAULTS,
    ...(settings || {}),
  };
  const preset = QUALITY_PRESETS[nextSettings.uploadQuality] || QUALITY_PRESETS.medium;
  const image = await loadImageFromFile(file);
  const { width, height } = calculateResizedDimensions(image.naturalWidth, image.naturalHeight, preset.maxWidth);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d', { alpha: false });
  context.drawImage(image, 0, 0, width, height);

  const quality = nextSettings.dataSaverMode ? preset.quality : Math.min(0.92, preset.quality + 0.08);
  const imageData = canvas.toDataURL('image/jpeg', quality);
  const compressedBytes = getByteSizeFromDataUrl(imageData);

  return {
    imageData,
    stats: {
      originalBytes: Number(file.size || 0),
      compressedBytes,
      width,
      height,
      mimeType: 'image/jpeg',
      qualityMode: nextSettings.uploadQuality,
      dataSaverMode: nextSettings.dataSaverMode,
    },
  };
}

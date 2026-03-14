import '@testing-library/jest-dom/vitest';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

window.scrollTo = () => {};

class MockFileReader {
  constructor() {
    this.result = null;
    this.onloadend = null;
    this.onerror = null;
  }

  readAsDataURL(blob) {
    Promise.resolve().then(async () => {
      try {
        const text = typeof blob?.text === 'function' ? await blob.text() : '';
        this.result = `data:${blob?.type || 'application/octet-stream'};base64,${btoa(text || 'mock-data')}`;
        this.onloadend?.();
      } catch (error) {
        this.onerror?.(error);
      }
    });
  }
}

global.FileReader = MockFileReader;

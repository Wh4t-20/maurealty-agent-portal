// src/utils/deviceInfo.ts
// A short, readable description of the user's browser and screen, e.g.
// "Chrome 130 · Windows · window 1536×730 · screen 1920×1080 · dark mode".
// Support tickets include it so IT support can recreate a problem on the same setup.
// Frontend only: this file reads the browser's own details and sends nothing anywhere.

export function describeDevice(): string {
  if (typeof navigator === 'undefined') return '';
  const ua = navigator.userAgent || '';
  const parts = [browserName(ua), osName(ua)];

  if (typeof window !== 'undefined') {
    parts.push(`window ${window.innerWidth}×${window.innerHeight}`);
    if (window.screen) parts.push(`screen ${window.screen.width}×${window.screen.height}`);
  }
  // The app's own dark mode (App.vue puts .dark on <html>): many display bugs only show in one theme.
  if (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')) {
    parts.push('dark mode');
  }
  return parts.filter(Boolean).join(' · ');
}

// Order matters: Edge, Opera and Samsung Internet also say "Chrome", and Chrome also says "Safari".
function browserName(ua: string): string {
  const pick = (pattern: RegExp, name: string) => {
    const match = pattern.exec(ua);
    return match ? `${name} ${match[1]}` : '';
  };
  return pick(/Edg(?:A|iOS)?\/(\d+)/, 'Edge')
    || pick(/OPR\/(\d+)/, 'Opera')
    || pick(/SamsungBrowser\/(\d+)/, 'Samsung Internet')
    || pick(/(?:Firefox|FxiOS)\/(\d+)/, 'Firefox')
    || pick(/(?:Chrome|CriOS)\/(\d+)/, 'Chrome')
    || pick(/Version\/(\d+(?:\.\d+)?).*Safari/, 'Safari')
    || 'Unknown browser';
}

// Android says "Linux" and iPhones say "like Mac OS X", so those are checked first.
function osName(ua: string): string {
  if (/Windows NT/.test(ua)) return 'Windows';
  if (/Android/.test(ua)) return 'Android';
  if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
  // iPads ask for the desktop site and look like a Mac, except that they have a touch screen.
  if (/Mac OS X/.test(ua)) return navigator.maxTouchPoints > 1 ? 'iPadOS' : 'macOS';
  if (/CrOS/.test(ua)) return 'ChromeOS';
  if (/Linux/.test(ua)) return 'Linux';
  return 'Unknown OS';
}

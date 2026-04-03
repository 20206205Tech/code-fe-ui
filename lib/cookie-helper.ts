export const cookieHelper = {
  set: (
    name: string,
    value: any,
    options: { maxAge?: number; path?: string } = {}
  ) => {
    const { maxAge, path = '/' } = options;
    const stringValue =
      typeof value === 'object' ? JSON.stringify(value) : String(value);

    let cookieString = `${name}=${encodeURIComponent(stringValue)}; path=${path}; SameSite=Lax`;

    if (maxAge) {
      cookieString += `; max-age=${maxAge}`;
    }

    if (typeof document !== 'undefined') {
      document.cookie = cookieString;
    }
  },

  get: (name: string) => {
    if (typeof document === 'undefined') return null;

    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      const rawValue = parts.pop()?.split(';').shift();
      if (rawValue) {
        const decoded = decodeURIComponent(rawValue);
        try {
          return JSON.parse(decoded); // Trả về object nếu là JSON
        } catch {
          return decoded; // Trả về string nếu không phải JSON
        }
      }
    }
    return null;
  },

  remove: (name: string) => {
    if (typeof document !== 'undefined') {
      document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }
  },
};

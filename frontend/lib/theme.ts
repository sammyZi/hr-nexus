/**
 * Theme Configuration
 * 
 * Defines typography and styling for different sections of the app:
 * - Landing page: Balsamiq Sans (playful, friendly)
 * - Dashboard/App: Inter (professional, clean)
 */

export const theme = {
  fonts: {
    landing: {
      family: "'Balsamiq Sans', cursive",
      weights: {
        normal: 400,
        bold: 700,
      },
    },
    app: {
      family: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
      weights: {
        light: 300,
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
      },
    },
  },
  
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
  },
} as const;

export type Theme = typeof theme;

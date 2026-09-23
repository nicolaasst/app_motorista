/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#fcf9f8', 'surface-dim': '#dcd9d9', 'surface-bright': '#fcf9f8',
        'surface-container-lowest': '#ffffff', 'surface-container-low': '#f6f3f2',
        'surface-container': '#f0edec', 'surface-container-high': '#ebe7e7', 'surface-container-highest': '#e5e2e1',
        'on-surface': '#1c1b1b', 'on-surface-variant': '#3f4a3a',
        'inverse-surface': '#313030', 'inverse-on-surface': '#f3f0ef',
        outline: '#6f7b68', 'outline-variant': '#becab5', 'surface-tint': '#006e00',
        'surface-variant': '#e5e2e1', background: '#fcf9f8', 'on-background': '#1c1b1b',
        primary: '#006800', 'on-primary': '#ffffff', 'primary-container': '#008400', 'on-primary-container': '#e3ffd6',
        'inverse-primary': '#6fde5c', 'primary-fixed': '#8bfc75', 'primary-fixed-dim': '#6fde5c',
        'on-primary-fixed': '#002200', 'on-primary-fixed-variant': '#005300',
        secondary: '#386b00', 'on-secondary': '#ffffff', 'secondary-container': '#91f92a', 'on-secondary-container': '#3b6f00',
        'secondary-fixed': '#94fc2d', 'secondary-fixed-dim': '#7bde00', 'on-secondary-fixed': '#0d2000', 'on-secondary-fixed-variant': '#295000',
        tertiary: '#016800', 'on-tertiary': '#ffffff', 'tertiary-container': '#018400', 'on-tertiary-container': '#e3ffd6',
        'tertiary-fixed': '#77ff61', 'tertiary-fixed-dim': '#51e240', 'on-tertiary-fixed': '#002200', 'on-tertiary-fixed-variant': '#015300',
        error: '#ba1a1a', 'on-error': '#ffffff', 'error-container': '#ffdad6', 'on-error-container': '#93000a',
        warning: '#b58900', 'warning-container': '#fff3c4', info: '#1b5e9c', 'info-container': '#d6e9ff',
      },
      fontFamily: {
        'display-lg': ['Manrope', 'sans-serif'], 'headline-lg': ['Manrope', 'sans-serif'], 'headline-md': ['Manrope', 'sans-serif'], 'headline-sm': ['Manrope', 'sans-serif'],
        'body-lg': ['Plus Jakarta Sans', 'sans-serif'], 'body-md': ['Plus Jakarta Sans', 'sans-serif'], 'body-sm': ['Plus Jakarta Sans', 'sans-serif'],
        'label-lg': ['Plus Jakarta Sans', 'sans-serif'], 'label-md': ['Plus Jakarta Sans', 'sans-serif'], 'label-sm': ['Plus Jakarta Sans', 'sans-serif'],
        'code-sm': ['Space Mono', 'monospace'], 'code-md': ['Space Mono', 'monospace'], 'code-lg': ['Space Mono', 'monospace'],
      },
      fontSize: {
        'display-lg': ['36px', { lineHeight: '44px', fontWeight: '800', letterSpacing: '-0.03em' }], 'headline-lg': ['28px', { lineHeight: '36px', fontWeight: '700', letterSpacing: '-0.02em' }], 'headline-md': ['20px', { lineHeight: '26px', fontWeight: '600', letterSpacing: '-0.015em' }], 'headline-sm': ['16px', { lineHeight: '22px', fontWeight: '600', letterSpacing: '-0.01em' }],
        'body-lg': ['15px', { lineHeight: '24px', fontWeight: '400' }], 'body-md': ['14px', { lineHeight: '22px', fontWeight: '400' }], 'body-sm': ['13px', { lineHeight: '19px', fontWeight: '400' }],
        'label-lg': ['14px', { lineHeight: '20px', fontWeight: '600' }], 'label-md': ['13px', { lineHeight: '18px', fontWeight: '600' }], 'label-sm': ['11px', { lineHeight: '14px', fontWeight: '700', letterSpacing: '0.03em' }],
        'code-sm': ['12px', { lineHeight: '16px', fontWeight: '400', letterSpacing: '0.02em' }], 'code-md': ['13px', { lineHeight: '18px', fontWeight: '400', letterSpacing: '0.02em' }], 'code-lg': ['14px', { lineHeight: '20px', fontWeight: '400', letterSpacing: '0.02em' }],
      },
      spacing: { 'space-2xs': '2px', 'space-xs': '4px', 'space-sm': '8px', 'space-md': '12px', 'space-lg': '16px', 'space-xl': '24px', 'space-2xl': '32px', margin: '16px', 'margin-desktop': '24px', gutter: '16px', 'gutter-desktop': '20px' },
      borderRadius: { sm: '4px', DEFAULT: '8px', md: '12px', lg: '16px', xl: '24px' },
    },
  },
  plugins: [],
};

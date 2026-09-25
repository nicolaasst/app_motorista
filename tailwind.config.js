/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
  		opacity: Object.fromEntries(Array.from({ length: 101 }, (_, i) => [i, `${i / 100}`])),
  		borderRadius: {
  			sm: '0.5rem',
  			DEFAULT: '1rem',
  			md: '1.5rem',
  			lg: '2rem',
  			xl: '3rem',
  			'2xl': '1.25rem',
  			'3xl': '1.5rem',
  			full: '9999px'
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))',
  				deep: 'hsl(var(--primary-deep))',
  				container: 'hsl(var(--primary-container))',
  				'on-container': 'hsl(var(--on-primary-container))',
  				pressed: 'hsl(var(--primary-pressed))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			tertiary: {
  				DEFAULT: 'hsl(var(--tertiary))',
  				foreground: 'hsl(var(--tertiary-foreground))',
  				container: 'hsl(var(--tertiary-container))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))',
  				pressed: 'hsl(var(--destructive-pressed))'
  			},
  			error: {
  				DEFAULT: 'hsl(var(--error))',
  				container: 'hsl(var(--error-container))',
  				'on-container': 'hsl(var(--on-error-container))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			onyx: {
  				DEFAULT: 'hsl(var(--onyx))',
  				pressed: 'hsl(var(--onyx-pressed))'
  			},
  			lime: 'hsl(var(--lime))',
  			paper: 'hsl(var(--paper))',
  			stone: 'hsl(var(--stone))',
			ink: 'hsl(var(--ink))',
			'ink-soft': 'hsl(var(--ink-soft))',
			navy: 'hsl(var(--navy))',
			'brand-yellow': 'hsl(var(--brand-yellow))',
			'brand-yellow-light': 'hsl(var(--brand-yellow-light))',
			'brand-yellow-secondary': 'hsl(var(--brand-yellow-secondary))',
			'brand-yellow-deep': 'hsl(var(--brand-yellow-deep))',
			'brand-yellow-soft': 'hsl(var(--brand-yellow-soft))',
			outline: 'hsl(var(--outline))',
			'surface-track': 'hsl(var(--surface-track))',
  			status: {
  				green: {
  					DEFAULT: 'hsl(var(--status-green-bg))',
  					fg: 'hsl(var(--status-green-fg))',
  					bg: 'hsl(var(--status-green-bg))'
  				},
  				amber: {
  					DEFAULT: 'hsl(var(--status-amber-bg))',
  					fg: 'hsl(var(--status-amber-fg))',
  					bg: 'hsl(var(--status-amber-bg))'
  				},
  				red: {
  					DEFAULT: 'hsl(var(--status-red-bg))',
  					fg: 'hsl(var(--status-red-fg))',
  					bg: 'hsl(var(--status-red-bg))'
  				},
  				blue: {
  					DEFAULT: 'hsl(var(--status-blue-bg))',
  					fg: 'hsl(var(--status-blue-fg))',
  					bg: 'hsl(var(--status-blue-bg))'
  				},
  				gray: {
  					DEFAULT: 'hsl(var(--status-gray-bg))',
  					fg: 'hsl(var(--status-gray-fg))',
  					bg: 'hsl(var(--status-gray-bg))'
  				}
  			},
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		fontFamily: {
  			heading: ['var(--font-heading)'],
  			body: ['var(--font-body)'],
  			display: ['var(--font-display)'],
  			mono: ['var(--font-mono)']
  		},
  		boxShadow: {
  			card: 'none',
  			elevated: '0 4px 12px -2px rgba(21,19,26,.06), 0 2px 4px -1px rgba(21,19,26,.04)',
  			modal: '0 12px 28px -4px rgba(15,23,42,.12), 0 4px 8px -2px rgba(15,23,42,.04)',
  			chrome: '0px -4px 16px rgba(0, 0, 0, 0.18)',
  			cta: '0px 8px 24px rgba(21, 19, 26, 0.25)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: { height: '0' },
  				to: { height: 'var(--radix-accordion-content-height)' }
  			},
  			'accordion-up': {
  				from: { height: 'var(--radix-accordion-content-height)' },
  				to: { height: '0' }
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}

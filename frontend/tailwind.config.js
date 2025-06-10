/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
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
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
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
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			// カスタムティールカラーパレット
  			teal: {
  				primary: '#0891b2',
  				secondary: '#06b6d4',
  				light: '#22d3ee',
  				dark: '#0e7490',
  				deep: '#155e75',
  				50: '#f0fdfa',
  				100: '#ccfbf1',
  				200: '#99f6e4',
  				300: '#5eead4',
  				400: '#2dd4bf',
  				500: '#14b8a6',
  				600: '#0891b2',
  				700: '#0e7490',
  				800: '#155e75',
  				900: '#164e63',
  			},
  						support: {
				lightCyan: '#a5f3fc',
				lightGray: '#f8fafc',
				softGray: '#f1f5f9',
				borderGray: '#e2e8f0',
				textGray: '#64748b',
				darkText: '#1e293b',
				darkerText: '#0f172a'
			},
			// ダークモード専用カラー
			dark: {
				// 背景色
				mainBg: '#36393F',     // チャット/メイン背景
				sidebarBg: '#2F3136',  // サイドバー
				frameBg: '#202225',    // 外枠/最暗部
				// テキスト & UI要素
				primaryText: '#FFFFFF',   // プライマリテキスト
				secondaryText: '#B9BBBE', // セカンダリテキスト
				uiHover: '#40444B',      // UI要素/ホバー
			}
  		}
  	}
  },
  plugins: [require("tailwindcss-animate"), require('@tailwindcss/typography')],
}

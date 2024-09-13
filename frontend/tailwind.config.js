/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: [
			"./index.html",
			"./src/**/*.{js,jsx,ts,tsx}",
    
		],
  theme: {
  	extend: {
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
				primary: 'rgb(var(--primary))',
				secondary: 'rgb(var(--secondary))',
				background: 'rgb(var(--background))',
				foreground: 'rgb(var(--foreground))',
			},
			fontFamily: {
				body: 'var(--font-body)'
			},
  	}
  },
  plugins: [require("tailwindcss-animate")],
}


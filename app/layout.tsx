import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Reels Boost',
  description: 'Комьюнити Instagram авторов',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <script src="https://telegram.org/js/telegram-web-app.js"></script>
      </head>
      <body style={{ margin: 0, padding: 0, background: '#0f0f1a' }}>
        <script dangerouslySetInnerHTML={{ __html: `
          if (window.Telegram && window.Telegram.WebApp) {
            window.Telegram.WebApp.ready();
            window.Telegram.WebApp.expand();
          }
        `}} />
        {children}
      </body>
    </html>
  )
}

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import '../src/index.css'
import { AuthProvider } from './contexts/AuthContext'
import { OrderCountProvider } from './contexts/OrderCountContext'
import Colors from './themes/Colors'

const themeVariables = {
  '--bg-primary': Colors.Background.primary,
  '--bg-secondary': Colors.Background.secondary,
  '--surface-muted': Colors.Background.muted,
  '--border-color': Colors.Borders.primary,
  '--text-primary': Colors.Texts.primary,
  '--text-secondary': Colors.Texts.secondary,
  '--highlight': Colors.Highlight.primary,
}

for (const [name, value] of Object.entries(themeVariables)) {
  document.documentElement.style.setProperty(name, value)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <OrderCountProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </OrderCountProvider>
    </AuthProvider>
  </StrictMode>
)

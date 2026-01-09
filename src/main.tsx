import { render } from 'preact'
import './index.css'
import { App } from './app.tsx'

const root = document.getElementById('app')
if (!root) {
  throw new Error('Root element not found')
}

render(<App />, root)

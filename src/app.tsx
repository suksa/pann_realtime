import { LocationProvider, Router, Route } from 'preact-iso'
import Home from './pages/Home'
import Bubble from './pages/Bubble'

// base 경로 추출 (GitHub Pages용)
const getBasePath = () => {
  const path = window.location.pathname
  // /pann_realtime 또는 /pann_realtime/ 같은 서브 디렉토리 경로 추출
  const match = path.match(/^\/([^\/]+)/)
  if (match && match[1] !== '') {
    return `/${match[1]}`
  }
  return ''
}

const App = () => {
  const basePath = getBasePath()
  
  // base 경로가 있으면 Route path에 포함
  const homePath = basePath ? `${basePath}/` : '/'
  const bubblePath = basePath ? `${basePath}/bubble` : '/bubble'
  
  return (
    <LocationProvider scope={basePath || undefined}>
      <Router>
        <Route path={homePath} component={Home} />
        <Route path={bubblePath} component={Bubble} />
      </Router>
    </LocationProvider>
  )
}

export { App }
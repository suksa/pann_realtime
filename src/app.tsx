import { LocationProvider, Router, Route } from 'preact-iso'
import Home from './pages/Home'
import Bubble from './pages/Bubble'

const App = () => {
  return (
    <LocationProvider>
      <Router>
        <Route path="/" component={Home} />
        <Route path="/bubble" component={Bubble} />
      </Router>
    </LocationProvider>
  )
}

export { App }
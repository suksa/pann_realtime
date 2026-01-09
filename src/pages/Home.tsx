import { useLocation } from 'preact-iso'

const Home = () => {
  const { route } = useLocation()
  
  // base 경로 추출
  const getBasePath = () => {
    const path = window.location.pathname
    const match = path.match(/^\/([^\/]+)/)
    if (match && match[1] !== '') {
      return `/${match[1]}`
    }
    return ''
  }
  
  const basePath = getBasePath()
  const bubblePath = basePath ? `${basePath}/bubble` : '/bubble'
  
  const handleClick = (e: Event) => {
    e.preventDefault()
    route(bubblePath)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">링크 모음</h1>
        <div className="space-y-4">
          <a 
            href={bubblePath}
            onClick={handleClick}
            className="block p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 hover:border-blue-500"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-2">버블 차트</h2>
            <p className="text-gray-600">실시간 키워드 버블 차트 보기</p>
          </a>
        </div>
      </div>
    </div>
  )
}

export default Home

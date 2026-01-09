import { useEffect, useRef, useState } from 'preact/hooks'
import * as d3 from 'd3'

interface BubbleData {
  rank: number
  keyword: string
  x?: number
  y?: number
}

// 더미 데이터 (실제로는 API에서 가져올 데이터)
const mockData: BubbleData[][] = [
  // 페이지 1 (1위~5위)
  [
    { rank: 1, keyword: '전광훈 벌금 확정' },
    { rank: 2, keyword: '뉴진스' },
    { rank: 3, keyword: 'BTS' },
    { rank: 4, keyword: '블랙핑크는 얼마나 유명해질까 궁금하네' },
    { rank: 5, keyword: '오세훈 서울 시장 재건축' },
  ],
  // 페이지 2 (6위~10위)
  [
    { rank: 6, keyword: '트와이스' },
    { rank: 7, keyword: '에스파' },
    { rank: 8, keyword: '아이브' },
    { rank: 9, keyword: '엔시티' },
    { rank: 10, keyword: '르세라핌' },
  ],
]

const Bubble = () => {
  const svgRef = useRef<SVGSVGElement>(null)
  const simulationRef = useRef<d3.Simulation<BubbleData, undefined> | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const totalPages = mockData.length

  useEffect(() => {
    if (!svgRef.current) return

    const width = 1000
    const height = 900
    const margin = { top: 60, right: 60, bottom: 60, left: 60 }

    // SVG 초기화
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    svg
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('max-width', '100%')
      .style('height', 'auto')

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    const chartWidth = width - margin.left - margin.right
    const chartHeight = height - margin.top - margin.bottom

    // 현재 페이지 데이터 - 중앙 근처에 약간 겹치게 초기 위치 설정 (매번 완전히 랜덤하게)
    const centerX = chartWidth / 2
    const centerY = chartHeight / 2
    const initialSpread = 100 // 초기 분산 거리 (약간 겹치게)
    
    const data = mockData[currentPage].map((d) => {
      // 완전히 랜덤한 각도와 거리로 초기 위치 설정
      const randomAngle = Math.random() * Math.PI * 2
      const randomDistance = (Math.random() * 0.5 + 0.5) * initialSpread // 50% ~ 100% 거리
      const offsetX = Math.cos(randomAngle) * randomDistance
      const offsetY = Math.sin(randomAngle) * randomDistance
      
      return {
        ...d,
        x: centerX + offsetX,
        y: centerY + offsetY
      }
    })

    // 모던한 그라데이션 색상 팔레트
    const gradients = [
      { start: '#FF6B9D', end: '#C44569' },
      { start: '#4ECDC4', end: '#44A08D' },
      { start: '#FFA07A', end: '#FF6B6B' },
      { start: '#FFD93D', end: '#F6AE2D' },
      { start: '#6BCB77', end: '#4ECDC4' },
    ]

    // 그라데이션 정의
    const defs = svg.append('defs')
    data.forEach((d, i) => {
      const gradient = defs.append('linearGradient')
        .attr('id', `gradient-${d.rank}`)
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '100%')
        .attr('y2', '100%')
      
      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', gradients[i % gradients.length].start)
        .attr('stop-opacity', 1)
      
      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', gradients[i % gradients.length].end)
        .attr('stop-opacity', 1)
    })

    // rank 기반 반지름 함수 (5개 단위로 그룹화)
    const getRadiusByRank = (rank: number): number => {
      const remainder = rank % 5
      if (remainder === 1) return 200  // 1위, 6위, 11위...: 가장 크게
      if (remainder === 2) return 170  // 2위, 7위, 12위...: 그 다음 크게
      return 120  // 3, 4, 5위, 8, 9, 10위...: 같은 작은 크기
    }

    // 버블 그룹 선택 및 데이터 바인딩
    const bubbles = g.selectAll<SVGGElement, BubbleData>('.bubble')
      .data(data, d => d.rank.toString())

    // 기존 버블 제거 (exit) - 부드러운 애니메이션
    bubbles.exit()
      .transition()
      .duration(800)
      .ease(d3.easeCubicIn)
      .style('opacity', 0)
      .attr('transform', function() {
        const d = d3.select(this).datum() as BubbleData
        return `translate(${d.x || chartWidth / 2},${d.y || chartHeight / 2}) scale(0)`
      })
      .remove()

    // 새 버블 추가 (enter) - 초기 위치를 약간 분산시켜서 설정
    const bubblesEnter = bubbles.enter()
      .append('g')
      .attr('class', 'bubble')
      .attr('transform', d => `translate(${d.x || chartWidth / 2},${d.y || chartHeight / 2})`)
      .style('opacity', 0)

    // 원 추가 (그라데이션, 그림자 필터 제거)
    bubblesEnter.append('circle')
      .attr('r', 0)
      .attr('fill', d => `url(#gradient-${d.rank})`)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('opacity', 0.85)
      .style('cursor', 'pointer')

    // 순위 배경 및 텍스트 추가 (우측 상단)
    const rankGroups = bubblesEnter.append('g')
      .attr('class', 'rank-badge')
    
    rankGroups.each(function(d) {
      const bubbleData = d as BubbleData
      const radius = getRadiusByRank(bubbleData.rank)
      const fontSize = Math.max(20, radius / 5)
      const rankText = `${bubbleData.rank}위`
      
      // 텍스트 너비 측정을 위한 임시 요소
      const tempText = svg.append('text')
        .attr('font-size', fontSize)
        .attr('font-weight', '800')
        .style('visibility', 'hidden')
        .text(rankText)
      
      const textWidth = (tempText.node()?.getBBox().width || 0) + 12 // 패딩 포함
      const textHeight = fontSize + 8
      tempText.remove()
      
      const group = d3.select(this)
      
      // 배경 rect 추가
      group.append('rect')
        .attr('x', radius * 0.6 - textWidth / 2)
        .attr('y', -radius * 0.6 - textHeight / 2)
        .attr('width', textWidth)
        .attr('height', textHeight)
        .attr('rx', 6)
        .attr('ry', 6)
        .attr('fill', 'rgba(0, 0, 0, 0.6)')
        .style('opacity', 1)
      
      // 순위 텍스트 추가
      group.append('text')
        .attr('text-anchor', 'middle')
        .attr('x', radius * 0.6)
        .attr('y', -radius * 0.6 + fontSize / 3)
        .attr('font-size', fontSize)
        .attr('font-weight', '800')
        .attr('fill', '#fff')
        .style('opacity', 1)
        .text(rankText)
    })

    // 텍스트를 두 줄로 나누는 헬퍼 함수
    const wrapText = (text: string, maxWidth: number, fontSize: number, svg: d3.Selection<SVGSVGElement, unknown, null, undefined>): string[] => {
      const chars = text.split('')
      const lines: string[] = []
      let firstLine = ''
      let firstLineEndIndex = 0
      
      // 임시 텍스트 요소로 너비 측정 (한 번만 생성)
      const tempText = svg.append('text')
        .attr('font-size', fontSize)
        .attr('font-weight', '700')
        .style('visibility', 'hidden')
        .style('position', 'absolute')
      
      // 첫 번째 줄 생성
      for (let i = 0; i < chars.length; i++) {
        const testLine = firstLine + chars[i]
        tempText.text(testLine)
        const textWidth = (tempText.node()?.getBBox().width || 0)
        
        if (textWidth > maxWidth && firstLine !== '') {
          firstLineEndIndex = i
          break
        } else {
          firstLine = testLine
          firstLineEndIndex = i + 1
        }
      }
      
      // 첫 번째 줄이 전체 텍스트를 포함하면 그대로 반환
      if (firstLineEndIndex >= chars.length) {
        tempText.remove()
        return [text]
      }
      
      lines.push(firstLine)
      
      // 두 번째 줄 생성 (남은 텍스트)
      const remainingText = chars.slice(firstLineEndIndex).join('')
      if (remainingText) {
        let secondLine = remainingText
        
        // 두 번째 줄이 넘치면 말줄임표 추가
        tempText.text(secondLine)
        let secondLineWidth = (tempText.node()?.getBBox().width || 0)
        
        if (secondLineWidth > maxWidth) {
          // 말줄임표를 포함한 너비를 고려하여 텍스트 자르기
          while (secondLine.length > 0) {
            const testText = secondLine + '...'
            tempText.text(testText)
            const width = (tempText.node()?.getBBox().width || 0)
            if (width <= maxWidth) {
              secondLine = testText
              break
            }
            secondLine = secondLine.slice(0, -1)
          }
        }
        
        lines.push(secondLine)
      }
      
      tempText.remove()
      return lines.length > 0 ? lines : [text]
    }
    
    // 키워드 텍스트 추가 (두 줄로 나누기)
    const keywordTexts = bubblesEnter.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.8em')
      .attr('font-size', d => Math.max(22, getRadiusByRank(d.rank) / 4))
      .attr('font-weight', '700')
      .attr('fill', '#fff')
      .style('opacity', 1)
    
    // 각 버블에 대해 텍스트 줄바꿈 적용
    keywordTexts.each(function(d) {
      const bubbleData = d as BubbleData
      const radius = getRadiusByRank(bubbleData.rank)
      const fontSize = Math.max(22, radius / 4)
      const maxWidth = radius * 1.6 // 원의 지름의 80% 정도
      const lines = wrapText(bubbleData.keyword, maxWidth, fontSize, svg)
      
      const textElement = d3.select(this)
      textElement.text(null) // 기존 텍스트 제거
      
      lines.forEach((line, i) => {
        textElement.append('tspan')
          .attr('x', 0)
          .attr('dy', i === 0 ? '0' : '1.2em')
          .text(line)
      })
    })

    // enter + update 병합
    const bubblesMerged = bubblesEnter.merge(bubbles)

    // 초기 위치 설정 (약간 분산된 위치)
    bubblesMerged
      .style('opacity', 0)
      .attr('transform', d => `translate(${d.x || chartWidth / 2},${d.y || chartHeight / 2})`)

    // 원 크기 먼저 설정 (애니메이션 전에 기본값)
    bubblesMerged.select('circle')
      .attr('r', 0)

    // 애니메이션 시작 - 모든 버블 동시에 나타나기
    bubblesMerged
      .transition()
      .duration(600)
      .ease(d3.easeCubicOut)
      .style('opacity', 1)

    // 원 크기 애니메이션 - 모든 버블 동시에
    bubblesMerged.select('circle')
      .transition()
      .duration(1000)
      .ease(d3.easeElasticOut)
      .attr('r', d => getRadiusByRank(d.rank))

    // 텍스트 나타나기 - 모든 버블 동시에 (텍스트는 항상 opacity 1)
    bubblesMerged.selectAll('text')
      .transition()
      .duration(600)
      .delay(400)
      .style('opacity', 1)

    // Force simulation 설정 - 실시간으로 벌어지게
    // 기존 simulation이 있으면 중지
    if (simulationRef.current) {
      simulationRef.current.stop()
    }

    // 버블이 나타난 후 자연스럽게 퍼지도록 시뮬레이션 시작
    const startSimulation = () => {
      // 매번 다른 중심점으로 약간의 변화 추가 (최종 위치가 달라지도록)
      const centerOffsetX = (Math.random() - 0.5) * 50 // -25 ~ 25
      const centerOffsetY = (Math.random() - 0.5) * 50 // -25 ~ 25
      const randomCenterX = chartWidth / 2 + centerOffsetX
      const randomCenterY = chartHeight / 2 + centerOffsetY
      
      const simulation = d3.forceSimulation<BubbleData>(data)
        // ⚡ 퍼지는 속도 조절 파라미터들 ⚡ (느리고 자연스럽게)
        .force('charge', d3.forceManyBody().strength(-80 + (Math.random() - 0.5) * 20)) // 약간의 랜덤성 추가
        .force('center', d3.forceCenter(randomCenterX, randomCenterY).strength(0.05)) // 랜덤 중심점
        .force('collision', d3.forceCollide<BubbleData>().radius(d => getRadiusByRank(d.rank) + 10)) // 충돌 방지
        .force('x', d3.forceX(randomCenterX).strength(0.03))
        .force('y', d3.forceY(randomCenterY).strength(0.03))
        .alpha(0.2) // 초기 활성도: 낮을수록 느리게 시작 (현재: 0.2)
        .alphaDecay(0.005) // 감소 속도: 낮을수록 천천히 멈춤 (현재: 0.005)
        .velocityDecay(0.8) // 속도 감쇠: 높을수록 느리게 이동 (현재: 0.8)

      simulationRef.current = simulation

      // 시뮬레이션 틱마다 위치 업데이트 및 경계 체크
      let lastAlpha = 1
      simulation.on('tick', () => {
        // 경계 내에 유지
        data.forEach(d => {
          const radius = getRadiusByRank(d.rank)
          if (d.x !== undefined && d.y !== undefined) {
            d.x = Math.max(radius, Math.min(chartWidth - radius, d.x))
            d.y = Math.max(radius, Math.min(chartHeight - radius, d.y))
          }
        })
        
        bubblesMerged
          .attr('transform', d => `translate(${d.x || chartWidth / 2},${d.y || chartHeight / 2})`)

        // alpha가 충분히 낮아지면 시뮬레이션 중지 (안정화)
        const currentAlpha = simulation.alpha()
        if (currentAlpha < 0.01 && lastAlpha >= 0.01) {
          setTimeout(() => {
            simulation.stop()
          }, 100)
        }
        lastAlpha = currentAlpha
      })
    }

    // 버블이 나타나면 바로 제자리로 찾아가도록 시뮬레이션 시작 (딜레이 없음)
    startSimulation()

    // 호버 효과 - 플랫 디자인
    bubblesMerged.on('mouseenter', function(_, d) {
      const bubble = d3.select(this)
      const bubbleData = d as BubbleData
      const newRadius = getRadiusByRank(bubbleData.rank) * 1.1
      
      bubble.select('circle')
        .transition()
        .duration(300)
        .ease(d3.easeCubicOut)
        .style('opacity', 1)
        .attr('stroke-width', 3)
        .attr('r', newRadius)
      
      // 순위 배지 크기 및 위치 조정
      const rankGroup = bubble.select('.rank-badge')
      const rankFontSize = Math.max(20, newRadius / 5) * 1.1
      const rankText = `${bubbleData.rank}위`
      
      // 텍스트 너비 측정
      const tempText = svg.append('text')
        .attr('font-size', rankFontSize)
        .attr('font-weight', '800')
        .style('visibility', 'hidden')
        .text(rankText)
      
      const textWidth = (tempText.node()?.getBBox().width || 0) + 12
      const textHeight = rankFontSize + 8
      tempText.remove()
      
      rankGroup.select('rect')
        .transition()
        .duration(300)
        .attr('x', newRadius * 0.5 - textWidth / 2)
        .attr('y', -newRadius * 0.5 - textHeight / 2)
        .attr('width', textWidth)
        .attr('height', textHeight)
      
      rankGroup.select('text')
        .transition()
        .duration(300)
        .attr('x', newRadius * 0.5)
        .attr('y', -newRadius * 0.5 + rankFontSize / 3)
        .attr('font-size', rankFontSize)
      
      // 키워드 텍스트 크기 조정 및 줄바꿈 재계산
      const keywordText = bubble.select('text')
        .filter(function() {
          return !d3.select(this).text().includes('위')
        })
      
      const keywordFontSize = Math.max(22, newRadius / 4) * 1.1
      const keywordMaxWidth = newRadius * 1.6
      
      keywordText.selectAll('tspan').remove()
      const lines = wrapText(bubbleData.keyword, keywordMaxWidth, keywordFontSize, svg)
      
      keywordText
        .transition()
        .duration(300)
        .style('opacity', 1)
        .attr('font-size', keywordFontSize)
      
      lines.forEach((line, i) => {
        keywordText.append('tspan')
          .attr('x', 0)
          .attr('dy', i === 0 ? '0' : '1.2em')
          .text(line)
      })
    })
    .on('mouseleave', function(_, d) {
      const bubble = d3.select(this)
      const bubbleData = d as BubbleData
      const radius = getRadiusByRank(bubbleData.rank)
      
      bubble.select('circle')
        .transition()
        .duration(300)
        .ease(d3.easeCubicOut)
        .style('opacity', 0.85)
        .attr('stroke-width', 2)
        .attr('r', radius)
      
      // 순위 배지 크기 및 위치 복원
      const rankGroup = bubble.select('.rank-badge')
      const rankFontSize = Math.max(20, radius / 5)
      const rankText = `${bubbleData.rank}위`
      
      // 텍스트 너비 측정
      const tempText = svg.append('text')
        .attr('font-size', rankFontSize)
        .attr('font-weight', '800')
        .style('visibility', 'hidden')
        .text(rankText)
      
      const textWidth = (tempText.node()?.getBBox().width || 0) + 12
      const textHeight = rankFontSize + 8
      tempText.remove()
      
      rankGroup.select('rect')
        .transition()
        .duration(300)
        .attr('x', radius * 0.5 - textWidth / 2)
        .attr('y', -radius * 0.5 - textHeight / 2)
        .attr('width', textWidth)
        .attr('height', textHeight)
      
      rankGroup.select('text')
        .transition()
        .duration(300)
        .attr('x', radius * 0.5)
        .attr('y', -radius * 0.5 + rankFontSize / 3)
        .attr('font-size', rankFontSize)
      
      // 키워드 텍스트 크기 복원 및 줄바꿈 재계산
      const keywordText = bubble.select('text')
        .filter(function() {
          return !d3.select(this).text().includes('위')
        })
      
      const keywordFontSize = Math.max(22, radius / 4)
      const keywordMaxWidth = radius * 1.6
      
      keywordText.selectAll('tspan').remove()
      const lines = wrapText(bubbleData.keyword, keywordMaxWidth, keywordFontSize, svg)
      
      keywordText
        .transition()
        .duration(300)
        .style('opacity', 1)
        .attr('font-size', keywordFontSize)
      
      lines.forEach((line, i) => {
        keywordText.append('tspan')
          .attr('x', 0)
          .attr('dy', i === 0 ? '0' : '1.2em')
          .text(line)
      })
    })

    // cleanup
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop()
        simulationRef.current = null
      }
    }

  }, [currentPage])

  const handlePageToggle = () => {
    setCurrentPage((prev) => (prev + 1) % totalPages)
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8">
      <div className="bg-white rounded-lg py-5 border border-gray-200">
        <h1 className="text-gray-800 text-xl font-bold px-4">
          실시간 이슈 키워드
        </h1>
        
        <div className="flex justify-center items-center">
          <svg ref={svgRef}></svg>
        </div>

        <div className="flex justify-center mt-4">
          <button
            onClick={handlePageToggle}
            className="px-8 py-3 bg-gray-800 text-white font-semibold rounded hover:bg-gray-700 transition-colors duration-200"
          >
            더보기 {currentPage + 1}/{totalPages}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Bubble

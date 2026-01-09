import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [preact()],
  // GitHub Pages 배포를 위한 base 경로
  // 리포지토리 이름에 맞게 수정하세요
  // 예: 리포지토리가 'username/pann_realtime'이면 base: '/pann_realtime/'
  // 루트 도메인(username.github.io)으로 배포하는 경우: base: '/'
  base: process.env.GITHUB_REPOSITORY 
    ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}/`
    : '/pann_realtime/',
  build: {
    outDir: 'dist',
  },
})

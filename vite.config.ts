import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [preact()],
  // GitHub Pages 배포를 위한 base 경로
  // 개발 환경과 프로덕션 모두 '/pann_realtime/' 사용
  base: process.env.GITHUB_REPOSITORY 
    ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}`
    : '/pann_realtime',
  build: {
    outDir: 'dist',
  },
})

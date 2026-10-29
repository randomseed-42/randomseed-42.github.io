import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import NotFound from './pages/NotFound'
import { tours } from './tours'

// Each demo is its own chunk, so the portfolio page stays light.
const ScreenshotTour = lazy(() => import('./pages/ScreenshotTour'))
const MementoDemo = lazy(() => import('./demos/memento/MementoDemo'))
const RememberWhenDemo = lazy(() => import('./demos/rememberwhen/RememberWhenDemo'))

export default function App() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ink-950" />}>
      <Routes>
        <Route path="/" element={<Home />} />
        {tours.map((t) => (
          <Route key={t.slug} path={`/projects/${t.slug}/*`} element={<ScreenshotTour tour={t} />} />
        ))}
        <Route path="/projects/memento" element={<MementoDemo />} />
        <Route path="/projects/remember-when" element={<RememberWhenDemo />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}

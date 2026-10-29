import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="font-mono text-ink-400">404</p>
      <h1 className="text-2xl font-semibold">Nothing here</h1>
      <Link to="/" className="text-accent-400 hover:underline">
        Back to the portfolio
      </Link>
    </div>
  )
}

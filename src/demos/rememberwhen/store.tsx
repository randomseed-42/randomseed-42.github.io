/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Consent, ViewerKind } from './lib/access'
import { CURRENT_WEEK } from './data/resident'

export type Tab = 'call' | 'graph' | 'biosketch' | 'console'

interface State {
  viewer: ViewerKind
  setViewer: (k: ViewerKind) => void
  consent: Consent
  setConsent: (c: Consent) => void
  week: number
  setWeek: (w: number) => void
  tab: Tab
  setTab: (t: Tab) => void
  /** Open call on "The call" tab; null shows the sessions list. */
  callId: string | null
  openCall: (id: string | null, atMs?: number) => void
  startAtMs: number
}

const Ctx = createContext<State | null>(null)

export function useRW() {
  const s = useContext(Ctx)
  if (!s) throw new Error('useRW outside provider')
  return s
}

export function RWProvider({ children, initialCall }: { children: ReactNode; initialCall: string }) {
  const [viewer, setViewer] = useState<ViewerKind>('staff')
  const [consent, setConsent] = useState<Consent>({ staff: true, family: false })
  const [week, setWeek] = useState(CURRENT_WEEK)
  const [tab, setTab] = useState<Tab>('call')
  const [callId, setCallId] = useState<string | null>(initialCall)
  const [startAtMs, setStart] = useState(0)
  const value = useMemo<State>(
    () => ({
      viewer,
      setViewer: (k) => {
        setViewer(k)
        if ((k === 'self' || k === 'family') && tab === 'console') setTab('biosketch')
      },
      consent,
      setConsent,
      week,
      setWeek,
      tab,
      setTab,
      callId,
      openCall: (id, atMs = 0) => {
        setCallId(id)
        setStart(atMs)
        setTab('call')
      },
      startAtMs,
    }),
    [viewer, consent, week, tab, callId, startAtMs],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

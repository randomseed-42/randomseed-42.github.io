// Who sees what. In the product every rule is decided on the server from `Access.kind`
// and the resident's consent flags; the client only renders what it's sent. The demo
// centralises the same rules here so switching the viewer re-renders every view:
//   D-004  cognitive measures (incl. warmth) are hidden from their subject
//   D-011  the resident does see their own portrait
//   D-021/026/027  audio and exact words depend on the resident's sharing consent
//   D-024  only the resident and family edit life chapters
//   D-028  assignee, care level and "Try" suggestions go to community roles only
//   D-031  biosketch views by viewer

export type ViewerKind = 'self' | 'family' | 'staff' | 'leadership'

export const VIEWERS: { kind: ViewerKind; label: string; blurb: string }[] = [
  { kind: 'self', label: 'The resident', blurb: 'Her own memories, in her own words' },
  { kind: 'family', label: 'Family member', blurb: 'A daughter with a family grant' },
  { kind: 'staff', label: 'Community staff', blurb: 'Her assigned caregiver' },
  { kind: 'leadership', label: 'Community leadership', blurb: 'Executive director' },
]

export interface Consent {
  staff: boolean
  family: boolean
}

export type BiosketchView = 'caregiver' | 'family' | 'clinical'

export const isOrgRole = (k: ViewerKind) => k === 'staff' || k === 'leadership'

export function canHearAndRead(k: ViewerKind, c: Consent) {
  if (k === 'self') return true
  return isOrgRole(k) ? c.staff : c.family
}

export function notSharedReason(k: ViewerKind) {
  return isOrgRole(k)
    ? "This person hasn't chosen to share their conversations with the care team."
    : "This person hasn't chosen to share their conversations with family."
}

export function biosketchViews(k: ViewerKind): { views: BiosketchView[]; opensOn: BiosketchView } {
  switch (k) {
    case 'self':
      return { views: ['family'], opensOn: 'family' }
    case 'family':
      return { views: ['family', 'clinical'], opensOn: 'family' }
    case 'staff':
      return { views: ['caregiver', 'family', 'clinical'], opensOn: 'caregiver' }
    case 'leadership':
      return { views: ['caregiver', 'family', 'clinical'], opensOn: 'clinical' }
  }
}

export const VIEW_LABEL: Record<BiosketchView, string> = {
  caregiver: 'Caregiver',
  family: 'Family',
  clinical: 'Resident services & clinical',
}

export const mayEditChapters = (k: ViewerKind) => k === 'self' || k === 'family'
export const mayAcknowledge = (k: ViewerKind) => isOrgRole(k)
export const seesTry = (k: ViewerKind) => isOrgRole(k)
export const seesAssignee = (k: ViewerKind) => isOrgRole(k)
export const seesBriefing = (k: ViewerKind) => isOrgRole(k)
export const seesCareConsole = (k: ViewerKind) => isOrgRole(k)
export const mayEditCommunityApproach = (k: ViewerKind) => k === 'leadership'
export const writableGuidanceKinds = (k: ViewerKind) =>
  k === 'self' ? (['steer_around'] as const) : (['communication', 'preference', 'tone', 'emotional_state', 'steer_around'] as const)

export const GUIDANCE_KIND_LABEL: Record<string, string> = {
  communication: 'Communication',
  preference: 'Preference',
  tone: 'Tone',
  emotional_state: 'Emotional state',
  steer_around: 'Steer around',
}

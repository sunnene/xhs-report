export interface Note {
  id: string
  title: string
  type: '视频' | '图文'
  exposure: number
  view: number
  clickRate: number
  like: number
  comment: number
  collect: number
  share: number
  followers: number
  date?: string
  tags?: string[]
  paid?: number | string
  exposureAmount?: number
  play?: number
  read?: number
  cost?: number
  paidCost?: number
}

export interface ContentStats {
  count: number
  exposure: number
  view: number
  like: number
  comment: number
}

export interface Stats {
  totalExposure: number
  totalView: number
  totalInteraction: number
  newFollowers: number
  totalFollowers: number
}

export interface OperationAdviceType {
  keep: string[]
  optimize: string[]
}

export interface TagStats {
  tag: string
  noteCount: number
  like: number
  comment: number
  collect: number
  share: number
  totalInteraction: number
  noteCountPercentage: number
  interactionPercentage: number
  exposure: number
  read: number
  cost: number
  costPercentage: number
  paidExposure: number
  paidExposurePercentage: number
  paidRead: number
  paidReadPercentage: number
  paidInteraction: number
  paidInteractionPercentage: number
  organicExposure: number
  organicRead: number
  organicInteraction: number
}

export interface CommentAnalysis {
  totalCount: number
  positiveCount: number
  negativeCount: number
  neutralCount: number
  productRelatedCount: number
  positiveRate: number
  negativeRate: number
  productRate: number
  topKeywords: { keyword: string; count: number; percentage: number }[]
  topWords?: { word: string; count: number; percentage: number }[]
  positiveExamples: string[]
  negativeExamples: string[]
  productRelatedExamples?: string[]
  conclusion: string
}

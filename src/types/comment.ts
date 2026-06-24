export interface Comment {
  id: string
  content: string
  noteTitle?: string
  date?: string
  sentiment: 'positive' | 'negative' | 'neutral'
  keywords: string[]
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
  conclusion?: string
}

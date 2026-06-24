import * as XLSX from 'xlsx'
import type { Comment, CommentAnalysis } from '@/types/comment'

const POSITIVE_WORDS: Record<string, number> = {
  '好': 2, '棒': 3, '赞': 3, '喜欢': 3, '爱': 3, '推荐': 3, '满意': 3, '优秀': 3, '完美': 4, '漂亮': 2,
  '好用': 3, '好看': 2, '实惠': 3, '划算': 3, '超值': 4, '惊喜': 3, '开心': 2, '感谢': 2, '不错': 2,
  '可以': 1, '厉害': 3, '专业': 3, '贴心': 3, '细心': 2, '周到': 3, '热情': 2, '耐心': 2, '感动': 3,
  '精彩': 3, '出色': 3, '给力': 3, '靠谱': 3, '顺畅': 2, '方便': 3, '快捷': 3, '舒适': 2, '值得': 3,
  '帮助': 2, '解决': 3, '改善': 3, '提升': 3, '稳定': 2, '流畅': 2, '清晰': 2, '实用': 3,
  '性价比高': 4, '物超所值': 4, '超出预期': 4, '非常满意': 4, '强烈推荐': 4, '真的不错': 3, '太好了': 3,
  '太棒了': 4, '很满意': 3, '很喜欢': 3, '很好用': 3, '很方便': 3, '很贴心': 3, '很专业': 3,
  '值得购买': 4, '回购': 4, '复购': 4, '忠实粉': 4, '铁粉': 4, '好评': 3, '五星': 4, '满分': 4,
  '惊艳': 4, '感恩': 2, '有用': 2, '有效': 3, '效果好': 4,
  '质量好': 4, '服务好': 4, '体验好': 4, '速度快': 3, '效率高': 3, '态度好': 3, '响应快': 3,
  '没问题': 2, '顺利': 2, '成功': 2, '完美解决': 4, '推荐给朋友': 4, '分享': 2, '收藏': 2
}

const NEGATIVE_WORDS: Record<string, number> = {
  '差': 3, '烂': 4, '坑': 4, '垃圾': 4, '失望': 3, '糟糕': 3, '无语': 3, '投诉': 4, '差评': 4, '问题': 2,
  '不好': 2, '不行': 2, '失败': 3, '浪费': 3, '后悔': 3, '欺骗': 4, '虚假': 4, '质量': 2, '破损': 3,
  '慢': 2, '贵': 2, '不值': 3, '麻烦': 2, '复杂': 2, '难用': 3, '难看': 2, '恶心': 4, '生气': 3,
  '故障': 3, '错误': 3, '无法': 2, '不能': 2, '没效果': 3, '不推荐': 3, '千万别': 4, '别买': 4,
  '上当': 4, '受骗': 4, '误导': 3, '延迟': 2, '卡顿': 3, '崩溃': 4, '闪退': 4, '加载慢': 3, '登录不上': 4,
  '联系不上': 4, '态度差': 4, '服务差': 4, '售后差': 4, '客服差': 4, '不回复': 3, '不解决': 3,
  '有问题': 3, '出问题': 3, '坏了': 3, '断了': 3, '破了': 3, '少了': 3, '漏了': 3, '错了': 3,
  '太贵了': 3, '不值钱': 3, '质量差': 4, '体验差': 4, '效果差': 4, '很失望': 3, '很后悔': 3, '很生气': 3,
  '太差': 4, '不满': 2, '抱怨': 2, '吐槽': 2,
  '坑人': 4, '骗人': 4, '假货': 4, '水货': 3, '退货': 3, '退款': 3, '维权': 3, '拉黑': 3, '抵制': 3,
  '很差': 3, '非常差': 4, '极其差': 4, '完全不行': 4, '根本没用': 4, '毫无效果': 4, '浪费时间': 3,
  '浪费钱': 3, '不值这个价': 3, '欺骗消费者': 4, '虚假宣传': 4, '夸大其词': 3, '名不副实': 3
}

const NEGATION_WORDS = ['不', '没', '无', '非', '别', '勿', '不要', '没有', '不能', '不会', '不是']

const DEFAULT_PRODUCT_KEYWORDS = [
  '产品', '服务', '质量', '价格', '体验', '效果', '功能', '设计', '包装', '物流',
  '客服', '售后', '配送', '安装', '使用', '操作', '性能', '性价比', '品质',
  '速度', '效率', '安全', '稳定', '可靠', '耐用', '持久', '便携', '美观',
  '界面', '交互', '响应', '流畅', '兼容', '适配', '更新', '维护', '优化'
]

export function parseCommentFile(file: File): Promise<Comment[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        
        let workbook: XLSX.WorkBook
        if (file.name.toLowerCase().endsWith('.csv')) {
          workbook = XLSX.read(data as string, { type: 'string' })
        } else {
          workbook = XLSX.read(data as ArrayBuffer, { type: 'array' })
        }
        
        if (workbook.SheetNames.length === 0) {
          reject(new Error('文件中没有工作表'))
          return
        }
        
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as (string | number)[][]
        
        const comments = parseCommentData(jsonData)
        resolve(comments)
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : '未知错误'
        reject(new Error(`解析评论文件失败: ${errMsg}`))
      }
    }
    
    reader.onerror = () => {
      reject(new Error('读取文件失败'))
    }
    
    if (file.name.toLowerCase().endsWith('.csv')) {
      reader.readAsText(file, 'UTF-8')
    } else {
      reader.readAsArrayBuffer(file)
    }
  })
}

function parseCommentData(jsonData: (string | number)[][]): Comment[] {
  if (!jsonData || jsonData.length < 2) {
    throw new Error('文件内容为空或格式不正确')
  }
  
  let headerRowIndex = 0
  let maxScore = 0
  
  for (let i = 0; i < Math.min(10, jsonData.length); i++) {
    const row = jsonData[i]
    if (!row) continue
    
    let score = 0
    for (const cell of row) {
      const cellStr = String(cell ?? '').toLowerCase().trim()
      if (cellStr.includes('评论') || cellStr.includes('内容')) score += 2
      if (cellStr.includes('时间') || cellStr.includes('日期')) score += 1
      if (cellStr.includes('标题') || cellStr.includes('笔记')) score += 1
    }
    
    if (score > maxScore) {
      maxScore = score
      headerRowIndex = i
    }
  }
  
  const headers = jsonData[headerRowIndex].map(h => String(h ?? '').trim())
  
  const contentIndex = headers.findIndex(h => 
    h.toLowerCase().includes('评论') || h.toLowerCase().includes('内容') ||
    h.toLowerCase().includes('留言') || h.toLowerCase().includes('回复')
  )
  const noteIndex = headers.findIndex(h => 
    h.toLowerCase().includes('标题') || h.toLowerCase().includes('笔记') ||
    h.toLowerCase().includes('文章') || h.toLowerCase().includes('内容标题')
  )
  const dateIndex = headers.findIndex(h => 
    h.toLowerCase().includes('时间') || h.toLowerCase().includes('日期') ||
    h.toLowerCase().includes('发布') || h.toLowerCase().includes('发表')
  )
  
  if (contentIndex === -1) {
    throw new Error(`未找到评论内容列。当前表头：${headers.join(', ')}`)
  }
  
  const comments: Comment[] = []
  
  for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
    const row = jsonData[i]
    if (!row) continue
    
    const content = String(row[contentIndex] ?? '').trim()
    if (!content || content.length < 2) continue
    
    const sentiment = analyzeSentiment(content)
    const keywords = extractKeywords(content)
    
    comments.push({
      id: `comment-${i}`,
      content,
      noteTitle: noteIndex !== -1 ? String(row[noteIndex] ?? '').trim() : undefined,
      date: dateIndex !== -1 ? String(row[dateIndex] ?? '').trim() : undefined,
      sentiment,
      keywords
    })
  }
  
  if (comments.length === 0) {
    throw new Error('没有找到有效评论数据')
  }
  
  return comments
}

function analyzeSentiment(content: string): 'positive' | 'negative' | 'neutral' {
  let positiveScore = 0
  let negativeScore = 0
  
  const words = tokenize(content)
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i]
    const lowerWord = word.toLowerCase()
    
    let hasNegation = false
    for (let j = Math.max(0, i - 2); j < i; j++) {
      if (NEGATION_WORDS.includes(words[j])) {
        hasNegation = true
        break
      }
    }
    
    if (POSITIVE_WORDS[lowerWord]) {
      const score = POSITIVE_WORDS[lowerWord]
      if (hasNegation) {
        negativeScore += score
      } else {
        positiveScore += score
      }
    }
    
    if (NEGATIVE_WORDS[lowerWord]) {
      const score = NEGATIVE_WORDS[lowerWord]
      if (hasNegation) {
        positiveScore += score
      } else {
        negativeScore += score
      }
    }
  }
  
  const absPositive = positiveScore
  const absNegative = negativeScore
  
  if (absPositive > 0 && absNegative === 0) {
    return 'positive'
  }
  if (absNegative > 0 && absPositive === 0) {
    return 'negative'
  }
  if (absPositive > absNegative * 2) {
    return 'positive'
  }
  if (absNegative > absPositive * 2) {
    return 'negative'
  }
  if (absPositive > absNegative * 1.5) {
    return 'positive'
  }
  if (absNegative > absPositive * 1.5) {
    return 'negative'
  }
  
  if (absPositive === absNegative && absPositive > 0) {
    return 'neutral'
  }
  
  const positivePatterns = ['太好了', '太棒了', '非常满意', '强烈推荐', '物超所值', '超出预期', '完美', '惊艳']
  const negativePatterns = ['太差了', '垃圾', '很失望', '很后悔', '千万别买', '别买', '上当', '受骗', '虚假宣传']
  
  for (const pattern of positivePatterns) {
    if (content.includes(pattern)) {
      return 'positive'
    }
  }
  
  for (const pattern of negativePatterns) {
    if (content.includes(pattern)) {
      return 'negative'
    }
  }
  
  return 'neutral'
}

function tokenize(text: string): string[] {
  const tokens: string[] = []
  let remaining = text
  
  const wordPattern = /[\u4e00-\u9fa5]{2,}|[a-zA-Z]+/g
  let match
  
  while ((match = wordPattern.exec(remaining)) !== null) {
    tokens.push(match[0])
  }
  
  for (const char of text) {
    if (/[\u4e00-\u9fa5]/.test(char)) {
      tokens.push(char)
    }
  }
  
  return tokens
}

function extractKeywords(content: string): string[] {
  const keywords: string[] = []
  const lowerContent = content.toLowerCase()
  
  for (const word of Object.keys(POSITIVE_WORDS)) {
    if (lowerContent.includes(word)) {
      keywords.push(word)
    }
  }
  
  for (const word of Object.keys(NEGATIVE_WORDS)) {
    if (lowerContent.includes(word)) {
      keywords.push(word)
    }
  }
  
  return [...new Set(keywords)]
}

export function analyzeComments(comments: Comment[], customProductKeywords: string[] = []): CommentAnalysis {
  const totalCount = comments.length
  const positiveCount = comments.filter(c => c.sentiment === 'positive').length
  const negativeCount = comments.filter(c => c.sentiment === 'negative').length
  const neutralCount = comments.filter(c => c.sentiment === 'neutral').length
  
  const allProductKeywords = [...DEFAULT_PRODUCT_KEYWORDS, ...customProductKeywords]
  const productRelatedCount = comments.filter(c => {
    const lowerContent = c.content.toLowerCase()
    return allProductKeywords.some(k => lowerContent.includes(k.toLowerCase()))
  }).length
  
  const wordCount: Record<string, number> = {}
  comments.forEach(comment => {
    const words = comment.content.replace(/[，,。.、；;！!？?]/g, ' ').split(/\s+/).filter(w => w.length >= 2)
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1
    })
  })
  
  const totalWordCount = Object.values(wordCount).reduce((sum, count) => sum + count, 0)
  const topWords = Object.entries(wordCount)
    .map(([word, count]) => ({ word, count, percentage: totalWordCount > 0 ? Math.round((count / totalWordCount) * 100) : 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
  
  const keywordCount: Record<string, number> = {}
  comments.forEach(comment => {
    comment.keywords.forEach(keyword => {
      keywordCount[keyword] = (keywordCount[keyword] || 0) + 1
    })
  })
  
  const totalKeywordCount = Object.values(keywordCount).reduce((sum, count) => sum + count, 0)
  const topKeywords = Object.entries(keywordCount)
    .map(([keyword, count]) => ({ keyword, count, percentage: totalKeywordCount > 0 ? Math.round((count / totalKeywordCount) * 100) : 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
  
  const positiveExamples = comments
    .filter(c => c.sentiment === 'positive')
    .slice(0, 5)
    .map(c => c.content)
  
  const negativeExamples = comments
    .filter(c => c.sentiment === 'negative')
    .slice(0, 5)
    .map(c => c.content)
  
  const productRelatedExamples = comments.filter(c => {
    const lowerContent = c.content.toLowerCase()
    return allProductKeywords.some(k => lowerContent.includes(k.toLowerCase()))
  }).slice(0, 5).map(c => c.content)
  
  const conclusion = generateConclusion({
    totalCount,
    positiveCount,
    negativeCount,
    neutralCount,
    productRelatedCount,
    positiveRate: totalCount > 0 ? Math.round((positiveCount / totalCount) * 100) : 0,
    negativeRate: totalCount > 0 ? Math.round((negativeCount / totalCount) * 100) : 0,
    productRate: totalCount > 0 ? Math.round((productRelatedCount / totalCount) * 100) : 0,
    topKeywords
  })
  
  return {
    totalCount,
    positiveCount,
    negativeCount,
    neutralCount,
    productRelatedCount,
    positiveRate: totalCount > 0 ? Math.round((positiveCount / totalCount) * 100) : 0,
    negativeRate: totalCount > 0 ? Math.round((negativeCount / totalCount) * 100) : 0,
    productRate: totalCount > 0 ? Math.round((productRelatedCount / totalCount) * 100) : 0,
    topWords,
    topKeywords,
    positiveExamples,
    negativeExamples,
    productRelatedExamples,
    conclusion
  }
}

interface ConclusionData {
  totalCount: number
  positiveCount: number
  negativeCount: number
  neutralCount: number
  productRelatedCount: number
  positiveRate: number
  negativeRate: number
  productRate: number
  topKeywords: { keyword: string; count: number }[]
}

function generateConclusion(data: ConclusionData): string {
  const parts: string[] = []
  
  parts.push(`本次共分析了 ${data.totalCount} 条评论。`)
  
  if (data.positiveRate >= 70 && data.negativeRate <= 10) {
    parts.push(`整体情绪倾向非常积极，正面评论占比 ${data.positiveRate}%，负面反馈极少。`)
  } else if (data.positiveRate >= 50) {
    parts.push(`整体情绪倾向积极，正面评论占比 ${data.positiveRate}%，负面评论占比 ${data.negativeRate}%。`)
  } else if (data.positiveRate >= 30) {
    parts.push(`整体情绪偏中性，正面评论占比 ${data.positiveRate}%，负面评论占比 ${data.negativeRate}%，需关注用户反馈。`)
  } else {
    parts.push(`整体情绪偏负面，正面评论占比 ${data.positiveRate}%，负面评论占比 ${data.negativeRate}%，建议重点关注并改进。`)
  }
  
  if (data.productRate >= 50) {
    parts.push(`有 ${data.productRate}% 的评论涉及产品力相关话题，说明用户较为关注产品本身。`)
  }
  
  if (data.topKeywords.length > 0) {
    const top3Keywords = data.topKeywords.slice(0, 3).map(k => k.keyword).join('、')
    parts.push(`用户讨论最多的关键词是：${top3Keywords}。`)
  }
  
  parts.push('建议：继续保持优势方面，针对负面反馈集中的问题进行优化改进。')
  
  return parts.join(' ')
}

export { DEFAULT_PRODUCT_KEYWORDS }

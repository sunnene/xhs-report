import * as XLSX from 'xlsx'
import type { Note } from '@/types'

export function parseExcel(file: File): Promise<Note[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: 'array' })
        
        if (workbook.SheetNames.length === 0) {
          reject(new Error('Excel文件中没有工作表'))
          return
        }
        
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        
        if (!worksheet) {
          reject(new Error('无法读取工作表内容'))
          return
        }
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          defval: '',
          blankrows: false
        }) as (string | number | boolean | undefined)[][]
        
        const notes = parseJsonData(jsonData)
        resolve(notes)
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : '未知错误'
        reject(new Error(`解析Excel文件失败: ${errMsg}`))
      }
    }
    
    reader.onerror = () => {
      reject(new Error('读取文件失败，请检查文件是否损坏'))
    }
    
    reader.onabort = () => {
      reject(new Error('文件读取被中止'))
    }
    
    reader.readAsArrayBuffer(file)
  })
}

export function parseCsv(file: File): Promise<Note[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        
        if (!text || text.trim().length === 0) {
          reject(new Error('CSV文件内容为空'))
          return
        }
        
        const workbook = XLSX.read(text, { type: 'string' })
        
        if (workbook.SheetNames.length === 0) {
          reject(new Error('无法解析CSV内容'))
          return
        }
        
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          defval: '',
          blankrows: false
        }) as (string | number | boolean | undefined)[][]
        
        const notes = parseJsonData(jsonData)
        resolve(notes)
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : '未知错误'
        reject(new Error(`解析CSV文件失败: ${errMsg}`))
      }
    }
    
    reader.onerror = () => {
      reject(new Error('读取文件失败，请检查文件是否损坏或编码是否正确'))
    }
    
    reader.onabort = () => {
      reject(new Error('文件读取被中止'))
    }
    
    reader.readAsText(file, 'UTF-8')
  })
}

const COLUMN_KEYWORDS: Record<string, string[]> = {
  title: ['标题', '笔记标题', '内容标题', '笔记', '内容'],
  type: ['体裁', '类型', '内容类型', '形式', '作品类型'],
  exposure: ['曝光', '曝光量', '曝光次数', '展现', '展现量', '流量'],
  view: ['观看', '观看量', '播放', '播放量', '浏览', '浏览量', '阅读', '阅读量'],
  clickRate: ['点击', '点击率', '封面点击率', '点击量'],
  like: ['点赞', '点赞数', '喜欢', '点赞量'],
  comment: ['评论', '评论数', '留言', '留言数', '评论量'],
  collect: ['收藏', '收藏数', '收藏量'],
  share: ['分享', '分享数', '转发', '转发数', '分享量'],
  followers: ['涨粉', '粉丝增长', '新增粉丝', '新增关注', '关注量', '粉丝增加', '粉丝数', '新粉', '净增粉丝', '涨粉数'],
  date: ['时间', '发布时间', '首次发布时间', '日期', '发布日期', '日期时间']
}

function normalizeHeader(header: string): string {
  let result = String(header ?? '').trim()
  
  result = result.replace(/[\u00A0\u200B]/g, '')
  result = result.replace(/[\(\)（）【】]/g, '')
  result = result.replace(/\s+/g, '')
  
  return result.toLowerCase()
}

function findColumnIndex(headers: string[], keywords: string[]): number {
  for (let i = 0; i < headers.length; i++) {
    const normalized = normalizeHeader(headers[i])
    for (const keyword of keywords) {
      if (normalized.includes(keyword.toLowerCase())) {
        return i
      }
    }
  }
  return -1
}

function parseJsonData(jsonData: (string | number | boolean | undefined)[][]): Note[] {
  if (!jsonData || jsonData.length < 2) {
    throw new Error('文件内容为空或格式不正确，至少需要包含表头和一行数据')
  }
  
  let headerRowIndex = 0
  
  for (let i = 0; i < Math.min(5, jsonData.length); i++) {
    const row = jsonData[i]
    if (row && row.some(cell => {
      const val = String(cell ?? '').trim().toLowerCase()
      return val.includes('标题') || val.includes('曝光') || val.includes('观看')
    })) {
      headerRowIndex = i
      break
    }
  }
  
  const headers = jsonData[headerRowIndex].map(h => String(h ?? '').trim())
  
  if (headers.every(h => h === '')) {
    throw new Error('无法识别表头，请确保第一行包含列标题')
  }
  
  const titleIndex = findColumnIndex(headers, COLUMN_KEYWORDS.title)
  const typeIndex = findColumnIndex(headers, COLUMN_KEYWORDS.type)
  const exposureIndex = findColumnIndex(headers, COLUMN_KEYWORDS.exposure)
  const viewIndex = findColumnIndex(headers, COLUMN_KEYWORDS.view)
  const clickRateIndex = findColumnIndex(headers, COLUMN_KEYWORDS.clickRate)
  const likeIndex = findColumnIndex(headers, COLUMN_KEYWORDS.like)
  const commentIndex = findColumnIndex(headers, COLUMN_KEYWORDS.comment)
  const collectIndex = findColumnIndex(headers, COLUMN_KEYWORDS.collect)
  const shareIndex = findColumnIndex(headers, COLUMN_KEYWORDS.share)
  const followersIndex = findColumnIndex(headers, COLUMN_KEYWORDS.followers)
  const dateIndex = findColumnIndex(headers, COLUMN_KEYWORDS.date)
  
  const missingColumns: string[] = []
  if (titleIndex === -1) missingColumns.push('标题')
  if (exposureIndex === -1) missingColumns.push('曝光')
  if (viewIndex === -1) missingColumns.push('观看/播放')
  
  if (missingColumns.length > 0) {
    throw new Error(`缺少必要的列: ${missingColumns.join('、')}\n当前表头: ${headers.join(' | ')}`)
  }
  
  const notes: Note[] = []
  
  for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
    const row = jsonData[i]
    
    if (!row) continue
    
    if (row.every(cell => {
      const val = String(cell ?? '').trim()
      return val === '' || val === '0'
    })) {
      continue
    }
    
    const title = String(row[titleIndex] ?? '').trim()
    
    if (!title || title.length < 2) continue
    
    const exposure = toNumber(row[exposureIndex])
    const view = toNumber(row[viewIndex])
    
    let clickRate = 0
    if (clickRateIndex !== -1) {
      clickRate = toNumber(row[clickRateIndex])
    } else if (exposure > 0) {
      clickRate = Math.round((view / exposure) * 1000) / 10
    }
    
    notes.push({
      id: `note-${i}`,
      title,
      type: typeIndex !== -1 && String(row[typeIndex] ?? '').trim() === '视频' ? '视频' : '图文',
      exposure,
      view,
      clickRate,
      like: likeIndex !== -1 ? toNumber(row[likeIndex]) : 0,
      comment: commentIndex !== -1 ? toNumber(row[commentIndex]) : 0,
      collect: collectIndex !== -1 ? toNumber(row[collectIndex]) : 0,
      share: shareIndex !== -1 ? toNumber(row[shareIndex]) : 0,
      followers: followersIndex !== -1 ? toNumber(row[followersIndex]) : 0,
      date: dateIndex !== -1 ? String(row[dateIndex] ?? '').trim() : undefined
    })
  }
  
  if (notes.length === 0) {
    throw new Error('文件中没有有效数据，请检查数据格式')
  }
  
  return notes
}

function toNumber(value: string | number | boolean | undefined | null): number {
  if (value === undefined || value === null) return 0
  if (typeof value === 'number') return value
  if (typeof value === 'boolean') return value ? 1 : 0
  
  const strValue = String(value).trim()
  if (strValue === '') return 0
  
  const num = parseFloat(strValue.replace(/,/g, ''))
  return isNaN(num) ? 0 : num
}

export function parseFile(file: File): Promise<Note[]> {
  const fileName = file.name.toLowerCase()
  
  if (fileName.endsWith('.csv')) {
    return parseCsv(file)
  } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    return parseExcel(file)
  } else {
    const ext = fileName.split('.').pop()
    return Promise.reject(new Error(`不支持的文件格式: .${ext}，请上传CSV或Excel文件（.csv, .xlsx, .xls）`))
  }
}

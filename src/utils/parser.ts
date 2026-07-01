import * as XLSX from 'xlsx'
import type { Note } from '@/types'

export const COLUMN_KEYWORDS: Record<string, string[]> = {
  title: ['笔记标题', '标题', '内容标题', '内容', '文案', '笔记', '名称', '作品', '帖子', '动态', '主题'],
  type: ['体裁', '类型', '内容类型', '形式', '视频/图文', '格式'],
  exposure: ['曝光', '曝光量', '曝光次数', '展现', '展现量', '流量', '曝光数'],
  view: ['观看量', '观看', '播放量', '播放', '浏览量', '浏览', '阅读量', '阅读', '播放次数'],
  clickRate: ['封面点击率', '点击率', '点击量', '点击转化率', '封面点击', '点击'],
  followers: ['涨粉', '关注量', '新增粉丝', '新增关注', '净增粉丝', '涨粉量', '增粉', '粉丝增长', '粉丝增加', '新增粉', '涨粉数', '粉丝增量'],
  like: ['点赞', '点赞数', '喜欢', '赞', '爱心', '点赞量'],
  comment: ['评论', '评论数', '留言', '回复', '评论量'],
  collect: ['收藏', '收藏数', '保存', '收藏量'],
  share: ['分享', '分享数', '转发', '分享量'],
  date: ['首次发布时间', '发布时间', '时间', '日期', '发布日期', '周期'],
  tags: ['标签', '自定义标签', '分类标签', '关键词', '话题', '分类']
}

export function normalizeHeader(header: string): string {
  return String(header ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\u00A0\s]/g, '')
    .replace(/[（）]/g, '')
    .replace(/[()]/g, '')
    .replace(/：/g, '')
    .replace(/:/g, '')
    .replace(/【/g, '')
    .replace(/】/g, '')
    .replace(/"/g, '')
    .replace(/'/g, '')
    .replace(/。/g, '')
    .replace(/·/g, '')
    .replace(/\n/g, '')
    .replace(/\r/g, '')
    .replace(/\t/g, '')
}

export function findColumnIndex(headers: string[], keywords: string[]): number {
  for (let i = 0; i < headers.length; i++) {
    const header = String(headers[i] ?? '').trim()
    const headerLower = header.toLowerCase()
    
    for (const keyword of keywords) {
      const keywordLower = keyword.toLowerCase()
      
      if (headerLower === keywordLower) {
        return i
      }
      
      if (headerLower.includes(keywordLower) && keyword.length >= 2) {
        return i
      }
    }
  }
  return -1
}

export function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0
  if (typeof value === 'number') {
    if (isNaN(value)) return 0
    return value
  }
  const strValue = String(value)
    .replace(/,/g, '')
    .replace(/，/g, '')
    .replace(/\s/g, '')
    .replace(/万/g, '0000')
    .replace(/W/g, '0000')
    .replace(/w/g, '0000')
    .replace(/\.0+$/, '')
    .replace(/%/g, '')
    .trim()
  if (strValue === '') return 0
  if (strValue === '-') return 0
  if (strValue === '—') return 0
  if (strValue === '–') return 0
  const num = parseFloat(strValue)
  return isNaN(num) ? 0 : num
}

function tryParseDate(dateStr: string): string {
  const trimmed = dateStr.trim()
  if (trimmed.match(/^\d{4}-\d{2}-\d{2}/)) return trimmed
  if (trimmed.match(/^\d{4}\/\d{2}\/\d{2}/)) return trimmed
  if (trimmed.match(/^\d{2}\/\d{2}/)) return `2026-${trimmed}`
  if (trimmed.match(/^\d{1,2}月\d{1,2}日/)) return trimmed
  if (trimmed.match(/周\d/)) return trimmed
  if (trimmed.match(/\d{4}/)) return trimmed
  return trimmed
}

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
          blankrows: false,
          raw: false
        }) as (string | number)[][]
        
        console.log('📊 Excel原始数据行数:', jsonData.length)
        console.log('📊 Excel前3行:', JSON.stringify(jsonData.slice(0, 3), null, 2))
        
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
        
        console.log('📄 CSV原始内容前1000字符:', text.substring(0, 1000))
        
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
          blankrows: false,
          raw: false
        }) as (string | number)[][]
        
        console.log('📊 CSV解析结果行数:', jsonData.length)
        console.log('📊 CSV前3行:', JSON.stringify(jsonData.slice(0, 3), null, 2))
        
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

function parseJsonData(jsonData: (string | number)[][]): Note[] {
  if (!jsonData || jsonData.length < 1) {
    throw new Error('文件内容为空或格式不正确')
  }
  
  console.log('🔍 开始解析JSON数据，总行数:', jsonData.length)
  
  let headerRowIndex = 0
  let maxScore = 0
  
  for (let i = 0; i < Math.min(30, jsonData.length); i++) {
    const row = jsonData[i]
    if (!row) continue
    
    let score = 0
    
    for (const cell of row) {
      if (!cell) continue
      const cellStr = String(cell).toLowerCase().trim()
      if (!cellStr) continue
      
      for (const keywords of Object.values(COLUMN_KEYWORDS)) {
        for (const keyword of keywords) {
          if (cellStr === keyword.toLowerCase()) {
            score += 5
            break
          }
          if (cellStr.includes(keyword.toLowerCase())) {
            score += 2
            break
          }
        }
      }
    }
    
    console.log(`📝 第${i+1}行得分: ${score} (列数: ${row.length})`)
    
    if (score > maxScore || (score === maxScore && row.length > (jsonData[headerRowIndex]?.length || 0))) {
      maxScore = score
      headerRowIndex = i
    }
  }
  
  console.log(`🎯 识别到表头在第${headerRowIndex+1}行`)
  
  const headers = jsonData[headerRowIndex].map((h, index) => ({
    original: String(h ?? '').trim(),
    normalized: normalizeHeader(String(h ?? '')),
    index
  }))
  
  console.log('📋 表头内容:', headers.map((h, i) => `${i+1}: "${h.original}"`).join(', '))
  
  const columnMapping: Record<string, number> = {}
  const foundColumns: string[] = []
  
  const usedColumns = new Set<number>()
  
  const fieldOrder = ['title', 'date', 'type', 'exposure', 'view', 'clickRate', 'like', 'comment', 'collect', 'share', 'followers', 'tags']
  
  for (const field of fieldOrder) {
    const keywords = COLUMN_KEYWORDS[field]
    const index = findColumnIndex(headers.map(h => h.original), keywords)
    if (index !== -1 && !usedColumns.has(index)) {
      columnMapping[field] = index
      foundColumns.push(headers[index].original)
      usedColumns.add(index)
      console.log(`✅ 找到字段 "${field}" 在第${index+1}列: "${headers[index].original}"`)
    }
  }
  
  console.log(`🔍 总共找到 ${foundColumns.length} 个字段: ${foundColumns.join(', ')}`)
  
  if (foundColumns.length === 0) {
    const allHeaders = headers.map((h, i) => `${i+1}: "${h.original}"`).join('\n')
    throw new Error(`未识别到任何数据列。\n\n支持的关键字段：\n${Object.keys(COLUMN_KEYWORDS).join('、')}\n\n当前表格的表头（共${headers.length}列）：\n${allHeaders}`)
  }
  
  const notes: Note[] = []
  const titleIndex = columnMapping.title
  const typeIndex = columnMapping.type
  const exposureIndex = columnMapping.exposure
  const viewIndex = columnMapping.view
  const clickRateIndex = columnMapping.clickRate
  const likeIndex = columnMapping.like
  const commentIndex = columnMapping.comment
  const collectIndex = columnMapping.collect
  const shareIndex = columnMapping.share
  const followersIndex = columnMapping.followers
  const dateIndex = columnMapping.date
  const tagsIndex = columnMapping.tags
  
  for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
    const row = jsonData[i]
    if (!row) continue
    
    let hasAnyContent = false
    
    for (const cell of row) {
      if (cell !== null && cell !== undefined) {
        const str = String(cell).trim()
        if (str !== '') {
          hasAnyContent = true
          break
        }
      }
    }
    
    if (!hasAnyContent) continue
    
    const rowData: Partial<Note> = {
      id: `note-${i}`
    }
    
    if (titleIndex !== undefined) {
      const title = String(row[titleIndex] ?? '').trim()
      rowData.title = title || `笔记 ${notes.length + 1}`
    } else {
      rowData.title = `笔记 ${notes.length + 1}`
    }
    
    if (typeIndex !== undefined) {
      const typeStr = String(row[typeIndex] ?? '').trim()
      rowData.type = typeStr === '视频' || typeStr.includes('视频') || typeStr.toLowerCase().includes('video') ? '视频' : '图文'
    } else {
      rowData.type = '图文'
    }
    
    rowData.exposure = exposureIndex !== undefined ? toNumber(row[exposureIndex]) : 0
    rowData.view = viewIndex !== undefined ? toNumber(row[viewIndex]) : 0
    rowData.clickRate = clickRateIndex !== undefined ? toNumber(row[clickRateIndex]) : 0
    rowData.like = likeIndex !== undefined ? toNumber(row[likeIndex]) : 0
    rowData.comment = commentIndex !== undefined ? toNumber(row[commentIndex]) : 0
    rowData.collect = collectIndex !== undefined ? toNumber(row[collectIndex]) : 0
    rowData.share = shareIndex !== undefined ? toNumber(row[shareIndex]) : 0
    rowData.followers = followersIndex !== undefined ? toNumber(row[followersIndex]) : 0
    
    if (dateIndex !== undefined) {
      const date = String(row[dateIndex] ?? '').trim()
      if (date) {
        rowData.date = tryParseDate(date)
      }
    }
    
    if (tagsIndex !== undefined) {
      const tagsStr = String(row[tagsIndex] ?? '').trim()
      rowData.tags = tagsStr ? tagsStr.split(/[,，;；、\s]+/).filter(t => t.trim()) : undefined
    }
    
    notes.push(rowData as Note)
  }
  
  console.log(`✅ 解析成功：共解析 ${notes.length} 行数据，识别到 ${foundColumns.length} 个字段`)
  
  return notes
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

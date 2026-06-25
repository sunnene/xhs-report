import * as XLSX from 'xlsx'
import type { Note } from '@/types'

export const COLUMN_KEYWORDS: Record<string, string[]> = {
  title: ['标题', '笔记标题', '内容标题', '内容', '文案', '笔记', '名称'],
  type: ['体裁', '类型', '内容类型', '形式', '视频/图文', '格式', '视频', '图文'],
  exposure: ['曝光', '曝光量', '曝光次数', '展现', '展现量', '流量', '曝光数'],
  view: ['观看', '观看量', '播放', '播放量', '浏览', '浏览量', '阅读', '阅读量', '播放次数'],
  clickRate: ['点击', '点击率', '封面点击率', '点击量', '点击转化率', '点击率%'],
  followers: ['涨粉', '关注量', '新增粉丝', '新增关注', '净增粉丝', '涨粉量', '增粉', '粉丝增长', '粉丝增加', '新增粉', '涨粉数'],
  like: ['点赞', '点赞数', '喜欢', '赞', '爱心', '点赞量'],
  comment: ['评论', '评论数', '留言', '回复', '评论量'],
  collect: ['收藏', '收藏数', '保存', '收藏量'],
  share: ['分享', '分享数', '转发', '分享量'],
  date: ['时间', '发布时间', '首次发布时间', '日期', '发布日期', '周期', '周', '月', '年', '星期', '发布日'],
  tags: ['标签', '自定义标签', '分类标签', '关键词', '话题', '分类', '标签列表']
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
}

export function findColumnIndex(headers: string[], keywords: string[]): number {
  for (let i = 0; i < headers.length; i++) {
    const normalized = normalizeHeader(headers[i])
    for (const keyword of keywords) {
      if (normalized.includes(keyword.toLowerCase()) || keyword.toLowerCase().includes(normalized)) {
        return i
      }
    }
  }
  return -1
}

export function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0
  if (typeof value === 'number') return value
  const strValue = String(value)
    .replace(/,/g, '')
    .replace(/，/g, '')
    .replace(/\s/g, '')
    .trim()
  if (strValue === '') return 0
  const num = parseFloat(strValue)
  return isNaN(num) ? 0 : num
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
          blankrows: false
        }) as (string | number)[][]
        
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
        }) as (string | number)[][]
        
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
  
  let headerRowIndex = -1
  let maxScore = 0
  
  for (let i = 0; i < Math.min(15, jsonData.length); i++) {
    const row = jsonData[i]
    if (!row) continue
    
    let score = 0
    for (const cell of row) {
      const cellStr = String(cell ?? '').toLowerCase().trim()
      for (const keywords of Object.values(COLUMN_KEYWORDS)) {
        for (const keyword of keywords) {
          if (cellStr.includes(keyword.toLowerCase())) {
            score++
            break
          }
        }
      }
    }
    
    if (score > maxScore) {
      maxScore = score
      headerRowIndex = i
    }
  }
  
  if (headerRowIndex === -1) {
    headerRowIndex = 0
  }
  
  const headers = jsonData[headerRowIndex].map((h, index) => ({
    original: String(h ?? '').trim(),
    normalized: normalizeHeader(String(h ?? '')),
    index
  }))
  
  const columnMapping: Record<string, number> = {}
  const foundColumns: string[] = []
  
  for (const [field, keywords] of Object.entries(COLUMN_KEYWORDS)) {
    const index = findColumnIndex(headers.map(h => h.original), keywords)
    if (index !== -1) {
      columnMapping[field] = index
      foundColumns.push(headers[index].original)
    }
  }
  
  const hasAnyData = Object.keys(columnMapping).length > 0
  if (!hasAnyData) {
    throw new Error(`未识别到任何数据列。请确保表格包含以下关键字段之一：标题、曝光、观看、点赞、评论、收藏、分享、日期、标签等。\n\n当前表格的表头：\n${headers.map(h => h.original).join('\n')}`)
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
    
    let rowHasContent = false
    for (const cell of row) {
      if (String(cell ?? '').trim() !== '') {
        rowHasContent = true
        break
      }
    }
    if (!rowHasContent) continue
    
    let hasRowData = false
    const rowData: Partial<Note> = {
      id: `note-${i}`
    }
    
    if (titleIndex !== undefined) {
      const title = String(row[titleIndex] ?? '').trim()
      if (title) {
        rowData.title = title
        hasRowData = true
      }
    } else {
      rowData.title = `笔记 ${i - headerRowIndex}`
      hasRowData = true
    }
    
    if (typeIndex !== undefined) {
      const typeStr = String(row[typeIndex] ?? '').trim()
      rowData.type = typeStr === '视频' || typeStr.includes('视频') ? '视频' : '图文'
    } else {
      rowData.type = '图文'
    }
    
    if (exposureIndex !== undefined) {
      rowData.exposure = toNumber(row[exposureIndex])
      if (rowData.exposure > 0) hasRowData = true
    } else {
      rowData.exposure = 0
    }
    
    if (viewIndex !== undefined) {
      rowData.view = toNumber(row[viewIndex])
    } else {
      rowData.view = 0
    }
    
    if (clickRateIndex !== undefined) {
      rowData.clickRate = toNumber(row[clickRateIndex])
    } else {
      rowData.clickRate = 0
    }
    
    if (likeIndex !== undefined) {
      rowData.like = toNumber(row[likeIndex])
      if (rowData.like > 0) hasRowData = true
    } else {
      rowData.like = 0
    }
    
    if (commentIndex !== undefined) {
      rowData.comment = toNumber(row[commentIndex])
      if (rowData.comment > 0) hasRowData = true
    } else {
      rowData.comment = 0
    }
    
    if (collectIndex !== undefined) {
      rowData.collect = toNumber(row[collectIndex])
    } else {
      rowData.collect = 0
    }
    
    if (shareIndex !== undefined) {
      rowData.share = toNumber(row[shareIndex])
    } else {
      rowData.share = 0
    }
    
    if (followersIndex !== undefined) {
      rowData.followers = toNumber(row[followersIndex])
    } else {
      rowData.followers = 0
    }
    
    if (dateIndex !== undefined) {
      const date = String(row[dateIndex] ?? '').trim()
      if (date) {
        rowData.date = date
      }
    }
    
    if (tagsIndex !== undefined) {
      const tagsStr = String(row[tagsIndex] ?? '').trim()
      rowData.tags = tagsStr ? tagsStr.split(/[,，;；、\s]+/).filter(t => t.trim()) : undefined
    }
    
    if (hasRowData) {
      notes.push(rowData as Note)
    }
  }
  
  if (notes.length === 0) {
    throw new Error('没有找到有效数据行。请检查表格数据是否正确填写，或尝试调整表格格式。')
  }
  
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

import type { Note, ContentStats, Stats, OperationAdviceType } from '@/types'

export function calculateStats(notes: Note[]): Stats {
  const totalExposure = notes.reduce((sum, note) => sum + note.exposure, 0)
  const totalView = notes.reduce((sum, note) => sum + note.view, 0)
  const totalInteraction = notes.reduce((sum, note) => 
    sum + note.like + note.comment + note.collect + note.share, 0)
  
  const totalFollowersFromData = notes.reduce((sum, note) => sum + note.followers, 0)
  
  const hasFollowersData = notes.some(note => note.followers > 0)
  const newFollowers = hasFollowersData ? totalFollowersFromData : Math.floor(totalInteraction * 0.01)
  
  const totalFollowers = 35000
  
  return {
    totalExposure,
    totalView,
    totalInteraction,
    newFollowers,
    totalFollowers
  }
}

export function calculateContentStats(notes: Note[]): { video: ContentStats; image: ContentStats } {
  const videoNotes = notes.filter(note => note.type === '视频')
  const imageNotes = notes.filter(note => note.type === '图文')
  
  const video: ContentStats = {
    count: videoNotes.length,
    exposure: videoNotes.reduce((sum, n) => sum + n.exposure, 0),
    view: videoNotes.reduce((sum, n) => sum + n.view, 0),
    like: videoNotes.reduce((sum, n) => sum + n.like, 0),
    comment: videoNotes.reduce((sum, n) => sum + n.comment, 0)
  }
  
  const image: ContentStats = {
    count: imageNotes.length,
    exposure: imageNotes.reduce((sum, n) => sum + n.exposure, 0),
    view: imageNotes.reduce((sum, n) => sum + n.view, 0),
    like: imageNotes.reduce((sum, n) => sum + n.like, 0),
    comment: imageNotes.reduce((sum, n) => sum + n.comment, 0)
  }
  
  return { video, image }
}

export function generateInsight(notes: Note[]): string {
  const { video, image } = calculateContentStats(notes)
  const totalExposure = video.exposure + image.exposure
  
  if (totalExposure === 0) return '暂无数据可分析'
  
  const videoRatio = Math.round((video.exposure / totalExposure) * 100)
  const imageRatio = 100 - videoRatio
  
  const videoInteraction = video.like + video.comment
  const imageInteraction = image.like + image.comment
  const totalInteraction = videoInteraction + imageInteraction
  
  let interactionRatio = 0
  if (totalInteraction > 0) {
    interactionRatio = Math.round((imageInteraction / totalInteraction) * 100)
  }
  
  if (imageRatio >= 80) {
    return `图文笔记表现显著优于视频笔记，曝光量占比达${imageRatio}%，互动数占比${interactionRatio}%。建议增加图文内容产出。`
  } else if (videoRatio >= 80) {
    return `视频笔记表现显著优于图文笔记，曝光量占比达${videoRatio}%。建议增加视频内容产出。`
  } else {
    return `图文笔记与视频笔记表现均衡，图文曝光占比${imageRatio}%，视频曝光占比${videoRatio}%。可根据互动数据进一步优化内容策略。`
  }
}

export function getHotNotes(notes: Note[]): Note[] {
  return [...notes].sort((a, b) => b.exposure - a.exposure).slice(0, 3)
}

export function generateOperationAdvice(notes: Note[]): OperationAdviceType {
  const { video, image } = calculateContentStats(notes)
  const hotNotes = getHotNotes(notes)
  const keep: string[] = []
  const optimize: string[] = []
  
  if (image.exposure > video.exposure) {
    keep.push('互动量图文内容表现优异')
  } else {
    keep.push('视频内容表现突出')
  }
  
  const hasPetContent = notes.some(n => 
    n.title.includes('宠物') || n.title.includes('猫') || n.title.includes('狗'))
  if (hasPetContent) {
    keep.push('宠物相关内容持续受欢迎')
  }
  
  const highInteractionNote = notes.find(n => n.like + n.comment > 50)
  if (highInteractionNote) {
    keep.push('高互动内容可作为模板参考')
  }
  
  if (video.count > 0 && video.exposure < image.exposure) {
    optimize.push('提升视频内容质量和吸引力')
  }
  
  const avgClickRate = notes.reduce((sum, n) => sum + n.clickRate, 0) / notes.length
  if (avgClickRate < 5) {
    optimize.push('优化封面设计，提高点击率')
  }
  
  const lowShareNotes = notes.filter(n => n.share === 0).length
  if (lowShareNotes > notes.length * 0.5) {
    optimize.push('增加引导分享的文案设计')
  }
  
  if (hotNotes.length > 0 && hotNotes[0].type === '图文') {
    optimize.push('分析爆款图文特征并复制成功模式')
  }
  
  return { keep, optimize }
}

export function formatNumber(num: number): string {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'W'
  } else if (num >= 1000) {
    return num.toLocaleString()
  }
  return num.toString()
}

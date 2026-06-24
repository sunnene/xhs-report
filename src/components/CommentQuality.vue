<script setup lang="ts">
import { ref, computed } from 'vue'
import { parseCommentFile, analyzeComments, DEFAULT_PRODUCT_KEYWORDS } from '@/utils/commentParser'
import type { Comment, CommentAnalysis } from '@/types/comment'

const comments = ref<Comment[]>([])
const analysis = ref<CommentAnalysis | null>(null)
const error = ref('')
const isUploading = ref(false)
const searchKeyword = ref('')
const targetKeywords = ref('')
const showPositive = ref(true)
const showNegative = ref(true)
const showNeutral = ref(true)
const customProductKeywords = ref('')

function handleFileUpload(e: Event) {
  const target = e.target as HTMLInputElement
  const files = target.files
  if (files && files.length > 0) {
    processFile(files[0])
  }
}

function handleDrop(e: DragEvent) {
  e.preventDefault()
  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    processFile(files[0])
  }
}

async function processFile(file: File) {
  isUploading.value = true
  error.value = ''
  
  try {
    comments.value = await parseCommentFile(file)
    const keywords = customProductKeywords.value.trim() 
      ? customProductKeywords.value.split(/[,，;；、\s]+/).filter(k => k.trim())
      : []
    analysis.value = analyzeComments(comments.value, keywords)
  } catch (err) {
    error.value = err instanceof Error ? err.message : '上传失败'
  } finally {
    isUploading.value = false
  }
}

function reAnalyze() {
  if (comments.value.length > 0) {
    const keywords = customProductKeywords.value.trim() 
      ? customProductKeywords.value.split(/[,，;；、\s]+/).filter(k => k.trim())
      : []
    analysis.value = analyzeComments(comments.value, keywords)
  }
}

const hasData = computed(() => comments.value.length > 0)

const filteredComments = computed(() => {
  let result = comments.value
  
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(c => c.content.toLowerCase().includes(keyword))
  }
  
  if (!showPositive.value) {
    result = result.filter(c => c.sentiment !== 'positive')
  }
  if (!showNegative.value) {
    result = result.filter(c => c.sentiment !== 'negative')
  }
  if (!showNeutral.value) {
    result = result.filter(c => c.sentiment !== 'neutral')
  }
  
  return result
})

const keywordSearchAnalysis = computed(() => {
  if (!hasData.value || !targetKeywords.value.trim()) {
    return null
  }
  
  const targetKeys = targetKeywords.value.split(/[,，;；、\s]+/).filter(k => k.trim())
  const totalCount = comments.value.length
  
  const hitComments = comments.value.filter(c => {
    const lowerContent = c.content.toLowerCase()
    return targetKeys.some(key => lowerContent.includes(key.toLowerCase()))
  })
  
  const hitCount = hitComments.length
  const hitRate = totalCount > 0 ? (hitCount / totalCount) * 100 : 0
  
  const keywordDetails = targetKeys.map(key => {
    const count = comments.value.filter(c => 
      c.content.toLowerCase().includes(key.toLowerCase())
    ).length
    return {
      keyword: key,
      count,
      rate: totalCount > 0 ? (count / totalCount) * 100 : 0
    }
  }).sort((a, b) => b.count - a.count)
  
  return {
    targetKeys,
    totalCount,
    hitCount,
    hitRate,
    keywordDetails
  }
})

const searchAnalysis = computed(() => {
  if (!hasData.value || !searchKeyword.value.trim()) {
    return analysis.value
  }
  
  const filtered = filteredComments.value
  const totalCount = filtered.length
  const positiveCount = filtered.filter(c => c.sentiment === 'positive').length
  const negativeCount = filtered.filter(c => c.sentiment === 'negative').length
  const neutralCount = filtered.filter(c => c.sentiment === 'neutral').length
  
  const allProductKeywords = [...DEFAULT_PRODUCT_KEYWORDS, ...(customProductKeywords.value.trim() ? customProductKeywords.value.split(/[,，;；、\s]+/).filter(k => k.trim()) : [])]
  const productRelatedCount = filtered.filter(c => {
    const lowerContent = c.content.toLowerCase()
    return allProductKeywords.some(k => lowerContent.includes(k.toLowerCase()))
  }).length
  
  const wordCount: Record<string, number> = {}
  filtered.forEach(comment => {
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
  filtered.forEach(comment => {
    comment.keywords.forEach(keyword => {
      keywordCount[keyword] = (keywordCount[keyword] || 0) + 1
    })
  })
  
  const totalKeywordCount = Object.values(keywordCount).reduce((sum, count) => sum + count, 0)
  const topKeywords = Object.entries(keywordCount)
    .map(([keyword, count]) => ({ keyword, count, percentage: totalKeywordCount > 0 ? Math.round((count / totalKeywordCount) * 100) : 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
  
  const positiveExamples = filtered
    .filter(c => c.sentiment === 'positive')
    .slice(0, 5)
    .map(c => c.content)
  
  const negativeExamples = filtered
    .filter(c => c.sentiment === 'negative')
    .slice(0, 5)
    .map(c => c.content)
  
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
    conclusion: generateSentimentConclusion(totalCount, positiveCount, negativeCount, neutralCount)
  }
})

function generateSentimentConclusion(total: number, positive: number, negative: number, _neutral: number): string {
  if (total === 0) return '暂无数据'
  
  const positiveRate = (positive / total) * 100
  const negativeRate = (negative / total) * 100
  
  if (positiveRate >= 70 && negativeRate <= 10) {
    return '整体情绪倾向非常积极，负面反馈极少。'
  } else if (positiveRate >= 60 && negativeRate <= 15) {
    return '整体情绪倾向积极，负面反馈较少。'
  } else if (positiveRate >= 50) {
    return '整体情绪基本正面，需关注负面反馈。'
  } else if (positiveRate >= 30) {
    return '整体情绪偏中性，建议优化用户体验。'
  } else {
    return '整体情绪偏负面，需重点关注并改进。'
  }
}

function generateDiscussionFocus(analysis: CommentAnalysis | null): string[] {
  if (!analysis) return []
  
  const focuses: string[] = []
  const keywords = analysis.topKeywords.map(k => k.keyword)
  
  if (keywords.some(k => k.includes('价格') || k.includes('钱') || k.includes('贵') || k.includes('便宜') || k.includes('实惠') || k.includes('划算'))) {
    focuses.push('价格与性价比的讨论')
  }
  if (keywords.some(k => k.includes('服务') || k.includes('客服') || k.includes('售后') || k.includes('态度'))) {
    focuses.push('服务质量与售后体验的反馈')
  }
  if (keywords.some(k => k.includes('产品') || k.includes('质量') || k.includes('功能') || k.includes('好用') || k.includes('实用'))) {
    focuses.push('产品功能与质量的评价')
  }
  if (keywords.some(k => k.includes('体验') || k.includes('方便') || k.includes('快捷') || k.includes('流畅'))) {
    focuses.push('使用体验与便捷性的讨论')
  }
  if (keywords.some(k => k.includes('推荐') || k.includes('喜欢') || k.includes('满意'))) {
    focuses.push('用户推荐与满意度表达')
  }
  if (analysis.negativeCount > 0) {
    focuses.push('负面反馈与改进建议')
  }
  
  if (focuses.length === 0) {
    focuses.push('用户对产品/服务的综合评价')
  }
  
  return focuses.slice(0, 4)
}
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm p-6">
    <div class="flex items-center gap-2 mb-6">
      <span class="text-xl">📊</span>
      <h3 class="text-lg font-semibold text-gray-800">评论舆情分析报告</h3>
    </div>
    
    <div 
      class="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer mb-6 transition-colors"
      :class="isUploading ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'"
      @drop="handleDrop"
      @dragover.prevent
      @click="() => ($refs.commentInput as HTMLInputElement)?.click()"
    >
      <input 
        ref="commentInput"
        type="file" 
        accept=".csv,.xlsx,.xls" 
        class="hidden" 
        @change="handleFileUpload"
      />
      
      <div v-if="!hasData || isUploading">
        <span class="text-4xl">📁</span>
        <p class="mt-2 text-gray-600">{{ isUploading ? '正在解析...' : '点击或拖拽上传评论汇总表' }}</p>
        <p class="text-sm text-gray-400">支持 CSV、Excel 格式</p>
      </div>
      <div v-else class="flex items-center justify-center gap-4">
        <span class="text-green-500">✓</span>
        <span class="text-gray-700">已加载 {{ comments.length }} 条评论</span>
        <button 
          @click.stop="() => { comments = []; analysis = null; searchKeyword = ''; targetKeywords = ''; }"
          class="text-sm text-red-500 hover:text-red-600"
        >
          重新上传
        </button>
      </div>
    </div>
    
    <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <p class="text-red-600">{{ error }}</p>
    </div>
    
    <div v-if="hasData" class="space-y-6">
      <div class="bg-blue-50 rounded-lg p-4">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-lg">🔍</span>
          <span class="font-bold text-blue-700">1. 关键词搜索分析</span>
        </div>
        <div class="flex flex-wrap gap-4">
          <div class="flex-1 min-w-[200px]">
            <label class="block text-sm text-blue-600 mb-1">目标检索词（多个用空格或逗号分隔）</label>
            <input 
              v-model="targetKeywords"
              type="text"
              placeholder="例如：宠物 滴滴宠物出行"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div v-if="keywordSearchAnalysis" class="mt-4 bg-white rounded-lg p-4">
          <div class="space-y-2 text-sm">
            <div class="flex items-center gap-4">
              <span class="text-gray-600">目标检索词：<span class="font-medium text-gray-800">{{ keywordSearchAnalysis.targetKeys.join('、') }}</span></span>
            </div>
            <div class="flex items-center gap-4">
              <span class="text-gray-600">总评论基数：<span class="font-medium text-gray-800">{{ keywordSearchAnalysis.totalCount }} 条</span></span>
            </div>
            <div class="flex items-center gap-4">
              <span class="text-gray-600">命中关键词的评论：<span class="font-medium text-green-600">{{ keywordSearchAnalysis.hitCount }} 条（占比 {{ keywordSearchAnalysis.hitRate.toFixed(2) }}%）</span></span>
            </div>
            <div class="flex items-center gap-4">
              <span class="text-gray-600">关键词明细：</span>
              <span class="font-medium text-gray-800">
                <span v-for="(item, index) in keywordSearchAnalysis.keywordDetails" :key="item.keyword">
                  '{{ item.keyword }}' ({{ item.count }}条，占比 {{ item.rate.toFixed(1) }}%)<span v-if="index < keywordSearchAnalysis.keywordDetails.length - 1"> | </span>
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="bg-purple-50 rounded-lg p-4">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-lg">📈</span>
          <span class="font-bold text-purple-700">2. 全量情感分析（基于 {{ comments.length }} 条总评论）</span>
        </div>
        
        <div v-if="searchAnalysis" class="bg-white rounded-lg p-4">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div class="text-center p-3 bg-green-50 rounded-lg">
              <div class="text-xl font-bold text-green-600">{{ searchAnalysis.positiveCount }}</div>
              <div class="text-xs text-gray-500">正面（{{ searchAnalysis.positiveRate }}%）</div>
            </div>
            <div class="text-center p-3 bg-red-50 rounded-lg">
              <div class="text-xl font-bold text-red-600">{{ searchAnalysis.negativeCount }}</div>
              <div class="text-xs text-gray-500">负面（{{ searchAnalysis.negativeRate }}%）</div>
            </div>
            <div class="text-center p-3 bg-gray-50 rounded-lg">
              <div class="text-xl font-bold text-gray-600">{{ searchAnalysis.neutralCount }}</div>
              <div class="text-xs text-gray-500">中性（{{ 100 - searchAnalysis.positiveRate - searchAnalysis.negativeRate }}%）</div>
            </div>
            <div class="text-center p-3 bg-blue-50 rounded-lg">
              <div class="text-xl font-bold text-blue-600">{{ searchAnalysis.totalCount }}</div>
              <div class="text-xs text-gray-500">总评论</div>
            </div>
          </div>
          
          <div class="flex items-center gap-2 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg">
            <span class="text-yellow-500">💡</span>
            <span class="text-amber-700 font-medium">舆情结论：</span>
            <span class="text-amber-600">{{ searchAnalysis.conclusion }}</span>
          </div>
        </div>
      </div>
      
      <div class="bg-indigo-50 rounded-lg p-4">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-lg">🔥</span>
          <span class="font-bold text-indigo-700">3. 高频词 Top 10</span>
        </div>
        
        <div v-if="searchAnalysis && searchAnalysis.topWords && searchAnalysis.topWords.length > 0" class="bg-white rounded-lg p-4">
          <div class="space-y-2">
            <div 
              v-for="(item, index) in searchAnalysis.topWords" 
              :key="item.word"
              class="flex items-center gap-3"
            >
              <span class="w-6 text-center text-sm font-medium text-indigo-600">{{ index + 1 }}.</span>
              <div class="flex-1 h-6 bg-indigo-100 rounded-full overflow-hidden">
                <div 
                  class="h-full bg-indigo-500 flex items-center px-2"
                  :style="{ width: `${Math.min((item.count / searchAnalysis.totalCount) * 100, 100)}%` }"
                >
                  <span class="text-sm text-white truncate">{{ item.word }}</span>
                </div>
              </div>
              <span class="text-sm text-gray-600">(占比 {{ ((item.count / searchAnalysis.totalCount) * 100).toFixed(1) }}%)</span>
            </div>
          </div>
        </div>
        <div v-else class="bg-white rounded-lg p-4 text-center text-gray-400">
          暂无高频词数据
        </div>
      </div>
      
      <div class="bg-teal-50 rounded-lg p-4">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-lg">🎯</span>
          <span class="font-bold text-teal-700">4. 核心讨论焦点</span>
        </div>
        
        <div v-if="searchAnalysis" class="bg-white rounded-lg p-4">
          <ul class="space-y-2">
            <li 
              v-for="(focus, index) in generateDiscussionFocus(searchAnalysis)" 
              :key="index"
              class="flex items-center gap-2 text-gray-700"
            >
              <span class="text-orange-500">🔹</span>
              <span>{{ focus }}</span>
            </li>
          </ul>
        </div>
        <div v-else class="bg-white rounded-lg p-4 text-center text-gray-400">
          暂无讨论焦点数据
        </div>
      </div>
      
      <div class="bg-gray-50 rounded-lg p-4">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-lg">🔧</span>
          <span class="font-bold text-gray-700">高级设置</span>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm text-gray-600 mb-1">产品力关键词（自定义）</label>
            <input 
              v-model="customProductKeywords"
              type="text"
              :placeholder="`默认关键词: ${DEFAULT_PRODUCT_KEYWORDS.slice(0, 5).join('、')}...`"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <p class="text-xs text-gray-400 mt-1">提示：输入自定义关键词，用逗号或空格分隔</p>
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-2">情感筛选</label>
            <div class="flex items-center gap-3">
              <label class="flex items-center gap-2 cursor-pointer">
                <input v-model="showPositive" type="checkbox" class="rounded text-green-500" />
                <span class="text-sm text-gray-600">👍 正向</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input v-model="showNegative" type="checkbox" class="rounded text-red-500" />
                <span class="text-sm text-gray-600">👎 负向</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input v-model="showNeutral" type="checkbox" class="rounded text-gray-500" />
                <span class="text-sm text-gray-600">😐 中性</span>
              </label>
            </div>
          </div>
        </div>
        <button 
          @click="reAnalyze"
          class="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          应用并重新分析
        </button>
      </div>
      
      <div class="bg-gray-50 rounded-lg p-4">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-lg">📋</span>
          <span class="font-bold text-gray-700">评论详情列表</span>
        </div>
        <div class="space-y-2 max-h-64 overflow-y-auto">
          <div 
            v-for="(comment, index) in filteredComments.slice(0, 20)" 
            :key="index"
            :class="[
              'p-3 rounded-lg border-l-4',
              comment.sentiment === 'positive' ? 'border-green-400 bg-green-50' : '',
              comment.sentiment === 'negative' ? 'border-red-400 bg-red-50' : '',
              comment.sentiment === 'neutral' ? 'border-gray-400 bg-gray-100' : ''
            ]"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span :class="[
                  'text-xs px-2 py-1 rounded-full',
                  comment.sentiment === 'positive' ? 'bg-green-200 text-green-700' : '',
                  comment.sentiment === 'negative' ? 'bg-red-200 text-red-700' : '',
                  comment.sentiment === 'neutral' ? 'bg-gray-200 text-gray-700' : ''
                ]">
                  {{ comment.sentiment === 'positive' ? '正向' : comment.sentiment === 'negative' ? '负向' : '中性' }}
                </span>
              </div>
            </div>
            <p class="text-sm text-gray-700 mt-1">{{ comment.content }}</p>
          </div>
          <div v-if="filteredComments.length === 0" class="text-center py-8 text-gray-400">
            暂无匹配的评论
          </div>
        </div>
      </div>
    </div>
    
    <div v-if="!hasData" class="bg-blue-50 rounded-lg p-4">
      <p class="text-sm text-blue-600">💡 提示：上传包含"评论内容"列的表格文件，系统将自动生成舆情分析报告</p>
    </div>
  </div>
</template>

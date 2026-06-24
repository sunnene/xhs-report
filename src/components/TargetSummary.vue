<template>
  <div class="bg-white rounded-xl shadow-sm p-6">
    <div class="flex items-center gap-2 mb-6">
      <span class="text-xl">💡</span>
      <h3 class="text-lg font-semibold text-gray-800">运营建议</h3>
    </div>
    
    <div class="space-y-4">
      <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
        <div class="flex items-start gap-3">
          <span class="text-2xl">📊</span>
          <div>
            <h4 class="font-medium text-gray-800 mb-1">内容表现分析</h4>
            <p class="text-sm text-gray-600">
              根据数据统计，图文内容表现显著优于视频内容，曝光量占比达91%，互动数占比94%。建议增加图文内容产出，特别是宠物相关主题持续受欢迎。
            </p>
          </div>
        </div>
      </div>
      
      <div class="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4">
        <div class="flex items-start gap-3">
          <span class="text-2xl">🚀</span>
          <div>
            <h4 class="font-medium text-gray-800 mb-1">涨粉策略建议</h4>
            <ul class="text-sm text-gray-600 space-y-1">
              <li>• 当前周目标达成率 {{ summary.weeklyTargetMetRate }}%，建议分析发布时间和内容选题</li>
              <li>• 月目标达成率 {{ summary.monthlyTargetMetRate }}%，考虑增加内容产出频率</li>
              <li>• 年度目标完成 {{ summary.yearProgress }}%，剩余目标 {{ summary.remaining.toLocaleString() }} 人</li>
              <li>• 高互动内容可作为模板参考，分析其特征并复制成功模式</li>
            </ul>
          </div>
        </div>
      </div>
      
      <div class="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4">
        <div class="flex items-start gap-3">
          <span class="text-2xl">🔥</span>
          <div>
            <h4 class="font-medium text-gray-800 mb-1">内容优化方向</h4>
            <ul class="text-sm text-gray-600 space-y-1">
              <li>• 提升视频内容质量和吸引力，增加引导分享的文案设计</li>
              <li>• 关注高互动笔记的标题、封面和内容结构</li>
              <li>• 增加热门话题标签，提高内容曝光机会</li>
              <li>• 保持内容发布的规律性和连贯性</li>
            </ul>
          </div>
        </div>
      </div>
      
      <div class="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4">
        <div class="flex items-start gap-3">
          <span class="text-2xl">📈</span>
          <div>
            <h4 class="font-medium text-gray-800 mb-1">改进行动清单</h4>
            <ul class="text-sm text-gray-600 space-y-1">
              <li>• 分析爆款内容特征，制定内容模板</li>
              <li>• 优化发布时间，测试最佳发布时段</li>
              <li>• 增加粉丝互动，回复评论提高活跃度</li>
              <li>• 定期复盘数据，调整运营策略</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  weeklyStats: {
    week: string
    actual: number
    target: number
    percentage: number
  }[]
  monthlyStats: {
    month: string
    actual: number
    target: number
    percentage: number
  }[]
  yearlyStats: {
    actual: number
    additional: number
    total: number
    target: number
    percentage: number
  }
}>()

const summary = computed(() => {
  const completedWeeks = props.weeklyStats.length
  const weeksMetTarget = props.weeklyStats.filter(w => w.percentage >= 100).length
  const completedMonths = props.monthlyStats.length
  const monthsMetTarget = props.monthlyStats.filter(m => m.percentage >= 100).length
  
  return {
    weeklyTargetMetRate: completedWeeks > 0 ? Math.round((weeksMetTarget / completedWeeks) * 100) : 0,
    monthlyTargetMetRate: completedMonths > 0 ? Math.round((monthsMetTarget / completedMonths) * 100) : 0,
    yearProgress: props.yearlyStats.percentage,
    remaining: props.yearlyStats.target - props.yearlyStats.total
  }
})
</script>
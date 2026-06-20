<template>
  <div class="min-h-screen bg-slate-900 text-slate-200">
    <header class="border-b border-slate-700 px-6 py-4">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-cyan-400">蒙特卡洛模拟与统计假设检验平台</h1>
          <p class="text-sm text-slate-500 mt-1">随机采样模拟 · 6种MC场景 · 场景组合智能推荐 · 联动观察分析</p>
        </div>
        <div class="flex gap-2">
          <button @click="store.activeTab = 'single'" :class="['px-4 py-2 rounded text-sm font-bold transition-all', store.activeTab === 'single' ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600']">单场景模拟</button>
          <button @click="store.activeTab = 'combo'" :class="['px-4 py-2 rounded text-sm font-bold transition-all', store.activeTab === 'combo' ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600']">组合联动观察</button>
        </div>
      </div>
    </header>

    <div class="bg-slate-800/50 border-b border-slate-700 px-6 py-4">
      <h3 class="text-sm font-bold text-amber-400 mb-3 flex items-center gap-2">
        <span>💡</span> 智能场景推荐
      </h3>
      <div class="flex gap-3">
        <input 
          v-model="questionInput" 
          type="text" 
          placeholder="描述你关注的问题，例如：我想对比不同方法的收敛速度，或者学习金融风险分析..." 
          class="flex-1 bg-slate-900 border border-slate-600 rounded px-4 py-2 text-sm focus:outline-none focus:border-amber-500 transition-all"
          @keyup.enter="handleRecommend"
        />
        <button 
          @click="handleRecommend" 
          :disabled="store.isRecommending"
          class="px-6 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 rounded text-sm font-bold transition-all"
        >
          {{ store.isRecommending ? '分析中...' : '🔍 获取推荐' }}
        </button>
        <button 
          v-if="store.recommendResult"
          @click="store.clearRecommend" 
          class="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm transition-all"
        >
          清除
        </button>
      </div>

      <div v-if="store.recommendResult" class="mt-4">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-xs text-slate-500">匹配关键词：</span>
          <span v-for="kw in store.recommendResult.matched_keywords" :key="kw" class="px-2 py-0.5 bg-amber-900/40 text-amber-400 rounded text-xs border border-amber-700/50">
            {{ kw }}
          </span>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div 
            v-for="combo in store.recommendResult.recommended_combos" 
            :key="combo.id"
            @click="store.selectCombo(combo)"
            :class="['cursor-pointer bg-slate-800 rounded-lg p-4 border transition-all hover:shadow-lg hover:shadow-amber-500/10', 
              store.selectedCombo?.id === combo.id ? 'border-amber-500 bg-amber-900/20' : 'border-slate-700 hover:border-amber-500/50']"
          >
            <div class="flex items-start justify-between mb-2">
              <h4 class="font-bold text-amber-300 text-sm">{{ combo.name }}</h4>
              <div class="flex items-center gap-1">
                <span :class="['text-xs px-1.5 py-0.5 rounded', 
                  combo.difficulty === '初级' ? 'bg-green-900/40 text-green-400' :
                  combo.difficulty === '中级' ? 'bg-yellow-900/40 text-yellow-400' :
                  'bg-red-900/40 text-red-400']">{{ combo.difficulty }}</span>
                <span class="text-xs text-slate-500">{{ combo.relevance_score }}分</span>
              </div>
            </div>
            <p class="text-xs text-slate-400 mb-2">{{ combo.description }}</p>
            <div class="flex flex-wrap gap-1 mb-2">
              <span v-for="s in combo.scenarios" :key="s.id" class="text-xs px-1.5 py-0.5 bg-slate-700 rounded text-slate-300">
                {{ s.name }}
              </span>
            </div>
            <div class="text-xs text-slate-500 border-t border-slate-700 pt-2 mt-2">
              <span class="text-amber-400">推荐理由：</span>{{ combo.reason }}
            </div>
          </div>
        </div>

        <div v-if="store.recommendResult.related_scenarios.length > 0" class="mt-3">
          <span class="text-xs text-slate-500">相关场景：</span>
          <span v-for="s in store.recommendResult.related_scenarios" :key="s.id" 
            @click="goToScenario(s.id)"
            class="ml-2 text-xs text-cyan-400 hover:text-cyan-300 cursor-pointer underline decoration-dotted">
            {{ s.name }}
          </span>
        </div>
      </div>
    </div>

    <div v-if="store.activeTab === 'single'" class="flex flex-col lg:flex-row gap-4 p-4">
      <div class="lg:w-1/4 space-y-4">
        <div class="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <h3 class="text-sm font-bold text-slate-400 mb-3">模拟场景</h3>
          <div class="space-y-1">
            <div v-for="s in SCENARIOS" :key="s.id" @click="store.setScenario(s)"
              :class="['cursor-pointer p-2 rounded border text-sm transition-all', store.currentScenario.id === s.id ? 'border-cyan-500 bg-cyan-900/30 text-cyan-400' : 'border-slate-700 text-slate-300 hover:border-slate-500']">
              <div class="font-bold">{{ s.name }}</div>
              <div class="text-xs text-slate-500 mt-0.5">{{ s.description }}</div>
            </div>
          </div>
        </div>
        <div class="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <h3 class="text-sm font-bold text-slate-400 mb-3">参数控制</h3>
          <label class="text-xs text-slate-500">迭代次数: {{ store.iterations }}</label>
          <input type="range" min="100" max="5000" step="100" v-model.number="store.iterations" class="w-full mt-1 mb-3 accent-cyan-500" />
          <button @click="store.runSimulation" :disabled="store.isRunning" class="w-full py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 rounded text-sm font-bold">
            {{ store.isRunning ? '运行中...' : '▶ 开始模拟' }}
          </button>
        </div>
        <div v-if="store.result" class="bg-slate-800 rounded-lg p-4 border border-slate-700 text-sm">
          <h3 class="text-sm font-bold text-slate-400 mb-3">模拟结果</h3>
          <div class="space-y-2">
            <div class="flex justify-between"><span class="text-slate-500">估算值</span><span class="text-cyan-400 font-bold font-mono">{{ store.result.estimate.toFixed(6) }}</span></div>
            <div v-if="store.result.trueValue !== undefined" class="flex justify-between"><span class="text-slate-500">真实值</span><span class="text-green-400 font-mono">{{ store.result.trueValue.toFixed(6) }}</span></div>
            <div v-if="store.result.error !== undefined" class="flex justify-between"><span class="text-slate-500">误差</span><span class="text-orange-400 font-mono">{{ store.result.error.toFixed(6) }}</span></div>
            <div class="flex justify-between"><span class="text-slate-500">样本数</span><span class="text-slate-300">{{ store.result.iterations }}</span></div>
          </div>
        </div>
      </div>
      <div class="lg:w-3/4 space-y-4">
        <div class="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <h3 class="text-sm font-bold text-slate-400 mb-3">收敛过程</h3>
          <div ref="convergenceRef" class="w-full rounded" style="height:240px;background:#0f172a;"></div>
        </div>
        <div class="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <h3 class="text-sm font-bold text-slate-400 mb-3">样本分布直方图</h3>
          <div ref="histogramRef" class="w-full rounded" style="height:220px;background:#0f172a;"></div>
        </div>
        <div class="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <h3 class="text-sm font-bold text-slate-400 mb-3">假设检验 (独立样本 T 检验)</h3>
          <div class="grid grid-cols-2 gap-4 mb-3">
            <div>
              <label class="text-xs text-slate-500">样本组A (逗号分隔)</label>
              <textarea v-model="group1Input" rows="2" class="w-full mt-1 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-cyan-500 resize-none"></textarea>
            </div>
            <div>
              <label class="text-xs text-slate-500">样本组B (逗号分隔)</label>
              <textarea v-model="group2Input" rows="2" class="w-full mt-1 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-cyan-500 resize-none"></textarea>
            </div>
          </div>
          <button @click="runTest" class="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 rounded text-sm">执行T检验</button>
          <div v-if="store.testResult" class="mt-3 grid grid-cols-4 gap-3 text-sm">
            <div class="bg-slate-900 rounded p-2 text-center"><div class="text-xs text-slate-500 mb-1">统计量 t</div><div class="text-cyan-400 font-bold font-mono">{{ store.testResult.statistic }}</div></div>
            <div class="bg-slate-900 rounded p-2 text-center"><div class="text-xs text-slate-500 mb-1">p 值</div><div class="font-bold font-mono" :class="store.testResult.significant ? 'text-red-400' : 'text-green-400'">{{ store.testResult.pValue }}</div></div>
            <div class="bg-slate-900 rounded p-2 text-center"><div class="text-xs text-slate-500 mb-1">自由度 df</div><div class="text-slate-300 font-mono">{{ store.testResult.df }}</div></div>
            <div class="bg-slate-900 rounded p-2 text-center"><div class="text-xs text-slate-500 mb-1">显著性</div><div class="text-xs font-bold" :class="store.testResult.significant ? 'text-red-400' : 'text-green-400'">{{ store.testResult.significant ? '显著(p<0.05)' : '不显著' }}</div></div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="p-4">
      <div v-if="!store.selectedCombo" class="flex flex-col items-center justify-center py-20 text-slate-500">
        <div class="text-6xl mb-4">📊</div>
        <p class="text-lg mb-2">请先选择一个场景组合</p>
        <p class="text-sm">在上方输入你关注的问题获取智能推荐，或选择下方预设组合</p>
        <div class="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl">
          <div v-for="combo in presetCombos" :key="combo.id" @click="store.selectCombo(combo)"
            class="cursor-pointer bg-slate-800 rounded-lg p-4 border border-slate-700 hover:border-purple-500 transition-all hover:bg-slate-700/50">
            <h4 class="font-bold text-purple-300 text-sm mb-2">{{ combo.name }}</h4>
            <p class="text-xs text-slate-400 mb-2">{{ combo.description }}</p>
            <div class="flex flex-wrap gap-1">
              <span v-for="s in combo.scenarios" :key="s.id" class="text-xs px-1.5 py-0.5 bg-slate-700 rounded text-slate-300">{{ s.name }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="space-y-4">
        <div class="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-lg font-bold text-purple-400">{{ store.selectedCombo.name }}</h3>
              <p class="text-sm text-slate-400 mt-1">{{ store.selectedCombo.description }}</p>
            </div>
            <div class="flex gap-2">
              <button @click="store.runComboSimulation" :disabled="store.isComboRunning" 
                class="px-6 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded text-sm font-bold">
                {{ store.isComboRunning ? '运行中...' : '▶ 联动运行' }}
              </button>
              <button @click="store.clearCombo" class="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm">
                退出组合
              </button>
            </div>
          </div>
          
          <div class="mb-4 p-3 bg-slate-900/50 rounded border border-slate-700">
            <div class="text-sm font-bold text-amber-400 mb-2">💡 推荐观察要点</div>
            <ul class="text-xs text-slate-400 space-y-1 list-disc list-inside">
              <li v-for="(insight, idx) in store.selectedCombo.insights" :key="idx">{{ insight }}</li>
            </ul>
          </div>

          <div class="grid grid-cols-3 gap-4">
            <div v-for="(r, idx) in store.comboResults" :key="r.scenarioId" 
              :class="['p-3 rounded border transition-all', 
                store.comboRunningIndex === idx ? 'border-purple-500 bg-purple-900/20 animate-pulse' :
                r.completed ? 'border-green-700 bg-green-900/10' : 'border-slate-700 bg-slate-900/30']">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: r.color }"></div>
                  <span class="font-bold text-sm">{{ r.scenarioName }}</span>
                </div>
                <span v-if="store.comboRunningIndex === idx" class="text-xs text-purple-400">运行中...</span>
                <span v-else-if="r.completed" class="text-xs text-green-400">✓ 完成</span>
                <span v-else class="text-xs text-slate-500">等待中</span>
              </div>
              <div v-if="r.completed && r.result" class="text-xs space-y-1">
                <div class="flex justify-between"><span class="text-slate-500">估算值</span><span class="font-mono" :style="{ color: r.color }">{{ r.result.estimate.toFixed(6) }}</span></div>
                <div v-if="r.result.trueValue !== undefined" class="flex justify-between"><span class="text-slate-500">真实值</span><span class="text-green-400 font-mono">{{ r.result.trueValue.toFixed(6) }}</span></div>
                <div v-if="r.result.error !== undefined" class="flex justify-between"><span class="text-slate-500">误差</span><span class="text-orange-400 font-mono">{{ r.result.error.toFixed(6) }}</span></div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <h3 class="text-sm font-bold text-slate-400 mb-3">收敛曲线对比</h3>
          <div ref="comboConvRef" class="w-full rounded" style="height:300px;background:#0f172a;"></div>
        </div>

        <div v-if="store.comboAllCompleted" class="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <h3 class="text-sm font-bold text-slate-400 mb-3">结果对比分析</h3>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-slate-700">
                  <th class="text-left py-2 px-3 text-slate-500 font-normal">场景</th>
                  <th class="text-right py-2 px-3 text-slate-500 font-normal">估算值</th>
                  <th class="text-right py-2 px-3 text-slate-500 font-normal">真实值</th>
                  <th class="text-right py-2 px-3 text-slate-500 font-normal">绝对误差</th>
                  <th class="text-right py-2 px-3 text-slate-500 font-normal">相对误差</th>
                  <th class="text-right py-2 px-3 text-slate-500 font-normal">样本数</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in store.comboResults" :key="r.scenarioId" class="border-b border-slate-700/50 hover:bg-slate-700/20">
                  <td class="py-2 px-3">
                    <div class="flex items-center gap-2">
                      <div class="w-2 h-2 rounded-full" :style="{ backgroundColor: r.color }"></div>
                      <span>{{ r.scenarioName }}</span>
                    </div>
                  </td>
                  <td class="text-right py-2 px-3 font-mono" :style="{ color: r.color }">{{ r.result?.estimate.toFixed(6) }}</td>
                  <td class="text-right py-2 px-3 font-mono text-green-400">{{ r.result?.trueValue !== undefined ? r.result.trueValue.toFixed(6) : '-' }}</td>
                  <td class="text-right py-2 px-3 font-mono text-orange-400">{{ r.result?.error !== undefined ? r.result.error.toFixed(6) : '-' }}</td>
                  <td class="text-right py-2 px-3 font-mono text-amber-400">
                    {{ r.result?.error !== undefined && r.result.trueValue !== undefined ? ((r.result.error / r.result.trueValue) * 100).toFixed(3) + '%' : '-' }}
                  </td>
                  <td class="text-right py-2 px-3 font-mono text-slate-300">{{ r.result?.iterations }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import * as echarts from 'echarts'
import { useMCStore, SCENARIOS, RecommendCombo } from './store/mc'

const store = useMCStore()
const convergenceRef = ref<HTMLDivElement | null>(null)
const histogramRef = ref<HTMLDivElement | null>(null)
const comboConvRef = ref<HTMLDivElement | null>(null)
const questionInput = ref('')
const group1Input = ref('5.1,4.8,5.3,4.9,5.2,5.0,4.7,5.1,5.4,4.8')
const group2Input = ref('4.6,4.2,4.9,4.3,4.5,4.7,4.4,4.8,4.1,4.6')
let convChart: echarts.ECharts | null = null
let histChart: echarts.ECharts | null = null
let comboConvChart: echarts.ECharts | null = null

const presetCombos = computed<RecommendCombo[]>(() => [
  {
    id: 'beginner_intro',
    name: '入门基础组合',
    description: '适合初学者理解蒙特卡洛核心思想',
    scenarios: SCENARIOS.filter(s => ['pi', 'random_walk', 'gambler'].includes(s.id)).map(s => ({ id: s.id, name: s.name, category: s.category })),
    scenario_ids: ['pi', 'random_walk', 'gambler'],
    reason: '',
    insights: [],
    difficulty: '初级',
    relevance_score: 0
  },
  {
    id: 'convergence_study',
    name: '收敛特性对比',
    description: '对比不同蒙特卡洛方法的收敛速度和稳定性',
    scenarios: SCENARIOS.filter(s => ['pi', 'option', 'gambler'].includes(s.id)).map(s => ({ id: s.id, name: s.name, category: s.category })),
    scenario_ids: ['pi', 'option', 'gambler'],
    reason: '',
    insights: [],
    difficulty: '中级',
    relevance_score: 0
  },
  {
    id: 'stochastic_process',
    name: '随机过程对比分析',
    description: '深入理解各类随机过程的特征差异',
    scenarios: SCENARIOS.filter(s => ['brownian', 'random_walk', 'diffusion'].includes(s.id)).map(s => ({ id: s.id, name: s.name, category: s.category })),
    scenario_ids: ['brownian', 'random_walk', 'diffusion'],
    reason: '',
    insights: [],
    difficulty: '中级',
    relevance_score: 0
  },
  {
    id: 'risk_analysis',
    name: '风险评估组合',
    description: '金融与概率中的极端风险分析',
    scenarios: SCENARIOS.filter(s => ['option', 'gambler', 'brownian'].includes(s.id)).map(s => ({ id: s.id, name: s.name, category: s.category })),
    scenario_ids: ['option', 'gambler', 'brownian'],
    reason: '',
    insights: [],
    difficulty: '高级',
    relevance_score: 0
  },
  {
    id: 'physics_simulation',
    name: '物理现象模拟组合',
    description: '微观粒子运动的多尺度模拟',
    scenarios: SCENARIOS.filter(s => ['brownian', 'diffusion', 'random_walk'].includes(s.id)).map(s => ({ id: s.id, name: s.name, category: s.category })),
    scenario_ids: ['brownian', 'diffusion', 'random_walk'],
    reason: '',
    insights: [],
    difficulty: '高级',
    relevance_score: 0
  },
  {
    id: 'finance_quant',
    name: '金融量化分析组合',
    description: '资产价格行为与衍生品定价',
    scenarios: SCENARIOS.filter(s => ['option', 'brownian', 'gambler'].includes(s.id)).map(s => ({ id: s.id, name: s.name, category: s.category })),
    scenario_ids: ['option', 'brownian', 'gambler'],
    reason: '',
    insights: [],
    difficulty: '高级',
    relevance_score: 0
  }
])

function handleRecommend() {
  if (questionInput.value.trim()) {
    store.getRecommendations(questionInput.value.trim())
  }
}

function goToScenario(id: string) {
  const scenario = SCENARIOS.find(s => s.id === id)
  if (scenario) {
    store.setScenario(scenario)
    store.activeTab = 'single'
  }
}

function initCharts() {
  if (convergenceRef.value) convChart = echarts.init(convergenceRef.value, 'dark')
  if (histogramRef.value) histChart = echarts.init(histogramRef.value, 'dark')
  if (comboConvRef.value) comboConvChart = echarts.init(comboConvRef.value, 'dark')
}

function updateCharts() {
  if (convChart && store.convergenceData.length > 0) {
    convChart.setOption({
      backgroundColor: '#0f172a',
      grid: { top: 20, bottom: 35, left: 65, right: 20 },
      xAxis: { type: 'value', axisLabel: { color: '#94a3b8', fontSize: 10 } },
      yAxis: { type: 'value', axisLabel: { color: '#94a3b8', fontSize: 10 } },
      series: [{ type: 'line', data: store.convergenceData, smooth: true, lineStyle: { color: '#06b6d4', width: 2 }, areaStyle: { color: 'rgba(6,182,212,0.1)' }, symbol: 'none' }],
      tooltip: { trigger: 'axis', backgroundColor: '#1e293b', borderColor: '#475569' }
    })
  }
  if (histChart && store.histogramData.xAxis.length > 0) {
    histChart.setOption({
      backgroundColor: '#0f172a',
      grid: { top: 15, bottom: 40, left: 55, right: 15 },
      xAxis: { type: 'category', data: store.histogramData.xAxis, axisLabel: { color: '#94a3b8', fontSize: 9, rotate: 30 } },
      yAxis: { type: 'value', axisLabel: { color: '#94a3b8', fontSize: 10 } },
      series: [{ type: 'bar', data: store.histogramData.data, itemStyle: { color: '#8b5cf6' } }],
      tooltip: { trigger: 'axis', backgroundColor: '#1e293b', borderColor: '#475569' }
    })
  }
}

function updateComboCharts() {
  if (!comboConvChart) return
  const series = store.comboConvergenceData.map(s => ({
    name: s.name,
    type: 'line' as const,
    data: s.data,
    smooth: true,
    lineStyle: { color: s.color, width: 2 },
    symbol: 'none',
    emphasis: { focus: 'series' as const }
  }))
  
  const legendData = store.comboResults.filter(r => r.completed).map(r => r.scenarioName)
  
  comboConvChart.setOption({
    backgroundColor: '#0f172a',
    legend: { data: legendData, textStyle: { color: '#94a3b8', fontSize: 11 }, top: 5 },
    grid: { top: 45, bottom: 35, left: 65, right: 20 },
    xAxis: { type: 'value', axisLabel: { color: '#94a3b8', fontSize: 10 }, name: '迭代步数', nameTextStyle: { color: '#64748b', fontSize: 10 } },
    yAxis: { type: 'value', axisLabel: { color: '#94a3b8', fontSize: 10 }, name: '估计值', nameTextStyle: { color: '#64748b', fontSize: 10 } },
    series: series,
    tooltip: { trigger: 'axis', backgroundColor: '#1e293b', borderColor: '#475569', textStyle: { fontSize: 11 } }
  })
}

function runTest() {
  const g1 = group1Input.value.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n))
  const g2 = group2Input.value.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n))
  if (g1.length > 1 && g2.length > 1) store.runTest(g1, g2)
}

onMounted(() => { 
  initCharts()
  store.runSimulation()
})

watch(() => store.result, () => updateCharts(), { deep: true })
watch(() => store.comboConvergenceData, () => updateComboCharts(), { deep: true })
watch(() => store.activeTab, (tab) => {
  if (tab === 'combo') {
    setTimeout(() => {
      if (comboConvRef.value && !comboConvChart) {
        comboConvChart = echarts.init(comboConvRef.value, 'dark')
      }
      updateComboCharts()
    }, 50)
  }
})
</script>

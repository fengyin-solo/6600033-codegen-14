import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface MCScenario {
  id: string
  name: string
  description: string
  params: Record<string, number>
  category: string
  tags?: string[]
}

export interface MCResult {
  scenario: string
  iterations: number
  estimate: number
  trueValue?: number
  error?: number
  samples: number[]
  convergence: number[]
}

export interface HypTestResult {
  testType: string
  statistic: number
  pValue: number
  significant: boolean
  alpha: number
  df?: number
}

export interface ScenarioDetail {
  id: string
  name: string
  category: string
  tags?: string[]
}

export interface RecommendCombo {
  id: string
  name: string
  description: string
  scenarios: ScenarioDetail[]
  scenario_ids: string[]
  reason: string
  insights: string[]
  difficulty: string
  relevance_score: number
}

export interface RecommendResponse {
  question: string
  matched_keywords: string[]
  recommended_combos: RecommendCombo[]
  related_scenarios: ScenarioDetail[]
}

export interface ComboResult {
  scenarioId: string
  scenarioName: string
  result: MCResult
  completed: boolean
  color: string
}

function normalRandom(): number {
  let u = 0, v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
}

function runMC(scenario: MCScenario, n: number): MCResult {
  const samples: number[] = []
  const convergence: number[] = []

  if (scenario.id === 'pi') {
    let inside = 0
    for (let i = 0; i < n; i++) {
      const x = Math.random() * 2 - 1, y = Math.random() * 2 - 1
      if (x * x + y * y <= 1) inside++
      samples.push(x * x + y * y <= 1 ? 1 : 0)
      convergence.push((inside / (i + 1)) * 4)
    }
    const estimate = (inside / n) * 4
    return { scenario: 'pi', iterations: n, estimate, trueValue: Math.PI, error: Math.abs(estimate - Math.PI), samples, convergence }
  }
  if (scenario.id === 'brownian') {
    let pos = 0
    const dt = scenario.params.dt || 0.01
    for (let i = 0; i < n; i++) { pos += normalRandom() * Math.sqrt(dt); samples.push(pos) }
    convergence.push(...samples.slice(0, 200))
    return { scenario: 'brownian', iterations: n, estimate: pos, samples, convergence }
  }
  if (scenario.id === 'option') {
    const { S0 = 100, K = 105, r = 0.05, sigma = 0.2, T = 1 } = scenario.params
    let payoffSum = 0
    for (let i = 0; i < n; i++) {
      const ST = S0 * Math.exp((r - 0.5 * sigma * sigma) * T + sigma * Math.sqrt(T) * normalRandom())
      const p = Math.max(ST - K, 0); payoffSum += p; samples.push(p)
      if ((i + 1) % 50 === 0) convergence.push((payoffSum / (i + 1)) * Math.exp(-r * T))
    }
    return { scenario: 'option', iterations: n, estimate: (payoffSum / n) * Math.exp(-r * T), samples, convergence }
  }
  if (scenario.id === 'random_walk') {
    let pos = 0
    for (let i = 0; i < n; i++) { pos += Math.random() > 0.5 ? 1 : -1; samples.push(pos) }
    convergence.push(...samples.slice(0, 200))
    return { scenario: 'random_walk', iterations: n, estimate: pos, samples, convergence }
  }
  if (scenario.id === 'diffusion') {
    const { D = 1, dt = 0.01 } = scenario.params
    let x = 0, y = 0
    for (let i = 0; i < n; i++) {
      x += normalRandom() * Math.sqrt(2 * D * dt); y += normalRandom() * Math.sqrt(2 * D * dt)
      samples.push(Math.sqrt(x * x + y * y))
    }
    convergence.push(...samples.slice(0, 200))
    return { scenario: 'diffusion', iterations: n, estimate: Math.sqrt(x * x + y * y), samples, convergence }
  }
  // gambler
  const { p = 0.45, bankroll = 50, goal = 100 } = scenario.params
  let ruinCount = 0
  for (let i = 0; i < n; i++) {
    let money = bankroll
    let steps = 0
    while (money > 0 && money < goal && steps < 10000) { money += Math.random() < p ? 1 : -1; steps++ }
    if (money <= 0) ruinCount++
    samples.push(money <= 0 ? 0 : 1)
    convergence.push(ruinCount / (i + 1))
  }
  return { scenario: 'gambler', iterations: n, estimate: ruinCount / n, samples, convergence }
}

export const SCENARIOS: MCScenario[] = [
  { id: 'pi', name: '圆周率π估算', description: '随机投点估算π值，观察收敛过程', params: {}, category: '基础', tags: ['几何', '概率', '收敛', '随机投点'] },
  { id: 'brownian', name: '布朗运动模拟', description: '粒子热运动随机路径模拟', params: { dt: 0.01 }, category: '物理', tags: ['物理', '随机过程', '时间序列', '扩散'] },
  { id: 'option', name: '欧式期权定价', description: 'Black-Scholes期权价格蒙特卡洛估算', params: { S0: 100, K: 105, r: 0.05, sigma: 0.2, T: 1 }, category: '金融', tags: ['金融', '风险', '定价', '正态分布'] },
  { id: 'random_walk', name: '随机游走', description: '一维离散随机游走轨迹模拟', params: {}, category: '基础', tags: ['基础', '随机过程', '离散', '路径'] },
  { id: 'diffusion', name: '粒子扩散', description: '二维粒子随机扩散位移分析', params: { D: 1, dt: 0.01 }, category: '物理', tags: ['物理', '扩散', '二维', '距离'] },
  { id: 'gambler', name: '赌徒破产', description: '不利赌局下资金耗尽概率估算', params: { p: 0.45, bankroll: 50, goal: 100 }, category: '概率', tags: ['概率', '风险', '破产', '马尔可夫链'] }
]

export const COMBO_COLORS = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899']

const API_BASE = 'http://localhost:8000'

export const useMCStore = defineStore('mc', () => {
  const currentScenario = ref<MCScenario>(SCENARIOS[0])
  const iterations = ref(1000)
  const result = ref<MCResult | null>(null)
  const testResult = ref<HypTestResult | null>(null)
  const isRunning = ref(false)

  const userQuestion = ref('')
  const recommendResult = ref<RecommendResponse | null>(null)
  const isRecommending = ref(false)
  const selectedCombo = ref<RecommendCombo | null>(null)
  const comboResults = ref<ComboResult[]>([])
  const comboRunningIndex = ref(-1)
  const isComboRunning = ref(false)
  const activeTab = ref<'single' | 'combo'>('single')

  function runSimulation() {
    isRunning.value = true
    setTimeout(() => { result.value = runMC(currentScenario.value, iterations.value); isRunning.value = false }, 10)
  }

  function runTest(g1: number[], g2: number[]) {
    const n1 = g1.length, n2 = g2.length
    const m1 = g1.reduce((a, b) => a + b, 0) / n1
    const m2 = g2.reduce((a, b) => a + b, 0) / n2
    const v1 = g1.reduce((s, x) => s + (x - m1) ** 2, 0) / (n1 - 1)
    const v2 = g2.reduce((s, x) => s + (x - m2) ** 2, 0) / (n2 - 1)
    const se = Math.sqrt(v1 / n1 + v2 / n2)
    const t = (m1 - m2) / se
    const df = Math.round((v1 / n1 + v2 / n2) ** 2 / ((v1 / n1) ** 2 / (n1 - 1) + (v2 / n2) ** 2 / (n2 - 1)))
    const pValue = 2 * (1 - Math.min(0.9999, Math.abs(t) / (Math.abs(t) + Math.sqrt(df))))
    testResult.value = { testType: 'Welch T检验', statistic: Math.round(t * 1000) / 1000, pValue: Math.round(pValue * 10000) / 10000, significant: pValue < 0.05, alpha: 0.05, df }
  }

  function setScenario(s: MCScenario) { currentScenario.value = s; result.value = null }

  async function getRecommendations(question: string) {
    if (!question.trim()) return
    userQuestion.value = question
    isRecommending.value = true
    recommendResult.value = null
    try {
      const response = await fetch(`${API_BASE}/api/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      })
      if (response.ok) {
        recommendResult.value = await response.json()
      }
    } catch (e) {
      console.error('Recommendation error:', e)
    } finally {
      isRecommending.value = false
    }
  }

  function selectCombo(combo: RecommendCombo) {
    selectedCombo.value = combo
    comboResults.value = combo.scenario_ids.map((sid, idx) => {
      const scenario = SCENARIOS.find(s => s.id === sid)!
      return {
        scenarioId: sid,
        scenarioName: scenario.name,
        result: null as unknown as MCResult,
        completed: false,
        color: COMBO_COLORS[idx % COMBO_COLORS.length]
      }
    })
    activeTab.value = 'combo'
  }

  async function runComboSimulation() {
    if (!selectedCombo.value || isComboRunning.value) return
    isComboRunning.value = true
    comboResults.value.forEach(r => { r.completed = false; r.result = null as unknown as MCResult })
    
    for (let i = 0; i < selectedCombo.value.scenario_ids.length; i++) {
      comboRunningIndex.value = i
      const sid = selectedCombo.value.scenario_ids[i]
      const scenario = SCENARIOS.find(s => s.id === sid)!
      await new Promise(resolve => setTimeout(resolve, 50))
      const result = runMC(scenario, iterations.value)
      comboResults.value[i].result = result
      comboResults.value[i].completed = true
    }
    
    comboRunningIndex.value = -1
    isComboRunning.value = false
  }

  function clearCombo() {
    selectedCombo.value = null
    comboResults.value = []
    activeTab.value = 'single'
  }

  function clearRecommend() {
    recommendResult.value = null
    userQuestion.value = ''
  }

  const convergenceData = computed(() => {
    if (!result.value) return [] as [number, number][]
    return result.value.convergence.slice(0, 200).map((v, i): [number, number] => [i, Math.round(v * 100000) / 100000])
  })

  const histogramData = computed(() => {
    if (!result.value) return { xAxis: [] as number[], data: [] as number[] }
    const s = result.value.samples.slice(0, 1000)
    const mn = Math.min(...s), mx = Math.max(...s)
    const bins = 20, bs = (mx - mn) / bins || 1
    const counts = new Array(bins).fill(0)
    s.forEach(v => { counts[Math.min(bins - 1, Math.floor((v - mn) / bs))]++ })
    return { xAxis: Array.from({ length: bins }, (_, i) => Math.round((mn + i * bs) * 100) / 100), data: counts }
  })

  const comboConvergenceData = computed(() => {
    const series: { name: string; data: [number, number][]; color: string }[] = []
    comboResults.value.forEach(r => {
      if (r.completed && r.result) {
        series.push({
          name: r.scenarioName,
          data: r.result.convergence.slice(0, 200).map((v, i): [number, number] => [i, Math.round(v * 100000) / 100000]),
          color: r.color
        })
      }
    })
    return series
  })

  const comboAllCompleted = computed(() => {
    return comboResults.value.length > 0 && comboResults.value.every(r => r.completed)
  })

  return { 
    currentScenario, iterations, result, testResult, isRunning, 
    convergenceData, histogramData, runSimulation, runTest, setScenario,
    userQuestion, recommendResult, isRecommending, selectedCombo, comboResults,
    comboRunningIndex, isComboRunning, activeTab,
    getRecommendations, selectCombo, runComboSimulation, clearCombo, clearRecommend,
    comboConvergenceData, comboAllCompleted
  }
})

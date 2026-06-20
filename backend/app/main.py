from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import re

app = FastAPI(title="Monte Carlo API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.get("/")
def root(): return {"service": "Monte Carlo API", "status": "running"}

SCENARIOS = [
    {"id": "pi", "name": "圆周率π估算", "category": "基础", "tags": ["几何", "概率", "收敛", "随机投点"]},
    {"id": "brownian", "name": "布朗运动模拟", "category": "物理", "tags": ["物理", "随机过程", "时间序列", "扩散"]},
    {"id": "option", "name": "欧式期权定价", "category": "金融", "tags": ["金融", "风险", "定价", "正态分布"]},
    {"id": "random_walk", "name": "随机游走", "category": "基础", "tags": ["基础", "随机过程", "离散", "路径"]},
    {"id": "diffusion", "name": "粒子扩散", "category": "物理", "tags": ["物理", "扩散", "二维", "距离"]},
    {"id": "gambler", "name": "赌徒破产", "category": "概率", "tags": ["概率", "风险", "破产", "马尔可夫链"]}
]

class ScenarioCombo(BaseModel):
    id: str
    name: str
    description: str
    scenarios: List[str]
    reason: str
    insights: List[str]
    keywords: List[str]
    difficulty: str

SCENARIO_COMBOS: List[ScenarioCombo] = [
    ScenarioCombo(
        id="convergence_study",
        name="收敛特性对比",
        description="对比不同蒙特卡洛方法的收敛速度和稳定性",
        scenarios=["pi", "option", "gambler"],
        reason="这三个场景分别代表几何估计、金融定价和概率估算三类典型问题，对比它们的收敛曲线可以理解样本量对估计精度的影响规律。",
        insights=["观察π估算的振荡收敛特性", "对比期权定价的平滑收敛过程", "研究赌徒破产的阶梯式收敛模式", "分析不同问题所需的最小样本量"],
        keywords=["收敛", "精度", "样本量", "稳定性", "误差分析"],
        difficulty="中级"
    ),
    ScenarioCombo(
        id="stochastic_process",
        name="随机过程对比分析",
        description="深入理解各类随机过程的特征差异",
        scenarios=["brownian", "random_walk", "diffusion"],
        reason="这三个场景分别代表连续时间、离散时间和二维空间三类随机过程，对比它们的路径特征是理解随机过程理论的最佳实践。",
        insights=["对比布朗运动的正态增量特性", "观察随机游走的整数路径特征", "分析二维扩散的距离分布规律", "理解时间尺度对过程的影响"],
        keywords=["随机过程", "时间序列", "路径", "物理", "正态分布"],
        difficulty="中级"
    ),
    ScenarioCombo(
        id="risk_analysis",
        name="风险评估组合",
        description="金融与概率中的极端风险分析",
        scenarios=["option", "gambler", "brownian"],
        reason="期权定价关注尾部风险，赌徒破产研究极端损失概率，布朗运动模拟价格波动，三者联动可全面理解风险的不同维度。",
        insights=["分析期权定价中的波动率影响", "理解赌徒破产中的风险厌恶", "观察布朗运动的极值分布", "学习如何量化不同类型的风险"],
        keywords=["风险", "金融", "极端值", "尾部概率", "波动率"],
        difficulty="高级"
    ),
    ScenarioCombo(
        id="beginner_intro",
        name="入门基础组合",
        description="适合初学者理解蒙特卡洛核心思想",
        scenarios=["pi", "random_walk", "gambler"],
        reason="从最直观的几何投点开始，到一维随机游走，再到赌徒破产，循序渐进地建立对蒙特卡洛方法的直觉理解。",
        insights=["通过投点法直观理解概率与面积的关系", "用随机游走建立随机过程的直觉", "通过赌徒问题理解累积风险", "掌握蒙特卡洛的核心思想：用频率估计概率"],
        keywords=["入门", "基础", "概率", "直觉", "教学"],
        difficulty="初级"
    ),
    ScenarioCombo(
        id="physics_simulation",
        name="物理现象模拟组合",
        description="微观粒子运动的多尺度模拟",
        scenarios=["brownian", "diffusion", "random_walk"],
        reason="从离散随机游走的微观视角，到布朗运动的介观描述，再到二维扩散的宏观统计，完整呈现物理随机现象的多尺度特性。",
        insights=["理解随机游走作为布朗运动的离散近似", "分析二维扩散的均方位移与时间的关系", "对比不同维度下随机运动的统计特性", "学习爱因斯坦关系的数值验证"],
        keywords=["物理", "粒子", "扩散", "布朗运动", "多尺度"],
        difficulty="高级"
    ),
    ScenarioCombo(
        id="finance_quant",
        name="金融量化分析组合",
        description="资产价格行为与衍生品定价",
        scenarios=["option", "brownian", "gambler"],
        reason="标的资产价格服从布朗运动，期权定价基于此假设，而赌徒破产可类比投资组合爆仓风险，构成完整的量化分析框架。",
        insights=["理解Black-Scholes模型的几何布朗运动假设", "观察不同波动率下期权价格的变化", "用赌徒破产类比资金管理风险", "学习风险中性定价的数值实现"],
        keywords=["金融", "量化", "期权", "定价", "资金管理"],
        difficulty="高级"
    )
]

class RecommendRequest(BaseModel):
    question: str

class ScenarioRef(BaseModel):
    id: str
    name: str
    category: str

class RecommendResponse(BaseModel):
    question: str
    matched_keywords: List[str]
    recommended_combos: List[Dict]
    related_scenarios: List[ScenarioRef]

def extract_keywords(text: str) -> List[str]:
    text = text.lower()
    all_keywords = set()
    for combo in SCENARIO_COMBOS:
        for kw in combo.keywords:
            if kw.lower() in text:
                all_keywords.add(kw)
    for scenario in SCENARIOS:
        for tag in scenario["tags"]:
            if tag.lower() in text:
                all_keywords.add(tag)
        if scenario["name"].lower() in text or scenario["category"].lower() in text:
            all_keywords.add(scenario["name"])
    synonyms = {
        "π": "圆周率", "pi": "圆周率",
        "股票": "金融", "期权": "金融", "投资": "风险",
        "粒子": "物理", "运动": "物理",
        "概率": "概率", "统计": "概率",
        "对比": "收敛", "比较": "收敛",
        "风险": "风险", "损失": "风险",
        "入门": "入门", "学习": "入门", "基础": "入门",
        "价格": "金融", "定价": "金融"
    }
    for syn, target in synonyms.items():
        if syn.lower() in text:
            all_keywords.add(target)
    return list(all_keywords)

def calculate_combo_score(combo: ScenarioCombo, keywords: List[str], question: str) -> float:
    score = 0.0
    question_lower = question.lower()
    for kw in keywords:
        if kw in combo.keywords:
            score += 3.0
    for kw in combo.keywords:
        if kw.lower() in question_lower:
            score += 2.0
    for scenario_id in combo.scenarios:
        scenario = next((s for s in SCENARIOS if s["id"] == scenario_id), None)
        if scenario:
            for tag in scenario["tags"]:
                if tag.lower() in question_lower:
                    score += 1.5
            if scenario["name"].lower() in question_lower:
                score += 2.5
            if scenario["category"].lower() in question_lower:
                score += 1.0
    if "入门" in keywords or "基础" in keywords:
        if combo.difficulty == "初级":
            score += 2.0
    if "高级" in question_lower or "深入" in question_lower:
        if combo.difficulty == "高级":
            score += 2.0
    if "对比" in question_lower or "比较" in question_lower or "分析" in question_lower:
        if len(combo.scenarios) >= 3:
            score += 1.5
    return score

@app.post("/api/recommend", response_model=RecommendResponse)
def get_recommendations(request: RecommendRequest):
    keywords = extract_keywords(request.question)
    
    combo_scores = []
    for combo in SCENARIO_COMBOS:
        score = calculate_combo_score(combo, keywords, request.question)
        if score > 0:
            combo_scores.append((combo, score))
    
    combo_scores.sort(key=lambda x: x[1], reverse=True)
    
    recommended_combos = []
    for combo, score in combo_scores[:3]:
        scenario_details = []
        for sid in combo.scenarios:
            scenario = next((s for s in SCENARIOS if s["id"] == sid), None)
            if scenario:
                scenario_details.append({
                    "id": scenario["id"],
                    "name": scenario["name"],
                    "category": scenario["category"],
                    "tags": scenario["tags"]
                })
        recommended_combos.append({
            "id": combo.id,
            "name": combo.name,
            "description": combo.description,
            "scenarios": scenario_details,
            "scenario_ids": combo.scenarios,
            "reason": combo.reason,
            "insights": combo.insights,
            "difficulty": combo.difficulty,
            "relevance_score": round(score, 2)
        })
    
    related_scenario_ids = set()
    for combo, _ in combo_scores:
        related_scenario_ids.update(combo.scenarios)
    for scenario in SCENARIOS:
        for tag in scenario["tags"]:
            if tag.lower() in [kw.lower() for kw in keywords]:
                related_scenario_ids.add(scenario["id"])
    
    related_scenarios = []
    for sid in related_scenario_ids:
        scenario = next((s for s in SCENARIOS if s["id"] == sid), None)
        if scenario:
            related_scenarios.append(ScenarioRef(
                id=scenario["id"],
                name=scenario["name"],
                category=scenario["category"]
            ))
    
    if not recommended_combos:
        default_combos = [SCENARIO_COMBOS[0], SCENARIO_COMBOS[3]]
        for combo in default_combos:
            scenario_details = []
            for sid in combo.scenarios:
                scenario = next((s for s in SCENARIOS if s["id"] == sid), None)
                if scenario:
                    scenario_details.append({
                        "id": scenario["id"],
                        "name": scenario["name"],
                        "category": scenario["category"],
                        "tags": scenario["tags"]
                    })
            recommended_combos.append({
                "id": combo.id,
                "name": combo.name,
                "description": combo.description,
                "scenarios": scenario_details,
                "scenario_ids": combo.scenarios,
                "reason": combo.reason,
                "insights": combo.insights,
                "difficulty": combo.difficulty,
                "relevance_score": 1.0
            })
        related_scenarios = [ScenarioRef(id=s["id"], name=s["name"], category=s["category"]) for s in SCENARIOS[:4]]
    
    return RecommendResponse(
        question=request.question,
        matched_keywords=keywords,
        recommended_combos=recommended_combos,
        related_scenarios=related_scenarios
    )

@app.get("/api/combos")
def get_all_combos():
    result = []
    for combo in SCENARIO_COMBOS:
        scenario_details = []
        for sid in combo.scenarios:
            scenario = next((s for s in SCENARIOS if s["id"] == sid), None)
            if scenario:
                scenario_details.append({
                    "id": scenario["id"],
                    "name": scenario["name"],
                    "category": scenario["category"]
                })
        result.append({
            "id": combo.id,
            "name": combo.name,
            "description": combo.description,
            "scenarios": scenario_details,
            "reason": combo.reason,
            "insights": combo.insights,
            "difficulty": combo.difficulty
        })
    return {"combos": result}

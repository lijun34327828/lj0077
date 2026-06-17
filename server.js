const express = require('express');
const cors = require('cors');
const path = require('path');

const app9847 = express();
const app3847 = express();

app9847.use(cors());
app9847.use(express.json());

app3847.use(cors());
app3847.use(express.static(path.join(__dirname, 'public')));

const INGREDIENTS = {
  blackTea: { id: 'blackTea', name: '红茶汤', unit: 'ml', color: '#8B4513', icon: '🍵' },
  greenTea: { id: 'greenTea', name: '绿茶汤', unit: 'ml', color: '#90EE90', icon: '🍃' },
  oolongTea: { id: 'oolongTea', name: '乌龙茶汤', unit: 'ml', color: '#DAA520', icon: '🫖' },
  freshMilk: { id: 'freshMilk', name: '鲜奶', unit: 'ml', color: '#FFFAF0', icon: '🥛' },
  coconutMilk: { id: 'coconutMilk', name: '椰奶', unit: 'ml', color: '#FFF8DC', icon: '🥥' },
  oatMilk: { id: 'oatMilk', name: '燕麦奶', unit: 'ml', color: '#F5DEB3', icon: '🌾' },
  fructose: { id: 'fructose', name: '果糖', unit: 'ml', color: '#FFD700', icon: '🍯' },
  brownSugar: { id: 'brownSugar', name: '黑糖', unit: 'g', color: '#654321', icon: '🟫' },
  honey: { id: 'honey', name: '蜂蜜', unit: 'ml', color: '#FFA500', icon: '🍯' },
  boba: { id: 'boba', name: '珍珠', unit: 'g', color: '#2F2F2F', icon: '⚫' },
  pudding: { id: 'pudding', name: '布丁', unit: 'g', color: '#FFEFD5', icon: '🍮' },
  coconutJelly: { id: 'coconutJelly', name: '椰果', unit: 'g', color: '#FFFFFF', icon: '⬜' },
  redBean: { id: 'redBean', name: '红豆', unit: 'g', color: '#8B0000', icon: '🫘' },
  taroBall: { id: 'taroBall', name: '芋圆', unit: 'g', color: '#D8BFD8', icon: '🟣' },
  cheeseFoam: { id: 'cheeseFoam', name: '芝士奶盖', unit: 'ml', color: '#FFFACD', icon: '🧀' },
  cream: { id: 'cream', name: '奶油', unit: 'ml', color: '#FFFAFA', icon: '🍦' },
  ice: { id: 'ice', name: '冰块', unit: 'g', color: '#E0FFFF', icon: '🧊' },
  mango: { id: 'mango', name: '芒果果肉', unit: 'g', color: '#FFD700', icon: '🥭' },
  strawberry: { id: 'strawberry', name: '草莓果肉', unit: 'g', color: '#FF69B4', icon: '🍓' },
  lemon: { id: 'lemon', name: '柠檬片', unit: '片', color: '#FFFF00', icon: '🍋' }
};

const LEVELS = [
  {
    id: 1,
    name: '经典珍珠奶茶',
    description: '最受欢迎的入门款，香甜Q弹',
    difficulty: '简单',
    recipe: {
      blackTea: 200,
      freshMilk: 150,
      fructose: 30,
      boba: 50,
      ice: 100
    },
    availableIngredients: ['blackTea', 'greenTea', 'freshMilk', 'fructose', 'brownSugar', 'boba', 'pudding', 'ice'],
    tolerance: 0.1
  },
  {
    id: 2,
    name: '抹茶拿铁',
    description: '清新抹茶遇上香浓牛奶',
    difficulty: '简单',
    recipe: {
      greenTea: 200,
      freshMilk: 180,
      fructose: 25,
      ice: 80
    },
    availableIngredients: ['greenTea', 'blackTea', 'freshMilk', 'oatMilk', 'fructose', 'honey', 'boba', 'coconutJelly', 'ice'],
    tolerance: 0.1
  },
  {
    id: 3,
    name: '芝士乌龙',
    description: '咸香奶盖搭配回甘乌龙',
    difficulty: '中等',
    recipe: {
      oolongTea: 250,
      cheeseFoam: 60,
      fructose: 20,
      ice: 120
    },
    availableIngredients: ['oolongTea', 'blackTea', 'greenTea', 'freshMilk', 'cheeseFoam', 'cream', 'fructose', 'brownSugar', 'honey', 'ice'],
    tolerance: 0.1
  },
  {
    id: 4,
    name: '杨枝甘露',
    description: '芒果椰香的热带风情',
    difficulty: '中等',
    recipe: {
      coconutMilk: 150,
      mango: 120,
      fructose: 25,
      boba: 30,
      ice: 80
    },
    availableIngredients: ['coconutMilk', 'freshMilk', 'mango', 'strawberry', 'fructose', 'honey', 'boba', 'pudding', 'coconutJelly', 'ice'],
    tolerance: 0.1
  },
  {
    id: 5,
    name: '黑糖珍珠鲜奶',
    description: '浓郁黑糖挂壁，Q弹珍珠',
    difficulty: '困难',
    recipe: {
      freshMilk: 250,
      brownSugar: 40,
      boba: 80,
      ice: 100
    },
    availableIngredients: ['freshMilk', 'oatMilk', 'brownSugar', 'fructose', 'honey', 'boba', 'pudding', 'taroBall', 'ice'],
    tolerance: 0.08
  },
  {
    id: 6,
    name: '芋圆红豆奶茶',
    description: '软糯芋圆配绵密红豆',
    difficulty: '困难',
    recipe: {
      blackTea: 180,
      freshMilk: 120,
      taroBall: 60,
      redBean: 50,
      fructose: 25,
      ice: 90
    },
    availableIngredients: ['blackTea', 'greenTea', 'freshMilk', 'coconutMilk', 'fructose', 'brownSugar', 'taroBall', 'redBean', 'boba', 'pudding', 'ice'],
    tolerance: 0.08
  },
  {
    id: 7,
    name: '柠檬蜂蜜绿茶',
    description: '清爽解腻的维C饮品',
    difficulty: '中等',
    recipe: {
      greenTea: 280,
      honey: 35,
      lemon: 3,
      ice: 100
    },
    availableIngredients: ['greenTea', 'oolongTea', 'blackTea', 'honey', 'fructose', 'lemon', 'strawberry', 'mango', 'ice'],
    tolerance: 0.1
  },
  {
    id: 8,
    name: '至尊豪华奶茶',
    description: '小料加满的终极挑战',
    difficulty: '大师',
    recipe: {
      oolongTea: 150,
      freshMilk: 100,
      oatMilk: 50,
      brownSugar: 20,
      fructose: 15,
      boba: 40,
      pudding: 40,
      coconutJelly: 30,
      taroBall: 30,
      cheeseFoam: 40,
      ice: 80
    },
    availableIngredients: ['blackTea', 'greenTea', 'oolongTea', 'freshMilk', 'oatMilk', 'coconutMilk', 'fructose', 'brownSugar', 'honey', 'boba', 'pudding', 'coconutJelly', 'redBean', 'taroBall', 'cheeseFoam', 'cream', 'ice', 'mango', 'strawberry', 'lemon'],
    tolerance: 0.05
  }
];

app9847.get('/api/ingredients', (req, res) => {
  res.json({ success: true, data: INGREDIENTS });
});

app9847.get('/api/levels', (req, res) => {
  const levels = LEVELS.map(level => ({
    id: level.id,
    name: level.name,
    description: level.description,
    difficulty: level.difficulty,
    availableIngredients: level.availableIngredients,
    tolerance: level.tolerance
  }));
  res.json({ success: true, data: levels });
});

app9847.get('/api/level/:id', (req, res) => {
  const levelId = parseInt(req.params.id);
  const level = LEVELS.find(l => l.id === levelId);
  
  if (!level) {
    return res.status(404).json({ success: false, message: '关卡不存在' });
  }
  
  const recipeWithDetails = {};
  for (const [ingId, amount] of Object.entries(level.recipe)) {
    recipeWithDetails[ingId] = {
      ...INGREDIENTS[ingId],
      amount: amount
    };
  }
  
  res.json({
    success: true,
    data: {
      id: level.id,
      name: level.name,
      description: level.description,
      difficulty: level.difficulty,
      recipe: recipeWithDetails,
      availableIngredients: level.availableIngredients,
      tolerance: level.tolerance
    }
  });
});

app9847.post('/api/validate', (req, res) => {
  const { levelId, userRecipe } = req.body;
  
  if (!levelId || !userRecipe) {
    return res.status(400).json({ success: false, message: '参数不完整' });
  }
  
  const level = LEVELS.find(l => l.id === levelId);
  if (!level) {
    return res.status(404).json({ success: false, message: '关卡不存在' });
  }
  
  const standardRecipe = level.recipe;
  const tolerance = level.tolerance;
  const errors = [];
  const warnings = [];
  const details = {};
  
  const allKeys = new Set([...Object.keys(standardRecipe), ...Object.keys(userRecipe)]);
  
  for (const ingId of allKeys) {
    const standardAmount = standardRecipe[ingId] || 0;
    const userAmount = userRecipe[ingId] || 0;
    const ingredient = INGREDIENTS[ingId];
    
    details[ingId] = {
      name: ingredient?.name || ingId,
      standard: standardAmount,
      user: userAmount,
      unit: ingredient?.unit || '',
      status: 'correct',
      diff: userAmount - standardAmount
    };
    
    if (standardAmount === 0 && userAmount > 0) {
      errors.push(`❌ 多余添加：${ingredient?.name || ingId}，标准配方不需要此原料`);
      details[ingId].status = 'extra';
      continue;
    }
    
    if (standardAmount > 0 && userAmount === 0) {
      errors.push(`❌ 缺少原料：${ingredient?.name || ingId}，标准配方需要 ${standardAmount}${ingredient?.unit || ''}`);
      details[ingId].status = 'missing';
      continue;
    }
    
    if (standardAmount > 0 && userAmount > 0) {
      const diff = Math.abs(userAmount - standardAmount);
      const allowedDiff = standardAmount * tolerance;
      
      if (diff > allowedDiff) {
        const direction = userAmount > standardAmount ? '多' : '少';
        errors.push(`⚠️ ${ingredient?.name || ingId}分量${direction}了：当前 ${userAmount}${ingredient?.unit || ''}，标准 ${standardAmount}${ingredient?.unit || ''}（允许误差±${Math.round(allowedDiff)}${ingredient?.unit || ''}）`);
        details[ingId].status = userAmount > standardAmount ? 'too_much' : 'too_little';
      } else {
        warnings.push(`✅ ${ingredient?.name || ingId}：${userAmount}${ingredient?.unit || ''}（标准 ${standardAmount}${ingredient?.unit || ''}）`);
      }
    }
  }
  
  const isPassed = errors.length === 0;
  const score = calculateScore(details, tolerance);
  
  res.json({
    success: true,
    data: {
      passed: isPassed,
      score: score,
      errors: errors,
      warnings: warnings,
      details: details,
      levelName: level.name,
      message: isPassed 
        ? `🎉 恭喜通关【${level.name}】！得分：${score}分` 
        : `调配失败，请检查以下问题后重试`
    }
  });
});

function calculateScore(details, tolerance) {
  let totalWeight = 0;
  let earnedWeight = 0;
  
  for (const ingId of Object.keys(details)) {
    const d = details[ingId];
    const weight = d.standard || d.user || 1;
    totalWeight += weight;
    
    if (d.status === 'correct') {
      earnedWeight += weight;
    } else if (d.status === 'too_much' || d.status === 'too_little') {
      const diffRatio = Math.abs(d.diff) / (d.standard * (1 + tolerance));
      earnedWeight += weight * Math.max(0, 1 - diffRatio * 2);
    }
  }
  
  return totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;
}

app9847.get('/api/health', (req, res) => {
  res.json({ success: true, message: '配比判定服务运行正常', port: 9847 });
});

const PORT_9847 = 9847;
const PORT_3847 = 3847;

app9847.listen(PORT_9847, () => {
  console.log(`🧪 配比判定逻辑服务已启动: http://localhost:${PORT_9847}`);
  console.log(`   API列表:`);
  console.log(`   GET  /api/health        - 健康检查`);
  console.log(`   GET  /api/ingredients   - 获取所有原料`);
  console.log(`   GET  /api/levels        - 获取关卡列表`);
  console.log(`   GET  /api/level/:id     - 获取指定关卡详情（含标准配比）`);
  console.log(`   POST /api/validate      - 提交配比进行判定`);
});

app3847.listen(PORT_3847, () => {
  console.log(`\n🎮 可视化游玩画布已启动: http://localhost:${PORT_3847}`);
  console.log(`   打开浏览器即可开始游戏！`);
});

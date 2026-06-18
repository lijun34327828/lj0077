const API_BASE = 'http://localhost:9847/api';

class MilkTeaGame {
  constructor() {
    this.currentLevelId = 1;
    this.maxUnlockedLevel = 1;
    this.completedLevels = new Set();
    this.ingredients = {};
    this.levels = [];
    this.currentLevel = null;
    this.currentRecipe = {};
    this.history = [];
    this.validationDetails = {};
    this.lastResult = null;
    this.isReady = false;
    this.initError = null;
  }

  async init() {
    try {
      this.initElements();
      this.attachEvents();
      this.showLoadingState();
      await this.loadIngredients();
      await this.loadLevels();
      const saved = this.loadFromStorage();
      if (saved) {
        this.maxUnlockedLevel = saved.maxUnlockedLevel || 1;
        this.completedLevels = new Set(saved.completedLevels || []);
        this.currentLevelId = saved.currentLevelId || 1;
      }
      if (this.currentLevelId > this.levels.length && this.levels.length > 0) {
        this.currentLevelId = 1;
      }
      await this.loadLevel(this.currentLevelId);
      this.updateUnlockedDisplay();
      this.isReady = true;
      this.hideLoadingState();
    } catch (e) {
      console.error('初始化失败:', e);
      this.initError = e.message || String(e);
      this.showInitError();
    }
  }

  showLoadingState() {
    if (this.els?.ingredientCount) {
      this.els.ingredientCount.textContent = '加载中...';
    }
    if (this.els?.comparisonRows) {
      this.els.comparisonRows.innerHTML = '<div class="empty-state"><p>⏳ 数据加载中...</p></div>';
    }
  }

  hideLoadingState() {
    if (this.els?.ingredientCount) {
      this.els.ingredientCount.textContent = `可用原料: ${(this.currentLevel?.availableIngredients || []).length}种`;
    }
  }

  showInitError() {
    const msg = this.initError || '未知错误';
    if (this.els?.ingredientList) {
      this.els.ingredientList.innerHTML = '';
    }
    if (this.els?.ingredientCount) {
      this.els.ingredientCount.textContent = '加载失败';
    }
    if (this.els?.comparisonRows) {
      this.els.comparisonRows.innerHTML = `<div class="empty-state"><p>❌ 初始化失败</p><p style="font-size:12px;margin-top:8px;color:var(--danger);">${msg}</p><p style="font-size:12px;margin-top:8px;">请检查后端服务是否启动</p></div>`;
    }
    this.showToast('游戏初始化失败: ' + msg, 'error');
  }

  initElements() {
    this.els = {
      currentLevel: document.getElementById('currentLevel'),
      levelName: document.getElementById('levelName'),
      unlockedLevels: document.getElementById('unlockedLevels'),
      levelSelectBtn: document.getElementById('levelSelectBtn'),
      ingredientList: document.getElementById('ingredientList'),
      ingredientCount: document.getElementById('ingredientCount'),
      dropZone: document.getElementById('dropZone'),
      cupContents: document.getElementById('cupContents'),
      dropHint: document.getElementById('dropHint'),
      addedItems: document.getElementById('addedItems'),
      addedCount: document.getElementById('addedCount'),
      undoBtn: document.getElementById('undoBtn'),
      clearBtn: document.getElementById('clearBtn'),
      validateBtn: document.getElementById('validateBtn'),
      comparisonRows: document.getElementById('comparisonRows'),
      recipeTitle: document.getElementById('recipeTitle'),
      recipeDesc: document.getElementById('recipeDesc'),
      difficultyBadge: document.getElementById('difficultyBadge'),
      toleranceInfo: document.getElementById('toleranceInfo'),
      lastResult: document.getElementById('lastResult'),
      resultContent: document.getElementById('resultContent'),
      modal: document.getElementById('modal'),
      modalTitle: document.getElementById('modalTitle'),
      modalBody: document.getElementById('modalBody'),
      modalClose: document.getElementById('modalClose'),
      modalOverlay: document.querySelector('.modal-overlay'),
      toast: document.getElementById('toast')
    };
  }

  attachEvents() {
    this.els.levelSelectBtn.addEventListener('click', () => this.openLevelSelect());
    this.els.undoBtn.addEventListener('click', () => this.undo());
    this.els.clearBtn.addEventListener('click', () => this.clearAll());
    this.els.validateBtn.addEventListener('click', () => this.validateRecipe());
    this.els.modalClose.addEventListener('click', () => this.closeModal());
    this.els.modalOverlay.addEventListener('click', () => this.closeModal());
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.els.modal.classList.contains('hidden')) {
        this.closeModal();
      }
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') { e.preventDefault(); this.undo(); }
        if (e.key === 'Enter') { e.preventDefault(); this.validateRecipe(); }
      }
    });

    this.els.dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.els.dropZone.classList.add('drag-over');
    });
    this.els.dropZone.addEventListener('dragleave', () => {
      this.els.dropZone.classList.remove('drag-over');
    });
    this.els.dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      this.els.dropZone.classList.remove('drag-over');
      const ingId = e.dataTransfer.getData('text/plain');
      if (ingId) this.addIngredient(ingId);
    });
  }

  async loadIngredients() {
    try {
      const res = await fetch(`${API_BASE}/ingredients`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json = await res.json();
      if (json.success) {
        this.ingredients = json.data;
      } else {
        throw new Error(json.message || '加载原料失败');
      }
    } catch (e) {
      console.error('加载原料失败:', e);
      this.showToast('无法连接到判定服务器，请检查后端服务是否启动', 'error');
      throw e;
    }
  }

  async loadLevels() {
    try {
      const res = await fetch(`${API_BASE}/levels`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json = await res.json();
      if (json.success) {
        this.levels = json.data;
      } else {
        throw new Error(json.message || '加载关卡列表失败');
      }
    } catch (e) {
      console.error('加载关卡失败:', e);
      throw e;
    }
  }

  async loadLevel(levelId) {
    try {
      const res = await fetch(`${API_BASE}/level/${levelId}`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json = await res.json();
      if (json.success) {
        this.currentLevel = json.data;
        this.currentLevelId = levelId;
        this.currentRecipe = {};
        this.history = [];
        this.validationDetails = {};
        this.lastResult = null;
        this.updateLevelInfo();
        this.renderIngredientList();
        this.renderComparison();
        this.renderAddedList();
        this.renderCup();
        this.saveToStorage();
      } else {
        throw new Error(json.message || '加载关卡失败');
      }
    } catch (e) {
      console.error('加载关卡详情失败:', e);
      this.showToast('加载关卡失败: ' + (e.message || e), 'error');
      throw e;
    }
  }

  updateLevelInfo() {
    this.els.currentLevel.textContent = `第 ${this.currentLevel.id} 关`;
    this.els.levelName.textContent = this.currentLevel.name;
    this.els.recipeTitle.textContent = `${this.currentLevel.name} - 标准配方`;
    this.els.recipeDesc.textContent = this.currentLevel.description;
    this.els.difficultyBadge.textContent = this.currentLevel.difficulty;
    this.els.difficultyBadge.className = 'difficulty-badge ' + this.currentLevel.difficulty;
    this.els.toleranceInfo.textContent = `📐 允许误差：±${Math.round(this.currentLevel.tolerance * 100)}%`;
    this.updateUnlockedDisplay();
  }

  updateUnlockedDisplay() {
    this.els.unlockedLevels.textContent = `已解锁 ${this.maxUnlockedLevel}/${this.levels.length}`;
  }

  renderIngredientList() {
    const available = this.currentLevel.availableIngredients || [];
    this.els.ingredientCount.textContent = `可用原料: ${available.length}种`;
    this.els.ingredientList.innerHTML = '';
    available.forEach(ingId => {
      const ing = this.ingredients[ingId];
      if (!ing) return;
      const el = document.createElement('div');
      el.className = 'ingredient-item';
      el.draggable = true;
      el.dataset.id = ingId;
      el.innerHTML = `
        <div class="ingredient-icon">${ing.icon}</div>
        <div class="ingredient-name">${ing.name}</div>
        <div class="ingredient-unit">(${ing.unit})</div>
      `;
      el.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', ingId);
        el.classList.add('dragging');
      });
      el.addEventListener('dragend', () => el.classList.remove('dragging'));
      el.addEventListener('click', () => this.addIngredient(ingId));
      this.els.ingredientList.appendChild(el);
    });
  }

  addIngredient(ingId) {
    const ing = this.ingredients[ingId];
    if (!ing) return;
    let defaultAmount;
    if (ing.unit === 'ml') defaultAmount = 50;
    else if (ing.unit === 'g') defaultAmount = 30;
    else if (ing.unit === '片') defaultAmount = 1;
    else defaultAmount = 10;
    if (!this.currentRecipe[ingId]) {
      this.currentRecipe[ingId] = 0;
    }
    const oldAmount = this.currentRecipe[ingId];
    this.currentRecipe[ingId] += defaultAmount;
    this.history.push({ type: 'add', ingId, amount: defaultAmount, oldAmount });
    this.renderAddedList();
    this.renderCup();
    this.renderComparison();
    this.showToast(`已添加 ${ing.name} ${defaultAmount}${ing.unit}`, 'success');
  }

  adjustAmount(ingId, delta) {
    const ing = this.ingredients[ingId];
    if (!ing || !this.currentRecipe[ingId]) return;
    let step;
    if (ing.unit === 'ml') step = 10;
    else if (ing.unit === 'g') step = 5;
    else step = 1;
    const oldAmount = this.currentRecipe[ingId];
    const newAmount = Math.max(0, oldAmount + delta * step);
    if (newAmount === oldAmount) return;
    this.history.push({ type: 'adjust', ingId, oldAmount, newAmount });
    if (newAmount === 0) {
      delete this.currentRecipe[ingId];
    } else {
      this.currentRecipe[ingId] = newAmount;
    }
    this.renderAddedList();
    this.renderCup();
    this.renderComparison();
  }

  removeIngredient(ingId) {
    const ing = this.ingredients[ingId];
    if (!ing || !this.currentRecipe[ingId]) return;
    const oldAmount = this.currentRecipe[ingId];
    this.history.push({ type: 'remove', ingId, oldAmount });
    delete this.currentRecipe[ingId];
    this.renderAddedList();
    this.renderCup();
    this.renderComparison();
    this.showToast(`已移除 ${ing.name}`, 'info');
  }

  setAmount(ingId, amount) {
    const ing = this.ingredients[ingId];
    if (!ing) return;
    amount = parseInt(amount) || 0;
    if (amount < 0) amount = 0;
    const oldAmount = this.currentRecipe[ingId] || 0;
    if (amount === oldAmount) return;
    this.history.push({ type: 'set', ingId, oldAmount, newAmount: amount });
    if (amount === 0) {
      delete this.currentRecipe[ingId];
    } else {
      this.currentRecipe[ingId] = amount;
    }
    this.renderAddedList();
    this.renderCup();
    this.renderComparison();
  }

  undo() {
    if (this.history.length === 0) {
      this.showToast('没有可撤销的操作', 'warning');
      return;
    }
    const last = this.history.pop();
    switch (last.type) {
      case 'add':
        this.currentRecipe[last.ingId] = last.oldAmount;
        if (this.currentRecipe[last.ingId] === 0) {
          delete this.currentRecipe[last.ingId];
        }
        break;
      case 'adjust':
      case 'set':
        if (last.oldAmount === 0) {
          delete this.currentRecipe[last.ingId];
        } else {
          this.currentRecipe[last.ingId] = last.oldAmount;
        }
        break;
      case 'remove':
        this.currentRecipe[last.ingId] = last.oldAmount;
        break;
    }
    this.renderAddedList();
    this.renderCup();
    this.renderComparison();
    this.showToast('已撤销上一步操作', 'info');
  }

  clearAll() {
    if (Object.keys(this.currentRecipe).length === 0) {
      this.showToast('操作台已经是空的', 'warning');
      return;
    }
    this.history.push({ type: 'clearAll', snapshot: JSON.parse(JSON.stringify(this.currentRecipe)) });
    this.currentRecipe = {};
    this.renderAddedList();
    this.renderCup();
    this.renderComparison();
    this.showToast('操作台已清空', 'info');
  }

  renderAddedList() {
    const entries = Object.entries(this.currentRecipe);
    this.els.addedCount.textContent = entries.length;
    this.els.addedItems.innerHTML = '';
    if (entries.length === 0) {
      this.els.addedItems.innerHTML = '<div class="empty-state"><p>🥤 暂无原料，请添加</p></div>';
      return;
    }
    entries.forEach(([ingId, amount]) => {
      const ing = this.ingredients[ingId];
      const detail = this.validationDetails[ingId];
      let statusText = '';
      let statusClass = '';
      if (detail) {
        if (detail.status === 'correct') {
          statusText = '✅ 分量OK';
          statusClass = 'color: var(--success)';
        } else if (detail.status === 'too_much') {
          statusText = `⚠️ 多了${Math.abs(detail.diff)}${ing.unit}`;
          statusClass = 'color: var(--warning)';
        } else if (detail.status === 'too_little') {
          statusText = `⚠️ 少了${Math.abs(detail.diff)}${ing.unit}`;
          statusClass = 'color: var(--info)';
        } else if (detail.status === 'extra') {
          statusText = '❌ 多余';
          statusClass = 'color: var(--danger)';
        } else if (detail.status === 'missing') {
          statusText = '❌ 缺少';
          statusClass = 'color: var(--danger)';
        }
      }
      const item = document.createElement('div');
      item.className = 'added-item';
      item.innerHTML = `
        <div class="added-item-icon">${ing.icon}</div>
        <div class="added-item-info">
          <div class="added-item-name">${ing.name}</div>
          <div class="added-item-status" style="${statusClass}">${statusText || `单位: ${ing.unit}`}</div>
        </div>
        <div class="added-item-controls">
          <div class="amount-control">
            <button class="amount-btn" data-action="minus">−</button>
            <input type="number" class="amount-display" value="${amount}" min="0" style="width:50px;text-align:center;border:none;background:transparent;font-weight:700;font-size:13px;color:var(--text);outline:none;">
            <button class="amount-btn" data-action="plus">+</button>
            <span class="amount-unit">${ing.unit}</span>
          </div>
          <button class="remove-btn" title="移除">✕</button>
        </div>
      `;
      const minusBtn = item.querySelector('[data-action="minus"]');
      const plusBtn = item.querySelector('[data-action="plus"]');
      const input = item.querySelector('.amount-display');
      const removeBtn = item.querySelector('.remove-btn');
      minusBtn.addEventListener('click', () => this.adjustAmount(ingId, -1));
      plusBtn.addEventListener('click', () => this.adjustAmount(ingId, 1));
      input.addEventListener('change', (e) => this.setAmount(ingId, e.target.value));
      removeBtn.addEventListener('click', () => this.removeIngredient(ingId));
      this.els.addedItems.appendChild(item);
    });
  }

  renderCup() {
    const layers = [];
    let totalMl = 0;
    const liquidIngs = ['blackTea', 'greenTea', 'oolongTea', 'freshMilk', 'coconutMilk', 'oatMilk', 'cheeseFoam', 'cream', 'fructose', 'brownSugar', 'honey'];
    const toppingIngs = ['boba', 'pudding', 'coconutJelly', 'redBean', 'taroBall', 'mango', 'strawberry', 'lemon', 'ice'];
    liquidIngs.forEach(ingId => {
      if (this.currentRecipe[ingId]) {
        const ing = this.ingredients[ingId];
        let amount = this.currentRecipe[ingId];
        if (ing.unit === 'g') amount = amount * 0.8;
        layers.push({ type: 'liquid', ing, amount });
        totalMl += amount;
      }
    });
    const toppings = [];
    toppingIngs.forEach(ingId => {
      if (this.currentRecipe[ingId]) {
        const ing = this.ingredients[ingId];
        const count = Math.ceil(this.currentRecipe[ingId] / 10);
        for (let i = 0; i < Math.min(count, 8); i++) {
          toppings.push({ ing });
        }
        if (ing.unit === 'ml') totalMl += this.currentRecipe[ingId] * 0.3;
      }
    });
    const maxMl = 600;
    const maxHeight = 270;
    const scale = Math.min(totalMl / maxMl, 1);
    const heightPx = maxHeight * scale;
    this.els.cupContents.innerHTML = '';
    if (layers.length > 0) {
      let cumHeight = 0;
      if (toppings.length > 0) {
        const toppingHeight = Math.min(30, 20 + toppings.length * 2);
        cumHeight += toppingHeight;
        const toppingEl = document.createElement('div');
        toppingEl.className = 'cup-layer toppings';
        toppingEl.style.height = toppingHeight + 'px';
        toppings.forEach(t => {
          const span = document.createElement('span');
          span.className = 'topping-item';
          span.textContent = t.icon;
          toppingEl.appendChild(span);
        });
        this.els.cupContents.appendChild(toppingEl);
      }
      layers.reverse().forEach(layer => {
        const layerRatio = layer.amount / totalMl;
        const layerHeight = (heightPx - cumHeight) * layerRatio;
        if (layerHeight < 2) return;
        const el = document.createElement('div');
        el.className = 'cup-layer';
        el.style.height = layerHeight + 'px';
        el.style.background = layer.ing.color;
        el.style.opacity = '0.85';
        el.innerHTML = `<span class="layer-text">${layer.ing.icon} ${layer.ing.name}</span>`;
        this.els.cupContents.appendChild(el);
      });
    }
    if (layers.length === 0 && toppings.length === 0) {
      this.els.dropHint.classList.remove('hidden');
    } else {
      this.els.dropHint.classList.add('hidden');
    }
  }

  renderComparison() {
    if (!this.currentLevel) return;
    const recipe = this.currentLevel.recipe || {};
    const allKeys = new Set([
      ...Object.keys(recipe), ...Object.keys(this.currentRecipe)]);
    this.els.comparisonRows.innerHTML = '';
    if (allKeys.size === 0) {
      this.els.comparisonRows.innerHTML = '<div class="empty-state"><p>🎯 标准配比待显示</p></div>';
      return;
    }
    this.validationDetails = {};
    const tolerance = this.currentLevel.tolerance;
    allKeys.forEach(ingId => {
      const standard = recipe[ingId]?.amount || recipe[ingId] || 0;
      const current = this.currentRecipe[ingId] || 0;
      const ing = this.ingredients[ingId];
      let status = 'correct';
      if (standard === 0 && current > 0) {
        status = 'extra';
      } else if (standard > 0 && current === 0) {
        status = 'missing';
      } else if (standard > 0 && current > 0) {
        const diff = Math.abs(current - standard);
        const allowed = standard * tolerance;
        if (diff > allowed) {
          status = current > standard ? 'too_much' : 'too_little';
        }
      }
      this.validationDetails[ingId] = {
        standard, user: current, status, diff: current - standard
      };
      const row = document.createElement('div');
      row.className = `comparison-row status-${status}`;
      let statusIcon = '✅';
      if (status === 'missing') statusIcon = '❌';
      if (status === 'extra') statusIcon = '⛔';
      if (status === 'too_much') statusIcon = '📈';
      if (status === 'too_little') statusIcon = '📉';
      let percent = 0;
      let diffClass = 'perfect';
      if (standard > 0) {
        percent = Math.min((current / standard) * 100, 150);
        if (status === 'too_much') diffClass = 'over';
        else if (status === 'too_little') diffClass = 'under';
      } else if (current > 0) {
        percent = 100;
        diffClass = 'over';
      }
      const displayStandard = standard;
      row.innerHTML = `
        <div class="ingredient-cell">
          <span class="ing-icon">${ing?.icon || '❓'}</span>
          <span class="ing-name">${ing?.name || ingId}</span>
        </div>
        <div class="amount-cell">
          ${displayStandard}<span class="unit">${ing?.unit || ''}</span>
          <div class="diff-bar"><div class="diff-fill perfect" style="width:100%"></div></div>
        </div>
        <div class="amount-cell">
          ${current}<span class="unit">${ing?.unit || ''}</span>
          <div class="diff-bar"><div class="diff-fill ${diffClass}" style="width:${percent}%"></div></div>
        </div>
        <div class="status-cell">${statusIcon}</div>
      `;
      this.els.comparisonRows.appendChild(row);
    });
  }

  async validateRecipe() {
    if (Object.keys(this.currentRecipe).length === 0) {
      this.showToast('请先添加原料后再验证！', 'warning');
      return;
    }
    this.els.validateBtn.disabled = true;
    this.els.validateBtn.textContent = '🔍 验证中...';
    try {
      const res = await fetch(`${API_BASE}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          levelId: this.currentLevelId,
          userRecipe: this.currentRecipe
        })
      });
      const json = await res.json();
      if (json.success) {
        this.handleValidationResult(json.data);
      } else {
        this.showToast(json.message || '验证失败', 'error');
      }
    } catch (e) {
      this.showToast('无法连接到判定服务器', 'error');
    } finally {
      this.els.validateBtn.disabled = false;
      this.els.validateBtn.innerHTML = '✅ 提交配比 / 验证通关';
    }
  }

  handleValidationResult(result) {
    this.lastResult = result;
    if (result.details) {
      Object.entries(result.details).forEach(([ingId, detail]) => {
        if (this.validationDetails[ingId]) {
          this.validationDetails[ingId].status = detail.status;
        }
      });
    }
    this.renderComparison();
    this.renderAddedList();
    this.renderLastResult(result);
    if (result.passed) {
      this.completedLevels.add(this.currentLevelId);
      if (this.currentLevelId >= this.maxUnlockedLevel) {
        this.maxUnlockedLevel = Math.min(this.currentLevelId + 1, this.levels.length);
      }
      this.updateUnlockedDisplay();
      this.saveToStorage();
      this.showPassedModal(result);
    } else {
      this.showToast(result.message, 'error');
    }
  }

  renderLastResult(result) {
    this.els.lastResult.classList.remove('hidden');
    const cls = result.passed ? 'passed' : 'failed';
    let errorsHtml = '';
    if (result.errors && result.errors.length > 0) {
      errorsHtml = '<div class="result-errors">' +
        result.errors.map(e => `<div class="result-error-item">${e}</div>`).join('') +
        '</div>';
    }
    let warningsHtml = '';
    if (result.warnings && result.warnings.length > 0 && !result.passed) {
      warningsHtml = '<div class="result-errors">' +
        result.warnings.map(w => `<div class="result-success-item">${w}</div>`).join('') +
        '</div>';
    }
    this.els.resultContent.innerHTML = `
      <div class="result-card ${cls}">
        <div class="result-score">
          <span class="score-number">${result.score}</span>
          <span class="score-label">分</span>
        </div>
        <div class="result-message">${result.message}</div>
        ${errorsHtml}
        ${warningsHtml}
      </div>
    `;
  }

  showPassedModal(result) {
    const isLast = this.currentLevelId >= this.levels.length;
    const nextLevelId = this.currentLevelId + 1;
    let actionsHtml = '';
    if (isLast) {
      actionsHtml = `
        <button class="btn btn-primary btn-large" onclick="game.closeModal(); game.showToast('🎉 恭喜你通关所有关卡！', 'success');">
          🏆 完成全部挑战
        </button>
      `;
    } else {
      actionsHtml = `
        <button class="btn btn-outline" onclick="game.closeModal();">
          继续研究本关
        </button>
        <button class="btn btn-primary" onclick="game.closeModal(); game.loadLevel(${nextLevelId});">
          ▶️ 进入第 ${nextLevelId} 关
        </button>
      `;
    }
    this.els.modalTitle.innerHTML = '🎉 通关成功！';
    this.els.modalBody.innerHTML = `
      <div class="passed-celebration">
        <div class="passed-emoji">🧋✨</div>
        <div class="passed-title">完美调配 ${this.currentLevel.name}</div>
        <div class="passed-subtitle">得分：${result.score} 分 | 已解锁 ${this.maxUnlockedLevel}/${this.levels.length} 关</div>
        <div style="margin-bottom:24px;">
          <div class="result-card passed" style="display:inline-block;text-align:left;">
            ${result.warnings?.map(w => `<div class="result-success-item">${w}</div>`).join('') || ''}
          </div>
        </div>
        <div class="passed-actions">
          ${actionsHtml}
        </div>
      </div>
    `;
    this.els.modal.classList.remove('hidden');
  }

  openLevelSelect() {
    this.els.modalTitle.textContent = '📋 选择关卡';
    let html = '<div class="level-grid">';
    this.levels.forEach(level => {
      const isLocked = level.id > this.maxUnlockedLevel;
      const isCompleted = this.completedLevels.has(level.id);
      const isCurrent = level.id === this.currentLevelId;
      const classes = ['level-card'];
      if (isLocked) classes.push('locked');
      if (isCompleted) classes.push('completed');
      if (isCurrent) classes.push('current');
      const ingsPreview = (level.availableIngredients || []).slice(0, 6).map(id => this.ingredients[id]?.icon || '').join(' ');
      html += `
        <div class="${classes.join(' ')}" data-id="${level.id}" ${isLocked ? '' : `onclick="game.closeModal(); game.loadLevel(${level.id});"`}>
          <div class="level-card-header">
            <div class="level-number">${level.id}</div>
            <div class="level-card-name">${level.name}</div>
          </div>
          <div class="level-card-desc">${level.description}</div>
          <div class="level-card-footer">
            <span class="difficulty-badge ${level.difficulty}">${level.difficulty}</span>
            <span title="可用原料">${ingsPreview}</span>
          </div>
        </div>
      `;
    });
    html += '</div>';
    this.els.modalBody.innerHTML = html;
    this.els.modal.classList.remove('hidden');
  }

  closeModal() {
    this.els.modal.classList.add('hidden');
  }

  showToast(message, type = 'info') {
    this.els.toast.className = `toast ${type}`;
    this.els.toast.textContent = message;
    this.els.toast.classList.remove('hidden');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      this.els.toast.classList.add('hidden');
    }, 2500);
  }

  saveToStorage() {
    try {
      localStorage.setItem('milktea_game', JSON.stringify({
        maxUnlockedLevel: this.maxUnlockedLevel,
        completedLevels: [...this.completedLevels],
        currentLevelId: this.currentLevelId
      }));
    } catch (e) {}
  }

  loadFromStorage() {
    try {
      const data = localStorage.getItem('milktea_game');
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }
}

let game;

function bootstrapGame() {
  if (game) return;
  game = new MilkTeaGame();
  window.game = game;
  game.init().catch(e => {
    console.error('游戏启动失败:', e);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrapGame);
} else {
  bootstrapGame();
}

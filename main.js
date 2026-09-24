// ========== 游戏基础数据 ==========

// 玩家数据
const player = {
  money: 300,
  totalHatchExp: 0,
  hatchLevel: 0,
};

// 游戏内时间，单位：天
const gameTime = {
  day: 0,
};

// 所有蛋
let eggs = [];

// 所有小鸡
let chicks = [];

// 所有成年鸡
let adultChickens = [];

// 所有已经死去的鸡（不再是活鸡，但仍可进背包、可售卖为 0 元）
let deadChickens = [];

// 所有工具（目前包括孵化器？）
let tools = [];

// 所有孵化器（每种工具数据格式不同）
let incubators = [];

// 孵蛋场景大格子位置
let hatchStations = [];

// 育雏场景中的大格子
let broodStations = [];

// 生活场景中的大格子
let lifeStations = [];

const bagSlot = {
  slotId: "bag",
  slotType: "bag",
  singleAcceptTypes: [],
  singleItemId: null,
  singleRequired: false,
  groupAcceptTypes: [
    "egg",
    "chick",
    "adultFemale",
    "adultMale",
    "incubator",
    "tool",
  ],
  groupItemIds: [],
  groupCapacity: 999,
  positionPoints: [],
  locationType: locationTypes.bag,
};

// 场景列表，按从左到右的顺序排列
const scenes = [
  document.getElementById("hatch-scene"), // 左侧：孵蛋场景
  document.getElementById("main-scene"), // 中间：主界面
  document.getElementById("brood-scene"), // 右侧：育雏场景
  document.getElementById("life-scene"), // 最右侧：生活场景
];

// 场景名称列表，和上面顺序对应
const sceneNames = ["孵蛋场景", "主界面", "育雏场景", "生活场景"];

const sceneContainer = document.getElementById("scene-container");
const sceneNameDisplay = document.getElementById("scene-name");

let currentSceneIndex = 1; // 默认显示中间的主界面
let touchStartX = 0;
let touchEndX = 0;
let currentShopCategory = "egg";
let currentBagCategory = "egg";
let inspectMode = false;
let zoomScale = 1.5;
let lastTouchDistance = 0;
let justZoomed = false;
let lastClickTime = 0; //双击判定
let currentInspectedTarget = null; //双击打开的物品
let draggingItem = null; //拖动的物品
let dragMoved = false; //距离判定是否算拖动
let sellModeActive = false; // 是否处于售卖模式
let confirmAction = null; // 和弹出确认窗有关，点确认后要执行的动作
const selectedForSell = []; // 当前勾选要卖出的物品 id
const moneyDisplay = document.getElementById("money");
const levelDisplay = document.getElementById("level");
const shopPanel = document.getElementById("shop-panel");
const shopBtn = document.getElementById("shop-btn");
const closeShopBtn = document.getElementById("close-shop");
const bagPanel = document.getElementById("bag-panel");
const bagBtn = document.getElementById("bag-btn");
const closeBagBtn = document.getElementById("close-bag");
const sellBagBtn = document.getElementById("sell-bag-btn");
const bagInspectLayer = document.getElementById("bag-inspect");
const bagInspectImg = document.getElementById("bag-inspect-img");
const sceneEggSlotContainerId = "scene_egg_slots";

loadGame();
initScenes();
refreshAll();

// 重新渲染全部界面（顶栏、状态、两个场景）
function refreshAll() {
  updateTopBar();
  renderMainSceneStatus();
  ensureHatchStation();
  renderHatchScene();
  ensureBroodStation();
  renderBroodScene();
  ensureLifeStation();
  renderLifeScene();
}
// 切换到指定场景
function goToScene(index) {
  currentSceneIndex = index;
  sceneContainer.scrollTo({
    left: index * sceneContainer.clientWidth,
    behavior: "smooth",
  });
  sceneNameDisplay.textContent = sceneNames[index];
}

// 判断滑动方向并切换场景
function handleSwipe() {
  const distance = touchEndX - touchStartX;

  // 滑动距离太短就忽略
  if (Math.abs(distance) < 100) {
    return;
  }

  if (distance < 0 && currentSceneIndex < scenes.length - 1) {
    // 左滑，去下一个场景
    goToScene(currentSceneIndex + 1);
  } else if (distance > 0 && currentSceneIndex > 0) {
    // 右滑，去上一个场景
    goToScene(currentSceneIndex - 1);
  }
}

// 触摸开始
sceneContainer.addEventListener("touchstart", function (event) {
  touchStartX = event.touches[0].clientX;
});

// 触摸结束
sceneContainer.addEventListener("touchend", function (event) {
  // 如果刚刚在拖动物品，就不切换场景
  if (draggingItem || dragMoved) return;
  touchEndX = event.changedTouches[0].clientX;
  handleSwipe();
});

// 初始化：让场景容器先跳到主界面，避免刷新后显示错位
function initScenes() {
  const containerWidth = sceneContainer.clientWidth;
  sceneContainer.scrollTo({
    left: currentSceneIndex * containerWidth,
    behavior: "instant",
  });
  sceneNameDisplay.textContent = sceneNames[currentSceneIndex];
}

// 锁定当前场景的纵向滚动（拖动时用）
function lockSceneScroll() {
  const grid = currentSceneGrid();
  if (grid) grid.style.overflowY = "hidden";
}

// 恢复当前场景的纵向滚动（拖动时用）
function unlockSceneScroll() {
  const grid = currentSceneGrid();
  if (grid) grid.style.overflowY = "auto";
}

// 根据当前场景，返回对应的 grid 容器（拖动时用）
function currentSceneGrid() {
  if (currentSceneIndex === 0) return document.getElementById("hatch-grid");
  if (currentSceneIndex === 2) return document.getElementById("brood-grid");
  if (currentSceneIndex === 3) return document.getElementById("life-grid");
  return null;
}

//双击判定
function isDoubleClick() {
  const now = Date.now();
  const isDouble = now - lastClickTime < 300;
  lastClickTime = now;
  return isDouble;
}

// 更新顶部状态栏
function updateTopBar() {
  moneyDisplay.textContent = "资金：" + player.money;
  levelDisplay.textContent = "等级：" + player.hatchLevel;
}

// 渲染主界面状态信息
function renderMainSceneStatus() {
  const statusDiv = document.getElementById("main-status");
  let lines = [];

  if (eggs.length > 0) {
    lines.push("您当前有 " + eggs.length + " 颗蛋");

    for (const egg of eggs) {
      if (egg.location && egg.location.type === locationTypes.incubator) {
        lines.push(
          "一颗" + egg.name + "已孵化 " + egg.hatchProgress.elapsedDays + " 天",
        );
      }
    }
  }

  const totalChickenCount = chicks.length + adultChickens.length;

  if (totalChickenCount > 0) {
    let line = "您当前有 " + totalChickenCount + " 只鸡";

    const chickCount = chicks.length;
    const adultHenCount = adultChickens.filter(
      (c) => c.gender === "female",
    ).length;
    const adultRoosterCount = adultChickens.filter(
      (c) => c.gender === "male",
    ).length;

    const parts = [];
    if (chickCount > 0) {
      parts.push(chickCount + "只雏鸡");
    }
    if (adultHenCount > 0) {
      parts.push(adultHenCount + "只母鸡");
    }
    if (adultRoosterCount > 0) {
      parts.push(adultRoosterCount + "只公鸡");
    }

    if (parts.length > 0) {
      line += "，其中" + parts.join("，");
    }

    lines.push(line);
  }

  const toolParts = [];

  if (incubators.length > 0) {
    toolParts.push(incubators.length + " 个孵化器");
  }

  for (const tool of tools) {
    if (tool.quantity > 0) {
      const itemInfo = shopItems.tool.find((item) => item.id === tool.id);
      toolParts.push(
        tool.quantity + " 个" + (itemInfo ? itemInfo.name : tool.id),
      );
    }
  }

  if (toolParts.length > 0) {
    lines.push("您当前有" + toolParts.join("，"));
  }

  statusDiv.innerHTML = lines.join("<br>");
}

// 保证孵蛋场景大格子的数量始终比已放入场景的孵化器多一个
function ensureHatchStation() {
  const occupiedCount = hatchStations.filter(
    (station) =>
      station.singleItemId !== null || station.groupItemIds.length > 0,
  ).length;

  const targetCount = occupiedCount + 1;

  while (hatchStations.length < targetCount) {
    hatchStations.push({
      slotId: Date.now() + Math.random(),
      slotType: "hatchStation",
      singleItemId: null,
      singleRequired: true,
      singleAcceptTypes: ["incubator", "adultFemale"],
      groupItemIds: [],
      groupCapacity: 20,
      groupAcceptTypes: ["egg", "chick"],
      positionPoints: [],
      locationType: locationTypes.sceneSlot,
    });
  }

  while (hatchStations.length > targetCount) {
    // 从后往前找第一个空着的格子
    let emptyIndex = -1;
    for (let i = hatchStations.length - 1; i >= 0; i--) {
      const s = hatchStations[i];
      if (s.singleItemId === null && s.groupItemIds.length === 0) {
        emptyIndex = i;
        break;
      }
    }

    // 找不到空格子就停止，避免误删还在用的格子
    if (emptyIndex === -1) break;

    hatchStations.splice(emptyIndex, 1);
  }
}

// 保证育雏场景大格子数量始终比已占用的大格子多一个
function ensureBroodStation() {
  const occupiedCount = broodStations.filter(
    (station) =>
      station.singleItemId !== null || station.groupItemIds.length > 0,
  ).length;

  const targetCount = occupiedCount + 1;

  while (broodStations.length < targetCount) {
    //对于新增的进行生成
    const layout =
      broodLayouts[Math.floor(Math.random() * broodLayouts.length)];

    broodStations.push({
      slotId: Date.now() + Math.random(),
      slotType: "broodStation",
      singleItemId: null,
      singleRequired: false,
      singleAcceptTypes: ["adultFemale"],
      singlePosition: { ...layout.singlePosition },
      groupItemIds: [],
      groupCapacity: layout.groupPoints.length,
      groupAcceptTypes: ["chick"],
      positionPoints: layout.groupPoints.map((p) => ({
        pointId: p.pointId,
        x: p.x,
        y: p.y,
        z: p.z,
        rotation: p.rotation,
        occupiedBy: null,
      })),
      locationType: locationTypes.sceneSlot,
      layoutId: layout.layoutId,
    });
  }

  while (broodStations.length > targetCount) {
    // 从后往前找第一个空着的格子
    let emptyIndex = -1;
    for (let i = broodStations.length - 1; i >= 0; i--) {
      const s = broodStations[i];
      if (s.singleItemId === null && s.groupItemIds.length === 0) {
        emptyIndex = i;
        break;
      }
    }

    // 找不到空格子就停止，避免误删还在用的格子
    if (emptyIndex === -1) break;

    broodStations.splice(emptyIndex, 1);
  }
}

// 保证生活场景大格子数量始终比已占用的大格子多一个
function ensureLifeStation() {
  const occupiedCount = lifeStations.filter((station) => {
    if (station.singleItemId !== null || station.groupItemIds.length > 0) {
      return true;
    }
    const hasEggs = eggs.some(
      (e) =>
        e.location &&
        e.location.type === locationTypes.lifeAreaEggPoint &&
        String(e.location.slotId) === String(station.slotId),
    );
    return hasEggs;
  }).length;

  const targetCount = occupiedCount + 1;

  while (lifeStations.length < targetCount) {
    const layout = lifeLayouts[Math.floor(Math.random() * lifeLayouts.length)];

    lifeStations.push({
      slotId: Date.now() + Math.random(),
      slotType: "lifeStation",
      singleItemId: null,
      singleRequired: false,
      singleAcceptTypes: ["adultMale"],
      singlePosition: { ...layout.singlePosition },
      groupItemIds: [],
      groupCapacity: layout.groupPoints.length,
      groupAcceptTypes: ["adultFemale"],
      positionPoints: layout.groupPoints.map((p) => ({
        pointId: p.pointId,
        x: p.x,
        y: p.y,
        z: p.z,
        rotation: p.rotation,
        occupiedBy: null,
      })),
      lifeAreaEggPoint: { ...layout.eggSpot },
      locationType: locationTypes.sceneSlot,
      layoutId: layout.layoutId,
    });
  }

  while (lifeStations.length > targetCount) {
    let emptyIndex = -1;
    for (let i = lifeStations.length - 1; i >= 0; i--) {
      const s = lifeStations[i];
      // if (s.singleItemId === null && s.groupItemIds.length === 0) {
      //   emptyIndex = i;
      //   break;
      // }

      const hasEggs = eggs.some(
        (e) =>
          e.location &&
          e.location.type === locationTypes.lifeAreaEggPoint &&
          String(e.location.slotId) === String(s.slotId),
      );
      if (s.singleItemId === null && s.groupItemIds.length === 0 && !hasEggs) {
        emptyIndex = i;
        break;
      }
    }
    if (emptyIndex === -1) break;
    lifeStations.splice(emptyIndex, 1);
  }
}

// 生成一个物体的展示单元（物品图 + 状态角标），size 为图片边长（像素）
function renderBeingUnit(being, size) {
  const badges = renderStatusBadges(being);
  const s = size || 80;

  return `
    <div class="being-unit" data-id="${being.id}" data-type="${being.type}" style="position: relative; display: inline-block;">
      <img src="${being.image}" style="width: ${s}px; height: ${s}px; object-fit: contain;">
      ${badges}
    </div>
  `;
}

// 查询某类型item在特定场景下的渲染尺寸，查不到返回默认 80
function getRenderSize(type, sceneKey) {
  const group = renderSizes[type];
  if (group && group[sceneKey]) {
    return group[sceneKey];
  }
  return 80;
}

// 根据槽位 id 重新渲染那一个槽位
function refreshSlot(slotId) {
  if (!slotId) return;

  // 背包
  if (slotId === "bag") {
    if (bagPanel.style.display === "flex") {
      renderBagContent(currentBagCategory, bagSearchInput.value);
    }
    return;
  }

  // 孵蛋大格子
  const hatchStation = hatchStations.find(
    (s) => String(s.slotId) === String(slotId),
  );
  if (hatchStation) {
    const el = document.getElementById("hatch-station-" + hatchStation.slotId);
    if (el) {
      el.outerHTML = renderOneHatchStation(hatchStation);
    }
    return;
  }

  // 育雏大格子
  const broodStation = broodStations.find(
    (s) => String(s.slotId) === String(slotId),
  );
  if (broodStation) {
    const el = document.getElementById("brood-station-" + broodStation.slotId);
    if (el) {
      el.outerHTML = renderOneBroodStation(broodStation);
    }
    return;
  }

  // 生活大格子
  const lifeStation = lifeStations.find(
    (s) => String(s.slotId) === String(slotId),
  );
  if (lifeStation) {
    const el = document.getElementById("life-station-" + lifeStation.slotId);
    if (el) {
      el.outerHTML = renderOneLifeStation(lifeStation);
    }
    return;
  }
}

// 渲染单个孵蛋大格子，返回 html 字符串
function renderOneHatchStation(station) {
  if (station.singleItemId !== null) {
    const incubator = incubators.find((inc) => inc.id === station.singleItemId);
    const broodyHen = adultChickens.find(
      (c) => String(c.id) === String(station.singleItemId),
    );

    if (incubator || broodyHen) {
      const singleItem = incubator || broodyHen;

      let pointsHTML = "";
      for (const point of station.positionPoints) {
        if (point.occupiedBy === null) {
          pointsHTML += `
            <img class="slot-placeholder" src="${slotTypes.eggSlot.placeholderImage}"
              style="position: absolute; left: ${point.x}px; top: ${point.y}px; z-index: ${point.z ?? 0}; transform: rotate(${point.rotation}deg);">
          `;
        } else {
          const individual =
            eggs.find((e) => e.id == point.occupiedBy) ||
            chicks.find((c) => c.id == point.occupiedBy);

          if (individual) {
            pointsHTML += `
              <div data-slot-id="${station.slotId}" data-point-id="${point.pointId}"
                style="position: absolute; left: ${point.x}px; top: ${point.y}px; z-index: ${point.z ?? 0}; transform: rotate(${point.rotation}deg);">
                ${renderBeingUnit(individual, getRenderSize(individual.type, "hatch"))}
              </div>
            `;
          }
        }
      }

      return `
        <div class="item-slot" id="hatch-station-${station.slotId}" data-slot-id="${station.slotId}" data-slot-type="${station.slotType}" style="width: 340px; min-height: 400px; border: 1px solid #d8cfc0; border-radius: 12px; position: relative;">
          <img src="${singleItem.image}" data-id="${singleItem.id}" data-type="${singleItem.type}" style="width: 300px; height: 300px; object-fit: contain; position: absolute; left: 20px; top: 50px;">
          ${pointsHTML}
        </div>
      `;
    }
  }

  return `
    <div class="item-slot" id="hatch-station-${station.slotId}" data-slot-id="${station.slotId}" data-slot-type="${station.slotType}" style="width: 340px; min-height: 160px; border: 1px dashed #d8cfc0; border-radius: 12px; display: flex; justify-content: center; align-items: center; color: #8a8075; position: relative;">
      <span>放入孵化器或抱窝母鸡</span>
    </div>
  `;
}

// 渲染整个孵蛋场景
function renderHatchScene() {
  const container = document.getElementById("hatch-grid");
  let html = "";

  for (const station of hatchStations) {
    html += renderOneHatchStation(station);
  }

  container.innerHTML = html;
}

// 渲染单个育雏大格子，返回 html 字符串
function renderOneBroodStation(station) {
  let chickensHTML = "";

  if (station.singleItemId !== null) {
    const singleChicken = adultChickens.find(
      (c) => String(c.id) === String(station.singleItemId),
    );
    if (singleChicken) {
      const sx = station.singlePosition?.x ?? 0;
      const sy = station.singlePosition?.y ?? 0;
      const sz = station.singlePosition?.z ?? 0;
      chickensHTML += `
        <div class="brood-chicken" data-id="${singleChicken.id}" data-type="${singleChicken.type}" style="position: absolute; left: ${sx}px; top: ${sy}px; z-index: ${sz};">
          ${renderBeingUnit(singleChicken, getRenderSize("adultFemale", "brood"))}
        </div>
      `;
    } else {
    }
  }

  for (const chickenId of station.groupItemIds) {
    const chicken =
      chicks.find((c) => c.id === chickenId) ||
      adultChickens.find((c) => c.id === chickenId);
    if (!chicken) {
    }
    if (chicken) {
      const px = chicken.location.x ?? 0;
      const py = chicken.location.y ?? 0;
      const pz = chicken.location.z ?? 0;
      chickensHTML += `
        <div class="brood-chicken" data-id="${chicken.id}" data-type="${chicken.type}" style="position: absolute; left: ${px}px; top: ${py}px; z-index: ${pz};">
          ${renderBeingUnit(chicken, getRenderSize(chicken.type, "brood"))}
        </div>
      `;
    }
  }

  const hasContent =
    station.groupItemIds.length > 0 || station.singleItemId !== null;

  const stationStyle = hasContent
    ? "width: 340px; height: 340px; flex-shrink: 0; border: 1px dashed #c9bfae; border-radius: 12px; position: relative;"
    : "width: 340px; min-height: 160px; border: 1px dashed #c9bfae; border-radius: 12px; display: flex; justify-content: center; align-items: center; color: #8a8075;";

  return `
    <div class="brood-station" id="brood-station-${station.slotId}" data-slot-id="${station.slotId}" data-slot-type="${station.slotType}" style="${stationStyle}">
      ${hasContent ? chickensHTML : "放入小鸡或母鸡"}
    </div>
  `;
}

// 渲染整个育雏场景
function renderBroodScene() {
  const container = document.getElementById("brood-grid");
  if (!container) return;

  let html = "";

  for (const station of broodStations) {
    html += renderOneBroodStation(station);
  }

  container.innerHTML = html;
}

// 渲染单个生活大格子
function renderOneLifeStation(station) {
  // 蛋位里的蛋
  let eggsHTML = "";
  const laidEggs = eggs.filter(
    (e) =>
      e.location &&
      e.location.type === locationTypes.lifeAreaEggPoint &&
      String(e.location.slotId) === String(station.slotId),
  );

  for (const egg of laidEggs) {
    const ex = egg.location.x ?? 0;
    const ey = egg.location.y ?? 0;
    const ez = egg.location.z ?? 0;
    eggsHTML += `
      <div class="life-egg" data-id="${egg.id}" data-type="${egg.type}" data-slot-id="${station.slotId}" style="position: absolute; left: ${ex}px; top: ${ey}px; z-index: ${ez};">
        ${renderBeingUnit(egg, getRenderSize("egg", "lifeArea"))}
      </div>
    `;
  }

  let chickensHTML = "";

  // 公鸡（单辅位）
  if (station.singleItemId !== null) {
    const rooster = adultChickens.find(
      (c) => String(c.id) === String(station.singleItemId),
    );
    if (rooster) {
      const sx = station.singlePosition?.x ?? 0;
      const sy = station.singlePosition?.y ?? 0;
      const sz = station.singlePosition?.z ?? 0;
      chickensHTML += `
        <div class="life-chicken" data-id="${rooster.id}" data-type="${rooster.type}" style="position: absolute; left: ${sx}px; top: ${sy}px; z-index: ${sz};">
          ${renderBeingUnit(rooster, getRenderSize("adultMale", "lifeArea"))}
        </div>
      `;
    }
  }

  // 母鸡（群体位）
  for (const chickenId of station.groupItemIds) {
    const hen = adultChickens.find((c) => String(c.id) === String(chickenId));
    if (!hen) continue;

    const px = hen.location.x ?? 0;
    const py = hen.location.y ?? 0;
    const pz = hen.location.z ?? 0;
    chickensHTML += `
      <div class="life-chicken" data-id="${hen.id}" data-type="${hen.type}" style="position: absolute; left: ${px}px; top: ${py}px; z-index: ${pz};">
        ${renderBeingUnit(hen, getRenderSize("adultFemale", "lifeArea"))}
      </div>
    `;
  }

  const hasContent =
    station.groupItemIds.length > 0 ||
    station.singleItemId !== null ||
    laidEggs.length > 0;

  const stationStyle = hasContent
    ? "width: 340px; height: 340px; flex-shrink: 0; border: 1px dashed #c9bfae; border-radius: 12px; position: relative;"
    : "width: 340px; min-height: 160px; flex-shrink: 0; border: 1px dashed #c9bfae; border-radius: 12px; display: flex; justify-content: center; align-items: center; color: #8a8075;";

  return `
    <div class="life-station" id="life-station-${station.slotId}" data-slot-id="${station.slotId}" data-slot-type="${station.slotType}" style="${stationStyle}">
      ${hasContent ? chickensHTML + eggsHTML : "放入公鸡或母鸡"}
    </div>
  `;
}

// 渲染整个生活场景
function renderLifeScene() {
  const container = document.getElementById("life-grid");
  if (!container) return;

  let html = "";
  for (const station of lifeStations) {
    html += renderOneLifeStation(station);
  }
  container.innerHTML = html;

  // 调试：打印每个格子的实际高度和样式
  // const cells = container.querySelectorAll(".life-station");
  // for (const cell of cells) {
  //   const rect = cell.getBoundingClientRect();
  //   console.log(
  //     "[格子尺寸]",
  //     cell.id,
  //     "height =",
  //     rect.height,
  //     "inlineStyle =",
  //     cell.getAttribute("style"),
  //   );
  // }
}

//辅助函数，用来根据槽位 id 找到目标槽位对象
function findTargetSlot(slotId) {
  if (slotId === "bag") return bagSlot;

  const allSlots = [...hatchStations, ...broodStations, ...lifeStations];

  return allSlots.find((s) => String(s.slotId) === String(slotId)) || null;
}

//统一移动函数
function moveDraggedItemToSlot(
  draggingId,
  draggingType,
  targetSlotId,
  dropX,
  dropY,
) {
  const itemArray = slotItemArrays[draggingType];
  if (!itemArray) return false;

  const item = itemArray.find((i) => i.id == draggingId);
  if (!item) return false;

  // 死鸡不能被放进任何槽位
  if (item.statuses && item.statuses.includes("dead")) {
    return false;
  }

  const targetSlot = findTargetSlot(targetSlotId);
  if (!targetSlot) return false;

  const isSingleType = targetSlot.singleAcceptTypes.includes(draggingType);
  const isGroupType = targetSlot.groupAcceptTypes.includes(draggingType);

  if (!isSingleType && !isGroupType) return false;

  //如果在孵化位有蛋的时候移动孵化器/母鸡
  if (draggingType === "incubator" || draggingType === "adultFemale") {
    if (item.location.slotId !== null && item.location.slotId !== undefined) {
      const currentSlot = findTargetSlot(item.location.slotId);
      if (
        currentSlot &&
        currentSlot.slotType === "hatchStation" &&
        currentSlot.groupItemIds.length > 0
      ) {
        return false;
      }
    }
  }

  // 从旧位置移除，并释放旧点位
  if (
    item.location &&
    item.location.slotId !== null &&
    item.location.slotId !== undefined
  ) {
    const oldSlot = findTargetSlot(item.location.slotId);
    if (oldSlot) {
      if (item.location.role === "single") {
        oldSlot.singleItemId =
          oldSlot.singleItemId == item.id ? null : oldSlot.singleItemId;
      } else {
        oldSlot.groupItemIds = oldSlot.groupItemIds.filter(
          (id) => id != item.id,
        );
      }

      if (
        item.location.pointId !== null &&
        item.location.pointId !== undefined
      ) {
        const oldPoint = oldSlot.positionPoints.find(
          (p) => p.pointId === item.location.pointId,
        );
        if (oldPoint) oldPoint.occupiedBy = null;
      }
    }
  }

  // 放进单一辅助位置
  if (isSingleType) {
    if (targetSlot.singleItemId !== null) return false;

    targetSlot.singleItemId = item.id;

    // 如果是孵蛋格子，读取对应 layout
    if (targetSlot.slotType === "hatchStation") {
      let layout = null;

      if (draggingType === "incubator") {
        layout = item.layout;
      } else if (draggingType === "adultFemale") {
        layout = broodyHenLayout;
      }

      targetSlot.singlePosition = null;
      targetSlot.positionPoints = [];

      if (layout) {
        targetSlot.singlePosition = { ...layout.singlePosition };
        targetSlot.positionPoints = layout.groupPoints.map((p) => ({
          pointId: p.pointId,
          x: p.x,
          y: p.y,
          z: p.z,
          rotation: p.rotation,
          occupiedBy: null,
        }));
        targetSlot.groupCapacity = targetSlot.positionPoints.length;
        targetSlot.layoutId = layout.layoutId;
      }
    }

    item.location.type = targetSlot.locationType;
    item.location.slotId = targetSlot.slotId;
    item.location.pointId = null;
    item.location.role = "single";
    return true;
  }

  // 放进主体群体
  if (isGroupType) {
    if (targetSlot.singleRequired && targetSlot.singleItemId === null) {
      return false;
    }

    if (targetSlot.groupItemIds.length >= targetSlot.groupCapacity) {
      return false;
    }

    let chosenPoint = null;

    // 背包不分配点位
    if (
      targetSlot.slotType === "bag" ||
      targetSlot.positionPoints.length === 0
    ) {
      chosenPoint = null;
    } else {
      // 把屏幕坐标换算成目标格子内部的相对坐标，育雏和生活合用一套逻辑
      const slotPrefix =
        targetSlot.slotType === "hatchStation"
          ? "hatch-station-"
          : targetSlot.slotType === "broodStation"
            ? "brood-station-"
            : "life-station-";
      const slotEl = document.getElementById(slotPrefix + targetSlot.slotId);

      let localX = dropX || 0;
      let localY = dropY || 0;
      if (slotEl) {
        const rect = slotEl.getBoundingClientRect();
        localX = (dropX || 0) - rect.left;
        localY = (dropY || 0) - rect.top;
      }

      // 因为摆放时用的是左上角，这里也把手指位置折算成“假想物品左上角”位置
      const draggedEl = document.querySelector(
        `[data-id="${draggingId}"][data-type="${draggingType}"]`,
      );
      if (draggedEl) {
        const draggedRect = draggedEl.getBoundingClientRect();
        localX = localX - draggedRect.width / 2;
        localY = localY - draggedRect.height / 2;
      }

      let minDist = Infinity;
      for (const p of targetSlot.positionPoints) {
        if (p.occupiedBy !== null) continue;
        const dx = p.x - localX;
        const dy = p.y - localY;
        const dist = dx * dx + dy * dy;
        if (dist < minDist) {
          minDist = dist;
          chosenPoint = p;
        }
      }

      if (!chosenPoint) return false;
    }

    targetSlot.groupItemIds.push(item.id);
    item.location.type = targetSlot.locationType;
    item.location.slotId = targetSlot.slotId;
    item.location.role = "group";

    if (chosenPoint) {
      chosenPoint.occupiedBy = item.id;
      item.location.pointId = chosenPoint.pointId;
      item.location.x = chosenPoint.x;
      item.location.y = chosenPoint.y;
      item.location.z = chosenPoint.z;
    } else {
      item.location.pointId = null;
      item.location.x = 0;
      item.location.y = 0;
      item.location.z = 0;
    }

    return true;
  }

  return false;
}

// 槽位类型对应的个体数组
const slotItemArrays = {
  egg: eggs,
  chick: chicks,
  adultFemale: adultChickens,
  adultMale: adultChickens,
  incubator: incubators,
  tool: tools,
};

// 根据 type 和 id，找到对应的物品实例（活鸡找不到时，回退查死鸡）
function findItemByTypeAndId(type, id) {
  const arr = slotItemArrays[type];
  if (arr) {
    const found = arr.find((i) => String(i.id) === String(id));
    if (found) return found;
  }

  // 死鸡：type 可能和活鸡相同，回退到 deadChickens 里找
  const deadFound = deadChickens.find((d) => String(d.id) === String(id));
  if (deadFound) return deadFound;

  return null;
}

// 渲染背包内容
function renderBagContent(category, keyword) {
  const content = document.getElementById("bag-content");

  let items = [];

  if (category === "egg") {
    for (const egg of eggs) {
      if (egg.location.type !== locationTypes.bag) continue;
      const itemInfo = shopItems.egg.find((item) => item.breed === egg.breed);
      items.push({
        id: egg.id,
        itemType: egg.type,
        image: egg.image || (itemInfo ? itemInfo.image : ""),
        name: egg.name || (itemInfo ? itemInfo.name : egg.breed),
        being: egg,
      });
    }
  } else if (category === "chick") {
    for (const chick of chicks) {
      if (chick.location.type !== locationTypes.bag) continue;
      const itemInfo = shopItems.chicken.find(
        (item) => item.breed === chick.breed && item.gender === chick.gender,
      );
      items.push({
        id: chick.id,
        itemType: chick.type,
        image: chick.image || (itemInfo ? itemInfo.image : ""),
        name: chick.name || (itemInfo ? itemInfo.name : chick.breed),
        being: chick,
      });
    }
    //假如是死亡的小鸡
    for (const dead of deadChickens) {
      if (dead.type !== "chick") continue;
      if (dead.location.type !== locationTypes.bag) continue;
      items.push({
        id: dead.id,
        itemType: dead.type,
        image: dead.image,
        name: dead.name,
        being: dead,
      });
    }
  } else if (category === "adultChicken") {
    for (const chicken of adultChickens) {
      if (chicken.location.type !== locationTypes.bag) continue;
      const itemInfo = shopItems.chicken.find(
        (item) =>
          item.breed === chicken.breed && item.gender === chicken.gender,
      );
      items.push({
        id: chicken.id,
        itemType: chicken.type,
        image: chicken.image || (itemInfo ? itemInfo.image : ""),
        name: chicken.name || (itemInfo ? itemInfo.name : chicken.breed),
        being: chicken,
      });
    }
    //假如是死亡的成年鸡
    for (const dead of deadChickens) {
      if (dead.type !== "adultFemale" && dead.type !== "adultMale") continue;
      if (dead.location.type !== locationTypes.bag) continue;
      items.push({
        id: dead.id,
        itemType: dead.type,
        image: dead.image,
        name: dead.name,
        being: dead,
      });
    }
  } else if (category === "tool") {
    for (const incubator of incubators) {
      if (incubator.location && incubator.location.type !== locationTypes.bag)
        continue;

      items.push({
        id: incubator.id,
        itemType: incubator.type,
        image: incubator.image,
        name: incubator.name,
      });
    }

    for (const tool of tools) {
      if (tool.location && tool.location.type !== locationTypes.bag) continue;

      const itemInfo = shopItems.tool.find((item) => item.id === tool.id);
      for (let i = 0; i < tool.quantity; i++) {
        items.push({
          id: tool.id,
          itemType: tool.type,
          image: itemInfo ? itemInfo.image : "",
          name: itemInfo ? itemInfo.name : tool.id,
        });
      }
    }
  }

  if (keyword) {
    items = items.filter((item) => item.name.includes(keyword));
  }

  if (items.length === 0) {
    content.innerHTML = "<p>这个分类暂时没有物品</p>";
    return;
  }

  let html = '<div class="bag-grid">';
  for (const item of items) {
    const showCheckbox = sellModeActive;
    const sellPrice = getSellPrice(item.id);
    html += `
  <div class="bag-cell" data-bag-category="${category}" data-id="${item.id}" data-type="${item.itemType}" data-sellable="true" style="position: relative;">
${item.being ? renderBeingUnit(item.being, getRenderSize(item.itemType, "bag")) : `<img class="shop-item-img" src="${item.image}" alt="${item.name}">`}


  ${
    showCheckbox
      ? `
    <label class="sell-checkbox" data-id="${item.id}" style="position: absolute; left: 6px; top: 6px; width: 22px; height: 22px; background: #fff; border: 2px solid #8a8075; border-radius: 6px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
      <span class="sell-checkmark" data-id="${item.id}" style="display: ${selectedForSell.includes(String(item.id)) ? "block" : "none"}; color: #2b2929; font-weight: bold; font-size: 16px; line-height: 1;">✓</span>
    </label>
    <span class="sell-price" data-id="${item.id}" style="position: absolute; left: 0; bottom: 22px; width: 100%; text-align: center; font-size: 12px; color: #fff; background: rgba(50, 45, 40, 0.65); padding: 2px 0;">${sellPrice} 元</span>`
      : ""
  }
    <div class="bag-item-name">${item.name}</div>
  </div>
`;
  }
  html += "</div>";
  content.innerHTML = html;
}

// 点"系统"，展开或收起下拉菜单
document.getElementById("settings-btn").addEventListener("click", function () {
  const systemMenu = document.getElementById("system-menu");
  if (systemMenu.style.display === "none" || systemMenu.style.display === "") {
    systemMenu.style.display = "block";
  } else {
    systemMenu.style.display = "none";
  }
});

// 读档
document.getElementById("load-btn").addEventListener("click", function () {
  const ok = loadGame();
  if (ok) {
    refreshAll();
    showToast("已读档");
    // 收起系统菜单
    document.getElementById("system-menu").style.display = "none";
  } else {
    showToast("还没有存档");
  }
});

// 开新游戏确认
document.getElementById("new-game-btn").addEventListener("click", function () {
  // 先收起系统菜单
  document.getElementById("system-menu").style.display = "none";

  showConfirm("确定要开新游戏吗？当前进度会被清空。", function () {
    localStorage.removeItem("hatch_save");

    player.money = 300;
    player.totalHatchExp = 0;
    player.hatchLevel = 0;
    gameTime.day = 0;

    eggs = [];
    chicks = [];
    adultChickens = [];
    incubators = [];
    tools = [];
    hatchStations = [];
    broodStations = [];
    bagSlot.groupItemIds = [];

    initScenes();
    refreshAll();
    showToast("已开始新游戏");
  });
});

// 打开商店
shopBtn.addEventListener("click", function () {
  shopPanel.style.display = "flex";
  tabButtons.forEach((b) => b.classList.remove("active"));
  document.querySelector('.tab-btn[data-tab="egg"]').classList.add("active");
  showShopItems("egg");
});

// 关闭商店
closeShopBtn.addEventListener("click", function () {
  shopPanel.style.display = "none";
});

// 打开背包
bagBtn.addEventListener("click", function () {
  bagPanel.style.display = "flex";
  bagTabButtons.forEach((b) => b.classList.remove("active"));
  document
    .querySelector('.tab-btn[data-bag-tab="egg"]')
    .classList.add("active");
  renderBagContent("egg");
});

// 关闭背包
closeBagBtn.addEventListener("click", function () {
  bagPanel.style.display = "none";
});

// 商店标签切换
const tabButtons = document.querySelectorAll("#shop-panel .tab-btn");
for (const btn of tabButtons) {
  btn.addEventListener("click", function () {
    tabButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentShopCategory = btn.getAttribute("data-tab");
    showShopItems(currentShopCategory, shopSearchInput.value);
  });
}

// 背包标签切换
const bagTabButtons = document.querySelectorAll(".tab-btn[data-bag-tab]");
for (const btn of bagTabButtons) {
  btn.addEventListener("click", function () {
    bagTabButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentBagCategory = btn.getAttribute("data-bag-tab");
    renderBagContent(currentBagCategory, bagSearchInput.value);
  });
}

// 显示当前商店分类的商品
function showShopItems(category, keyword) {
  const content = document.getElementById("shop-content");
  let items = shopItems[category];

  if (keyword) {
    items = items.filter((item) => item.name.includes(keyword));
  }

  if (items.length === 0) {
    content.innerHTML = "<p>这个分类暂时没有商品</p>";
    return;
  }

  let html = "";
  for (const item of items) {
    html += `
      <div class="shop-item">
      <img class="shop-item-img" src="${item.image}" alt="${item.name}">
        <div>
          <div>${item.name}</div>
          <div class="shop-item-desc">${item.description}</div>
        </div>
        <div class="buy-area" data-price="${item.price}">
          <div>单价：${item.price}</div>
          <div class="qty-row">
            <button class="qty-btn minus-btn" data-id="${item.id}">-</button>
            <input class="qty-input" type="number" value="${item.type === "egg" ? 10 : 1}" min="1" data-id="${item.id}">
            <button class="qty-btn plus-btn" data-id="${item.id}">+</button>
          </div>
          <span class="total-price">总价：<span class="total-price-num" data-id="${item.id}">${item.price * (item.type === "egg" ? 10 : 1)}</span></span>
        <button class="buy-btn" data-id="${item.id}">购买</button>
        </div>
      </div>
    `;
  }
  content.innerHTML = html;
}

// 监听商店内容里的加减按钮和输入框，购买
document
  .getElementById("shop-content")
  .addEventListener("click", function (event) {
    const target = event.target;
    const itemId = target.getAttribute("data-id");
    if (!itemId) return;

    const input = document.querySelector(`.qty-input[data-id="${itemId}"]`);
    let current = parseInt(input.value, 10);

    if (target.classList.contains("minus-btn")) {
      if (current > 1) {
        input.value = current - 1;
      }
    }

    if (target.classList.contains("plus-btn")) {
      input.value = current + 1;
    }

    // 更新总价
    const buyArea = target.closest(".buy-area");
    const price = parseFloat(buyArea.getAttribute("data-price"));
    const totalPriceSpan = buyArea.querySelector(".total-price-num");
    totalPriceSpan.textContent = price * parseInt(input.value, 10);

    if (target.classList.contains("buy-btn")) {
      const qty = parseInt(input.value, 10);
      const totalCost = price * qty;

      if (player.money < totalCost) {
        showToast("资金不足");
        return;
      }

      player.money -= totalCost;
      updateTopBar();
      obtainItem(itemId, qty, {
        type: locationTypes.bag,
        slotId: "bag",
        pointId: null,
        role: "group",
        x: 0,
        y: 0,
        z: 0,
      });
      showToast("购买成功");
      renderMainSceneStatus();
    }
  });

//全局检测双击，提取id和类型
document.addEventListener("click", function (event) {
  if (!isDoubleClick()) return;

  const targetEl = event.target.closest("[data-id][data-type]");
  // console.log("双击目标:", targetEl);
  if (!targetEl) return;

  const id = targetEl.getAttribute("data-id");
  const type = targetEl.getAttribute("data-type");

  let target = null;

  target = findItemByTypeAndId(type, id);

  if (target) {
    openInspect(target);
  }
});

//进入观察界面
function openInspect(target) {
  currentInspectedTarget = target;

  bagInspectImg.src = target.image;
  bagInspectImg.alt = target.name || "";
  bagInspectImg.style.transform = "scale(1.5)";
  zoomScale = 1.5;
  inspectMode = true;
  bagInspectLayer.style.display = "flex";

  // 以后在这里继续加：状态、年龄、是否可售、出售按钮等
}

//双指缩放第一步
bagInspectLayer.addEventListener("touchstart", function (event) {
  if (event.touches.length === 2) {
    lastTouchDistance = Math.hypot(
      event.touches[0].clientX - event.touches[1].clientX,
      event.touches[0].clientY - event.touches[1].clientY,
    );
  }
});
//双指缩放第二步
bagInspectLayer.addEventListener("touchmove", function (event) {
  if (event.touches.length === 2) {
    const distance = Math.hypot(
      event.touches[0].clientX - event.touches[1].clientX,
      event.touches[0].clientY - event.touches[1].clientY,
    );

    if (lastTouchDistance > 0) {
      zoomScale = zoomScale * (distance / lastTouchDistance);
      zoomScale = Math.min(3, Math.max(1.5, zoomScale));
      bagInspectImg.style.transform = "scale(" + zoomScale + ")";
      justZoomed = true;
    }

    lastTouchDistance = distance;
  }
});

//单击返回
bagInspectLayer.addEventListener("click", function () {
  if (justZoomed) {
    justZoomed = false;
    return;
  }

  if (inspectMode) {
    bagInspectLayer.style.display = "none";
    currentInspectedTarget = null;
    // document.querySelectorAll(".observe-btn").forEach((btn) => {
    //   btn.style.display = "none";
    // });
    // selectedBagItem = null;
    inspectMode = false;
  }
});

//全局检查拖动开始
document.addEventListener("touchstart", function (event) {
  // 点到勾选框（或其内部）时，视为勾选操作，不进入拖动
  if (event.target.closest(".sell-checkbox")) return;

  const targetEl = event.target.closest("[data-id][data-type]");
  if (!targetEl) return;
  // sceneContainer.style.overflowX = "hidden"; //防止触发切换屏幕
  const bagContent = document.getElementById("bag-content");
  if (bagContent) bagContent.style.overflowY = "hidden"; //防止滑动背包

  dragMoved = false;

  const dragId = targetEl.getAttribute("data-id");
  const dragType = targetEl.getAttribute("data-type");

  const dragItem = findItemByTypeAndId(dragType, dragId);

  draggingItem = {
    id: dragId,
    type: dragType,
    startX: event.touches[0].clientX,
    startY: event.touches[0].clientY,
    fromSlotId: dragItem ? dragItem.location.slotId : null,
  };

  // 拖动开始，锁定场景滚动
  lockSceneScroll();

  // 虚像的塑造：图 + 状态角标一起跟手
  if (dragItem && dragItem.image) {
    const ghost = document.createElement("div");
    ghost.className = "drag-ghost";
    ghost.id = "drag-ghost";
    ghost.style.left = event.touches[0].clientX + "px";
    ghost.style.top = event.touches[0].clientY + "px";

    ghost.innerHTML = renderBeingUnit(
      dragItem,
      getRenderSize(dragItem.type, "ghost"),
    );
    document.getElementById("drag-layer").appendChild(ghost);
  }

  // 让被按住的原本元素透明，保留它在文档中，避免触摸序列中断
  if (targetEl) {
    targetEl.style.opacity = "0";
  }
});

//拖动中
document.addEventListener("touchmove", function (event) {
  if (!draggingItem) return;

  const dx = event.touches[0].clientX - draggingItem.startX;
  const dy = event.touches[0].clientY - draggingItem.startY;

  if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
    dragMoved = true;
  }

  const ghost = document.getElementById("drag-ghost");
  if (ghost) {
    ghost.style.left = event.touches[0].clientX + "px";
    ghost.style.top = event.touches[0].clientY + "px";
  }
});

//拖动结束
document.addEventListener("touchend", function (event) {
  if (!draggingItem) return;

  if (!dragMoved) {
    draggingItem = null;
    const touchedEl = document.querySelector(
      '[data-id][data-type][style*="opacity: 0"]',
    );
    if (touchedEl) {
      touchedEl.style.opacity = "";
    }
    const bagContent = document.getElementById("bag-content");
    if (bagContent) bagContent.style.overflowY = "";
    unlockSceneScroll();
    // 清理虚影：即使没挪够距离也算作结束，不能留下影子
    const ghost = document.getElementById("drag-ghost");
    if (ghost) ghost.remove();
    dragMoved = false;
    return;
  }

  const touch = event.changedTouches[0];
  const dropTarget = document
    .elementFromPoint(touch.clientX, touch.clientY)
    ?.closest("[data-slot-id]");

  if (!dropTarget) {
    draggingItem = null;
    const touchedEl = document.querySelector(
      '[data-id][data-type][style*="opacity: 0"]',
    );
    if (touchedEl) {
      touchedEl.style.opacity = "";
    }
    // 清理虚影，避免拖到空白处后残留
    const ghost = document.getElementById("drag-ghost");
    if (ghost) ghost.remove();
    const bagContent = document.getElementById("bag-content");
    if (bagContent) bagContent.style.overflowY = "";
    unlockSceneScroll();
    dragMoved = false;
    return;
  }

  const targetSlotId = dropTarget.getAttribute("data-slot-id");

  const success = moveDraggedItemToSlot(
    draggingItem.id,
    draggingItem.type,
    targetSlotId,
    touch.clientX,
    touch.clientY,
  );

  if (success) {
    const hatchCountBefore = hatchStations.length;
    const broodCountBefore = broodStations.length;
    const lifeCountBefore = lifeStations.length;

    ensureHatchStation();
    ensureBroodStation();
    ensureLifeStation();

    const hatchCountChanged = hatchStations.length !== hatchCountBefore;
    const broodCountChanged = broodStations.length !== broodCountBefore;
    const lifeCountChanged = lifeStations.length !== lifeCountBefore;

    const fromSlotId = draggingItem.fromSlotId;
    const toSlotId = targetSlotId;

    if (hatchCountChanged) {
      renderHatchScene();
    }

    if (broodCountChanged) {
      renderBroodScene();
    }

    if (lifeCountChanged) {
      renderLifeScene();
    }

    if (!hatchCountChanged && !broodCountChanged && !lifeCountChanged) {
      refreshSlot(fromSlotId);
      refreshSlot(toSlotId);
    }

    showToast("移动成功");
  }
  // 恢复被按住的原本元素的透明度
  const touchedEl = document.querySelector(
    '[data-id][data-type][style*="opacity: 0"]',
  );
  if (touchedEl) {
    touchedEl.style.opacity = "";
  }
  draggingItem = null;

  const ghost = document.getElementById("drag-ghost");
  if (ghost) ghost.remove();
  const bagContent = document.getElementById("bag-content");
  if (bagContent) bagContent.style.overflowY = "";
  unlockSceneScroll();
  dragMoved = false;
});

// 商店搜索
const shopSearchInput = document.getElementById("shop-search");
shopSearchInput.addEventListener("input", function () {
  showShopItems(currentShopCategory, shopSearchInput.value);
});

// 背包搜索
const bagSearchInput = document.getElementById("bag-search");
bagSearchInput.addEventListener("input", function () {
  renderBagContent(currentBagCategory, bagSearchInput.value);
});

// 背包切换售卖模式
sellBagBtn.addEventListener("click", function () {
  sellModeActive = !sellModeActive;

  if (sellModeActive) {
    sellBagBtn.textContent = "退出售卖";
  } else {
    sellBagBtn.textContent = "售卖";
  }
  // 售卖状态变了，重新渲染背包，让勾选框出现或消失
  renderBagContent(currentBagCategory, bagSearchInput.value);
  // 同步统计栏的显示与隐藏
  const sellBar = document.getElementById("sell-bar");
  if (sellBar) {
    sellBar.style.display = sellModeActive ? "flex" : "none";
  }
  if (sellModeActive) {
    updateSellBar();
  }
});

// 背包售卖模式，单个物品勾选框，切换选中状态
document
  .getElementById("bag-content")
  .addEventListener("click", function (event) {
    const checkbox = event.target.closest(".sell-checkbox");
    if (!checkbox) return;
    if (!sellModeActive) return;

    const id = checkbox.getAttribute("data-id");
    if (!id) return;

    const index = selectedForSell.indexOf(id);
    let nowSelected; // 操作之后，这个格子是否处于选中状态

    if (index === -1) {
      selectedForSell.push(id);
      nowSelected = true;
    } else {
      selectedForSell.splice(index, 1);
      nowSelected = false;
    }

    // 只更新这个勾选框的显示，不重画整个背包
    const checkmark = checkbox.querySelector(".sell-checkmark");
    if (checkmark) {
      checkmark.style.display = nowSelected ? "block" : "none";
    }

    // 更新统计栏件数
    updateSellBar();
  });

// 由物品 id 查出它的售出价（目前暂时定为买价的六折）
function getSellPrice(id) {
  const sid = String(id);

  // 死鸡一律 0 元
  const dead = deadChickens.find((d) => String(d.id) === sid);
  if (dead) return 0;

  const egg = eggs.find((e) => String(e.id) === sid);
  if (egg) {
    // 只有孵化失败才 0 元
    if (egg.hatchProgress.stage === "failed") {
      return 0;
    }
    const buyPrice = breeds[egg.breed].prices?.egg ?? 0;
    return buyPrice * 0.6;
  }

  // 鸡：小鸡数组里的是小鸡或青年鸡，成年数组里的是成年鸡
  const chick = chicks.find((c) => String(c.id) === sid);
  if (chick) {
    const key =
      chick.stage === "young"
        ? chick.gender === "female"
          ? "youngFemale"
          : "youngMale"
        : "chick";
    const buyPrice = breeds[chick.breed].prices?.[key] ?? 0;
    return toOneDecimal(buyPrice * 0.6);
  }

  const adult = adultChickens.find((c) => String(c.id) === sid);
  if (adult) {
    const key = adult.gender === "female" ? "adultFemale" : "adultMale";
    const buyPrice = breeds[adult.breed].prices?.[key] ?? 0;
    return toOneDecimal(buyPrice * 0.6);
  }

  // 孵化器
  const incubator = incubators.find((i) => String(i.id) === sid);
  if (incubator) {
    const info = shopItems.tool.find((t) => t.type === "incubator");
    const buyPrice = info ? info.price : 0;
    return toOneDecimal(buyPrice * 0.6);
  }

  // 普通工具
  const tool = tools.find((t) => String(t.id) === sid);
  if (tool) {
    const info = shopItems.tool.find((t) => String(t.id) === tool.id);
    const buyPrice = info ? info.price : 0;
    return toOneDecimal(buyPrice * 0.6);
  }

  return 0;
}

// 把售卖价格规定为一位小数（解决浮点误差显示的问题）
function toOneDecimal(n) {
  return Math.round(n * 10) / 10;
}

// 全选当前背包分类（售卖-全选）
document
  .getElementById("select-all-btn")
  .addEventListener("click", function () {
    const ids = collectCurrentCategoryIds();
    for (const id of ids) {
      if (!selectedForSell.includes(id)) {
        selectedForSell.push(id);
      }
    }
    renderBagContent(currentBagCategory, bagSearchInput.value);
    updateSellBar();
  });

// 清空所有已选（售卖-全不选）
document.getElementById("clear-all-btn").addEventListener("click", function () {
  selectedForSell.length = 0;
  renderBagContent(currentBagCategory, bagSearchInput.value);
  updateSellBar();
});

// 确认卖出
document
  .getElementById("confirm-sell-btn")
  .addEventListener("click", function () {
    if (selectedForSell.length === 0) {
      showToast("没有选中的物品");
      return;
    }

    const total = toOneDecimal(
      selectedForSell.reduce((sum, id) => sum + getSellPrice(id), 0),
    );

    for (const id of selectedForSell) {
      const sid = String(id);

      let removed = false;

      const eggIndex = eggs.findIndex((e) => String(e.id) === sid);
      if (eggIndex !== -1) {
        eggs.splice(eggIndex, 1);
        removed = true;
      }

      if (!removed) {
        const chickIndex = chicks.findIndex((c) => String(c.id) === sid);
        if (chickIndex !== -1) {
          chicks.splice(chickIndex, 1);
          removed = true;
        }
      }

      if (!removed) {
        const adultIndex = adultChickens.findIndex((c) => String(c.id) === sid);
        if (adultIndex !== -1) {
          adultChickens.splice(adultIndex, 1);
          removed = true;
        }
      }

      if (!removed) {
        const incubatorIndex = incubators.findIndex(
          (i) => String(i.id) === sid,
        );
        if (incubatorIndex !== -1) {
          incubators.splice(incubatorIndex, 1);
          removed = true;
        }
      }

      if (!removed) {
        const toolIndex = tools.findIndex((t) => String(t.id) === sid);
        if (toolIndex !== -1) {
          tools.splice(toolIndex, 1);
          removed = true;
        }
      }

      bagSlot.groupItemIds = bagSlot.groupItemIds.filter(
        (itemId) => String(itemId) !== sid,
      );
    }

    player.money += total;
    updateTopBar();

    showToast("卖出成功，获得 " + total + " 元");

    sellModeActive = false;
    sellBagBtn.textContent = "售卖";
    selectedForSell.length = 0;
    const sellBar = document.getElementById("sell-bar");
    if (sellBar) sellBar.style.display = "none";

    renderBagContent(currentBagCategory, bagSearchInput.value);
    renderMainSceneStatus();
  });

// 刷新背包售卖统计栏：件数与合计
function updateSellBar() {
  const sellCount = document.getElementById("sell-count");
  if (sellCount) {
    sellCount.textContent = "已选 " + selectedForSell.length + " 件";
  }

  let total = 0;
  for (const id of selectedForSell) {
    total += getSellPrice(id);
  }

  const sellTotal = document.getElementById("sell-total");
  if (sellTotal) {
    sellTotal.textContent = "合计 " + toOneDecimal(total) + " 元";
  }
}

// 收集当前背包分类下所有可卖物品的 id（售卖-全选-助手函数）
function collectCurrentCategoryIds() {
  const ids = [];

  if (currentBagCategory === "egg") {
    for (const egg of eggs) {
      if (egg.location.type !== locationTypes.bag) continue;
      ids.push(String(egg.id));
    }
  } else if (currentBagCategory === "chick") {
    for (const chick of chicks) {
      if (chick.location.type !== locationTypes.bag) continue;
      ids.push(String(chick.id));
    }
  } else if (currentBagCategory === "adultChicken") {
    for (const chicken of adultChickens) {
      if (chicken.location.type !== locationTypes.bag) continue;
      ids.push(String(chicken.id));
    }
  } else if (currentBagCategory === "tool") {
    for (const incubator of incubators) {
      if (incubator.location && incubator.location.type !== locationTypes.bag)
        continue;
      ids.push(String(incubator.id));
    }
    for (const tool of tools) {
      if (tool.location && tool.location.type !== locationTypes.bag) continue;
      ids.push(String(tool.id));
    }
  }

  return ids;
}

// 显示短暂提示
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.style.display = "block";

  clearTimeout(toast._hideTimer);
  toast._hideTimer = setTimeout(function () {
    toast.style.display = "none";
  }, 1500);
}

// 显示自制确认窗：message 是提示文字，onConfirm 是点确定后要执行的动作
function showConfirm(message, onConfirm) {
  const dialog = document.getElementById("confirm-dialog");
  const messageEl = document.getElementById("confirm-message");

  if (messageEl) {
    messageEl.textContent = message;
  }

  confirmAction = onConfirm;
  dialog.style.display = "flex";
}

// 关闭确认窗，不执行任何动作
function hideConfirm() {
  const dialog = document.getElementById("confirm-dialog");
  dialog.style.display = "none";
  confirmAction = null;
}
//"取消"就是关闭窗子、什么都不做。
document
  .getElementById("confirm-cancel-btn")
  .addEventListener("click", function () {
    hideConfirm();
  });
//"确定"要执行我们传进来的那个动作。
document
  .getElementById("confirm-ok-btn")
  .addEventListener("click", function () {
    const action = confirmAction;
    hideConfirm();
    if (action) {
      action();
    }
  });
// 生成一颗蛋
function createEgg(breedId, initialLocation, options) {
  const breedInfo = breeds[breedId];
  const eggItemInfo = shopItems.egg.find((item) => item.breed === breedId);

  const fertilized =
    options && typeof options.fertilized === "boolean"
      ? options.fertilized
      : Math.random() < breedInfo.fertilityRate;
  const canHatch =
    options && typeof options.canHatch === "boolean"
      ? options.canHatch
      : Math.random() < breedInfo.hatchSuccessRate;

  let hatchOffset = 0;
  const r = Math.random();

  if (r < 0.1) {
    hatchOffset = -1;
  } else if (r < 0.3) {
    hatchOffset = -0.5;
  } else if (r < 0.7) {
    hatchOffset = 0;
  } else if (r < 0.9) {
    hatchOffset = 0.5;
  } else {
    hatchOffset = 1;
  }

  const stageDays = fertilized
    ? {
        embryo: 5,
        smallHole: breedInfo.growth.hatchDays - 2 + hatchOffset,
        halfCircle: breedInfo.growth.hatchDays - 1 + hatchOffset,
        halfOut: breedInfo.growth.hatchDays + hatchOffset,
        wetOut: breedInfo.growth.hatchDays + 0.5 + hatchOffset,
        dry: breedInfo.growth.hatchDays + 1 + hatchOffset,
      }
    : {};

  const egg = {
    id: Date.now() + Math.random(),
    type: "egg",
    breed: breedId,
    name: eggItemInfo ? eggItemInfo.name : breedInfo.name,
    image: eggItemInfo ? eggItemInfo.image : "",
    gender: Math.random() < 0.5 ? "female" : "male",
    fertilized: fertilized,
    canHatch: canHatch,
    peckPosition: Math.random() < breedInfo.bigEndRate ? "bigEnd" : "smallEnd",
    hatchOffset: hatchOffset,
    appearanceSeed: Math.random(),
    statuses: [],
    hatchProgress: {
      stage: "waiting",
      elapsedDays: 0,
    },
    stageDays: stageDays,
    location: initialLocation
      ? {
          type: initialLocation.type,
          slotId: initialLocation.slotId ?? null,
          pointId: initialLocation.pointId ?? null,
          role: initialLocation.role ?? "group",
          x: initialLocation.x ?? 0,
          y: initialLocation.y ?? 0,
          z: initialLocation.z ?? 0,
        }
      : {
          type: locationTypes.bag,
          slotId: "bag",
          pointId: null,
          role: "group",
          x: 0,
          y: 0,
          z: 0,
        },
  };

  return egg;
}

// 生成一只鸡（目前就等于“买一个成年鸡”，不包括蛋变成鸡的内容）
function createChicken(breedId, gender, age, initialLocation) {
  const breedInfo = breeds[breedId];

  const growthOffset = Math.random();
  const lifespanSeed = Math.random();

  const chickToYoungDays =
    breedInfo.growth.chickToYoungDays +
    growthOffset * breedInfo.growth.youngOffsetMax;
  const youngToAdultDays =
    breedInfo.growth.youngToAdultDays +
    growthOffset * breedInfo.growth.adultOffsetMax;
  const adultToDeadDays =
    breedInfo.growth.lifespanDays +
    lifespanSeed * breedInfo.growth.lifespanOffsetMax;

  const chicken = {
    id: Date.now() + Math.random(),
    type: gender === "female" ? "adultFemale" : "adultMale",
    breed: breedId,
    name: breedInfo.itemNames[
      gender === "female" ? "adultFemale" : "adultMale"
    ],
    nickname: "",
    gender: gender,
    stage: "adult",
    ageDays: youngToAdultDays,
    image:
      breedInfo.stageImages[gender === "female" ? "adultFemale" : "adultMale"],
    appearanceSeed: Math.random(),
    growthOffset: growthOffset,
    lifespanSeed: lifespanSeed,
    stageDays: {
      chickToYoung: chickToYoungDays,
      youngToAdult: youngToAdultDays,
      adultToDead: adultToDeadDays,
    },
    statuses: ["healthy"],
    location: initialLocation || {
      type: locationTypes.bag,
      slotId: "bag",
      pointId: null,
      role: "group",
      x: 0,
      y: 0,
      z: 0,
    },
  };

  if (age === "chick") {
    chicks.push(chicken);
  } else if (age === "adult") {
    adultChickens.push(chicken);
  }

  return chicken;
}

// 生成一个孵化器实例
function createIncubator(itemInfo) {
  const incubatorId = Date.now() + Math.random();

  const layout = itemInfo.layout
    ? {
        layoutId: itemInfo.layout.layoutId,
        singlePosition: { ...itemInfo.layout.singlePosition },
        groupPoints: itemInfo.layout.groupPoints.map((p) => ({
          pointId: p.pointId,
          x: p.x,
          y: p.y,
          z: p.z,
          rotation: p.rotation,
          occupiedBy: null,
        })),
      }
    : {
        layoutId: "default",
        singlePosition: { x: 0, y: 0, z: 0, rotation: 0 },
        groupPoints: [],
      };

  const incubator = {
    id: incubatorId,
    type: "incubator",
    name: itemInfo.name,
    image: itemInfo.image,
    capacity: layout.groupPoints.length,
    layout: layout,
    location: {
      type: locationTypes.bag,
      slotId: "bag",
      pointId: null,
      role: "group",
      x: 0,
      y: 0,
      z: 0,
    },
  };

  incubators.push(incubator);

  return incubator;
}

// 统一获取物品
function obtainItem(itemId, quantity, initialLocation) {
  // 查找商品信息
  let itemInfo = null;
  for (const category in shopItems) {
    const found = shopItems[category].find((item) => item.id === itemId);
    if (found) {
      itemInfo = found;
      break;
    }
  }

  if (!itemInfo) return;

  if (itemInfo.type === "egg") {
    for (let i = 0; i < quantity; i++) {
      const egg = createEgg(itemInfo.breed, initialLocation);
      eggs.push(egg);
      bagSlot.groupItemIds.push(egg.id);
    }
  } else if (itemInfo.type === "chicken") {
    for (let i = 0; i < quantity; i++) {
      const chicken = createChicken(
        itemInfo.breed,
        itemInfo.gender,
        itemInfo.age,
      );
      bagSlot.groupItemIds.push(chicken.id);
    }
  } else if (itemInfo.type === "incubator") {
    for (let i = 0; i < quantity; i++) {
      const incubator = createIncubator(itemInfo);
      bagSlot.groupItemIds.push(incubator.id);
    }
  } else if (itemInfo.type === "tool") {
    const existingTool = tools.find((tool) => tool.id === itemId);

    if (existingTool) {
      existingTool.quantity += quantity;
    } else {
      tools.push({
        id: itemId,
        type: "tool",
        name: itemInfo.name,
        image: itemInfo.image,
        quantity: quantity,
        location: {
          type: locationTypes.bag,
          slotId: "bag",
          pointId: null,
          role: "group",
          x: 0,
          y: 0,
          z: 0,
        },
      });
      bagSlot.groupItemIds.push(itemId);
    }
  }

  if (bagPanel.style.display === "flex") {
    renderBagContent(currentBagCategory);
  }
}

// 推进天数的影响（测试版）目前只考虑了·孵化器当中的·鸡蛋，和鸡的成长
function advanceDays(days) {
  gameTime.day += days;

  for (const station of hatchStations) {
    for (const id of [...station.groupItemIds]) {
      const egg = eggs.find((e) => e.id === id);
      if (!egg) continue;

      egg.hatchProgress.elapsedDays += days;
      updateEggStage(egg);

      if (
        egg.hatchProgress.stage === "dry" &&
        egg.hatchProgress.elapsedDays >= egg.stageDays.dry
      ) {
        hatchEggToChick(egg);
      }
    }
  }

  for (const chick of chicks) {
    chick.ageDays += days;
    updateChickenStage(chick);
  }

  for (const chicken of adultChickens) {
    chicken.ageDays += days;
    updateChickenStage(chicken);
  }

  applyDailyDeath();
  applyDailySickness();
  relayoutBroodStations();
  relayoutLifeStations();
  lifeStationLayEggs();
  refreshAll();
}

//推进天数按钮（测试版）
document
  .getElementById("advance-days-btn")
  .addEventListener("click", function () {
    const input = document.getElementById("advance-days-input");
    const days = parseInt(input.value, 10);

    if (!days || days <= 0) {
      showToast("请输入有效天数");
      return;
    }
    // 先存下推进前的状态，再推进天数
    saveGame();
    advanceDays(days);
    showToast("时间推进了 " + days + " 天");
  });

//孵化阶段判断函数
function updateEggStage(egg) {
  const breedInfo = breeds[egg.breed];
  const failAt =
    (breedInfo.growth.hatchDays || 0) + (breedInfo.growth.hatchOffsetMax || 0);
  // 未受精、或受精但无法孵化的蛋：超过出壳上限时间仍未出，才判定失败
  if (!egg.fertilized || !egg.canHatch) {
    if (egg.hatchProgress.elapsedDays >= failAt) {
      egg.hatchProgress.stage = "failed";
    }
    // 没到时间之前，保持当前的 stage 不变
    return;
  }

  const days = egg.hatchProgress.elapsedDays;
  const sd = egg.stageDays;

  if (days < sd.embryo) {
    egg.hatchProgress.stage = "waiting";
  } else if (days < sd.smallHole) {
    egg.hatchProgress.stage = "embryo";
  } else if (days < sd.halfCircle) {
    egg.hatchProgress.stage = "smallHole";
  } else if (days < sd.halfOut) {
    egg.hatchProgress.stage = "halfCircle";
  } else if (days < sd.wetOut) {
    egg.hatchProgress.stage = "halfOut";
  } else if (days < sd.dry) {
    egg.hatchProgress.stage = "wetOut";
  } else {
    egg.hatchProgress.stage = "dry";
  }

  // const breedInfo = breeds[egg.breed];
  if (breedInfo && breedInfo.stageImages) {
    const stageImage = breedInfo.stageImages[egg.hatchProgress.stage];
    if (stageImage) {
      egg.image = stageImage;
    }
  }
}

//蛋孵化成小鸡
function hatchEggToChick(egg) {
  const breedInfo = breeds[egg.breed];

  const chick = {
    id: egg.id,
    type: "chick",
    breed: egg.breed,
    name: breedInfo.itemNames.chick,
    nickname: "",
    gender: egg.gender,
    stage: "chick",
    ageDays: 0,
    image: breedInfo.stageImages.chick,
    appearanceSeed: egg.appearanceSeed,
    growthOffset: egg.hatchOffset,
    lifespanSeed: Math.random(),
    stageDays: {
      chickToYoung:
        breedInfo.growth.chickToYoungDays +
        egg.hatchOffset * breedInfo.growth.youngOffsetMax,
      youngToAdult:
        breedInfo.growth.youngToAdultDays +
        egg.hatchOffset * breedInfo.growth.adultOffsetMax,
      adultToDead:
        breedInfo.growth.lifespanDays +
        Math.random() * breedInfo.growth.lifespanOffsetMax,
    },
    statuses: ["healthy"],
    location: {
      type: egg.location.type,
      slotId: egg.location.slotId,
      pointId: egg.location.pointId,
      role: "group",
      x: egg.location.x,
      y: egg.location.y,
      z: egg.location.z,
    },
  };

  chicks.push(chick);

  const eggIndex = eggs.findIndex((e) => e.id === egg.id);
  if (eggIndex !== -1) {
    eggs.splice(eggIndex, 1);
  }

  return chick;
}

// 更新鸡的生长阶段
function updateChickenStage(chicken) {
  const breedInfo = breeds[chicken.breed];
  const growth = breedInfo.growth;

  if (chicken.ageDays < chicken.stageDays.chickToYoung) {
    chicken.stage = "chick";
    chicken.name = breedInfo.itemNames.chick;
    chicken.image = breedInfo.stageImages.chick;
  } else if (chicken.ageDays < chicken.stageDays.youngToAdult) {
    chicken.stage = "young";
    chicken.name =
      chicken.gender === "female"
        ? breedInfo.itemNames.youngFemale
        : breedInfo.itemNames.youngMale;
    chicken.image =
      chicken.gender === "female"
        ? breedInfo.stageImages.youngFemale
        : breedInfo.stageImages.youngMale;
  } else {
    chicken.stage = "adult";
    chicken.type = chicken.gender === "female" ? "adultFemale" : "adultMale";
    chicken.name =
      chicken.gender === "female"
        ? breedInfo.itemNames.adultFemale
        : breedInfo.itemNames.adultMale;
    chicken.image =
      chicken.gender === "female"
        ? breedInfo.stageImages.adultFemale
        : breedInfo.stageImages.adultMale;
  }

  if (chicken.stage === "adult") {
    const chickIndex = chicks.findIndex((c) => c.id === chicken.id);
    if (chickIndex !== -1) {
      chicks.splice(chickIndex, 1);
      adultChickens.push(chicken);
    }
  }
}

// 判断一个个体当前处于哪些状态，返回状态名数组
function getStatusKeys(being) {
  const keys = [];

  // 蛋：孵化失败
  if (
    being.type === "egg" &&
    being.hatchProgress &&
    being.hatchProgress.stage === "failed"
  ) {
    keys.push("failed");
  }

  // 鸡：状态都放在 statuses 里
  if (being.statuses && Array.isArray(being.statuses)) {
    for (const s of being.statuses) {
      keys.push(s);
    }
  }

  return keys;
}

// 根据个体状态，生成角标图片的 HTML（没有状态则返回空字符串）
function renderStatusBadges(being) {
  const keys = getStatusKeys(being);
  let html = "";
  for (const key of keys) {
    const img = statusBadges[key];
    if (img) {
      html += `<img class="status-badge" src="${img}" alt="${key}">`;
    }
  }
  return html;
}

// 过天数时，活鸡有 10% 概率生病
function applyDailySickness() {
  // const SICK_RATE = 0.1;
  const SICK_RATE = 0;

  const allAlive = [...chicks, ...adultChickens];

  for (const chicken of allAlive) {
    // 已经生病就跳过
    if (chicken.statuses && chicken.statuses.includes("sick")) continue;

    // 正在孵蛋的母鸡不会生病
    const isBrooding = hatchStations.some(
      (s) => String(s.singleItemId) === String(chicken.id),
    );
    if (isBrooding) continue;

    if (Math.random() < SICK_RATE) {
      if (!chicken.statuses) chicken.statuses = [];

      // 生病就不算健康，移除 healthy，只留 sick
      chicken.statuses = chicken.statuses.filter((s) => s !== "healthy");
      if (!chicken.statuses.includes("sick")) {
        chicken.statuses.push("sick");
      }
    }
  }
}

// 每日死亡判定：每只活鸡有 10% 概率死去（目前的逻辑简单粗暴就是每天死亡率10%+正常的寿终）
function applyDailyDeath() {
  // const DEATH_RATE = 0.1;
  const DEATH_RATE = 0;

  const allAlive = [...chicks, ...adultChickens];
  const toDie = [];

  for (const chicken of allAlive) {
    // 正在孵蛋的母鸡不会死，跳过
    const isBrooding = hatchStations.some(
      (s) => String(s.singleItemId) === String(chicken.id),
    );
    if (isBrooding) continue;

    // 1) 随机死亡：每天 10%
    let shouldDie = Math.random() < DEATH_RATE;

    // 2) 寿终：年龄到了自己的寿命上限
    if (!shouldDie && chicken.stageDays && chicken.stageDays.adultToDead) {
      if (chicken.ageDays >= chicken.stageDays.adultToDead) {
        shouldDie = true;
      }
    }

    if (shouldDie) {
      toDie.push(chicken);
    }
  }

  for (const chicken of toDie) {
    killChicken(chicken);
  }
}

// 把一只活鸡变成死鸡（保留原 id 和全部资料，并腾出原位置）
function killChicken(chicken) {
  // 先腾出它在原位置占的格子/点位
  if (
    chicken.location &&
    chicken.location.slotId !== null &&
    chicken.location.slotId !== undefined
  ) {
    const oldSlot = findTargetSlot(chicken.location.slotId);
    if (oldSlot) {
      if (chicken.location.role === "single") {
        oldSlot.singleItemId =
          oldSlot.singleItemId == chicken.id ? null : oldSlot.singleItemId;
      } else {
        oldSlot.groupItemIds = oldSlot.groupItemIds.filter(
          (id) => id != chicken.id,
        );
      }

      if (
        chicken.location.pointId !== null &&
        chicken.location.pointId !== undefined
      ) {
        const oldPoint = oldSlot.positionPoints.find(
          (p) => p.pointId === chicken.location.pointId,
        );
        if (oldPoint) oldPoint.occupiedBy = null;
      }
    }
  }

  // 构造死鸡对象：照搬原鸡的全部字段，只改状态
  const deadChicken = {
    ...chicken,
    statuses: ["dead"],
    aliveImage: chicken.image,
    image: getDeadImage(chicken),
  };

  // 从活鸡数组中移除
  const chickIndex = chicks.findIndex(
    (c) => String(c.id) === String(chicken.id),
  );
  if (chickIndex !== -1) {
    chicks.splice(chickIndex, 1);
  }

  const adultIndex = adultChickens.findIndex(
    (c) => String(c.id) === String(chicken.id),
  );
  if (adultIndex !== -1) {
    adultChickens.splice(adultIndex, 1);
  }

  deadChickens.push(deadChicken);
}

// 按临死阶段和性别，取对应的死亡图
function getDeadImage(chicken) {
  const info = breeds[chicken.breed];
  if (!info || !info.stageImages) return chicken.image;

  let key = "";
  if (chicken.stage === "chick") {
    key = "deadChick";
  } else if (chicken.stage === "young") {
    key = chicken.gender === "female" ? "deadYoungFemale" : "deadYoungMale";
  } else {
    key = chicken.gender === "female" ? "deadAdultFemale" : "deadAdultMale";
  }

  return info.stageImages[key] || chicken.image;
}

// 跨天时，让每个育雏大格子换一套不同的布局，并重新分配里面的鸡
function relayoutBroodStations() {
  for (const station of broodStations) {
    // 格子是空的，就不用换
    if (station.groupItemIds.length === 0 && station.singleItemId === null) {
      continue;
    }

    // 挑一套和当前不同的布局
    const currentLayoutId = station.layoutId;
    const candidates = broodLayouts.filter(
      (l) => l.layoutId !== currentLayoutId,
    );
    const nextLayout =
      candidates.length > 0
        ? candidates[Math.floor(Math.random() * candidates.length)]
        : broodLayouts[0];

    // 换成新布局，点位全部清空
    station.layoutId = nextLayout.layoutId;
    station.singlePosition = { ...nextLayout.singlePosition };
    station.positionPoints = nextLayout.groupPoints.map((p) => ({
      pointId: p.pointId,
      x: p.x,
      y: p.y,
      z: p.z,
      rotation: p.rotation,
      occupiedBy: null,
    }));

    // 母鸡放到新布局的母鸡位
    if (station.singleItemId !== null) {
      const hen = adultChickens.find(
        (c) => String(c.id) === String(station.singleItemId),
      );
      if (hen) {
        hen.location.x = station.singlePosition.x;
        hen.location.y = station.singlePosition.y;
        hen.location.z = station.singlePosition.z;
      }
    }

    // 把空位列出来，供小鸡随机落座
    const emptyPoints = station.positionPoints.filter(
      (p) => p.occupiedBy === null,
    );

    for (const chickenId of station.groupItemIds) {
      const chicken =
        chicks.find((c) => String(c.id) === String(chickenId)) ||
        adultChickens.find((c) => String(c.id) === String(chickenId));
      if (!chicken) continue;

      if (emptyPoints.length === 0) break; // 没空位了，剩下的先不动

      const randomIndex = Math.floor(Math.random() * emptyPoints.length);
      const point = emptyPoints.splice(randomIndex, 1)[0];

      point.occupiedBy = chicken.id;
      chicken.location.pointId = point.pointId;
      chicken.location.x = point.x;
      chicken.location.y = point.y;
      chicken.location.z = point.z;
    }
  }
}

// 生活大格子跨天换布局
function relayoutLifeStations() {
  for (const station of lifeStations) {
    // 空的就跳过
    if (station.groupItemIds.length === 0 && station.singleItemId === null) {
      continue;
    }

    // 挑一套和当前不同的布局
    const candidates = lifeLayouts.filter(
      (l) => l.layoutId !== station.layoutId,
    );
    const nextLayout =
      candidates.length > 0
        ? candidates[Math.floor(Math.random() * candidates.length)]
        : lifeLayouts[0];

    // 换成新布局；下蛋位不动
    station.layoutId = nextLayout.layoutId;
    station.singlePosition = { ...nextLayout.singlePosition };
    station.positionPoints = nextLayout.groupPoints.map((p) => ({
      pointId: p.pointId,
      x: p.x,
      y: p.y,
      z: p.z,
      rotation: p.rotation,
      occupiedBy: null,
    }));

    // 公鸡放回新公鸡位
    if (station.singleItemId !== null) {
      const rooster = adultChickens.find(
        (c) => String(c.id) === String(station.singleItemId),
      );
      if (rooster) {
        rooster.location.x = station.singlePosition.x;
        rooster.location.y = station.singlePosition.y;
        rooster.location.z = station.singlePosition.z;
      }
    }

    // 母鸡随机落到新空位
    const emptyPoints = station.positionPoints.filter(
      (p) => p.occupiedBy === null,
    );

    for (const henId of station.groupItemIds) {
      const hen = adultChickens.find((c) => String(c.id) === String(henId));
      if (!hen) continue;
      if (emptyPoints.length === 0) break;

      const randomIndex = Math.floor(Math.random() * emptyPoints.length);
      const point = emptyPoints.splice(randomIndex, 1)[0];

      point.occupiedBy = hen.id;
      hen.location.pointId = point.pointId;
      hen.location.x = point.x;
      hen.location.y = point.y;
      hen.location.z = point.z;
    }
  }
}

// 生活大格子下蛋
function lifeStationLayEggs() {
  const FERTILITY_RATE = 0.8; // 有公鸡时的受精概率
  const HATCH_FAIL_RATE = 0.1; // 受精蛋里不能孵化的概率
  const LAY_RATE = 0.6; // 每只母鸡每天下蛋的概率

  for (const station of lifeStations) {
    const hasRooster = station.singleItemId !== null;

    // 找到公鸡（如果有）
    let rooster = null;
    if (hasRooster) {
      rooster = adultChickens.find(
        (c) => String(c.id) === String(station.singleItemId),
      );
    }

    for (const henId of station.groupItemIds) {
      const hen = adultChickens.find((c) => String(c.id) === String(henId));
      if (!hen) continue;

      // 今天下不下蛋
      if (Math.random() >= LAY_RATE) continue;

      // 受精与否
      let fertilized = false;
      let canHatch = false;

      if (hasRooster && rooster) {
        fertilized = Math.random() < FERTILITY_RATE;
        if (fertilized) {
          canHatch = Math.random() >= HATCH_FAIL_RATE;
        }
      }

      // 品种遗传：父母同品种取母方；异品种按价格权重的反比选
      let breed = hen.breed;
      if (fertilized && rooster && rooster.breed !== hen.breed) {
        const motherPrice = breeds[hen.breed].prices.adultFemale;
        const fatherPrice = breeds[rooster.breed].prices.adultMale;
        // 选"母方品种"的概率 = 父方价格 / (母方价格 + 父方价格)
        const pickMother =
          Math.random() < fatherPrice / (motherPrice + fatherPrice);
        breed = pickMother ? hen.breed : rooster.breed;
      }

      // 下蛋位置：蛋位中心 + 随机小偏移，自然散开
      const spot = station.lifeAreaEggPoint;
      const initialLocation = {
        type: locationTypes.lifeAreaEggPoint,
        slotId: station.slotId,
        pointId: null,
        role: "group",
        x: (spot ? spot.x : 24) + (Math.random() * 60 - 30),
        y: (spot ? spot.y : 250) + (Math.random() * 40 - 20),
        z: spot ? spot.z : 250,
      };

      const egg = createEgg(breed, initialLocation, {
        fertilized: fertilized,
        canHatch: canHatch,
      });

      eggs.push(egg);
    }
  }
}

// 存档，保存当前状态到浏览器本地
function saveGame() {
  const saveData = {
    player,
    gameTime,
    eggs,
    chicks,
    adultChickens,
    deadChickens,
    incubators,
    tools,
    hatchStations,
    broodStations,
    lifeStations,
    bagGroupItemIds: bagSlot.groupItemIds,
  };

  try {
    localStorage.setItem("hatch_save", JSON.stringify(saveData));
  } catch (e) {
    console.log("存档失败", e);
  }

  console.log("已保存存档");
}

// 从浏览器本地读取存档，并恢复到当前状态
function loadGame() {
  let saveData = null;

  try {
    const raw = localStorage.getItem("hatch_save");
    if (raw) {
      saveData = JSON.parse(raw);
    }
  } catch (e) {
    console.log("读档失败", e);
  }

  if (!saveData) {
    // 没有存档，保持默认初始状态
    return false;
  }

  // 恢复各部分数据
  eggs = saveData.eggs || [];
  chicks = saveData.chicks || [];
  adultChickens = saveData.adultChickens || [];
  deadChickens = saveData.deadChickens || [];
  incubators = saveData.incubators || [];
  tools = saveData.tools || [];
  hatchStations = saveData.hatchStations || [];
  broodStations = saveData.broodStations || [];
  lifeStations = saveData.lifeStations || [];

  if (saveData.player) {
    player.money = saveData.player.money;
    player.totalHatchExp = saveData.player.totalHatchExp;
    player.hatchLevel = saveData.player.hatchLevel;
  }

  if (saveData.gameTime) {
    gameTime.day = saveData.gameTime.day;
  }

  if (saveData.bagGroupItemIds) {
    bagSlot.groupItemIds = saveData.bagGroupItemIds;
  }

  return true;
}

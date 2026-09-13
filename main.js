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

// 所有工具（目前包括孵化器？）
let tools = [];

// 所有孵化器（每种工具数据格式不同）
let incubators = [];

// 孵蛋场景大格子位置
let hatchStations = [];

// 育雏场景中的大格子
let broodStations = [];

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
];

// 场景名称列表，和上面顺序对应
const sceneNames = ["孵蛋场景", "主界面", "育雏场景"];

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
// let selectedBagItem = null;
// let selectedSlotItem = null;
// let selectedBroodChicken = null;
let lastClickTime = 0; //双击判定
let currentInspectedTarget = null; //双击打开的物品
let draggingItem = null; //拖动的物品
let dragMoved = false; //距离判定是否算拖动
const moneyDisplay = document.getElementById("money");
const levelDisplay = document.getElementById("level");
const shopPanel = document.getElementById("shop-panel");
const shopBtn = document.getElementById("shop-btn");
const closeShopBtn = document.getElementById("close-shop");
const bagPanel = document.getElementById("bag-panel");
const bagBtn = document.getElementById("bag-btn");
const closeBagBtn = document.getElementById("close-bag");
const bagInspectLayer = document.getElementById("bag-inspect");
const bagInspectImg = document.getElementById("bag-inspect-img");
const sceneEggSlotContainerId = "scene_egg_slots";

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

// 渲染整个孵蛋场景（现在有问题需要重写）

function renderHatchScene() {
  const container = document.getElementById("hatch-grid");
  let html = "";

  for (const station of hatchStations) {
    if (station.singleItemId !== null) {
      const incubator = incubators.find(
        (inc) => inc.id === station.singleItemId,
      );

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
        style="position: absolute; left: ${point.x}px; top: ${point.y}px; transform: rotate(${point.rotation}deg);">
    `;
          } else {
            const individual =
              eggs.find((e) => e.id == point.occupiedBy) ||
              chicks.find((c) => c.id == point.occupiedBy);

            if (individual) {
              pointsHTML += `
    <img class="slot-item-img" src="${individual.image}"
      data-id="${individual.id}" data-type="${individual.type}"
      data-slot-id="${station.slotId}" data-point-id="${point.pointId}"
      style="position: absolute; left: ${point.x}px; top: ${point.y}px; transform: rotate(${point.rotation}deg);">
  `;
            }
          }
        }

        html += `
<div class="item-slot" id="hatch-station-${station.slotId}" data-slot-id="${station.slotId}" data-slot-type="${station.slotType}" style="width: 340px; min-height: 400px; border: 1px solid #d8cfc0; border-radius: 12px; position: relative;">
<img src="${singleItem.image}" data-id="${singleItem.id}" data-type="${singleItem.type}" style="width: 300px; height: 300px; object-fit: contain; position: absolute; left: 20px; top: 50px;">
${pointsHTML}
</div>
`;
      }
    } else {
      html += `
        <div class="item-slot" id="hatch-station-${station.slotId}" data-slot-id="${station.slotId}" data-slot-type="${station.slotType}" style="width: 340px; min-height: 160px; border: 1px dashed #d8cfc0; border-radius: 12px; display: flex; justify-content: center; align-items: center; color: #8a8075; position: relative;">
          <span>放入孵化器或抱窝母鸡</span>
        </div>
      `;
    }
  }

  container.innerHTML = html;
}

// 渲染整个育雏场景（目前有问题需要重写）
function renderBroodScene() {
  const container = document.getElementById("brood-grid");
  if (!container) return;

  let html = "";

  for (const station of broodStations) {
    let chickensHTML = "";

    if (station.singleItemId !== null) {
      const singleChicken = adultChickens.find(
        (c) => String(c.id) === String(station.singleItemId),
      );
      if (singleChicken) {
        const sx = station.singlePosition?.x ?? 0;
        const sy = station.singlePosition?.y ?? 0;
        chickensHTML += `
          <div class="brood-chicken" data-id="${singleChicken.id}" data-type="${singleChicken.type}" style="position: absolute; left: ${sx}px; top: ${sy}px;">
            <img src="${singleChicken.image}" style="width: 80px; height: 80px; object-fit: contain;">
          </div>
        `;
      }
    }

    for (const chickenId of station.groupItemIds) {
      const chicken =
        chicks.find((c) => c.id === chickenId) ||
        adultChickens.find((c) => c.id === chickenId);

      if (chicken) {
        const px = chicken.location.x ?? 0;
        const py = chicken.location.y ?? 0;
        chickensHTML += `
          <div class="brood-chicken" data-id="${chicken.id}" data-type="${chicken.type}" style="position: absolute; left: ${px}px; top: ${py}px;">
            <img src="${chicken.image}" style="width: 80px; height: 80px; object-fit: contain;">
          </div>
        `;
      }
    }

    const hasContent =
      station.groupItemIds.length > 0 || station.singleItemId !== null;

    const stationStyle = hasContent
      ? "width: 340px; height: 340px; border: 1px dashed #c9bfae; border-radius: 12px; position: relative;"
      : "width: 340px; min-height: 160px; border: 1px dashed #c9bfae; border-radius: 12px; display: flex; justify-content: center; align-items: center; color: #8a8075;";

    html += `
      <div class="brood-station" id="brood-station-${station.slotId}" data-slot-id="${station.slotId}" data-slot-type="${station.slotType}" style="${stationStyle}">
        ${hasContent ? chickensHTML : "放入小鸡或母鸡"}
      </div>
    `;
  }

  container.innerHTML = html;
}

//辅助函数，用来根据槽位 id 找到目标槽位对象
function findTargetSlot(slotId) {
  if (slotId === "bag") return bagSlot;

  const allSlots = [...hatchStations, ...broodStations];

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
  // console.log(
  //   "[移动开始] draggingId =",
  //   draggingId,
  //   "draggingType =",
  //   draggingType,
  // );
  // console.log(
  //   "[移动开始] 找到实例 =",
  //   item.id,
  //   "当前 location =",
  //   JSON.parse(JSON.stringify(item.location)),
  // );

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

  // 如果物品原本在背包里，先把它的 id 从背包的 groupItemIds 里移除
  if (
    item.location &&
    item.location.type === locationTypes.bag &&
    item.location.slotId === null
  ) {
    bagSlot.groupItemIds = bagSlot.groupItemIds.filter(
      (id) => String(id) !== String(item.id),
    );
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
      let minDist = Infinity;
      for (const p of targetSlot.positionPoints) {
        if (p.occupiedBy !== null) continue;
        const dx = p.x - (dropX || 0);
        const dy = p.y - (dropY || 0);
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
    } else {
      item.location.pointId = null;
      item.location.x = 0;
      item.location.y = 0;
    }
    // console.log("[移动成功] 蛋数组 location 一览：");
    // for (const e of eggs) {
    //   console.log("  egg", e.id, JSON.parse(JSON.stringify(e.location)));
    // }
    return true;
  }

  return false;
}

//槽位和可放物品之间的映射
// const slotAcceptMap = {
//   eggSlot: ["egg"],
//   chickSlot: ["chick"],
//   broodStation: ["chick", "adultFemale"],
//   hatchStation: ["incubator", "adultFemale"],
//   adultArea: ["adultFemale", "adultMale"],
//   bag: ["egg", "chick", "adultFemale", "adultMale", "incubator", "tool"],
// };

// 槽位类型对应的个体数组
const slotItemArrays = {
  egg: eggs,
  chick: chicks,
  adultFemale: adultChickens,
  adultMale: adultChickens,
  incubator: incubators,
  tool: tools,
};

// 通用槽位渲染函数（返回html版）（但是目前只用于孵化器内部的蛋的槽位渲染）
// function renderSlots(slots) {
//   let html = "";

//   for (const slot of slots) {
//     const typeInfo = slotTypes[slot.slotType];

//     let imgSrc = typeInfo.placeholderImage;
//     let imgClass = "slot-placeholder";

//     let item = null;

//     if (slot.itemIdArray.length > 0) {
//       const acceptedTypes = slotAcceptMap[slot.slotType] || [];

//       for (const type of acceptedTypes) {
//         const arr = slotItemArrays[type];
//         if (!arr) continue;
//         item = arr.find((i) => i.id === slot.itemIdArray[0]);
//         if (item) break;
//       }

//       if (item && item.image) {
//         imgSrc = item.image;
//         imgClass = "slot-item-img";
//       }
//     }

//     const hasPosition =
//       typeof slot.x === "number" && typeof slot.y === "number";

//     const slotStyle = hasPosition
//       ? `position: absolute; left: ${slot.x}px; top: ${slot.y}px;`
//       : "position: relative;";

//     const imgStyle = slot.rotation
//       ? `transform: rotate(${slot.rotation}deg);`
//       : "";

//     html += `
//   <div class="item-slot" data-slot-id="${slot.slotId}" data-slot-type="${slot.slotType}" style="${slotStyle}">
//     ${slot.itemIdArray.length === 0 ? `<img class="${imgClass}" src="${imgSrc}" alt="放置位" style="${imgStyle}">` : ""}
//   </div>
//   ${slot.itemIdArray.length > 0 && item ? `<img class="slot-item-img" src="${item.image}" data-id="${item.id}" data-type="${item.type}" style="${slotStyle} ${imgStyle}">` : ""}
// `;
//   }

//   return html;
// }

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
    html += `
  <div class="bag-cell" data-bag-category="${category}" data-id="${item.id}" data-type="${item.itemType}" style="position: relative;">
    <img class="shop-item-img" src="${item.image}" alt="${item.name}">
    <div class="bag-item-name">${item.name}</div>
  </div>
`;
  }
  html += "</div>";
  content.innerHTML = html;
}

initScenes();
updateTopBar();
renderMainSceneStatus();
ensureHatchStation();
renderHatchScene();
ensureBroodStation();
renderBroodScene();

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
  console.log("双击目标:", targetEl);
  if (!targetEl) return;

  const id = targetEl.getAttribute("data-id");
  const type = targetEl.getAttribute("data-type");

  let target = null;

  const itemArray = slotItemArrays[type];
  if (itemArray) {
    target = itemArray.find((i) => i.id == id);
  }

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

//双指缩放
bagInspectLayer.addEventListener("touchstart", function (event) {
  if (event.touches.length === 2) {
    lastTouchDistance = Math.hypot(
      event.touches[0].clientX - event.touches[1].clientX,
      event.touches[0].clientY - event.touches[1].clientY,
    );
  }
});

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
  const targetEl = event.target.closest("[data-id][data-type]");
  if (!targetEl) return;
  sceneContainer.style.overflowX = "hidden"; //防止触发切换屏幕
  const bagContent = document.getElementById("bag-content");
  if (bagContent) bagContent.style.overflowY = "hidden"; //防止滑动背包

  dragMoved = false;
  draggingItem = {
    id: targetEl.getAttribute("data-id"),
    type: targetEl.getAttribute("data-type"),
    startX: event.touches[0].clientX,
    startY: event.touches[0].clientY,
  };
  console.log(
    "[拖动开始] 命中元素 =",
    targetEl,
    "id =",
    draggingItem.id,
    "type =",
    draggingItem.type,
  );
});

//拖动中
document.addEventListener("touchmove", function (event) {
  if (!draggingItem) return;

  const dx = event.touches[0].clientX - draggingItem.startX;
  const dy = event.touches[0].clientY - draggingItem.startY;

  if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
    dragMoved = true;
  }
});

//拖动结束
document.addEventListener("touchend", function (event) {
  if (!draggingItem) return;

  if (!dragMoved) {
    draggingItem = null;
    sceneContainer.style.overflowX = "";
    const bagContent = document.getElementById("bag-content");
    if (bagContent) bagContent.style.overflowY = "";
    return;
  }

  const touch = event.changedTouches[0];
  const dropTarget = document
    .elementFromPoint(touch.clientX, touch.clientY)
    ?.closest("[data-slot-id]");

  if (!dropTarget) {
    draggingItem = null;
    sceneContainer.style.overflowX = "";
    const bagContent = document.getElementById("bag-content");
    if (bagContent) bagContent.style.overflowY = "";
    return;
  }

  const targetSlotId = dropTarget.getAttribute("data-slot-id");

  // console.log(
  //   "[松手] draggingItem =",
  //   JSON.parse(JSON.stringify(draggingItem)),
  // );
  // console.log("[松手] targetSlotId =", targetSlotId);

  console.log(
    "[拖动结束] draggingItem =",
    draggingItem,
    "dragMoved =",
    dragMoved,
  );
  console.log(
    "[拖动结束] 落点元素 =",
    document.elementFromPoint(touch.clientX, touch.clientY),
  );

  const success = moveDraggedItemToSlot(
    draggingItem.id,
    draggingItem.type,
    targetSlotId,
    touch.clientX,
    touch.clientY,
  );

  console.log(
    "[拖动结束] draggingItem =",
    draggingItem,
    "dragMoved =",
    dragMoved,
  );
  console.log(
    "[拖动结束] 落点元素 =",
    document.elementFromPoint(touch.clientX, touch.clientY),
  );

  if (success) {
    //这里刷新的太多了需要以后修整
    ensureHatchStation();
    ensureBroodStation();
    renderHatchScene();
    renderBroodScene();

    if (bagPanel.style.display === "flex") {
      renderBagContent(currentBagCategory, bagSearchInput.value);
    }

    showToast("移动成功");
  }

  draggingItem = null;
  sceneContainer.style.overflowX = "";
  const bagContent = document.getElementById("bag-content");
  if (bagContent) bagContent.style.overflowY = "";
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

// 生成一颗蛋
function createEgg(breedId, initialLocation) {
  const breedInfo = breeds[breedId];
  const eggItemInfo = shopItems.egg.find((item) => item.breed === breedId);

  const fertilized = Math.random() < breedInfo.fertilityRate;
  const canHatch = Math.random() < breedInfo.hatchSuccessRate;

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
          containerId: initialLocation.containerId ?? null,
          slotId: initialLocation.slotId ?? null,
          pointId: initialLocation.pointId ?? null,
          role: initialLocation.role ?? "group",
          x: initialLocation.x ?? 0,
          y: initialLocation.y ?? 0,
          z: initialLocation.z ?? 0,
        }
      : {
          type: locationTypes.bag,
          containerId: null,
          slotId: null,
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
      slotId: null,
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
          rotation: p.rotation,
          occupiedBy: null,
        })),
      }
    : {
        layoutId: "default",
        singlePosition: { x: 0, y: 0, rotation: 0 },
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
      slotId: null,
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
          slotId: null,
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

  updateTopBar();
  renderMainSceneStatus();
  ensureHatchStation();
  renderHatchScene();
  ensureBroodStation();
  renderBroodScene();
}

//推进天数（测试版）
document
  .getElementById("advance-days-btn")
  .addEventListener("click", function () {
    const input = document.getElementById("advance-days-input");
    const days = parseInt(input.value, 10);

    if (!days || days <= 0) {
      showToast("请输入有效天数");
      return;
    }

    advanceDays(days);
    showToast("时间推进了 " + days + " 天");
  });

//孵化阶段判断函数
function updateEggStage(egg) {
  if (!egg.fertilized) {
    egg.hatchProgress.stage = "infertile";
    return;
  }

  if (!egg.canHatch) {
    egg.hatchProgress.stage = "failed";
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

  const breedInfo = breeds[egg.breed];
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

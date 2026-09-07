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

// 孵蛋场景中的普通蛋位数据（暂时）
let itemSlots = [
  {
    slotId: 0,
    slotType: "egg",
    itemId: null,
    containerId: "scene_egg_slots",
    locationType: locationTypes.sceneSlot,
  },
  {
    slotId: 1,
    slotType: "egg",
    itemId: null,
    containerId: "scene_egg_slots",
    locationType: locationTypes.sceneSlot,
  },
];

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
let selectedBagItem = null;
let selectedSlotItem = null;
let selectedBroodChicken = null;
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
  if (Math.abs(distance) < 50) {
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
    (station) => station.itemId !== null,
  ).length;

  const targetCount = occupiedCount + 1;

  while (hatchStations.length < targetCount) {
    hatchStations.push({
      slotId: Date.now() + Math.random(),
      slotType: "hatchStation",
      itemId: null,
      containerId: "hatch_station_area",
      locationType: locationTypes.sceneSlot,
    });
  }

  while (hatchStations.length > targetCount) {
    hatchStations.pop();
  }
}

// 保证育雏场景大格子数量始终比已占用的大格子多一个
function ensureBroodStation() {
  const occupiedCount = broodStations.filter(
    (station) => station.chickenIds.length > 0,
  ).length;

  const targetCount = occupiedCount + 1;

  while (broodStations.length < targetCount) {
    broodStations.push({
      stationId: Date.now() + Math.random(),
      chickenIds: [],
      hasMotherHen: false,
    });
  }

  while (broodStations.length > targetCount) {
    broodStations.pop();
  }
}

// 渲染整个孵蛋场景

function renderHatchScene() {
  const container = document.getElementById("hatch-grid");
  let html = "";

  for (const station of hatchStations) {
    if (station.itemId !== null) {
      const incubator = incubators.find((inc) => inc.id === station.itemId);

      if (incubator) {
        html += `
          <div class="item-slot" id="hatch-station-${station.slotId}" data-slot="${station.slotId}" data-slot-type="${station.slotType}" style="width: 340px; min-height: 400px; border: 1px solid #d8cfc0; border-radius: 12px; position: relative; display: flex; justify-content: center; align-items: center;">
            <img src="${incubator.image}" style="width: 300px; height: 300px; object-fit: contain;">
            ${renderSlots(incubator.slots)}
          </div>
        `;
      }
    } else {
      html += `
        <div class="item-slot" id="hatch-station-${station.slotId}" data-slot="${station.slotId}" data-slot-type="${station.slotType}" style="width: 340px; min-height: 160px; border: 1px dashed #d8cfc0; border-radius: 12px; display: flex; justify-content: center; align-items: center; color: #8a8075; position: relative;">
          <span>放入孵化器或抱窝母鸡</span>
          <button class="observe-btn" style="display: none; position: absolute; left: 5px; bottom: 5px;">观察</button>
        </div>
      `;
    }
  }

  container.innerHTML = html;
}

// 渲染整个育雏场景
function renderBroodScene() {
  const container = document.getElementById("brood-grid");
  if (!container) return;

  let html = "";

  for (const station of broodStations) {
    let chickensHTML = "";

    for (const chickenId of station.chickenIds) {
      const chicken =
        chicks.find((c) => c.id === chickenId) ||
        adultChickens.find((c) => c.id === chickenId);

      if (chicken) {
        chickensHTML += `
          <div class="brood-chicken" data-chicken-id="${chicken.id}" style="position: relative; display: inline-block; margin: 4px;">
            <img src="${chicken.image}" style="width: 80px; height: 80px; object-fit: contain;">
            <button class="observe-btn" style="display: none; position: absolute; left: 2px; bottom: 2px;">观察</button>
          </div>
        `;
      }
    }

    html += `
      <div class="brood-station" id="brood-station-${station.stationId}" data-station-id="${station.stationId}" style="width: 340px; min-height: 160px; border: 1px dashed #c9bfae; border-radius: 12px; padding: 10px; display: flex; flex-wrap: wrap; align-items: center; justify-content: center;">
        ${chickensHTML}
        ${
          station.chickenIds.length === 0
            ? '<span style="color: #8a8075;">放入小鸡或母鸡</span>'
            : ""
        }
      </div>
    `;
  }

  container.innerHTML = html;
}

// 渲染大格子里的孵化器或抱窝母鸡，目前没用可以删了
function renderIncubatorOrHen(station) {
  if (station.itemId === null) return "";

  const incubator = incubators.find((inc) => inc.id === station.itemId);
  if (!incubator) return "";

  let slotsHTML = "";

  incubator.slots.forEach((slot, index) => {
    const layout = incubator.slotLayout[index];
    const x = layout ? layout.x : 0;
    const y = layout ? layout.y : 0;

    const typeInfo = slotTypes[slot.slotType];
    let imgSrc = typeInfo.placeholderImage;
    let imgClass = "slot-placeholder";

    if (slot.itemId !== null) {
      const itemArray = slotItemArrays[slot.slotType];
      const item = itemArray.find((i) => i.id === slot.itemId);
      if (item && item.image) {
        imgSrc = item.image;
        imgClass = "slot-item-img";
      }
    }

    slotsHTML += `
      <div class="item-slot" data-slot="${slot.slotId}" data-slot-type="${slot.slotType}" style="position: absolute; left: ${x}px; top: ${y}px;">
        <img class="${imgClass}" src="${imgSrc}" alt="放置位">
      </div>
    `;
  });

  return `
    <img src="${incubator.image}" style="position: absolute; left: 20px; top: 30px; width: 300px; height: 300px; object-fit: contain;">
    ${slotsHTML}
  `;
}

// 槽位类型对应的个体数组
const slotItemArrays = {
  egg: eggs,
  chick: chicks,
  adultChicken: adultChickens,
  tool: tools,
  hatchStation: incubators, //目前没放母鸡
};

// 通用槽位渲染函数（返回html版）
function renderSlots(slots) {
  let html = "";

  for (const slot of slots) {
    const typeInfo = slotTypes[slot.slotType];

    let imgSrc = typeInfo.placeholderImage;
    let imgClass = "slot-placeholder";

    if (slot.itemId !== null) {
      const itemArray = slotItemArrays[slot.slotType];

      if (itemArray) {
        const item = itemArray.find((i) => i.id === slot.itemId);

        if (item && item.image) {
          imgSrc = item.image;
          imgClass = "slot-item-img";
        }
      }
    }

    const hasPosition =
      typeof slot.x === "number" && typeof slot.y === "number";

    const slotStyle = hasPosition
      ? `position: absolute; left: ${slot.x}px; top: ${slot.y}px;`
      : "position: relative;";

    const imgStyle = slot.rotation
      ? `transform: rotate(${slot.rotation}deg);`
      : "";

    html += `
      <div class="item-slot" data-slot="${slot.slotId}" data-slot-type="${slot.slotType}" style="${slotStyle}">
        <img class="${imgClass}" src="${imgSrc}" alt="放置位" style="${imgStyle}">
        <button class="observe-btn" style="display: none; position: absolute; left: 5px; bottom: 5px;">观察</button>
      </div>
    `;
  }

  return html;
}

// 渲染背包内容
function renderBagContent(category, keyword) {
  const content = document.getElementById("bag-content");

  let items = [];

  if (keyword) {
    items = items.filter((item) => item.name.includes(keyword));
  }

  if (category === "egg") {
    for (const egg of eggs) {
      if (egg.location.type !== locationTypes.bag) continue;
      const itemInfo = shopItems.egg.find((item) => item.breed === egg.breed);
      items.push({
        id: egg.id,
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
          image: itemInfo ? itemInfo.image : "",
          name: itemInfo ? itemInfo.name : tool.id,
        });
      }
    }
  }

  if (items.length === 0) {
    content.innerHTML = "<p>这个分类暂时没有物品</p>";
    return;
  }

  let html = '<div class="bag-grid">';
  for (const item of items) {
    html += `
  <div class="bag-cell" data-type="${category}" data-id="${item.id}" style="position: relative;">
    <img class="shop-item-img" src="${item.image}" alt="${item.name}">
    <div class="bag-item-name">${item.name}</div>
    <button class="observe-btn" style="display: none; position: absolute; left: 20px; bottom: 25px;">观察</button>
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
  selectedBagItem = null;
  document
    .querySelectorAll(".bag-cell")
    .forEach((c) => c.classList.remove("highlight"));
  document
    .querySelectorAll(".item-slot")
    .forEach((s) => s.classList.remove("highlight"));
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
      const bagLocation = {
        type: locationTypes.bag,
        containerId: null,
        slotId: null,
      };

      obtainItem(itemId, qty, bagLocation);
      showToast("购买成功");
      renderMainSceneStatus();
    }
  });

//背包物品点击选中/取消选中
document
  .getElementById("bag-content")
  .addEventListener("click", function (event) {
    if (event.target.classList.contains("observe-btn")) return;
    const cell = event.target.closest(".bag-cell");
    if (!cell) {
      selectedBagItem = null;
      document.querySelectorAll(".observe-btn").forEach((btn) => {
        btn.style.display = "none";
      });
      document.querySelectorAll(".bag-cell").forEach((c) => {
        c.classList.remove("highlight");
      });
      return;
    }

    const wasSelected = cell.classList.contains("highlight");

    if (wasSelected) {
      selectedBagItem = null;
      cell.classList.remove("highlight");
      document
        .querySelectorAll(".observe-btn")
        .forEach((btn) => (btn.style.display = "none"));
      updateSlotHighlights();
      return;
    }

    const img = cell.querySelector("img");
    if (!img) return;

    // 隐藏所有观察按钮
    document.querySelectorAll(".observe-btn").forEach((btn) => {
      btn.style.display = "none";
    });

    const observeBtn = cell.querySelector(".observe-btn");
    observeBtn.style.display = "block";

    // 取消所有背包物品的高亮
    document.querySelectorAll(".bag-cell").forEach((c) => {
      c.classList.remove("highlight");
    });

    // 高亮当前选中格子
    cell.classList.add("highlight");

    selectedBagItem = {
      id: Number(cell.getAttribute("data-id")),
      image: img.src,
      alt: img.alt,
      name: cell.querySelector(".bag-item-name").textContent,
      observeBtn: observeBtn,
      type: cell.getAttribute("data-type"),
    };

    updateSlotHighlights();
  });

// 点击场景槽位，尝试放入选中的背包物品
document
  .getElementById("hatch-grid")
  .addEventListener("click", function (event) {
    if (event.target.classList.contains("observe-btn")) return;
    const slotElement = event.target.closest(".item-slot");
    if (!slotElement) return;
    const slotId = slotElement.getAttribute("data-slot");
    const allSceneSlots = [
      ...itemSlots,
      ...hatchStations,
      ...incubators.flatMap((inc) => inc.slots),
    ];

    const slot = allSceneSlots.find((s) => String(s.slotId) === String(slotId));
    if (!slot) return;
    if (slot.itemId !== null) {
      //如果点击已经选中的非空槽位则取消选择
      if (
        selectedSlotItem &&
        String(selectedSlotItem.slotId) === String(slot.slotId)
      ) {
        selectedSlotItem = null;

        slotElement.classList.remove("highlight");
        const slotObserveBtn = slotElement.querySelector(".observe-btn");
        if (slotObserveBtn) {
          slotObserveBtn.style.display = "none";
        }

        event.stopPropagation();
        return;
      }
      //选中该非空槽位
      selectedBagItem = null;

      document
        .querySelectorAll(".bag-cell")
        .forEach((c) => c.classList.remove("highlight"));
      document
        .querySelectorAll(".observe-btn")
        .forEach((btn) => (btn.style.display = "none"));

      document
        .querySelectorAll(".item-slot")
        .forEach((s) => s.classList.remove("highlight"));
      //槽位加上高光
      slotElement.classList.add("highlight");
      //加上显示这个槽位里的观察按钮，并隐藏其他观察按钮
      document.querySelectorAll(".observe-btn").forEach((btn) => {
        btn.style.display = "none";
      });

      const slotObserveBtn = slotElement.querySelector(".observe-btn");
      if (slotObserveBtn) {
        slotObserveBtn.style.display = "block";
      }
      //槽位内容
      selectedSlotItem = {
        slotId: slot.slotId,
        containerId: slot.containerId,
        itemId: slot.itemId,
        slotType: slot.slotType,
      };
      //停止聆听
      event.stopPropagation();
      return;
    }

    //先判断是否为孵化器放入大格子
    if (slot.slotType === "hatchStation") {
      if (!selectedBagItem || selectedBagItem.type !== "tool") return;

      const incubator = incubators.find((inc) => inc.id === selectedBagItem.id);
      if (!incubator) return;
      slot.itemId = incubator.id;

      incubator.location = {
        type: slot.locationType,
        containerId: slot.containerId,
        slotId: slot.slotId,
      };

      selectedBagItem = null;
      document
        .querySelectorAll(".item-slot")
        .forEach((s) => s.classList.remove("highlight"));
      document
        .querySelectorAll(".bag-cell")
        .forEach((c) => c.classList.remove("highlight"));
      document
        .querySelectorAll(".observe-btn")
        .forEach((btn) => (btn.style.display = "none"));

      ensureHatchStation();
      renderBagContent(currentBagCategory, bagSearchInput.value);
      renderHatchScene();
      renderMainSceneStatus();
      event.stopPropagation();
      return;
    }

    //如果点击空位置，把非空槽位的内容放入，或者取消已选择的非空槽位
    if (!selectedBagItem || selectedBagItem.type !== slot.slotType) {
      if (selectedSlotItem && selectedSlotItem.slotType === slot.slotType) {
        const fromSlot = itemSlots.find(
          (s) => String(s.slotId) === String(selectedSlotItem.slotId),
        );
        if (fromSlot && fromSlot.itemId !== null) {
          const itemArray = slotItemArrays[slot.slotType];
          const item = itemArray.find((i) => i.id === fromSlot.itemId);
          if (item) {
            slot.itemId = fromSlot.itemId;
            fromSlot.itemId = null;

            item.location = {
              type: slot.locationType,
              containerId: slot.containerId,
              slotId: slot.slotId,
            };
          }
        }

        selectedSlotItem = null;

        document
          .querySelectorAll(".item-slot")
          .forEach((s) => s.classList.remove("highlight"));
        document
          .querySelectorAll(".observe-btn")
          .forEach((btn) => (btn.style.display = "none"));

        renderHatchScene();
        renderMainSceneStatus();

        event.stopPropagation();
        return;
      }

      if (selectedSlotItem) {
        selectedSlotItem = null;

        document
          .querySelectorAll(".item-slot")
          .forEach((s) => s.classList.remove("highlight"));
        document
          .querySelectorAll(".observe-btn")
          .forEach((btn) => (btn.style.display = "none"));
      }
      return;
    }

    if (!selectedBagItem) return;

    if (selectedBagItem.type !== slot.slotType) return;

    const itemArray = slotItemArrays[slot.slotType];
    if (!itemArray) return;

    const itemIndex = itemArray.findIndex(
      (item) => item.id === selectedBagItem.id,
    );
    if (itemIndex === -1) return;

    const item = itemArray[itemIndex];
    slot.itemId = item.id;

    item.location = {
      type: slot.locationType,
      containerId: slot.containerId,
      slotId: slot.slotId,
    };

    selectedBagItem = null;
    document
      .querySelectorAll(".item-slot")
      .forEach((s) => s.classList.remove("highlight"));
    document
      .querySelectorAll(".bag-cell")
      .forEach((c) => c.classList.remove("highlight"));
    document
      .querySelectorAll(".observe-btn")
      .forEach((btn) => (btn.style.display = "none"));

    renderBagContent(currentBagCategory, bagSearchInput.value);
    renderHatchScene();
    renderMainSceneStatus();
  });

//给背包面板添加点击监听，识别“是否点击了背包content”。
document
  .getElementById("bag-panel")
  .addEventListener("click", function (event) {
    if (!event.target.closest("#bag-content")) return;

    //如果点击育雏鸡
    if (selectedBroodChicken) {
      const chicken =
        chicks.find((c) => c.id === selectedBroodChicken.chickenId) ||
        adultChickens.find((c) => c.id === selectedBroodChicken.chickenId);

      if (chicken) {
        const station = broodStations.find((s) =>
          s.chickenIds.includes(chicken.id),
        );

        if (station) {
          station.chickenIds = station.chickenIds.filter(
            (id) => id !== chicken.id,
          );

          if (
            station.hasMotherHen &&
            !station.chickenIds.some((id) => {
              const c = adultChickens.find((ac) => ac.id === id);
              return c && c.gender === "female" && c.age === "adult";
            })
          ) {
            station.hasMotherHen = false;
          }

          chicken.location = {
            type: locationTypes.bag,
            containerId: null,
            slotId: null,
          };
        }
      }

      selectedBroodChicken = null;
      document.querySelectorAll(".brood-chicken").forEach((el) => {
        el.classList.remove("highlight");
      });

      ensureBroodStation();
      renderBroodScene();
      renderBagContent(currentBagCategory, bagSearchInput.value);
      renderMainSceneStatus();
      return;
    }

    if (!selectedSlotItem) return;

    const allSceneSlots = [
      ...itemSlots,
      ...hatchStations,
      ...incubators.flatMap((inc) => inc.slots),
    ];

    const slot = allSceneSlots.find(
      (s) => String(s.slotId) === String(selectedSlotItem.slotId),
    );
    if (!slot) return;

    const itemArray = slotItemArrays[slot.slotType];
    if (!itemArray) return;

    const item = itemArray.find((i) => i.id === slot.itemId);
    if (!item) return;

    item.location = {
      type: locationTypes.bag,
      containerId: null,
      slotId: null,
    };

    //在收回孵化器之前，先检查它里面的槽位是否全部为空
    if (slot.slotType === "hatchStation") {
      const incubator = incubators.find((inc) => inc.id === slot.itemId);
      if (incubator) {
        const hasEgg = incubator.slots.some((s) => s.itemId !== null);
        if (hasEgg) {
          showToast("还没清空呢");
          return;
        }
      }
    }

    slot.itemId = null;

    //（测试版）如果是从·孵化器中把干了的小鸡拿出来，就把孵化器槽位变回蛋类型
    if (
      slot.locationType === locationTypes.incubator &&
      slot.slotType === "chick"
    ) {
      slot.slotType = "egg";
    }

    selectedSlotItem = null;

    document
      .querySelectorAll(".item-slot")
      .forEach((s) => s.classList.remove("highlight"));
    //如果收回的是孵化器，则改变孵化区域大格子数目
    if (slot.slotType === "hatchStation") {
      ensureHatchStation();
    }
    renderHatchScene();
    renderBagContent(currentBagCategory, bagSearchInput.value);
    renderMainSceneStatus();
  });

//点击场景空白处或商店区域时取消场景选中
document.addEventListener("click", function (event) {
  if (event.target.closest(".item-slot")) return;
  if (event.target.closest("#bag-panel")) return;
  if (event.target.closest(".observe-btn")) return;

  selectedSlotItem = null;
  selectedBagItem = null;
  selectedBroodChicken = null;

  document
    .querySelectorAll(".item-slot")
    .forEach((s) => s.classList.remove("highlight"));
  document
    .querySelectorAll(".bag-cell")
    .forEach((c) => c.classList.remove("highlight"));
  document.querySelectorAll(".brood-chicken").forEach((el) => {
    el.classList.remove("highlight");
  });
  document
    .querySelectorAll(".observe-btn")
    .forEach((btn) => (btn.style.display = "none"));
});

//让育雏大格子支持点击，并判断是否放入背包选中的鸡。
document
  .getElementById("brood-grid")
  .addEventListener("click", function (event) {
    //检测是否点击到鸡的观察按钮
    if (event.target.classList.contains("observe-btn")) return;
    //检测是否点击到鸡
    const chickenElement = event.target.closest(".brood-chicken");
    if (chickenElement && !selectedBagItem) {
      const chickenId = chickenElement.getAttribute("data-chicken-id");

      //如果点击的是同一只鸡就取消选中
      if (
        selectedBroodChicken &&
        String(selectedBroodChicken.chickenId) === String(chickenId)
      ) {
        selectedBroodChicken = null;
        chickenElement.classList.remove("highlight");
        const btn = chickenElement.querySelector(".observe-btn");
        if (btn) btn.style.display = "none";
        event.stopPropagation();
        return;
      }

      document.querySelectorAll(".brood-chicken").forEach((el) => {
        el.classList.remove("highlight");
      });

      chickenElement.classList.add("highlight");

      selectedBroodChicken = {
        chickenId: Number(chickenId),
      };

      document.querySelectorAll(".observe-btn").forEach((btn) => {
        btn.style.display = "none";
      });

      const observeBtn = chickenElement.querySelector(".observe-btn");
      if (observeBtn) {
        observeBtn.style.display = "block";
      }

      event.stopPropagation();
      return;
    }

    const stationElement = event.target.closest(".brood-station");
    if (!stationElement) return;

    //如果点击大格子空白处就取消选中的育雏鸡（目前逻辑已经转移到监听全局）
    // if (selectedBroodChicken) {
    //   selectedBroodChicken = null;
    //   document.querySelectorAll(".brood-chicken").forEach((el) => {
    //     el.classList.remove("highlight");
    //   });
    //   document.querySelectorAll(".observe-btn").forEach((btn) => {
    //     btn.style.display = "none";
    //   });
    //   return;
    // }

    const stationId = stationElement.getAttribute("data-station-id");
    const station = broodStations.find(
      (s) => String(s.stationId) === String(stationId),
    );
    if (!station) return;

    if (!selectedBagItem) return;

    if (
      selectedBagItem.type !== "chick" &&
      selectedBagItem.type !== "adultChicken"
    )
      return;

    const chicken =
      chicks.find((c) => c.id === selectedBagItem.id) ||
      adultChickens.find((c) => c.id === selectedBagItem.id);

    if (!chicken) return;

    if (chicken.age === "adult" && chicken.gender === "male") {
      showToast("成年公鸡不能放入育雏区");
      return;
    }

    if (chicken.age === "adult" && chicken.gender === "female") {
      const hasMother = station.chickenIds.some((id) => {
        const c = adultChickens.find((ac) => ac.id === id);
        return c && c.age === "adult" && c.gender === "female";
      });

      if (hasMother) {
        showToast("这个育雏区已经有一只带崽母鸡了");
        return;
      }
    }

    station.chickenIds.push(chicken.id);

    if (chicken.age === "adult" && chicken.gender === "female") {
      station.hasMotherHen = true;
    }

    chicken.location = {
      type: locationTypes.sceneSlot,
      containerId: "brood-grid",
      slotId: station.stationId,
    };

    selectedBagItem = null;
    document
      .querySelectorAll(".bag-cell")
      .forEach((c) => c.classList.remove("highlight"));
    document
      .querySelectorAll(".observe-btn")
      .forEach((btn) => (btn.style.display = "none"));

    ensureBroodStation();
    renderBroodScene();
    renderBagContent(currentBagCategory, bagSearchInput.value);
    renderMainSceneStatus();
  });

// 全局观察按钮点击
document.addEventListener("click", function (event) {
  if (!event.target.classList.contains("observe-btn")) return;

  if (selectedBagItem) {
    openInspect(selectedBagItem.image, selectedBagItem.alt);
    return;
  }

  if (selectedSlotItem) {
    const itemArray = slotItemArrays[selectedSlotItem.slotType];
    const item = itemArray.find((i) => i.id === selectedSlotItem.itemId);
    if (item && item.image) {
      openInspect(item.image, item.name || "");
    }
  }

  if (selectedBroodChicken) {
    const chicken =
      chicks.find((c) => c.id === selectedBroodChicken.chickenId) ||
      adultChickens.find((c) => c.id === selectedBroodChicken.chickenId);
    if (chicken && chicken.image) {
      openInspect(chicken.image, chicken.name || "");
      return;
    }
  }
});

//进入大图
function openInspect(imageSrc, imageAlt) {
  bagInspectImg.src = imageSrc;
  bagInspectImg.alt = imageAlt;
  bagInspectImg.style.transform = "scale(1.5)";
  zoomScale = 1.5;
  inspectMode = true;
  bagInspectLayer.style.display = "flex";
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
    // document.querySelectorAll(".observe-btn").forEach((btn) => {
    //   btn.style.display = "none";
    // });
    // selectedBagItem = null;
    inspectMode = false;
  }
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
    breed: breedId,
    name: eggItemInfo ? eggItemInfo.name : breedInfo.name,
    image: eggItemInfo ? eggItemInfo.image : "",
    gender: Math.random() < 0.5 ? "female" : "male",
    fertilized: fertilized,
    canHatch: canHatch,
    peckPosition: Math.random() < breedInfo.bigEndRate ? "bigEnd" : "smallEnd",
    hatchProgress: {
      stage: "waiting",
      elapsedDays: 0,
    },
    hatchOffset: hatchOffset,
    stageDays: stageDays,
    location: initialLocation || {
      type: locationTypes.bag,
      containerId: null,
      slotId: null,
    },
  };

  return egg;
}

// 生成一只鸡（目前就等于“买一个鸡”，不包括蛋变成鸡的内容）
function createChicken(breedId, gender, age, initialLocation) {
  const breedInfo = breeds[breedId];

  const chicken = {
    id: Date.now() + Math.random(),
    breed: breedId,
    name: breedInfo.itemNames[
      gender === "female" ? "adultFemale" : "adultMale"
    ],
    image:
      breedInfo.stageImages[gender === "female" ? "adultFemale" : "adultMale"],
    gender: gender,
    age: age,
    ageDays: age === "adult" ? breedInfo.growth.youngToAdultDays : 0,
    statuses: ["healthy"],
    location: initialLocation || {
      type: locationTypes.bag,
      containerId: null,
      slotId: null,
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

  const slots = [];
  const slotLayout = [];

  const capacity = itemInfo.capacity || 6;

  for (let i = 0; i < capacity; i++) {
    const slotId = Date.now() + Math.random() + i;
    const layoutInfo = itemInfo.slotLayout[i];

    const x = layoutInfo ? layoutInfo.x : 0;
    const y = layoutInfo ? layoutInfo.y : 0;
    const rotation = layoutInfo ? layoutInfo.rotation : 0;

    slots.push({
      slotId: slotId,
      slotType: "egg",
      itemId: null,
      containerId: incubatorId,
      locationType: locationTypes.incubator,
      x: x,
      y: y,
      rotation: rotation,
    });

    slotLayout.push({
      slotId: slotId,
      x: x,
      y: y,
      rotation: rotation,
    });
  }

  const incubator = {
    id: incubatorId,
    type: "incubator",
    name: itemInfo.name,
    image: itemInfo.image,
    capacity: capacity,
    slots: slots,
    slotLayout: slotLayout,
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
      eggs.push(createEgg(itemInfo.breed, initialLocation));
    }
  } else if (itemInfo.type === "chicken") {
    for (let i = 0; i < quantity; i++) {
      createChicken(itemInfo.breed, itemInfo.gender, itemInfo.age);
    }
  } else if (itemInfo.type === "tool") {
    if (itemInfo.id === "basic_incubator") {
      for (let i = 0; i < quantity; i++) {
        createIncubator(itemInfo);
      }
    } else {
      const existingTool = tools.find((tool) => tool.id === itemId);
      if (existingTool) {
        existingTool.quantity += quantity;
      } else {
        tools.push({
          id: itemId,
          quantity: quantity,
          location: initialLocation || {
            type: locationTypes.bag,
            containerId: null,
            slotId: null,
          },
        });
      }
    }
  }
  if (bagPanel.style.display === "flex") {
    renderBagContent(currentBagCategory);
  }
}

//选中背包物品时，高光场景内槽位
function updateSlotHighlights() {
  document.querySelectorAll(".item-slot").forEach((slot) => {
    slot.classList.remove("highlight");
  });

  if (!selectedBagItem) return;

  document.querySelectorAll(".item-slot").forEach((slot) => {
    const slotType = slot.getAttribute("data-slot-type");
    if (slotType === selectedBagItem.type) {
      slot.classList.add("highlight");
    }
  });
}

// 推进天数的影响（测试版）目前只考虑了·孵化器当中的·鸡蛋，和鸡的成长
function advanceDays(days) {
  gameTime.day += days;

  for (const incubator of incubators) {
    for (const slot of incubator.slots) {
      if (slot.itemId === null) continue;

      const egg = eggs.find((e) => e.id === slot.itemId);
      if (!egg) continue;

      egg.hatchProgress.elapsedDays += days;
      updateEggStage(egg);

      if (
        egg.hatchProgress.stage === "dry" &&
        egg.hatchProgress.elapsedDays >= egg.stageDays.dry
      ) {
        const chick = hatchEggToChick(egg);

        //临时把孵化槽位改成小鸡类型
        slot.slotType = "chick";
        slot.itemId = chick.id;

        continue;
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
    breed: egg.breed,
    name: breedInfo.itemNames.chick,
    image: breedInfo.stageImages.dry,
    gender: egg.gender,
    age: "chick",
    ageDays: 0,
    statuses: ["healthy"],
    location: egg.location,
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

  if (chicken.ageDays < growth.chickToYoungDays) {
    chicken.age = "chick";
    chicken.name = breedInfo.itemNames.chick;
    chicken.image = breedInfo.stageImages.chick;
  } else if (chicken.ageDays < growth.youngToAdultDays) {
    chicken.age = "young";
    chicken.name =
      chicken.gender === "female"
        ? breedInfo.itemNames.youngFemale
        : breedInfo.itemNames.youngMale;
    chicken.image =
      chicken.gender === "female"
        ? breedInfo.stageImages.youngFemale
        : breedInfo.stageImages.youngMale;
  } else {
    chicken.age = "adult";
    chicken.name =
      chicken.gender === "female"
        ? breedInfo.itemNames.adultFemale
        : breedInfo.itemNames.adultMale;
    chicken.image =
      chicken.gender === "female"
        ? breedInfo.stageImages.adultFemale
        : breedInfo.stageImages.adultMale;
  }

  if (chicken.age === "adult") {
    const chickIndex = chicks.findIndex((c) => c.id === chicken.id);
    if (chickIndex !== -1) {
      chicks.splice(chickIndex, 1);
      adultChickens.push(chicken);
    }
  }
}

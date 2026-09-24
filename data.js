//物品类型
const itemTypes = {
  egg: "egg",
  chick: "chick",
  adultFemale: "adultFemale",
  adultMale: "adultMale",
  incubator: "incubator",
  tool: "tool",
};

// 个体所处位置类型
const locationTypes = {
  bag: "bag",
  sceneSlot: "sceneSlot",
  incubator: "incubator",
  broodyHen: "broodyHen",
  lifeAreaEggPoint: "lifeAreaEggPoint",
  stationExitPoint: "stationExitPoint", // 新增：待离开位（只出不进的堆叠位）
};

//slot类型（目前只用它的图片）
const slotTypes = {
  eggSlot: {
    acceptType: "egg",
    placeholderImage: "images/tuji_egg.png",
  },
  chickSlot: {
    acceptType: "chick",
    placeholderImage: "images/tuji_chick.png",
  },
  broodStation: {
    acceptType: ["chick", "adultFemale"],
    placeholderImage: "images/tuji_chick.png",
  },
  hatchStation: {
    acceptType: ["incubator", "adultFemale"],
    placeholderImage: "images/empty_hatch_station.png",
  },
  // adultArea: {
  //   acceptType: ["adultFemale", "adultMale"],
  //   placeholderImage: "images/tuji_hen.png",
  // },
  lifeStation: {
    acceptType: ["adultMale", "adultFemale"],
    placeholderImage: "images/tuji_hen.png",
  },
  bag: {
    acceptType: [
      "egg",
      "chick",
      "adultFemale",
      "adultMale",
      "incubator",
      "tool",
    ],
    placeholderImage: "",
  },
};

// 状态角标图片映射：状态名 -> 角标图片路径
const statusBadges = {
  failed: "images/badge_failed.png", // 孵化失败
  sick: "images/badge_sick.png", // 生病
  hungry: "images/badge_hungry.png", // 饿了
  dirty: "images/badge_dirty.png", // 地面脏了（暂未实装，先占位）
  // 未来可能：cold 冷了 / hot 热了 / angry 生气了 / lackBugs 缺虫 / lackGrit 缺沙 / lackGrain 缺粮 / happy 心情好 / strong 身体强壮
};

const renderSizes = {
  egg: {
    hatch: 90, //孵化中的蛋
    lifeArea: 36, //刚下的蛋
    bag: 80, //背包里的蛋
    ghost: 90,
  },
  chick: {
    hatch: 90, //刚孵化的小鸡
    brood: 60, //跟着妈妈的小鸡
    bag: 80, //背包里面的小鸡
    ghost: 80,
  },
  adultFemale: {
    hatch: 120, // 抱窝母鸡，很大
    brood: 90, // 保育员（以及在育雏出栏的成年母鸡）
    lifeArea: 64, // 生活中的群体下蛋母鸡
    bag: 80, //背包里面的母鸡
    ghost: 100,
  },
  adultMale: {
    brood: 90, // 育雏出栏等待的成年公鸡（与保育员同大小）
    lifeArea: 84, // 生活大格子公鸡单辅位
    bag: 80, //背包公鸡
    ghost: 100,
  },
  incubator: {
    hatch: 120, //孵化中的孵化器
    bag: 80, //背包里的孵化器
    ghost: 120,
  },
  tool: {
    bag: 80,
    ghost: 80,
  },
};

//每种物品的虚影渲染尺寸
const ghostSizes = {
  egg: 90,
  chick: 80,
  adultFemale: 100,
  adultMale: 100,
  incubator: 120,
  tool: 80,
};

//蛋对象模板
const eggTemplate = {
  id: "",
  type: "egg",
  breed: "", // 品种 id，如 tuji
  name: "", // 如“土鸡蛋”
  image: "",
  gender: "", // female / male，出壳后决定
  fertilized: false, // 是否受精
  canHatch: false, // 是否具备成功孵化可能
  peckPosition: "", // bigEnd / smallEnd，啄壳位置
  hatchOffset: 0, // 孵化进度偏移，如 -1、-0.5、0、0.5、1
  appearanceSeed: 0, // 留给未来外观微差
  statuses: [],
  hatchProgress: {
    stage: "", // waiting / embryo / smallHole / halfCircle / halfOut / wetOut / dry / infertile / failed
    elapsedDays: 0,
  },
  stageDays: {
    embryo: 0,
    smallHole: 0,
    halfCircle: 0,
    halfOut: 0,
    wetOut: 0,
    dry: 0,
  },
  location: {
    type: "", // bag / incubator / sceneSlot 等
    slotId: null,
    pointId: null,
    role: "",
    x: 0,
    y: 0,
    z: 0,
  },
};

// 蛋会变成鸡。为了让鸡能延续蛋阶段就已经确定的信息，应该把下面这些接过去：
// id
// breed
// gender
// appearanceSeed
// hatchOffset 或对应的成长节奏偏移 growthOffset
// location
// statuses

//鸡对象模板
const chickenTemplate = {
  id: "",
  type: "", // chick / adultFemale / adultMale
  breed: "", // tuji 等品种 id
  name: "", // 品种标准名，如“土鸡（母鸡）”
  nickname: "", // 玩家以后可以起名字，先留空
  gender: "", // female / male
  stage: "", // chick / young / adult / dead
  ageDays: 0, // 出壳后的天数
  image: "",
  appearanceSeed: 0, // 用于外貌微小差异
  growthOffset: 0, // 成长节奏偏移，比如 0.5、-0.5
  lifespanSeed: 0, // 寿命随机种子
  stageDays: {
    chickToYoung: 0,
    youngToAdult: 0,
    adultToDead: 0,
  },
  statuses: [], // 例如 ["healthy"]、["dead"]
  location: {
    type: "", // bag / broodStation / adultArea / sceneSlot 等
    slotId: null,
    pointId: null,
    role: "",
    x: 0,
    y: 0,
    z: 0,
  },
};

//孵化器对象模板
const incubatorTemplate = {
  id: "",
  type: "incubator",
  name: "",
  image: "",
  capacity: 6,

  layout: {
    layoutId: "",
    singlePosition: { x: 0, y: 0, rotation: 0 },
    groupPoints: [{ pointId: 0, x: 0, y: 0, rotation: 0, occupiedBy: null }],
  },

  location: {
    type: "", // bag / sceneSlot
    slotId: null,
    pointId: null,
    role: "",
    x: 0,
    y: 0,
    z: 0,
  },
};

//普通工具对象模板
const toolTemplate = {
  id: "",
  type: "tool",
  name: "",
  image: "",
  quantity: 1,
  location: {
    type: "", // 通常只在 bag
    slotId: null,
    pointId: null,
    role: "",
    x: 0,
    y: 0,
    z: 0,
  },
};

//所有槽位统一使用大格子结构
const slotTemplate = {
  slotId: "",
  slotType: "", // hatchStation / broodStation / adultArea / bag
  singleAcceptTypes: [], // 这个格子接受哪些单一辅助个体
  singleItemId: null, // 单一辅助个体
  singleRequired: false, // 是否需要单一辅助个体
  groupAcceptTypes: [], // 这个格子接受哪些主体群体
  groupItemIds: [], // 主体群体实例 id
  groupCapacity: 0, // 主体容量
  positionPoints: {
    layoutId: "",
    singlePosition: { x: 0, y: 0, rotation: 0 },
    groupPoints: [{ pointId: 0, x: 0, y: 0, rotation: 0, occupiedBy: null }],
  },
  pointOccupied: {},
  locationType: "", // sceneSlot / bag
};

//孵蛋母鸡的蛋位布局
const broodyHenLayout = {
  layoutId: "broody_hen_circle",
  singlePosition: { x: 120, y: 170, z: 0, rotation: 0 },
  groupPoints: [
    { pointId: 0, x: 60, y: 60, z: 60, rotation: 0, occupiedBy: null },
    { pointId: 1, x: 120, y: 40, z: 40, rotation: 0, occupiedBy: null },
    { pointId: 2, x: 180, y: 60, z: 60, rotation: 0, occupiedBy: null },
    { pointId: 3, x: 210, y: 110, z: 110, rotation: 0, occupiedBy: null },
    { pointId: 4, x: 220, y: 170, z: 170, rotation: 0, occupiedBy: null },
    { pointId: 5, x: 210, y: 230, z: 230, rotation: 0, occupiedBy: null },
    { pointId: 6, x: 180, y: 280, z: 280, rotation: 0, occupiedBy: null },
    { pointId: 7, x: 120, y: 300, z: 300, rotation: 0, occupiedBy: null },
    { pointId: 8, x: 60, y: 280, z: 280, rotation: 0, occupiedBy: null },
    { pointId: 9, x: 30, y: 230, z: 230, rotation: 0, occupiedBy: null },
    { pointId: 10, x: 20, y: 170, z: 170, rotation: 0, occupiedBy: null },
    { pointId: 11, x: 30, y: 110, z: 110, rotation: 0, occupiedBy: null },
    { pointId: 12, x: 90, y: 90, z: 90, rotation: 0, occupiedBy: null },
    { pointId: 13, x: 150, y: 80, z: 80, rotation: 0, occupiedBy: null },
    { pointId: 14, x: 180, y: 130, z: 130, rotation: 0, occupiedBy: null },
    { pointId: 15, x: 170, y: 200, z: 200, rotation: 0, occupiedBy: null },
    { pointId: 16, x: 130, y: 250, z: 250, rotation: 0, occupiedBy: null },
    { pointId: 17, x: 80, y: 230, z: 230, rotation: 0, occupiedBy: null },
    { pointId: 18, x: 60, y: 170, z: 170, rotation: 0, occupiedBy: null },
    { pointId: 19, x: 90, y: 130, z: 130, rotation: 0, occupiedBy: null },
  ],
};

//育雏大格子、生活区大格子准备几套布局（例如）

const broodLayouts = [
  {
    layoutId: "brood_center",
    singlePosition: { x: 120, y: 120, z: 120, rotation: 0 },
    groupPoints: [
      { pointId: 0, x: 50, y: 40, z: 40, rotation: 0, occupiedBy: null },
      { pointId: 1, x: 90, y: 40, z: 40, rotation: 0, occupiedBy: null },
      { pointId: 2, x: 150, y: 40, z: 40, rotation: 0, occupiedBy: null },
      { pointId: 3, x: 190, y: 40, z: 40, rotation: 0, occupiedBy: null },
      { pointId: 4, x: 30, y: 90, z: 90, rotation: 0, occupiedBy: null },
      { pointId: 5, x: 70, y: 90, z: 90, rotation: 0, occupiedBy: null },
      { pointId: 6, x: 170, y: 90, z: 90, rotation: 0, occupiedBy: null },
      { pointId: 7, x: 210, y: 90, z: 90, rotation: 0, occupiedBy: null },
      { pointId: 8, x: 30, y: 150, z: 150, rotation: 0, occupiedBy: null },
      { pointId: 9, x: 70, y: 150, z: 150, rotation: 0, occupiedBy: null },
      { pointId: 10, x: 170, y: 150, z: 150, rotation: 0, occupiedBy: null },
      { pointId: 11, x: 210, y: 150, z: 150, rotation: 0, occupiedBy: null },
      { pointId: 12, x: 50, y: 210, z: 210, rotation: 0, occupiedBy: null },
      { pointId: 13, x: 90, y: 210, z: 210, rotation: 0, occupiedBy: null },
      { pointId: 14, x: 150, y: 210, z: 210, rotation: 0, occupiedBy: null },
      { pointId: 15, x: 190, y: 210, z: 210, rotation: 0, occupiedBy: null },
      { pointId: 16, x: 80, y: 250, z: 250, rotation: 0, occupiedBy: null },
      { pointId: 17, x: 120, y: 250, z: 250, rotation: 0, occupiedBy: null },
      { pointId: 18, x: 160, y: 250, z: 250, rotation: 0, occupiedBy: null },
      { pointId: 19, x: 120, y: 280, z: 280, rotation: 0, occupiedBy: null },
    ],
    stationExitPoint: { x: 300, y: 300, z: 300 },
  },

  {
    layoutId: "brood_spread",
    singlePosition: { x: 120, y: 140, z: 140, rotation: 0 },
    groupPoints: [
      { pointId: 0, x: 70, y: 55, z: 55, rotation: 0, occupiedBy: null },
      { pointId: 1, x: 165, y: 55, z: 55, rotation: 0, occupiedBy: null },
      { pointId: 2, x: 120, y: 30, z: 30, rotation: 0, occupiedBy: null },
      { pointId: 3, x: 35, y: 105, z: 105, rotation: 0, occupiedBy: null },
      { pointId: 4, x: 205, y: 105, z: 105, rotation: 0, occupiedBy: null },
      { pointId: 5, x: 120, y: 95, z: 95, rotation: 0, occupiedBy: null },
      { pointId: 6, x: 55, y: 175, z: 175, rotation: 0, occupiedBy: null },
      { pointId: 7, x: 185, y: 175, z: 175, rotation: 0, occupiedBy: null },
      { pointId: 8, x: 120, y: 190, z: 190, rotation: 0, occupiedBy: null },
      { pointId: 9, x: 85, y: 235, z: 235, rotation: 0, occupiedBy: null },
      { pointId: 10, x: 155, y: 235, z: 235, rotation: 0, occupiedBy: null },
      { pointId: 11, x: 120, y: 255, z: 255, rotation: 0, occupiedBy: null },
      { pointId: 12, x: 45, y: 140, z: 140, rotation: 0, occupiedBy: null },
      { pointId: 13, x: 195, y: 140, z: 140, rotation: 0, occupiedBy: null },
      { pointId: 14, x: 120, y: 145, z: 145, rotation: 0, occupiedBy: null },
      { pointId: 15, x: 70, y: 100, z: 100, rotation: 0, occupiedBy: null },
      { pointId: 16, x: 170, y: 100, z: 100, rotation: 0, occupiedBy: null },
      { pointId: 17, x: 70, y: 205, z: 205, rotation: 0, occupiedBy: null },
      { pointId: 18, x: 170, y: 205, z: 205, rotation: 0, occupiedBy: null },
      { pointId: 19, x: 120, y: 220, z: 220, rotation: 0, occupiedBy: null },
    ],
    stationExitPoint: { x: 300, y: 300, z: 300 },
  },
];

const lifeLayouts = [
  {
    layoutId: "life_left",
    singlePosition: { x: 200, y: 160, z: 160, rotation: 0 },
    groupPoints: [
      { pointId: 0, x: 60, y: 60, z: 60, rotation: 0, occupiedBy: null },
      { pointId: 1, x: 130, y: 60, z: 60, rotation: 0, occupiedBy: null },
      { pointId: 2, x: 95, y: 120, z: 120, rotation: 0, occupiedBy: null },
      { pointId: 3, x: 60, y: 180, z: 180, rotation: 0, occupiedBy: null },
      { pointId: 4, x: 130, y: 180, z: 180, rotation: 0, occupiedBy: null },
    ],
    eggSpot: { x: 24, y: 250, z: 250 },
    stationExitPoint: { x: 300, y: 300, z: 300 },
  },
  {
    layoutId: "life_right",
    singlePosition: { x: 90, y: 160, z: 160, rotation: 0 },
    groupPoints: [
      { pointId: 0, x: 160, y: 60, z: 60, rotation: 0, occupiedBy: null },
      { pointId: 1, x: 230, y: 60, z: 60, rotation: 0, occupiedBy: null },
      { pointId: 2, x: 195, y: 120, z: 120, rotation: 0, occupiedBy: null },
      { pointId: 3, x: 160, y: 180, z: 180, rotation: 0, occupiedBy: null },
      { pointId: 4, x: 230, y: 180, z: 180, rotation: 0, occupiedBy: null },
    ],
    eggSpot: { x: 24, y: 250, z: 250 },
    stationExitPoint: { x: 300, y: 300, z: 300 },
  },
];

// ========== 品种数据表 ==========

const breeds = {
  tuji: {
    name: "土鸡",
    unlockLevel: 0,
    fertilityRate: 0.8,
    hatchSuccessRate: 0.85,
    bigEndRate: 0.85,

    growth: {
      hatchDays: 21,
      chickToYoungDays: 30,
      youngToAdultDays: 105,
      hatchOffsetMax: 1,
      youngOffsetMax: 5,
      adultOffsetMax: 15,
      lifespanDays: 2555,
      lifespanOffsetMax: 730,
    },

    itemNames: {
      egg: "土鸡蛋",
      chick: "土鸡（小鸡）",
      youngFemale: "土鸡（青年母鸡）",
      youngMale: "土鸡（青年公鸡）",
      adultFemale: "土鸡（母鸡）",
      adultMale: "土鸡（公鸡）",
    },
    descriptions: {
      egg: "一颗普通的土鸡蛋",
      chick: "一只土鸡小鸡",
      youngFemale: "一只年轻土鸡（母鸡）",
      youngMale: "一只年轻土鸡（公鸡）",
      adultFemale: "一只成年土鸡母鸡",
      adultMale: "一只成年土鸡公鸡",
    },
    prices: {
      egg: 3,
      chick: 10,
      youngFemale: 60,
      youngMale: 50,
      adultFemale: 120,
      adultMale: 90,
    },
    stageImages: {
      waiting: "images/tuji_egg.png",
      embryo: "images/tuji_egg.png",
      smallHole: "images/tuji_egg_small_hole.png",
      halfCircle: "images/tuji_egg_half_circle.png",
      halfOut: "images/tuji_chick_half_out.png",
      wetOut: "images/tuji_chick_wet.png",
      dry: "images/tuji_chick_dry.png",
      chick: "images/tuji_chick.png",
      youngFemale: "images/tuji_young_female.png",
      youngMale: "images/tuji_young_male.png",
      adultFemale: "images/tuji_hen.png",
      adultMale: "images/tuji_rooster.png",
      deadChick: "images/tuji_chick_dead.png",
      deadYoungFemale: "images/tuji_young_female_dead.png",
      deadYoungMale: "images/tuji_young_male_dead.png",
      deadAdultFemale: "images/tuji_hen_dead.png",
      deadAdultMale: "images/tuji_rooster_dead.png",
    },
  },
};

// ========== 商店商品数据 ==========

const shopItems = {
  egg: [
    {
      id: "tuji_egg",
      breed: "tuji",
      type: "egg",
      name: breeds.tuji.itemNames.egg,
      price: breeds.tuji.prices.egg,
      description: breeds.tuji.descriptions.egg,
      image: breeds.tuji.stageImages.waiting,
    },
  ],

  chicken: [
    {
      id: "tuji_hen",
      breed: "tuji",
      type: "chicken",
      name: breeds.tuji.itemNames.adultFemale,
      price: breeds.tuji.prices.adultFemale,
      description: breeds.tuji.descriptions.adultFemale,
      gender: "female",
      age: "adult",
      image: breeds.tuji.stageImages.adultFemale,
    },
    {
      id: "tuji_rooster",
      breed: "tuji",
      type: "chicken",
      name: breeds.tuji.itemNames.adultMale,
      price: breeds.tuji.prices.adultMale,
      description: breeds.tuji.descriptions.adultMale,
      gender: "male",
      age: "adult",
      image: breeds.tuji.stageImages.adultMale,
    },
  ],

  tool: [
    {
      id: "basic_incubator",
      type: "incubator",
      name: "基础孵化器",
      price: 60,
      description: "最基础的家用孵化器，可以同时孵化多颗蛋",
      image: "images/basic_incubator.png",
      capacity: 6,
      layout: {
        layoutId: "incubator_basic",
        singlePosition: { x: 120, y: 170, z: 170, rotation: 0 },
        groupPoints: [
          { pointId: 0, x: 15, y: 95, z: 95, rotation: 0, occupiedBy: null },
          { pointId: 1, x: 120, y: 35, z: 35, rotation: 60, occupiedBy: null },
          { pointId: 2, x: 225, y: 95, z: 95, rotation: 120, occupiedBy: null },
          {
            pointId: 3,
            x: 225,
            y: 215,
            z: 215,
            rotation: 180,
            occupiedBy: null,
          },
          {
            pointId: 4,
            x: 120,
            y: 275,
            z: 275,
            rotation: 240,
            occupiedBy: null,
          },
          {
            pointId: 5,
            x: 15,
            y: 215,
            z: 215,
            rotation: 300,
            occupiedBy: null,
          },
        ],
      },
    },
  ],
};

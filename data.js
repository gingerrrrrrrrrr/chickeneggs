// 个体所处位置类型
const locationTypes = {
  bag: "bag",
  sceneSlot: "sceneSlot",
  incubator: "incubator",
  broodyHen: "broodyHen",
};

//slot类型
const slotTypes = {
  egg: {
    acceptType: "egg",
    placeholderImage: "images/tuji_egg.png",
  },
  chick: {
    acceptType: "chick",
    placeholderImage: "images/tuji_chick.png",
  },
  adultChicken: {
    acceptType: "adultChicken",
    placeholderImage: "images/tuji_hen.png",
  },
  tool: {
    acceptType: "tool",
    placeholderImage: "images/basic_incubator.png",
  },
  hatchStation: {
    acceptType: "incubatorOrBroodyHen",
    placeholderImage: "images/empty_hatch_station.png",
  },
};

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
      type: "tool",
      name: "基础孵化器",
      price: 60,
      description: "最基础的家用孵化器，可以同时孵化多颗蛋",
      image: "images/basic_incubator.png",
      capacity: 6,
      slotLayout: [
        { x: 15, y: 95, rotation: 0 },
        { x: 120, y: 35, rotation: 60 },
        { x: 225, y: 95, rotation: 120 },
        { x: 225, y: 215, rotation: 180 },
        { x: 120, y: 275, rotation: 240 },
        { x: 15, y: 215, rotation: 300 },
      ],
    },
  ],
};

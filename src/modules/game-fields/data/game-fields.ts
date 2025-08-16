import { FieldType } from "src/models/game-field.model";

export const gameFieldsData = [
  {
    type: FieldType.GO,
    position: 1,
    name: "Старт",
    basePrice: null,
    housePrice: null,
    buildsCount: null,
    rent: null
  },
  {
    type: FieldType.PROPERTY,
    position: 2,
    name: "Арбат",
    basePrice: 60,
    housePrice: 50,
    buildsCount: 0,
    rent: [2, 10, 30, 90, 160, 250]
  },
  {
    type: FieldType.COMMUNITY_CHEST,
    position: 3,
    name: "Общественная казна",
    basePrice: null,
    housePrice: null,
    buildsCount: null,
    rent: null
  },
  {
    type: FieldType.PROPERTY,
    position: 4,
    name: "Поварская",
    basePrice: 60,
    housePrice: 50,
    buildsCount: 0,
    rent: [4, 20, 60, 180, 320, 450]
  },
  {
    type: FieldType.TAX,
    position: 5,
    name: "Подоходный налог",
    basePrice: null,
    housePrice: null,
    buildsCount: 0,
    rent: [200]
  },
  {
    type: FieldType.RAILROAD,
    position: 6,
    name: "Ленинградский вокзал",
    basePrice: 200,
    housePrice: null,
    buildsCount: null,
    rent: [25, 50, 100, 200]
  },
  {
    type: FieldType.PROPERTY,
    position: 7,
    name: "Тверская",
    basePrice: 100,
    housePrice: 50,
    buildsCount: 0,
    rent: [6, 30, 90, 270, 400, 550]
  },
  {
    type: FieldType.CHANCE,
    position: 8,
    name: "Шанс",
    basePrice: null,
    housePrice: null,
    buildsCount: null,
    rent: null
  },
  {
    type: FieldType.PROPERTY,
    position: 9,
    name: "Кузнецкий мост",
    basePrice: 100,
    housePrice: 50,
    buildsCount: 0,
    rent: [6, 30, 90, 270, 400, 550]
  },
  {
    type: FieldType.PROPERTY,
    position: 10,
    name: "Пушкинская",
    basePrice: 120,
    housePrice: 50,
    buildsCount: 0,
    rent: [8, 40, 100, 300, 450, 600]
  },
  {
    type: FieldType.JUST_VISITING,
    position: 11,
    name: "Тюрьма",
    basePrice: null,
    housePrice: null,
    buildsCount: null,
    rent: null
  },
  {
    type: FieldType.PROPERTY,
    position: 12,
    name: "Китай-город",
    basePrice: 140,
    housePrice: 100,
    buildsCount: 0,
    rent: [10, 50, 150, 450, 625, 750]
  },
  {
    type: FieldType.UTILITY,
    position: 13,
    name: "Мосэнерго",
    basePrice: 150,
    housePrice: null,
    buildsCount: null,
    rent: [4, 10]
  },
  {
    type: FieldType.PROPERTY,
    position: 14,
    name: "Лубянка",
    basePrice: 140,
    housePrice: 100,
    buildsCount: 0,
    rent: [10, 50, 150, 450, 625, 750]
  },
  {
    type: FieldType.PROPERTY,
    position: 15,
    name: "Охотный ряд",
    basePrice: 160,
    housePrice: 100,
    buildsCount: 0,
    rent: [12, 60, 180, 500, 700, 900]
  },
  {
    type: FieldType.RAILROAD,
    position: 16,
    name: "Киевский вокзал",
    basePrice: 200,
    housePrice: null,
    buildsCount: null,
    rent: [25, 50, 100, 200]
  },
  {
    type: FieldType.PROPERTY,
    position: 17,
    name: "Новый Арбат",
    basePrice: 180,
    housePrice: 100,
    buildsCount: 0,
    rent: [14, 70, 200, 550, 750, 950]
  },
  {
    type: FieldType.COMMUNITY_CHEST,
    position: 18,
    name: "Общественная казна",
    basePrice: null,
    housePrice: null,
    buildsCount: null,
    rent: null
  },
  {
    type: FieldType.PROPERTY,
    position: 19,
    name: "Смоленская",
    basePrice: 180,
    housePrice: 100,
    buildsCount: 0,
    rent: [14, 70, 200, 550, 750, 950]
  },
  {
    type: FieldType.PROPERTY,
    position: 20,
    name: "Маяковская",
    basePrice: 200,
    housePrice: 100,
    buildsCount: 0,
    rent: [16, 80, 220, 600, 800, 1000]
  },
  {
    type: FieldType.FREE_PARKING,
    position: 21,
    name: "Бесплатная стоянка",
    basePrice: null,
    housePrice: null,
    buildsCount: null,
    rent: null
  },
  {
    type: FieldType.PROPERTY,
    position: 22,
    name: "Таганская",
    basePrice: 220,
    housePrice: 150,
    buildsCount: 0,
    rent: [18, 90, 250, 700, 875, 1050]
  },
  {
    type: FieldType.CHANCE,
    position: 23,
    name: "Шанс",
    basePrice: null,
    housePrice: null,
    buildsCount: null,
    rent: null
  },
  {
    type: FieldType.PROPERTY,
    position: 24,
    name: "Павелецкая",
    basePrice: 220,
    housePrice: 150,
    buildsCount: 0,
    rent: [18, 90, 250, 700, 875, 1050]
  },
  {
    type: FieldType.PROPERTY,
    position: 25,
    name: "Серпуховская",
    basePrice: 240,
    housePrice: 150,
    buildsCount: 0,
    rent: [20, 100, 300, 750, 925, 1100]
  },
  {
    type: FieldType.RAILROAD,
    position: 26,
    name: "Казанский вокзал",
    basePrice: 200,
    housePrice: null,
    buildsCount: null,
    rent: [25, 50, 100, 200]
  },
  {
    type: FieldType.PROPERTY,
    position: 27,
    name: "Добрынинская",
    basePrice: 260,
    housePrice: 150,
    buildsCount: 0,
    rent: [22, 110, 330, 800, 975, 1150]
  },
  {
    type: FieldType.PROPERTY,
    position: 28,
    name: "Октябрьская",
    basePrice: 260,
    housePrice: 150,
    buildsCount: 0,
    rent: [22, 110, 330, 800, 975, 1150]
  },
  {
    type: FieldType.UTILITY,
    position: 29,
    name: "Мосводоканал",
    basePrice: 150,
    housePrice: null,
    buildsCount: null,
    rent: [4, 10]
  },
  {
    type: FieldType.PROPERTY,
    position: 30,
    name: "Полянка",
    basePrice: 280,
    housePrice: 150,
    buildsCount: 0,
    rent: [24, 120, 360, 850, 1025, 1200]
  },
  {
    type: FieldType.GO_TO_JAIL,
    position: 31,
    name: "Отправляйтесь в тюрьму",
    basePrice: null,
    housePrice: null,
    buildsCount: null,
    rent: null
  },
  {
    type: FieldType.PROPERTY,
    position: 32,
    name: "Красная Пресня",
    basePrice: 300,
    housePrice: 200,
    buildsCount: 0,
    rent: [26, 130, 390, 900, 1100, 1275]
  },
  {
    type: FieldType.PROPERTY,
    position: 33,
    name: "Баррикадная",
    basePrice: 300,
    housePrice: 200,
    buildsCount: 0,
    rent: [26, 130, 390, 900, 1100, 1275]
  },
  {
    type: FieldType.COMMUNITY_CHEST,
    position: 34,
    name: "Общественная казна",
    basePrice: null,
    housePrice: null,
    buildsCount: null,
    rent: null
  },
  {
    type: FieldType.PROPERTY,
    position: 35,
    name: "Красные Ворота",
    basePrice: 320,
    housePrice: 200,
    buildsCount: 0,
    rent: [28, 150, 450, 1000, 1200, 1400]
  },
  {
    type: FieldType.RAILROAD,
    position: 36,
    name: "Ярославский вокзал",
    basePrice: 200,
    housePrice: null,
    buildsCount: null,
    rent: [25, 50, 100, 200]
  },
  {
    type: FieldType.CHANCE,
    position: 37,
    name: "Шанс",
    basePrice: null,
    housePrice: null,
    buildsCount: null,
    rent: null
  },
  {
    type: FieldType.PROPERTY,
    position: 38,
    name: "Комсомольская",
    basePrice: 350,
    housePrice: 200,
    buildsCount: 0,
    rent: [35, 175, 500, 1100, 1300, 1500]
  },
  {
    type: FieldType.TAX,
    position: 39,
    name: "Налог на роскошь",
    basePrice: null,
    housePrice: null,
    buildsCount: null,
    rent: [100]
  },
  {
    type: FieldType.PROPERTY,
    position: 40,
    name: "Москва-Сити",
    basePrice: 400,
    housePrice: 200,
    buildsCount: 0,
    rent: [50, 200, 600, 1400, 1700, 2000]
  }
];
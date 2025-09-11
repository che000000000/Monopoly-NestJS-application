import { GameFieldColor, GameFieldType } from "../model/game-field";

export const GAME_FIELDS_DATA = [
	{
		name: "Старт",
		type: GameFieldType.GO,
		position: 1,
	},
	{
		name: "Житная ул.",
		type: GameFieldType.PROPERTY,
		color: GameFieldColor.BROWN,
		position: 2,
		basePrice: 60,
		housePrice: 50,
		buildsCount: 0,
		rent: [2, 10, 30, 90, 160, 250]
	},
	{
		name: "Общественная казна",
		type: GameFieldType.COMMUNITY_CHEST,
		position: 3,
	},
	{
		name: "Нагаинская ул.",
		type: GameFieldType.PROPERTY,
		color: GameFieldColor.BROWN,
		position: 4,
		basePrice: 60,
		housePrice: 50,
		buildsCount: 0,
		rent: [4, 20, 60, 180, 320, 450]
	},
	{
		name: "Подоходный налог",
		type: GameFieldType.TAX,
		position: 5,
		buildsCount: 0,
		rent: [200]
	},
	{
		name: "Рижская железная дорога",
		type: GameFieldType.RAILROAD,
		position: 6,
		basePrice: 200,
		rent: [25, 50, 100, 200]
	},
	{
		name: "Варшавское шоссе",
		type: GameFieldType.PROPERTY,
		color: GameFieldColor.WHITE_MOON,
		position: 7,
		basePrice: 100,
		housePrice: 50,
		buildsCount: 0,
		rent: [6, 30, 90, 270, 400, 550]
	},
	{
		name: "Шанс",
		type: GameFieldType.CHANCE,
		position: 8,
	},
	{
		name: "Ул. Огеева",
		type: GameFieldType.PROPERTY,
		color: GameFieldColor.WHITE_MOON,
		position: 9,
		basePrice: 100,
		housePrice: 50,
		buildsCount: 0,
		rent: [6, 30, 90, 270, 400, 550]
	},
	{
		name: "Первая парковая ул.",
		type: GameFieldType.PROPERTY,
		color: GameFieldColor.WHITE_MOON,
		position: 10,
		basePrice: 120,
		housePrice: 50,
		buildsCount: 0,
		rent: [8, 40, 100, 300, 450, 600]
	},
	{
		name: "Просто посетили",
		type: GameFieldType.JUST_VISITING,
		position: 11,
	},
	{
		name: "Ул. Полянка",
		type: GameFieldType.PROPERTY,
		color: GameFieldColor.PURPLE,
		position: 12,
		basePrice: 140,
		housePrice: 100,
		buildsCount: 0,
		rent: [10, 50, 150, 450, 625, 750]
	},
	{
		name: "Мосэнерго",
		type: GameFieldType.UTILITY,
		position: 13,
		basePrice: 150,
		rent: [4, 10]
	},
	{
		name: "Ул. Сретенка",
		type: GameFieldType.PROPERTY,
		color: GameFieldColor.PURPLE,
		position: 14,
		basePrice: 140,
		housePrice: 100,
		buildsCount: 0,
		rent: [10, 50, 150, 450, 625, 750]
	},
	{
		name: "Ростовская набережная",
		type: GameFieldType.PROPERTY,
		color: GameFieldColor.PURPLE,
		position: 15,
		basePrice: 160,
		housePrice: 100,
		buildsCount: 0,
		rent: [12, 60, 180, 500, 700, 900]
	},
	{
		name: "Курская железная дорога",
		type: GameFieldType.RAILROAD,
		position: 16,
		basePrice: 200,
		rent: [25, 50, 100, 200]
	},
	{
		name: "Рязанский проспект",
		type: GameFieldType.PROPERTY,
		color: GameFieldColor.ORANGE,
		position: 17,
		basePrice: 180,
		housePrice: 100,
		buildsCount: 0,
		rent: [14, 70, 200, 550, 750, 950]
	},
	{
		name: "Общественная казна",
		type: GameFieldType.COMMUNITY_CHEST,
		position: 18,
	},
	{
		name: "Ул. Вавилова",
		type: GameFieldType.PROPERTY,
		color: GameFieldColor.ORANGE,
		position: 19,
		basePrice: 180,
		housePrice: 100,
		buildsCount: 0,
		rent: [14, 70, 200, 550, 750, 950]
	},
	{
		name: "Рублевское шоссе",
		type: GameFieldType.PROPERTY,
		color: GameFieldColor.ORANGE,
		position: 20,
		basePrice: 200,
		housePrice: 100,
		buildsCount: 0,
		rent: [16, 80, 220, 600, 800, 1000]
	},
	{
		name: "Бесплатная парковка",
		type: GameFieldType.FREE_PARKING,
		position: 21,
	},
	{
		name: "Ул. Тверская",
		type: GameFieldType.PROPERTY,
		color: GameFieldColor.RED,
		position: 22,
		basePrice: 220,
		housePrice: 150,
		buildsCount: 0,
		rent: [18, 90, 250, 700, 875, 1050]
	},
	{
		name: "Шанс",
		type: GameFieldType.CHANCE,
		position: 23,
	},
	{
		name: "Пушкинская ул.",
		type: GameFieldType.PROPERTY,
		color: GameFieldColor.RED,
		position: 24,
		basePrice: 220,
		housePrice: 150,
		buildsCount: 0,
		rent: [18, 90, 250, 700, 875, 1050]
	},
	{
		name: "Площадь Мояковского",
		type: GameFieldType.PROPERTY,
		color: GameFieldColor.RED,
		position: 25,
		basePrice: 240,
		housePrice: 150,
		buildsCount: 0,
		rent: [20, 100, 300, 750, 925, 1100]
	},
	{
		name: "Казанская железная дорога",
		type: GameFieldType.RAILROAD,
		position: 26,
		basePrice: 200,
		rent: [25, 50, 100, 200]
	},
	{
		name: "Ул. Грузинский вал",
		type: GameFieldType.PROPERTY,
		color: GameFieldColor.YELLOW,
		position: 27,
		basePrice: 260,
		housePrice: 150,
		buildsCount: 0,
		rent: [22, 110, 330, 800, 975, 1150]
	},
	{
		name: "Ул. Чайковского",
		type: GameFieldType.PROPERTY,
		color: GameFieldColor.YELLOW,
		position: 28,
		basePrice: 260,
		housePrice: 150,
		buildsCount: 0,
		rent: [22, 110, 330, 800, 975, 1150]
	},
	{
		name: "Мосисток",
		type: GameFieldType.UTILITY,
		position: 29,
		basePrice: 150,
		rent: [4, 10]
	},
	{
		name: "Смоленская площадь",
		type: GameFieldType.PROPERTY,
		color: GameFieldColor.YELLOW,
		position: 30,
		basePrice: 280,
		housePrice: 150,
		buildsCount: 0,
		rent: [24, 120, 360, 850, 1025, 1200]
	},
	{
		name: "Отправляйтесь в тюрьму",
		type: GameFieldType.GO_TO_JAIL,
		position: 31,
	},
	{
		name: "Ул. Щусева",
		type: GameFieldType.PROPERTY,
		color: GameFieldColor.GREEN,
		position: 32,
		basePrice: 300,
		housePrice: 200,
		buildsCount: 0,
		rent: [26, 130, 390, 900, 1100, 1275]
	},
	{
		name: "Гоголевский бульвар",
		type: GameFieldType.PROPERTY,
		color: GameFieldColor.GREEN,
		position: 33,
		basePrice: 300,
		housePrice: 200,
		buildsCount: 0,
		rent: [26, 130, 390, 900, 1100, 1275]
	},
	{
		name: "Общественная казна",
		type: GameFieldType.COMMUNITY_CHEST,
		position: 34,
	},
	{
		name: "Кутузовский проспект",
		type: GameFieldType.PROPERTY,
		color: GameFieldColor.GREEN,
		position: 35,
		basePrice: 320,
		housePrice: 200,
		buildsCount: 0,
		rent: [28, 150, 450, 1000, 1200, 1400]
	},
	{
		name: "Ярославский вокзал",
		type: GameFieldType.RAILROAD,
		position: 36,
		basePrice: 200,
		rent: [25, 50, 100, 200]
	},
	{
		name: "Шанс",
		type: GameFieldType.CHANCE,
		position: 37,
	},
	{
		name: "Ул. Малая бронная",
		type: GameFieldType.PROPERTY,
		color: GameFieldColor.BLUE,
		position: 38,
		basePrice: 350,
		housePrice: 200,
		buildsCount: 0,
		rent: [35, 175, 500, 1100, 1300, 1500]
	},
	{
		name: "Сверхналог",
		type: GameFieldType.TAX,
		position: 39,
		rent: [100]
	},
	{
		name: "Ул. Арбат",
		type: GameFieldType.PROPERTY,
		color: GameFieldColor.BLUE,
		position: 40,
		basePrice: 400,
		housePrice: 200,
		buildsCount: 0,
		rent: [50, 200, 600, 1400, 1700, 2000]
	}
]
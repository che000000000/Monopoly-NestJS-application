import { ActionCardDeckType, ActionCardMoveDirection, ActionCardPropertyType, ActionCardType } from "../model/action-card";

interface ActionCardSeedData {
    description: string,
    deckType: ActionCardDeckType,
    type: ActionCardType,
    amount?: number,
    moveDirection?: ActionCardMoveDirection,
    moveSteps?: number,
    targetPosition?: number,
    propertyType?: ActionCardPropertyType,
    houseCost?: number,
    hotelCost?: number,
    rentFactor?: number,
    paymentForCircle?: boolean,
    isActive?: boolean,
    playerId?: string
}

export const ACTION_CARDS: ActionCardSeedData[] = [
    {
        description: 'Отправляйтесь на Ул. Арбат',
        deckType: ActionCardDeckType.CHANCE,
        type: ActionCardType.MOVE,
        moveDirection: ActionCardMoveDirection.TARGET,
        targetPosition: 40,
        paymentForCircle: true
    },
    {
        description: 'Отправляйтесь на Площадь Маяковского. Если вы проходите поле Вперед, получите M200',
        deckType: ActionCardDeckType.CHANCE,
        type: ActionCardType.MOVE,
        moveDirection: ActionCardMoveDirection.TARGET,
        targetPosition: 25,
        paymentForCircle: true
    },
    {
        description: 'Вас избрали председателем совета директоров. Заплатите каждому игроку по M50',
        deckType: ActionCardDeckType.CHANCE,
        type: ActionCardType.PAY_PLAYERS,
        amount: 50
    },
    {
        description: 'Отправляйтесь поездом до Ж/Д станции Рижская железная дорога. Если вы проходите поле Вперед, получите М200',
        deckType: ActionCardDeckType.CHANCE,
        type: ActionCardType.MOVE,
        moveDirection: ActionCardMoveDirection.TARGET,
        targetPosition: 6,
        paymentForCircle: true
    },
    {
        description: 'Отправляйтесь прямо в тюрьму, не проходите поле Вперёд и не получайте М200',
        deckType: ActionCardDeckType.CHANCE,
        type: ActionCardType.MOVE,
        moveDirection: ActionCardMoveDirection.TARGET,
        targetPosition: 11,
        paymentForCircle: false
    },
    {
        description: 'Идите на поле "Вперед". (Получите М200)',
        deckType: ActionCardDeckType.CHANCE,
        type: ActionCardType.MOVE,
        moveDirection: ActionCardMoveDirection.TARGET,
        targetPosition: 1,
        paymentForCircle: true
    },
    {
        description: 'Идите на ближайшее поле коммунального предприятия. Если оно не находится в собственности, можете выкупить его.',
        deckType: ActionCardDeckType.CHANCE,
        type: ActionCardType.MOVE,
        moveDirection: ActionCardMoveDirection.NEAREST,
        propertyType: ActionCardPropertyType.UTILITY,
        paymentForCircle: true,
    },
    {
        description: 'Штраф за превышение скорости M15',
        deckType: ActionCardDeckType.CHANCE,
        type: ActionCardType.PAY_MONEY,
        amount: 15
    },
    {
        description: 'Идите на ближайшую Ж/Д станцию. Если она не находится в собственности, можете выкупить её. Если она находится в собственности, заплатите владельцу арендную плату, вдвое превышающую обычную',
        deckType: ActionCardDeckType.CHANCE,
        type: ActionCardType.MOVE,
        moveDirection: ActionCardMoveDirection.NEAREST,
        propertyType: ActionCardPropertyType.RAILROAD,
        paymentForCircle: true,
        rentFactor: 2
    },
    {
        description: 'Бесплатное освобождение из тюрьмы. Карточка сохраняется до того момента, пока не будет использована',
        deckType: ActionCardDeckType.CHANCE,
        type: ActionCardType.GET_OUT_OF_JAIL
    },
    {
        description: 'Идите на ближайшую Ж/Д станцию. Если она находится в собственности, заплатите владельцу арендную плату, вдвое превышающую обычную',
        deckType: ActionCardDeckType.CHANCE,
        type: ActionCardType.MOVE,
        moveDirection: ActionCardMoveDirection.NEAREST,
        propertyType: ActionCardPropertyType.RAILROAD,
        paymentForCircle: true,
        rentFactor: 2
    },
    {
        description: 'Наступил срок исполнения платежа по вашей ссуде на строительство. Получите М150',
        deckType: ActionCardDeckType.CHANCE,
        type: ActionCardType.GET_MONEY,
        amount: 150
    },
    {
        description: 'Банк платит вам дивиденты в размере М50',
        deckType: ActionCardDeckType.CHANCE,
        type: ActionCardType.GET_MONEY,
        amount: 50
    },
    {
        description: 'Отправляйтесь на Ул. Полянка. Если вы проходите поле Вперед, получите М200',
        deckType: ActionCardDeckType.CHANCE,
        type: ActionCardType.MOVE,
        moveDirection: ActionCardMoveDirection.TARGET,
        targetPosition: 12,
        paymentForCircle: true
    },
    {
        description: 'Вернитесь на три поля назад',
        deckType: ActionCardDeckType.CHANCE,
        type: ActionCardType.MOVE,
        moveDirection: ActionCardMoveDirection.GET_BACK,
        moveSteps: 3,
    },
    {
        description: 'Подошло время капитального ремонта всей вашей собственности: заплатите за каждый дом М25, заплатите за каждый отель по М100',
        deckType: ActionCardDeckType.CHANCE,
        type: ActionCardType.PROPERTY_REPAIR,
        houseCost: 25,
        hotelCost: 100
    },
    {
        description: 'Наступил срок исполнения платежа по отпускному фонду. Получите М100',
        deckType: ActionCardDeckType.COMMUNITY_CHEST,
        type: ActionCardType.GET_MONEY,
        amount: 100
    },
    {
        description: 'От вас требуется провести ремонтные работы: М40 за каждый дом, М115 за каждый отель',
        deckType: ActionCardDeckType.COMMUNITY_CHEST,
        type: ActionCardType.PROPERTY_REPAIR,
        houseCost: 40,
        hotelCost: 115
    },
    {
        description: 'Банковская ошибка в вашу пользу. Получите М200',
        deckType: ActionCardDeckType.COMMUNITY_CHEST,
        type: ActionCardType.GET_MONEY,
        amount: 200
    },
    {
        description: 'Наступил срок исполнения платежа по страхованию жизни. Получите М100',
        deckType: ActionCardDeckType.COMMUNITY_CHEST,
        type: ActionCardType.GET_MONEY,
        amount: 100
    },
    {
        description: 'Отправляйтесь прямо в тюрьму, не проходите поле Вперед и не получайте М200',
        deckType: ActionCardDeckType.COMMUNITY_CHEST,
        type: ActionCardType.MOVE,
        moveDirection: ActionCardMoveDirection.TARGET,
        targetPosition: 11,
        paymentForCircle: false
    },
    {
        description: 'Получите М25 за консалтинговые услуги',
        deckType: ActionCardDeckType.COMMUNITY_CHEST,
        type: ActionCardType.GET_MONEY,
        amount: 25
    },
    {
        description: 'Возмещение подоходного налога. Получите М20',
        deckType: ActionCardDeckType.COMMUNITY_CHEST,
        type: ActionCardType.GET_MONEY,
        amount: 20
    },
    {
        description: 'Бесплатное освобождение из тюрьмы. Карточка сохраняется до того момента, пока не будет использована',
        deckType: ActionCardDeckType.COMMUNITY_CHEST,
        type: ActionCardType.GET_OUT_OF_JAIL
    },
    {
        description: 'Вы заняли второе место на конкурсе красоты. Получите М10',
        deckType: ActionCardDeckType.COMMUNITY_CHEST,
        type: ActionCardType.GET_MONEY,
        amount: 10
    },
    {
        description: 'Оплатите расходы на госпитализацию в размере М100',
        deckType: ActionCardDeckType.COMMUNITY_CHEST,
        type: ActionCardType.PAY_MONEY,
        amount: 100
    },
    {
        description: 'Оплатите обучение в размере М50',
        deckType: ActionCardDeckType.COMMUNITY_CHEST,
        type: ActionCardType.PAY_MONEY,
        amount: 50
    },
    {
        description: 'Вы получаете в наследство М100',
        deckType: ActionCardDeckType.COMMUNITY_CHEST,
        type: ActionCardType.GET_MONEY,
        amount: 100
    },
    {
        description: 'Идите на поле Вперед. (Получите М200)',
        deckType: ActionCardDeckType.COMMUNITY_CHEST,
        type: ActionCardType.MOVE,
        moveDirection: ActionCardMoveDirection.TARGET,
        targetPosition: 1,
        paymentForCircle: true
    },
    {
        description: 'Визит к врачу. Заплатите М50',
        deckType: ActionCardDeckType.COMMUNITY_CHEST,
        type: ActionCardType.PAY_MONEY,
        amount: 50
    },
    {
        description: 'На продаже акций вы зарабатываете М50',
        deckType: ActionCardDeckType.COMMUNITY_CHEST,
        type: ActionCardType.GET_MONEY,
        amount: 50
    },
    {
        description: 'Сегодня ваш день рождения. Получите по М10 от каждого игрока',
        deckType: ActionCardDeckType.COMMUNITY_CHEST,
        type: ActionCardType.GET_PAYMENT_FROM_PLAYERS,
        amount: 10
    }
]
import { Spread } from './types';

export const spreads: Spread[] = [
  {
    id: 'single',
    name: 'Single Card',
    nameCn: '单张牌',
    description: '快速占卜，获取当下的指引或每日一牌',
    positions: [
      {
        id: 'single-1',
        name: 'The Card',
        nameCn: '指引',
        description: '代表当前情况的核心信息或建议'
      }
    ]
  },
  {
    id: 'three-card',
    name: 'Three Card Spread',
    nameCn: '三张牌阵',
    description: '经典的过去-现在-未来牌阵，了解事情的发展脉络',
    positions: [
      {
        id: 'three-1',
        name: 'Past',
        nameCn: '过去',
        description: '影响当前情况的过去因素'
      },
      {
        id: 'three-2',
        name: 'Present',
        nameCn: '现在',
        description: '当前的状态和挑战'
      },
      {
        id: 'three-3',
        name: 'Future',
        nameCn: '未来',
        description: '如果继续当前道路可能的结果'
      }
    ]
  },
  {
    id: 'celtic-cross',
    name: 'Celtic Cross',
    nameCn: '凯尔特十字',
    description: '深度分析牌阵，全面了解问题的各个方面',
    positions: [
      {
        id: 'celtic-1',
        name: 'Present',
        nameCn: '现状',
        description: '当前的核心情况'
      },
      {
        id: 'celtic-2',
        name: 'Challenge',
        nameCn: '挑战',
        description: '面临的主要障碍或挑战'
      },
      {
        id: 'celtic-3',
        name: 'Past',
        nameCn: '过去',
        description: '导致当前情况的过去事件'
      },
      {
        id: 'celtic-4',
        name: 'Future',
        nameCn: '近期未来',
        description: '即将发生的事情'
      },
      {
        id: 'celtic-5',
        name: 'Above',
        nameCn: '目标',
        description: '你的目标或最好的可能结果'
      },
      {
        id: 'celtic-6',
        name: 'Below',
        nameCn: '潜意识',
        description: '潜意识的影响因素'
      },
      {
        id: 'celtic-7',
        name: 'Advice',
        nameCn: '建议',
        description: '你应该采取的态度或行动'
      },
      {
        id: 'celtic-8',
        name: 'External',
        nameCn: '外部影响',
        description: '周围环境和他人的影响'
      },
      {
        id: 'celtic-9',
        name: 'Hopes/Fears',
        nameCn: '希望与恐惧',
        description: '你内心的希望或恐惧'
      },
      {
        id: 'celtic-10',
        name: 'Outcome',
        nameCn: '最终结果',
        description: '事情最可能的结果'
      }
    ]
  }
];

export function getSpreadById(id: string): Spread | undefined {
  return spreads.find(spread => spread.id === id);
}

export function getDefaultSpread(): Spread {
  return spreads[1]; // 三张牌阵作为默认
}

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
    id: 'two-options',
    name: 'Two Options Spread',
    nameCn: '二择一牌阵',
    description: '面对两个选择时，分析各自的利弊与最终走向',
    positions: [
      {
        id: 'two-options-1',
        name: 'Current Situation',
        nameCn: '当前处境',
        description: '你目前面对这个抉择的核心状态'
      },
      {
        id: 'two-options-2',
        name: 'Option A Process',
        nameCn: '选择A的发展',
        description: '选择A将经历的过程与挑战'
      },
      {
        id: 'two-options-3',
        name: 'Option A Outcome',
        nameCn: '选择A的结果',
        description: '选择A最终可能带来的结果'
      },
      {
        id: 'two-options-4',
        name: 'Option B Process',
        nameCn: '选择B的发展',
        description: '选择B将经历的过程与挑战'
      },
      {
        id: 'two-options-5',
        name: 'Option B Outcome',
        nameCn: '选择B的结果',
        description: '选择B最终可能带来的结果'
      }
    ]
  },
  {
    id: 'relationship',
    name: 'Relationship Spread',
    nameCn: '关系牌阵',
    description: '深入分析两人之间的感情或人际关系状况',
    positions: [
      {
        id: 'relationship-1',
        name: 'Your Feelings',
        nameCn: '你的感受',
        description: '你在这段关系中的内心状态与态度'
      },
      {
        id: 'relationship-2',
        name: "Other's Feelings",
        nameCn: '对方的感受',
        description: '对方在这段关系中的内心状态与态度'
      },
      {
        id: 'relationship-3',
        name: 'Connection',
        nameCn: '关系现状',
        description: '两人之间当前的互动模式与关系质量'
      },
      {
        id: 'relationship-4',
        name: 'Challenge',
        nameCn: '关系挑战',
        description: '这段关系中需要面对和克服的障碍'
      },
      {
        id: 'relationship-5',
        name: 'Potential',
        nameCn: '关系走向',
        description: '这段关系未来的发展趋势与可能性'
      }
    ]
  },
  {
    id: 'timeline',
    name: 'Timeline Spread',
    nameCn: '时间之流',
    description: '深入追溯事件的根源，看清发展脉络与行动方向',
    positions: [
      {
        id: 'timeline-1',
        name: 'Root Cause',
        nameCn: '根源',
        description: '事情发生的深层原因与根本起因'
      },
      {
        id: 'timeline-2',
        name: 'Past Influence',
        nameCn: '过去影响',
        description: '过去的经历如何影响了当前局势'
      },
      {
        id: 'timeline-3',
        name: 'Present',
        nameCn: '当下',
        description: '当前的核心状态与关键因素'
      },
      {
        id: 'timeline-4',
        name: 'Near Future',
        nameCn: '近期趋势',
        description: '短期内事态的发展方向'
      },
      {
        id: 'timeline-5',
        name: 'Advice',
        nameCn: '行动建议',
        description: '你应该采取的行动或需要关注的要点'
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

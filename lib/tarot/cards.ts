import { TarotCard, Suit } from './types';

// 大阿卡纳 (Major Arcana) - 22张
const majorArcana: TarotCard[] = [
  {
    id: 'major-00',
    name: 'The Fool',
    nameCn: '愚者',
    type: 'major',
    number: 0,
    image: '/cards/major/00-fool.jpg',
    keywords: {
      upright: ['新开始', '冒险', '纯真', '自由', '潜能'],
      reversed: ['鲁莽', '冒失', '愚蠢', '停滞', '恐惧']
    },
    meaning: {
      upright: '代表新的开始、冒险精神和无限可能。暗示你正处于人生旅程的起点，充满希望和潜力。',
      reversed: '警示鲁莽行事或过于天真。可能暗示恐惧阻碍了你前进的脚步。'
    }
  },
  {
    id: 'major-01',
    name: 'The Magician',
    nameCn: '魔术师',
    type: 'major',
    number: 1,
    image: '/cards/major/01-magician.jpg',
    keywords: {
      upright: ['创造力', '意志力', '技能', '专注', '行动'],
      reversed: ['欺骗', '操纵', '才能浪费', '缺乏方向']
    },
    meaning: {
      upright: '象征你拥有实现目标所需的一切资源和能力。是时候将想法付诸行动了。',
      reversed: '可能暗示才能被浪费或被人欺骗。需要审视自己的动机和方向。'
    }
  },
  {
    id: 'major-02',
    name: 'The High Priestess',
    nameCn: '女祭司',
    type: 'major',
    number: 2,
    image: '/cards/major/02-high-priestess.jpg',
    keywords: {
      upright: ['直觉', '神秘', '内在智慧', '潜意识', '灵性'],
      reversed: ['秘密', '隐藏', '忽视直觉', '表面']
    },
    meaning: {
      upright: '提醒你倾听内心的声音，相信直觉。答案可能隐藏在潜意识深处。',
      reversed: '可能忽视了重要的直觉信号，或有秘密尚未揭露。'
    }
  },
  {
    id: 'major-03',
    name: 'The Empress',
    nameCn: '女皇',
    type: 'major',
    number: 3,
    image: '/cards/major/03-empress.jpg',
    keywords: {
      upright: ['丰饶', '母性', '自然', '创造', '美丽'],
      reversed: ['依赖', '空虚', '创造力受阻', '忽视自我']
    },
    meaning: {
      upright: '代表丰盛、创造力和滋养。可能暗示怀孕、新项目诞生或物质丰裕。',
      reversed: '可能感到创造力枯竭或过度依赖他人。需要重新连接自然和内在力量。'
    }
  },
  {
    id: 'major-04',
    name: 'The Emperor',
    nameCn: '皇帝',
    type: 'major',
    number: 4,
    image: '/cards/major/04-emperor.jpg',
    keywords: {
      upright: ['权威', '结构', '控制', '父性', '稳定'],
      reversed: ['专制', '僵化', '缺乏纪律', '滥用权力']
    },
    meaning: {
      upright: '象征权威、秩序和稳定。暗示需要建立结构或寻求有经验者的指导。',
      reversed: '可能暗示过度控制或缺乏纪律。需要在权威和灵活性之间找到平衡。'
    }
  },
  {
    id: 'major-05',
    name: 'The Hierophant',
    nameCn: '教皇',
    type: 'major',
    number: 5,
    image: '/cards/major/05-hierophant.jpg',
    keywords: {
      upright: ['传统', '信仰', '教育', '指导', '仪式'],
      reversed: ['叛逆', '非传统', '挑战权威', '个人信念']
    },
    meaning: {
      upright: '代表传统智慧、精神指导和正规教育。可能暗示寻求导师或遵循传统。',
      reversed: '可能在挑战传统或寻找自己的精神道路。鼓励独立思考。'
    }
  },
  {
    id: 'major-06',
    name: 'The Lovers',
    nameCn: '恋人',
    type: 'major',
    number: 6,
    image: '/cards/major/06-lovers.jpg',
    keywords: {
      upright: ['爱情', '和谐', '选择', '价值观', '结合'],
      reversed: ['失衡', '价值冲突', '不和谐', '错误选择']
    },
    meaning: {
      upright: '象征爱情、和谐关系和重要选择。可能面临需要遵从内心的决定。',
      reversed: '可能暗示关系不和谐或价值观冲突。需要重新审视自己的选择。'
    }
  },
  {
    id: 'major-07',
    name: 'The Chariot',
    nameCn: '战车',
    type: 'major',
    number: 7,
    image: '/cards/major/07-chariot.jpg',
    keywords: {
      upright: ['胜利', '意志力', '决心', '控制', '前进'],
      reversed: ['失控', '缺乏方向', '侵略性', '障碍']
    },
    meaning: {
      upright: '代表通过意志力和决心获得胜利。暗示你有能力克服障碍，向目标前进。',
      reversed: '可能感到失去控制或方向不明。需要重新聚焦并掌控局面。'
    }
  },
  {
    id: 'major-08',
    name: 'Strength',
    nameCn: '力量',
    type: 'major',
    number: 8,
    image: '/cards/major/08-strength.jpg',
    keywords: {
      upright: ['勇气', '耐心', '内在力量', '温柔', '自信'],
      reversed: ['自我怀疑', '软弱', '缺乏自信', '粗暴']
    },
    meaning: {
      upright: '象征内在力量、勇气和温柔的坚持。提醒你真正的力量来自内心。',
      reversed: '可能正在经历自我怀疑或感到软弱。需要重新连接内在力量。'
    }
  },
  {
    id: 'major-09',
    name: 'The Hermit',
    nameCn: '隐士',
    type: 'major',
    number: 9,
    image: '/cards/major/09-hermit.jpg',
    keywords: {
      upright: ['内省', '独处', '智慧', '寻求真理', '指引'],
      reversed: ['孤立', '孤独', '退缩', '拒绝帮助']
    },
    meaning: {
      upright: '代表内省、独处和寻求内在智慧的时期。是时候暂时退出喧嚣，寻找答案。',
      reversed: '可能过度孤立或拒绝他人的帮助。需要在独处和社交之间找到平衡。'
    }
  },
  {
    id: 'major-10',
    name: 'Wheel of Fortune',
    nameCn: '命运之轮',
    type: 'major',
    number: 10,
    image: '/cards/major/10-wheel-of-fortune.jpg',
    keywords: {
      upright: ['命运', '转变', '周期', '好运', '机遇'],
      reversed: ['厄运', '抗拒改变', '失控', '逆境']
    },
    meaning: {
      upright: '象征命运的转变和生命的周期性。好运即将到来，把握机遇。',
      reversed: '可能正经历逆境或抗拒必要的改变。记住这只是暂时的周期。'
    }
  },
  {
    id: 'major-11',
    name: 'Justice',
    nameCn: '正义',
    type: 'major',
    number: 11,
    image: '/cards/major/11-justice.jpg',
    keywords: {
      upright: ['公正', '真相', '因果', '法律', '平衡'],
      reversed: ['不公', '逃避责任', '偏见', '欺骗']
    },
    meaning: {
      upright: '代表公正、真相和因果报应。提醒你为自己的行为负责，追求公平。',
      reversed: '可能暗示不公正的情况或逃避责任。需要诚实面对真相。'
    }
  },
  {
    id: 'major-12',
    name: 'The Hanged Man',
    nameCn: '倒吊人',
    type: 'major',
    number: 12,
    image: '/cards/major/12-hanged-man.jpg',
    keywords: {
      upright: ['牺牲', '放手', '新视角', '等待', '顺从'],
      reversed: ['拖延', '抗拒', '无谓牺牲', '停滞']
    },
    meaning: {
      upright: '象征暂停、牺牲和从新角度看问题。有时放手才能获得更多。',
      reversed: '可能在无谓地拖延或做出不必要的牺牲。需要重新评估处境。'
    }
  },
  {
    id: 'major-13',
    name: 'Death',
    nameCn: '死神',
    type: 'major',
    number: 13,
    image: '/cards/major/13-death.jpg',
    keywords: {
      upright: ['结束', '转变', '过渡', '放下', '重生'],
      reversed: ['抗拒改变', '停滞', '恐惧', '无法放手']
    },
    meaning: {
      upright: '代表结束和新开始，是转变而非字面死亡。旧的必须结束，新的才能开始。',
      reversed: '可能在抗拒必要的改变或无法放下过去。需要接受转变。'
    }
  },
  {
    id: 'major-14',
    name: 'Temperance',
    nameCn: '节制',
    type: 'major',
    number: 14,
    image: '/cards/major/14-temperance.jpg',
    keywords: {
      upright: ['平衡', '耐心', '调和', '适度', '目标'],
      reversed: ['失衡', '过度', '缺乏耐心', '冲突']
    },
    meaning: {
      upright: '象征平衡、耐心和调和。提醒你在生活各方面保持适度和和谐。',
      reversed: '可能生活失衡或缺乏耐心。需要重新找到中庸之道。'
    }
  },
  {
    id: 'major-15',
    name: 'The Devil',
    nameCn: '恶魔',
    type: 'major',
    number: 15,
    image: '/cards/major/15-devil.jpg',
    keywords: {
      upright: ['束缚', '欲望', '物质主义', '阴暗面', '依赖'],
      reversed: ['解脱', '释放', '面对阴暗', '打破束缚']
    },
    meaning: {
      upright: '代表束缚、欲望和阴暗面。可能被物质或不健康的关系所困。',
      reversed: '暗示正在打破束缚或面对内心阴暗面。解脱即将到来。'
    }
  },
  {
    id: 'major-16',
    name: 'The Tower',
    nameCn: '高塔',
    type: 'major',
    number: 16,
    image: '/cards/major/16-tower.jpg',
    keywords: {
      upright: ['剧变', '崩塌', '启示', '觉醒', '解放'],
      reversed: ['逃避灾难', '恐惧改变', '延迟崩塌']
    },
    meaning: {
      upright: '象征突然的剧变和旧结构的崩塌。虽然痛苦，但为重建铺平道路。',
      reversed: '可能在逃避必要的改变或灾难只是被延迟。需要面对现实。'
    }
  },
  {
    id: 'major-17',
    name: 'The Star',
    nameCn: '星星',
    type: 'major',
    number: 17,
    image: '/cards/major/17-star.jpg',
    keywords: {
      upright: ['希望', '灵感', '宁静', '更新', '信心'],
      reversed: ['绝望', '失去信心', '断开连接', '悲观']
    },
    meaning: {
      upright: '代表希望、灵感和内心的宁静。经历风暴后，平静和治愈即将到来。',
      reversed: '可能感到绝望或失去信心。需要重新连接希望和灵感。'
    }
  },
  {
    id: 'major-18',
    name: 'The Moon',
    nameCn: '月亮',
    type: 'major',
    number: 18,
    image: '/cards/major/18-moon.jpg',
    keywords: {
      upright: ['幻觉', '恐惧', '潜意识', '直觉', '不确定'],
      reversed: ['释放恐惧', '真相揭露', '困惑消除']
    },
    meaning: {
      upright: '象征幻觉、恐惧和潜意识。事情可能不如表面所见，需要信任直觉。',
      reversed: '恐惧正在消散，真相即将揭露。困惑的时期即将结束。'
    }
  },
  {
    id: 'major-19',
    name: 'The Sun',
    nameCn: '太阳',
    type: 'major',
    number: 19,
    image: '/cards/major/19-sun.jpg',
    keywords: {
      upright: ['快乐', '成功', '活力', '乐观', '真相'],
      reversed: ['暂时挫折', '过度乐观', '延迟成功']
    },
    meaning: {
      upright: '代表快乐、成功和积极能量。是最吉祥的牌之一，预示美好时光。',
      reversed: '成功可能暂时延迟，但仍会到来。保持乐观但要现实。'
    }
  },
  {
    id: 'major-20',
    name: 'Judgement',
    nameCn: '审判',
    type: 'major',
    number: 20,
    image: '/cards/major/20-judgement.jpg',
    keywords: {
      upright: ['觉醒', '重生', '召唤', '反思', '赦免'],
      reversed: ['自我怀疑', '拒绝召唤', '无法原谅']
    },
    meaning: {
      upright: '象征觉醒、重生和响应更高召唤。是时候反思过去，迎接新生。',
      reversed: '可能在忽视内心的召唤或无法原谅自己/他人。需要放下过去。'
    }
  },
  {
    id: 'major-21',
    name: 'The World',
    nameCn: '世界',
    type: 'major',
    number: 21,
    image: '/cards/major/21-world.jpg',
    keywords: {
      upright: ['完成', '整合', '成就', '旅程终点', '圆满'],
      reversed: ['未完成', '缺乏结束', '延迟', '空虚']
    },
    meaning: {
      upright: '代表完成、成就和一个周期的圆满结束。你已经完成了重要的人生旅程。',
      reversed: '可能有未完成的事务或感到缺乏成就感。需要完成当前周期。'
    }
  }
];

// 小阿卡纳生成函数
function createMinorArcana(suit: Suit, suitNameCn: string): TarotCard[] {
  const suitMeanings: Record<Suit, { element: string; theme: string }> = {
    wands: { element: '火', theme: '行动、创造、激情' },
    cups: { element: '水', theme: '情感、关系、直觉' },
    swords: { element: '风', theme: '思想、冲突、真相' },
    pentacles: { element: '土', theme: '物质、工作、实际' }
  };

  const courtCards = [
    { num: 11, name: 'Page', nameCn: '侍从' },
    { num: 12, name: 'Knight', nameCn: '骑士' },
    { num: 13, name: 'Queen', nameCn: '王后' },
    { num: 14, name: 'King', nameCn: '国王' }
  ];

  const numberMeanings: Record<number, { upright: string[]; reversed: string[] }> = {
    1: { upright: ['新开始', '潜力', '机遇'], reversed: ['延迟', '错失机会', '缺乏动力'] },
    2: { upright: ['平衡', '选择', '合作'], reversed: ['失衡', '犹豫', '冲突'] },
    3: { upright: ['成长', '创造', '表达'], reversed: ['缺乏成长', '创意受阻', '分散'] },
    4: { upright: ['稳定', '基础', '休息'], reversed: ['不稳定', '停滞', '不安'] },
    5: { upright: ['挑战', '冲突', '变化'], reversed: ['恢复', '和解', '接受'] },
    6: { upright: ['和谐', '给予', '胜利'], reversed: ['不和谐', '自私', '失败'] },
    7: { upright: ['反思', '评估', '耐心'], reversed: ['缺乏远见', '急躁', '困惑'] },
    8: { upright: ['行动', '速度', '进展'], reversed: ['延迟', '受阻', '混乱'] },
    9: { upright: ['完成', '满足', '智慧'], reversed: ['未完成', '不满', '担忧'] },
    10: { upright: ['圆满', '结束', '传承'], reversed: ['负担', '抗拒结束', '失败'] },
    11: { upright: ['好奇', '学习', '消息'], reversed: ['不成熟', '缺乏方向', '坏消息'] },
    12: { upright: ['行动', '冒险', '追求'], reversed: ['鲁莽', '停滞', '挫折'] },
    13: { upright: ['滋养', '直觉', '关怀'], reversed: ['情绪化', '依赖', '不安全'] },
    14: { upright: ['领导', '权威', '成熟'], reversed: ['专制', '软弱', '操控'] }
  };

  const cards: TarotCard[] = [];
  const { theme } = suitMeanings[suit];

  for (let i = 1; i <= 14; i++) {
    const isCourtCard = i >= 11;
    const courtCard = courtCards.find(c => c.num === i);

    let name: string;
    let nameCn: string;

    if (i === 1) {
      name = `Ace of ${suit.charAt(0).toUpperCase() + suit.slice(1)}`;
      nameCn = `${suitNameCn}王牌`;
    } else if (isCourtCard && courtCard) {
      name = `${courtCard.name} of ${suit.charAt(0).toUpperCase() + suit.slice(1)}`;
      nameCn = `${suitNameCn}${courtCard.nameCn}`;
    } else {
      name = `${i} of ${suit.charAt(0).toUpperCase() + suit.slice(1)}`;
      nameCn = `${suitNameCn}${i}`;
    }

    cards.push({
      id: `${suit}-${i.toString().padStart(2, '0')}`,
      name,
      nameCn,
      type: 'minor',
      suit,
      number: i,
      image: `/cards/minor/${suit}/${i.toString().padStart(2, '0')}.jpg`,
      keywords: numberMeanings[i],
      meaning: {
        upright: `在${theme}领域，${numberMeanings[i].upright.join('、')}。`,
        reversed: `在${theme}领域，${numberMeanings[i].reversed.join('、')}。`
      }
    });
  }

  return cards;
}

// 生成所有小阿卡纳
const wands = createMinorArcana('wands', '权杖');
const cups = createMinorArcana('cups', '圣杯');
const swords = createMinorArcana('swords', '宝剑');
const pentacles = createMinorArcana('pentacles', '星币');

// 导出完整的78张牌
export const allCards: TarotCard[] = [
  ...majorArcana,
  ...wands,
  ...cups,
  ...swords,
  ...pentacles
];

export const majorArcanaCards = majorArcana;
export const minorArcanaCards = [...wands, ...cups, ...swords, ...pentacles];

// 按花色获取牌
export function getCardsBySuit(suit: Suit): TarotCard[] {
  return allCards.filter(card => card.suit === suit);
}

// 获取大阿卡纳
export function getMajorArcana(): TarotCard[] {
  return majorArcana;
}

// 随机抽牌
export function drawRandomCards(count: number): TarotCard[] {
  const shuffled = [...allCards].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

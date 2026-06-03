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
  const courtCards = [
    { num: 11, name: 'Page', nameCn: '侍从' },
    { num: 12, name: 'Knight', nameCn: '骑士' },
    { num: 13, name: 'Queen', nameCn: '王后' },
    { num: 14, name: 'King', nameCn: '国王' }
  ];

  // 小阿卡纳关键词与正逆位表述（按花色独立定制，基于标准伟特塔罗牌义）
  const minorKeywords: Record<Suit, Record<number, { upright: string[]; reversed: string[] }>> = {
    wands: {
      1: { upright: ['创造', '灵感', '新行动', '热情', '潜力'], reversed: ['延迟', '缺乏热情', '无力', '错失'] },
      2: { upright: ['计划', '决定', '远见', '选择'], reversed: ['犹豫', '害怕改变', '保守'] },
      3: { upright: ['扩张', '展望', '进展', '合作'], reversed: ['阻碍', '延迟', '挫折'] },
      4: { upright: ['稳定', '家园', '庆祝', '和谐'], reversed: ['不稳', '缺乏支持', '短暂'] },
      5: { upright: ['竞争', '冲突', '较量', '挑战'], reversed: ['避免冲突', '和解', '尊重'] },
      6: { upright: ['胜利', '成功', '认可', '进展'], reversed: ['骄傲', '不被承认', '失败'] },
      7: { upright: ['坚持', '防御', '勇气', '立场'], reversed: ['放弃', '精疲力尽', '被压倒'] },
      8: { upright: ['快速行动', '速度', '进展', '讯息'], reversed: ['延迟', '慌乱', '减速'] },
      9: { upright: ['韧性', '警惕', '持久', '防备'], reversed: ['疲惫', '精疲力竭', '动摇'] },
      10: { upright: ['负担', '责任', '压力', '完成'], reversed: ['崩溃', '无法委托', '筋疲力尽'] },
      11: { upright: ['探索', '兴奋', '自由', '消息'], reversed: ['缺乏方向', '拖延', '冲突'] },
      12: { upright: ['行动', '冒险', '热情', '冲动'], reversed: ['鲁莽', '愤怒', '不稳定'] },
      13: { upright: ['热情', '自信', '魅力', '独立'], reversed: ['自私', '嫉妒', '不安全'] },
      14: { upright: ['领导', '远见', '热情', '果断'], reversed: ['专横', '冲动', '不切实际'] }
    },
    cups: {
      1: { upright: ['新情感', '爱', '直觉', '灵性', '同情'], reversed: ['情感阻塞', '空虚', '失落'] },
      2: { upright: ['结合', '伙伴', '和谐', '吸引'], reversed: ['失衡', '分离', '紧张'] },
      3: { upright: ['友谊', '庆祝', '社区', '欢乐'], reversed: ['过度', '八卦', '孤立'] },
      4: { upright: ['冷漠', '沉思', '不满', '评估'], reversed: ['觉醒', '新机会', '接受'] },
      5: { upright: ['失落', '悲伤', '后悔', '失望'], reversed: ['接受', '和解', '前行'] },
      6: { upright: ['怀旧', '纯真', '回忆', '礼物'], reversed: ['前进', '离开过去', '独立'] },
      7: { upright: ['幻想', '选择', '梦想', '诱惑'], reversed: ['混乱', '缺乏方向', '现实'] },
      8: { upright: ['离去', '放弃', '寻找', '幻灭'], reversed: ['逃避', '恐惧改变', '停滞'] },
      9: { upright: ['满足', '愿望', '丰盛', '奢侈'], reversed: ['贪婪', '不满足', '空洞'] },
      10: { upright: ['圆满', '幸福', '情感满足', '和谐'], reversed: ['破裂', '不和', '失望'] },
      11: { upright: ['敏感', '直觉', '惊喜', '消息'], reversed: ['不成熟', '情绪化', '不安全'] },
      12: { upright: ['浪漫', '跟随心', '理想', '提议'], reversed: ['情绪化', '失望', '善变'] },
      13: { upright: ['同情', '关怀', '直觉', '成熟'], reversed: ['依赖', '情绪化', '过度敏感'] },
      14: { upright: ['情感控制', '同情', '平衡', '智慧'], reversed: ['冷漠', '操纵', '情绪压抑'] }
    },
    swords: {
      1: { upright: ['突破', '清晰', '真理', '决心', '新思想'], reversed: ['混乱', '残酷', '困惑'] },
      2: { upright: ['僵局', '艰难选择', '平衡', '不确定'], reversed: ['逃避', '信息不足', '和解'] },
      3: { upright: ['心碎', '悲伤', '分离', '痛苦', '背叛'], reversed: ['愈合', '宽恕', '恢复', '接受'] },
      4: { upright: ['休息', '恢复', '沉思', '疗愈'], reversed: ['不安', '倦怠', '压力'] },
      5: { upright: ['冲突', '败北', '策略', '自私'], reversed: ['悔恨', '和解', '宽恕'] },
      6: { upright: ['过渡', '离开', '治愈', '前进'], reversed: ['停滞', '包袱', '抗拒'] },
      7: { upright: ['欺骗', '策略', '逃避', '秘密'], reversed: ['坦白', '被揭露', '悔改'] },
      8: { upright: ['束缚', '自我限制', '恐惧', '受害'], reversed: ['释放', '新视角', '自由'] },
      9: { upright: ['焦虑', '噩梦', '绝望', '担忧', '创伤'], reversed: ['希望', '寻求帮助', '恢复'] },
      10: { upright: ['结束', '失败', '背叛', '崩溃'], reversed: ['恢复', '反弹', '结束痛苦'] },
      11: { upright: ['好奇', '警觉', '真相', '学习'], reversed: ['八卦', '欺骗', '不成熟'] },
      12: { upright: ['果断', '野心', '冲突', '急躁'], reversed: ['鲁莽', '无方向', '攻击性'] },
      13: { upright: ['清晰', '独立', '诚实', '界限', '智慧'], reversed: ['冷酷', '刻薄', '怨恨', '苦涩'] },
      14: { upright: ['真理', '权威', '逻辑', '公正'], reversed: ['专制', '残酷', '滥用', '操纵'] }
    },
    pentacles: {
      1: { upright: ['新机会', '繁荣', '物质开始', '丰盛'], reversed: ['错失机会', '坏投资', '延迟'] },
      2: { upright: ['平衡', '适应', '优先级', '多任务'], reversed: ['失衡', '混乱', '过度'] },
      3: { upright: ['合作', '团队', '技能', '建造'], reversed: ['缺乏合作', '差劲工作', '冲突'] },
      4: { upright: ['稳定', '保守', '安全', '储蓄'], reversed: ['贪婪', '吝啬', '固执'] },
      5: { upright: ['贫困', '艰难', '失去', '不安全'], reversed: ['恢复', '帮助', '改善'] },
      6: { upright: ['慷慨', '分享', '慈善', '回报'], reversed: ['条件', '自私', '债务'] },
      7: { upright: ['评估', '耐心', '长期投资', '收获'], reversed: ['不耐', '差结果', '浪费'] },
      8: { upright: ['勤奋', '学徒', '精进', '工艺'], reversed: ['缺乏热情', '粗制', '无动力'] },
      9: { upright: ['独立', '丰收', '奢侈', '自我满足'], reversed: ['财务问题', '孤立', '过度保护'] },
      10: { upright: ['财富', '遗产', '家庭稳定', '传统'], reversed: ['不稳定', '损失', '家庭问题'] },
      11: { upright: ['学习', '机会', '勤勉', '实际'], reversed: ['懒惰', '缺乏承诺', '贪婪'] },
      12: { upright: ['可靠', '勤奋', '责任', '缓慢进展'], reversed: ['懒惰', '停滞', '固执'] },
      13: { upright: ['实用', '丰盛', '照顾', '务实'], reversed: ['自私', '嫉妒', '物质主义'] },
      14: { upright: ['富裕', '成功', '可靠', '商业头脑'], reversed: ['贪婪', '固执', '腐败'] }
    }
  };

  // 小阿卡纳正逆位完整表述（与关键词匹配，提供更自然、解释性的描述）
  const minorMeanings: Record<Suit, Record<number, { upright: string; reversed: string }>> = {
    wands: {
      1: { upright: '象征创造的火花与新行动的开始。热情的灵感已经点燃，是时候将想法大胆付诸实践，开创属于自己的道路。', reversed: '创造力或内在热情暂时受阻。行动被延迟或缺乏启动的动力，需要重新找回那份最初的激情与勇气。' },
      2: { upright: '代表对未来的规划与关键选择。你站在人生的十字路口，拥有开阔的视野，需要做出有远见的决定。', reversed: '对改变感到恐惧或计划不够周全。可能固守舒适区，错失向外扩展的良机。' },
      3: { upright: '象征视野的扩张与事业的稳步推进。之前的努力开始显现成果，合作与长远眼光将带来更多机会。', reversed: '进展遭遇阻碍或超出预期的延迟。需要耐心调整策略，不要因短期挫折而放弃长期目标。' },
      4: { upright: '代表家庭、归属与值得庆祝的稳定时刻。努力有了收获，可以安心享受和谐与被支持的感觉。', reversed: '稳定感出现裂痕或缺乏外界支持。可能过于依赖他人认可，需要重建内在的安全感。' },
      5: { upright: '象征竞争、冲突与通过碰撞获得成长。不同意见激烈交锋，只要保持专注与热情，就能从混乱中胜出。', reversed: '回避必要的冲突或能量被分散。学会尊重不同观点，将竞争转化为建设性的合作。' },
      6: { upright: '代表公开的胜利与被认可的成功。你的付出得到回报，享受这一刻的荣耀，同时保持谦逊与清醒。', reversed: '胜利未被看见或骄傲自满带来问题。可能需要重新评估自己的位置，避免因自大而失去支持。' },
      7: { upright: '象征坚守立场与勇敢防御挑战的韧性。你已接近成功，需用坚定保护来之不易的成果。', reversed: '感到精疲力尽或信心动摇。过度防御可能导致孤立，适时放下与求助是明智之举。' },
      8: { upright: '代表快速的行动与事情的迅猛进展。箭已离弦，消息或机会来得突然而有力，果断把握即可。', reversed: '行动受阻或因过于仓促而混乱。事情的节奏被打乱，需要放慢脚步，等待更合适的时机。' },
      9: { upright: '象征持久的韧性与最后的警惕守卫。你经历过重重考验，保持警觉以守护已有的成就。', reversed: '身心俱疲或对持续的压力感到难以承受。知道何时可以放下防备，允许自己真正休息。' },
      10: { upright: '代表承担沉重责任与即将到来的完成。目标近在眼前，但需注意不要让压力压垮自己，学会适度分担。', reversed: '负担已达极限，濒临崩溃边缘。必须学会求助与委托，否则将彻底耗竭所有能量。' },
      11: { upright: '象征对热情的探索与传递兴奋能量的年轻活力。新的创意火花出现，保持好奇与开放的心态。', reversed: '缺乏清晰方向或不断拖延启动。兴奋可能演变为冲突，需要更务实的计划与执行力。' },
      12: { upright: '代表充满热情的冲刺与冒险行动的骑士精神。以强大动力追求目标，但要注意控制冲动与方向。', reversed: '鲁莽行事或热情难以维持。愤怒、急躁或不稳定性可能破坏原本的进展。' },
      13: { upright: '象征热情、自信与富有个人魅力的领导力。用温暖与独立感染他人，勇敢活出属于自己的光芒。', reversed: '自私或嫉妒心开始作祟。过度关注自我可能伤害人际关系，需要找回内在的平衡。' },
      14: { upright: '代表拥有远见与热情果断的领导能力。能够看到宏大图景，并激励身边的人共同实现目标。', reversed: '专横跋扈或冲动决策。热情过度可能变成控制欲与不切实际的期待。' }
    },
    cups: {
      1: { upright: '象征情感的苏醒与心灵的开启。新的爱、灵感或深刻的连接正在到来，敞开心扉去感受。', reversed: '情感能量受阻或内心感到空虚。可能错过了情感的流动，需要重新与自己的感受建立连接。' },
      2: { upright: '代表灵魂的结合与深层关系的建立。两个心灵相互吸引与映照，带来和谐与相互理解。', reversed: '关系出现失衡或沟通中断。曾经的连接正在松动，需要诚实面对双方的差异。' },
      3: { upright: '象征友谊、庆祝与情感上的丰盛。身边有值得分享快乐的人，社区与归属感带来治愈。', reversed: '过度放纵或人际中出现小团体与闲言。欢乐可能转为孤立，需要审视情感的边界。' },
      4: { upright: '代表对当前情感状态的沉思与重新评估。可能感到某种空虚或不满足，是时候向内寻找真正想要的。', reversed: '从麻木中苏醒或突然看清机会。曾经拒绝的情感现在愿意被接受。' },
      5: { upright: '象征失去、悲伤与对过去的悔恨。三杯洒落代表专注在缺失上，而非剩余的祝福。', reversed: '开始接受现实并愿意前行。悲伤没有消失，但你已准备好拾起剩下的两杯，走向和解。' },
      6: { upright: '代表童年的纯真、怀旧与情感的礼物。过去的美好记忆带来安慰与疗愈，也提醒你内心的单纯。', reversed: '固守过去或不愿长大。需要向前走，放下对旧日安全的依恋，拥抱当下的独立。' },
      7: { upright: '象征众多的选择、幻想与内心的渴望。幻象与现实交织，需要分辨哪些是真正值得追求的。', reversed: '幻想破灭或被过多选项困扰。混乱中需要回归现实，做出清晰而负责任的选择。' },
      8: { upright: '代表主动离开熟悉的情感环境，去追寻更深层的满足。虽有失落，却是为了更高的心灵召唤。', reversed: '害怕改变或逃避必要的离去。停留在不健康的关系中，只会让痛苦延续。' },
      9: { upright: '象征情感愿望的实现与内心的满足。九杯代表你已拥有或即将拥有所渴望的丰盛与喜悦。', reversed: '外在丰盛却内心空洞。贪得无厌或对表面的满足感到失望，需要寻找真正的喜悦源头。' },
      10: { upright: '代表情感的圆满与家庭/关系的终极和谐。梦想成真，爱与归属感环绕，是最美好的情感状态之一。', reversed: '家庭或亲密关系出现裂痕。曾经的圆满破碎，需要面对现实并重新修复或接受改变。' },
      11: { upright: '象征情感上的敏感与直觉的礼物。年轻的心灵带来惊喜与纯真的信息，提醒你保持柔软。', reversed: '情绪不成熟或过度依赖他人。可能因不安全感而制造戏剧，需要培养内在的情感稳定性。' },
      12: { upright: '代表跟随内心与浪漫理想主义的骑士。带着温柔与想象力行动，追求有意义的情感连接。', reversed: '情绪反复无常或理想破灭后失望。善变与逃避让关系难以建立，需要脚踏实地。' },
      13: { upright: '象征成熟的情感智慧与深切的同理心。能够平静地承载他人的情绪，同时保持清晰的边界。', reversed: '过度敏感或情感依赖他人。可能成为情绪的容器而忽略自己，需要学会保护与滋养自我。' },
      14: { upright: '代表情感的成熟掌控与平衡的智慧。能在爱与理性间找到中道，以慈悲与稳定影响身边的人。', reversed: '情感压抑或用冷漠掩盖真实感受。可能在关系中操纵或逃避亲密，需要重新打开心房。' }
    },
    swords: {
      1: { upright: '象征思想的突破与真相的利剑。清晰的洞见斩断迷雾，是时候以决心与诚实面对现实。', reversed: '思维混乱或真理被扭曲。残酷的言辞或内心的困惑正在造成伤害，需要寻求澄清。' },
      2: { upright: '代表艰难的抉择与暂时的僵局。蒙住双眼的女人手持双剑，处于平衡却不自然的停顿状态。', reversed: '逃避做决定或接受了次优方案。信息不足导致困惑，拖延只会让情况更复杂。' },
      3: { upright: '代表心碎、背叛与尖锐的分离痛苦。三剑刺穿心脏，悲伤如雨点落下。真相虽然残酷，却是必要的。', reversed: '痛苦正在缓慢愈合。宽恕自己与他人成为可能，虽然伤疤仍在，但你已开始恢复。' },
      4: { upright: '象征休息、恢复与暂时的撤退。骑士躺在石棺上，剑悬于头顶，是疗愈与沉思的时刻。', reversed: '无法真正休息或压力持续消耗。倦怠与不安累积，需要强迫自己停下来，否则会彻底崩溃。' },
      5: { upright: '代表通过不择手段获得的胜利与随之而来的空虚。赢了战斗却失去了尊重与内心的平静。', reversed: '对过去行为的悔恨与寻求和解的愿望。承认错误并愿意修复关系，是重新开始的第一步。' },
      6: { upright: '象征从痛苦中过渡与离开熟悉的伤心地。六剑载着乘客渡向对岸，代表治愈之旅的开始。', reversed: '抗拒必要的离开或带着旧包袱前行。无法放下过去会让过渡变得更加艰难。' },
      7: { upright: '代表策略、欺骗与偷偷摸摸的行动。七剑暗示你可能在逃避责任，或有人在对你使用诡计。', reversed: '秘密被揭露或自己决定坦白。欺骗的代价显现，是时候以诚实面对自己与他人。' },
      8: { upright: '象征自我设限与被恐惧囚禁的心灵。女人被八把剑围住，却其实可以自由离开。', reversed: '从自我施加的束缚中获得释放。新视角出现，你终于看清自己其实一直拥有选择的自由。' },
      9: { upright: '代表极度的焦虑、噩梦与精神上的折磨。九把剑悬在床上的人头顶，恐惧在夜晚达到顶点。', reversed: '从绝望的深渊中慢慢爬出。愿意寻求帮助或看到一丝希望，恢复的过程已经启动。' },
      10: { upright: '象征彻底的失败、背叛与最低谷的结束。十把剑刺入背部，旧的模式必须彻底死亡。', reversed: '最坏的情况已经过去。唯一的方向是向上，恢复与新开始正在到来。' },
      11: { upright: '象征敏锐的好奇心与追寻真相的年轻心灵。手持剑与笔，时刻准备学习与揭露。', reversed: '八卦、散播负面消息或言辞不负责任。思想上的不成熟正在制造不必要的冲突。' },
      12: { upright: '代表思想上的果断攻击与为信念而战的骑士精神。速度极快，但容易忽视他人的感受。', reversed: '鲁莽的言论或行动造成伤害。没有方向的攻击只会让局面失控。' },
      13: { upright: '象征清晰的头脑、诚实与保护自我的智慧。女王手持剑，冷静地划清界限。', reversed: '冷酷无情或因过去伤害而变得刻薄。苦涩与怨恨正在毒害你的心，需要疗愈。' },
      14: { upright: '代表以真理与逻辑进行公正裁决的权威。国王的剑指向天，代表思想的最高形式。', reversed: '滥用权力或以理性为借口进行操纵。残酷的判断正在伤害他人，也在伤害你自己。' }
    },
    pentacles: {
      1: { upright: '象征物质机会与丰盛的种子落地。一只手从云中递出金币，新的实际可能性正在开启。', reversed: '机会被错过或金钱上的延迟。坏的投资或起步时的犹豫，需要重新审视现实条件。' },
      2: { upright: '代表在变化中维持平衡与灵活应对。双手 juggling 两个金币，显示多重责任下的适应能力。', reversed: '失衡与过度负荷。事情变得混乱不堪，需要放下一些任务，重新排序优先级。' },
      3: { upright: '象征团队合作与专业技能的展现。三个工匠共同建造，代表通过协作获得高质量的成果。', reversed: '缺乏真正的合作或工作质量低下。团队中出现冲突或敷衍了事，需要重新对齐目标。' },
      4: { upright: '代表对物质安全的保守守护与稳固的基础。国王紧握四枚金币，享受当前拥有的稳定。', reversed: '贪婪、吝啬或对失去的过度恐惧。固执地守住东西反而阻碍了流动与成长。' },
      5: { upright: '象征物质上的匮乏、艰难与被遗忘的感觉。两个穷人在雪中经过教堂，却无人施舍。', reversed: '从困境中逐渐恢复。获得帮助或情况开始改善，重要的是愿意接受外界的支持。' },
      6: { upright: '代表慷慨的给予与公平的交换。一人施舍金币，另一人以尊重回应，体现互惠。', reversed: '给予附带条件或权力不平等。施舍变成控制，接受者感到被操纵。' },
      7: { upright: '代表耐心等待与长期投资的收获。农夫看着七枚金币长成的植物，评估进展。', reversed: '缺乏耐心或努力没有得到预期回报。可能因为分心或时机不对而感到失望。' },
      8: { upright: '象征专注的工艺与通过重复练习获得的精进。工匠雕刻八枚金币，享受技艺本身。', reversed: '对工作失去热情或敷衍了事。缺乏动力导致质量下降，需要找回最初的热爱。' },
      9: { upright: '代表独立自主与物质上的自我满足。女人在花园中欣赏九枚金币，享受独处的丰盛。', reversed: '财务上的不谨慎或过度保护导致孤立。表面的成功无法带来真正的安全感。' },
      10: { upright: '象征家族财富、传统与长期的物质稳定。十枚金币组成家族徽章，代表传承与归属。', reversed: '家庭或物质基础出现不稳定。遗产纠纷或对“成功”定义的迷失，需要重新审视价值观。' },
      11: { upright: '象征对实际技能的学习与对机会的勤勉把握。年轻的侍从专注研究金币，充满潜力。', reversed: '懒惰或对学习缺乏承诺。贪图安逸而不愿意付出努力，将错失成长的机会。' },
      12: { upright: '代表可靠、勤奋与缓慢但稳健的进展。骑士的马走得很慢，但方向坚定，负责任。', reversed: '懒惰、停滞或对细节的过度固执。缺乏灵活性让事情无法推进。' },
      13: { upright: '象征务实的丰盛与照顾他人的能力。王后坐在花园中，脚下有兔子，代表实际的滋养。', reversed: '自私或对物质的过度依恋。嫉妒与占有欲正在破坏人际的温暖。' },
      14: { upright: '代表物质上的成功、可靠与商业智慧。国王稳坐宝座，手持金币与权杖，掌控丰盛。', reversed: '贪婪、固执或腐败的物质主义。金钱成为目的而非工具，腐蚀了内在的价值。' }
    }
  };

  const cards: TarotCard[] = [];

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

    const kws = minorKeywords[suit][i];
    const m = minorMeanings[suit][i];
    cards.push({
      id: `${suit}-${i.toString().padStart(2, '0')}`,
      name,
      nameCn,
      type: 'minor',
      suit,
      number: i,
      image: `/cards/minor/${suit}/${i.toString().padStart(2, '0')}.jpg`,
      keywords: kws,
      meaning: m
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

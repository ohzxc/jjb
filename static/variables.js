let rewards = [
  '给开发者加个鸡腿',
  '请开发者喝杯咖啡',
  '京价保就是好',
  '保价成功，感谢开发者',
  '返利到手，打赏开发者',
  '赞赏支持',
  '打赏声优'
]

module.exports = {
  rewards: rewards,
  stateText: {
    "failed": "失败",
    "alive": "有效",
    "unknown": "未知"
  },
  notices: [
    {
      text: '京东页面经常修改，唯有你的支持才能让京价保保持更新持续运作。',
      button: rewards[5],
      type: 'reward',
      target: 'ming'
    },
    {
      text: '京东的登录有效期很短，请在登录时勾选保存密码自动登录以便京价保自动完成工作。',
      button: rewards[0],
      type: 'reward',
      target: 'ming'
    },
    {
      text: '软件开发需要开发者付出劳动和智慧，每一行代码都要付出相应的工作，并非唾手可得。',
      button: rewards[5],
      type: 'reward',
      target: 'ming'
    },
    {
      text: '京价保并不强制付费，但如果它确实帮到你，希望你也能帮助它保持更新。',
      button: rewards[5],
      type: 'reward',
      target: 'ming'
    },
    {
      text: '许多开源项目因为缺乏支持而停止更新，如果你希望京价保保持更新，请赞赏支持。',
      button: rewards[5],
      type: 'reward',
      target: 'ming'
    },
    {
      text: '如果你的京东账号修改了密码，请在高级设置中选择清除密码重新登录来继续使用京价保',
      button: rewards[5],
      type: 'reward',
      target: 'ming'
    },
    {
      text: '把京价保推荐给你的朋友同样能帮助京价保保持更新，如果缺乏使用者，开发者可能会放弃维护项目。',
      button: rewards[2],
      type: 'reward',
      target: 'ming'
    },
    {
      text: '如果价保成功的话，打赏声优小姐姐几块钱她会很开心哦',
      button: rewards[6],
      type: 'reward',
      target: 'samedi'
    }
  ],
  recommendServices: [
    {
      link: "https://cloud.tencent.com/redirect.php?redirect=1025&cps_key=8c3eff7793dd70781315d9b5c9727c39&from=console",
      title: "腾讯云新客礼包",
      description: "新客户无门槛领取2775元代金券",
      class: "el-tag el-tag--success"
    },
    {
      link: "https://www.boslife.me/aff.php?aff=435",
      title: "科学上网服务",
      description: "小明使用2年的科学上网服务",
      class: "el-tag el-tag--warning"
    },
    {
      link: "https://promotion.aliyun.com/ntms/yunparter/invite.html?userCode=sqj7d3bm",
      title: "阿里云优惠券",
      description: "领取阿里云全品类优惠券",
      class: "el-tag"
    },
  ]
};
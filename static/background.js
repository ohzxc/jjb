$ = window.$ = window.jQuery = require('jquery')
import * as _ from "lodash"
import Logline from 'logline'
import {DateTime} from 'luxon'
import {priceProUrl, mapFrequency, getTask, getTasks} from './tasks'
import {rand, getSetting, saveSetting} from './utils'
import {getLoginState} from './account'

import {findGood, findOrder, updateOrders, newMessage, updateMessages, addTaskLog, findAndUpdateTaskResult} from './db'

Logline.using(Logline.PROTOCOL.INDEXEDDB)

var logger = {}
var autoLoginQuota = {}
var mLoginUrl = "https://home.m.jd.com/myJd/newhome.action"
var priceProPage = null
var mobileUAType = getSetting('uaType', 1)

// This is to remove X-Frame-Options header, if present
chrome.webRequest.onHeadersReceived.addListener(
  function(info) {
    var headers = info.responseHeaders;
    for (var i=headers.length-1; i>=0; --i) {
      var header = headers[i].name.toLowerCase();
      if (header == 'x-frame-options' || header == 'frame-options') {
          headers.splice(i, 1); // Remove header
      }
    }
    return {responseHeaders: headers};
  },
  {
      urls: ['*://*.jd.com/*', '*://*.jd.hk/*'], //
      types: ['sub_frame']
  },
  ['blocking', 'responseHeaders']
);

chrome.runtime.onInstalled.addListener(function (object) {
  let installed = localStorage.getItem('jjb_installed')
  let uaType = localStorage.getItem('uaType')
  if (installed) {
    if (!uaType) {
      localStorage.setItem('uaType', 1);
    }
    console.log("已经安装")
  } else {
    localStorage.setItem('jjb_installed', 'Y');
    localStorage.setItem('uaType', rand(3));
    chrome.tabs.create({url: "/start.html"}, function (tab) {
      console.log("京价保安装成功！");
    });
  }
});

var popularPhoneUA = [
  'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1 jdjr-app ios',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 9_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/10.2 Mobile/15E148 Safari/604.1 jdjr-app ios',
  'Mozilla/5.0 (iPhone9,4; U; CPU iPhone OS 10_0_1 like Mac OS X) AppleWebKit/602.1.50 (KHTML, like Gecko) Version/10.0 Mobile/14A403 Safari/602.1 jdjr-app ios',
  'Mozilla/5.0 (Linux; Android 6.0.1; SM-G920V Build/MMB29K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.98 Mobile Safari/537.36 jdjr-app'
];
chrome.webRequest.onBeforeSendHeaders.addListener(
  function (details) {
    for (var i = 0; i < details.requestHeaders.length; ++i) {
      if (details.requestHeaders[i].name === 'User-Agent') {
        details.requestHeaders[i].value = popularPhoneUA[mobileUAType];
        break;
      }
    }
    return {
      requestHeaders: details.requestHeaders
    };
  }, {
    urls: [
      "*://*.m.jd.com/*",
      "*://m.jr.jd.com/*",
      "*://wq.jd.com/*",
      "*://wqs.jd.com/*",
      "*://msitepp-fm.jd.com/*"
    ]
  }, ['blocking', 'requestHeaders']);


// 判断浏览器
try {
  browser.runtime.getBrowserInfo().then(function (browserInfo) {
    localStorage.setItem('browserName', browserInfo.name);
  })
} catch (error) {}


// 阻止打开京东金融App的代码
chrome.webRequest.onBeforeRequest.addListener(
  function (details) {
    if (details.url == "https://m.jr.jd.com/statics/downloadApp/newdl/newdl.js")
      return {
        cancel: (details.url.indexOf("://m.jr.jd.com/") != -1)
      };
  }, {
    urls: ["*://m.jr.jd.com/*", "*://m.jd.com/*"]
  }, ["blocking"]);

// 定时任务
chrome.alarms.onAlarm.addListener(function( alarm ) {
  log('background', "onAlarm", alarm)
  let taskId = alarm.name.split('_').length > 1 ? alarm.name.split('_')[1] : null
  switch(true){
    // 计划任务
    case alarm.name.startsWith('runScheduleJob'):
      runJob(taskId)
      break;
    // 定时任务
    case alarm.name.startsWith('runJob'):
      runJob(taskId)
      break;
    // 周期运行（10分钟）
    case alarm.name == 'cycleTask':
      clearPinnedTabs()
      findJobs()
      runJob()
      updateIcon()
      break;
    case alarm.name.startsWith('clearIframe'):
      resetIframe(taskId || 'iframe')
      break;
    case alarm.name.startsWith('destroyIframe'):
      $("#" + taskId).remove();
      break;
    case alarm.name.startsWith('closeTab'):
      try {
        chrome.tabs.get(taskId, (tab) => {
          if (tab) {
            chrome.tabs.remove(tab.id)
          }
        })
      } catch (e) {}
      break;
    case alarm.name == 'reload':
      chrome.runtime.reload()
      chrome.alarms.clearAll()
      // 保留3天内的log
      Logline.keep(3);
      break;
  }
})

// 保存任务栈
function saveJobStack(jobStack) {
  jobStack = _.uniq(jobStack)
  localStorage.setItem('jobStack', JSON.stringify(jobStack));
}

// 根据页面查找匹配的任务
function findTasksByLocation(location) {
  let taskList = getTasks()
  console.log('taskList', taskList)
  let locationTask = taskList.filter(task => task.location && Object.keys(task.location).length > 0)
  let matchedTasks =[]
  locationTask.forEach((task) => {
    if (Object.keys(task.location).every((key) => task.location[key].indexOf(location[key]) > -1 )) {
      matchedTasks.push(task)
    }
  })
  return matchedTasks
}


function scheduleJob(task) {
  let hour = DateTime.local().hour;
  for (var i = 0, len = task.schedule.length; i < len; i++) {
    let scheduledHour = task.schedule[i]
    if (scheduledHour > hour) {
      let scheduledTime = DateTime.local().set({
        hour: scheduledHour,
        minute: rand(2) - 1,
        second: rand(55)
      }).valueOf()
      chrome.alarms.create('runScheduleJob_' + task.id, {
        when: scheduledTime
      })
      log('background', "schedule job created", {
        job: task,
        time: scheduledHour,
        when: scheduledTime
      })
      break;
    }
  }
}


function pushJob(task, jobStack) {
  if (task.schedule) {
    chrome.alarms.get('runScheduleJob_' + task.id, function (alarm) {
      if (!alarm || alarm.scheduledTime < Date.now()) {
        return scheduleJob(task)
      } else {
        console.log("job already scheduled ", alarm)
      }
    })
    return jobStack
  } else {
    jobStack.push(task.id)
  }
  return jobStack
}

// 寻找乔布斯
function findJobs(platform) {
  let jobStack = getSetting('jobStack', [])
  let taskList = getTasks(platform)
  console.log('taskList', taskList)

  taskList.forEach(function(task) {
    if (task.suspended || task.deprecated) {
      return console.log(task.title, '任务已暂停')
    }
    if (task.checked) {
      return console.log(task.title, '任务已完成')
    }
    switch(task.frequency){
      case '2h':
        // 如果从没运行过，或者上次运行已经过去超过2小时，那么需要运行
        if (!task.last_run_at || (DateTime.local() > DateTime.fromMillis(task.last_run_at).plus({ hours: 2 }))) {
          jobStack = pushJob(task, jobStack)
        }
        break;
      case '5h':
        // 如果从没运行过，或者上次运行已经过去超过5小时，那么需要运行
        if (!task.last_run_at || (DateTime.local() > DateTime.fromMillis(task.last_run_at).plus({ hours: 5 }))) {
          jobStack = pushJob(task, jobStack)
        }
        break;
      case 'daily':
        // 如果从没运行过，或者上次运行不在今天，或者是签到任务但未完成
        if (!task.last_run_at || !(DateTime.local().hasSame(DateTime.fromMillis(task.last_run_at), 'day')) || (task.checkin && !task.checked)) {
          jobStack = pushJob(task, jobStack)
        }
        break;
      default:
        console.log('ok, never run ', task.title)
    }
  });
  saveJobStack(jobStack)
}

// 执行组织交给我的任务
async function runJob(taskId, force = false) {
  // 不在凌晨阶段运行非强制任务
  if (DateTime.local().hour < 6 && !force) {
    return console.log('Silent Night')
  }
  log('background', "run job", {
    taskId,
    force
  })
  // 如果没有指定任务ID 就从任务栈里面找一个
  if (!taskId) {
    let jobStack = getSetting('jobStack', [])
    if (jobStack && jobStack.length > 0) {
      taskId = jobStack.shift();
      saveJobStack(jobStack)
    } else {
      return log('info', '好像没有什么事需要我做...')
    }
  }
  let task = getTask(taskId)

  // 如果任务已暂停
  if (task.pause) {
    return log('job', task, '已被暂停')
  }

  // 如果任务已挂起或已经弃用 且不是强制执行
  if ((task.suspended || task.deprecated) && !force) {
    return log('job', task, '由于账号未登录已暂停运行')
  }
  if (task.frequency != 'never' || force) {
    log('background', "run", task)
    await addTaskLog(task)
    if (task.mode == 'iframe') {
      openByIframe(task.url, 'job')
    } else {
      chrome.tabs.create({
        index: 1,
        url: task.url,
        active: false,
        pinned: true
      }, function (tab) {
        // 将标签页静音
        chrome.tabs.update(tab.id, {
          muted: true
        }, function (result) {
          log('background', "muted tab", result)
        })
        chrome.alarms.create('closeTab_'+tab.id, {delayInMinutes: 3})
      })
    }
  }
}

function savePrice(price) {
  let skuPriceList = localStorage.getItem('skuPriceList') ? JSON.parse(localStorage.getItem('skuPriceList')) : {}
  skuPriceList[price.sku] = price
  localStorage.setItem('skuPriceList', JSON.stringify(skuPriceList));
  return skuPriceList
}

function log(type, message, details) {
  if (!logger[type]) {
    logger[type] = new Logline(type)
  }
  logger[type].info(message, details)
  console.log(new Date(), type, message, details)
}

function resetIframe(domId) {
  $("#" + domId).remove();
  let iframeDom = `<iframe id="${domId}" width="400 px" height="600 px" src=""></iframe>`;
  $('body').append(iframeDom);
}

function openByIframe(src, type, delayTimes = 0) {
  // 加载新的任务
  let iframeId = "iframe"
  let keepMinutes = 6
  if (type == 'temporary') {
    iframeId = 'iframe' + rand(10241024)
    keepMinutes = 1
  }
  // 当前任务过多则等待
  if ($('iframe').length > 5 && delayTimes < 6) {
    setTimeout(() => {
      openByIframe(src, type, delayTimes + 1)
    }, (10 + rand(10)) * 1000);
    return console.log('too many iframe pages', src, delayTimes)
  }
  // 运行
  resetIframe(iframeId)
  $("#" + iframeId).attr('src', src)
  // 设置重置任务
  chrome.alarms.create((type == 'temporary' ? 'destroyIframe_' : 'clearIframe_') + iframeId, {
    delayInMinutes: keepMinutes
  })
}

function updateUnreadCount(change = 0) {
  let lastUnreadCount = localStorage.getItem('unreadCount') || 0
  let unreadCount = parseInt(Number(lastUnreadCount) + change)
  if (unreadCount < 0) {
    unreadCount = 0
  }
  localStorage.setItem('unreadCount', unreadCount);
  if (unreadCount > 0) {
    let unreadCountText = unreadCount.toString()
    if (unreadCount > 100) {
      unreadCountText = '99+'
    }
    chrome.browserAction.setBadgeText({ text: unreadCountText });
    chrome.browserAction.setBadgeBackgroundColor({ color: "#4caf50" });
  } else {
    chrome.browserAction.setBadgeText({ text: "" });
  }
}

// 清除掉不必要的
function removeExpiredLocalStorageItems() {
  let arr = [];
  for (var i = 0; i < localStorage.length; i++){
    if (localStorage.key(i).indexOf('temporary:') == 0) {
      arr.push(localStorage.key(i));
    }
  }

  for (var i = 0; i < arr.length; i++) {
    localStorage.removeItem(arr[i]);
  }
}

function setDefaultSetting() {
  let priceProDays = localStorage.getItem("price_pro_days")
  if (!priceProDays) {
    saveSetting("price_pro_days", 15)
  }
}


$( document ).ready(function() {
  log('background', "document ready", new Date())
  // 每10分钟运行一次定时任务
  chrome.alarms.create('cycleTask', {
    periodInMinutes: 10
  })

  // 每600分钟完全重载
  chrome.alarms.create('reload', {periodInMinutes: 600})

  // 载入后马上运行一次任务查找
  findJobs()

  // 载入显示未读数量
  updateUnreadCount()

  // 加载任务参数
  loadSettingsToLocalStorage('task-parameters')

  // 加载推荐设置
  loadRecommendSettingsToLocalStorage()

  // 设置默认值
  setDefaultSetting()

  // 移除临时缓存项（只在20点～8点运行）
  if (new Date().getHours() > 20 || new Date().getHours() < 8) {
    removeExpiredLocalStorageItems()
  }
})

// 用手机模式打开
function openWebPageAsMobile(url) {
  chrome.windows.create({
    width: 420,
    height: 800,
    url: url,
    type: "popup"
  });
}

function openLoginPage(loginState) {
  if (loginState.m.state != 'alive') {
    openWebPageAsMobile(mLoginUrl)
  } else {
    chrome.tabs.create({
      url: "https://home.jd.com"
    })
  }
}

// 清除不需要的tab
function clearPinnedTabs() {
  chrome.tabs.query({
    pinned: true
  }, function (tabs) {
    var tabIds = $.map(tabs, function (tab) {
      if (tab && tab.url.indexOf('jd.com') !== -1) {
        return tab.id
      }
    })

    // opera doesn't remove pinned tabs, so lets first unpin
    $.map(tabIds, function (tabId) {
        chrome.tabs.update(tabId, {"pinned":false}, function(theTab){ chrome.tabs.remove(theTab.id); });
    })
  })
}

// 点击通知
chrome.notifications.onClicked.addListener(function (notificationId) {
  if (notificationId.split('_').length > 0) {
    let batch = notificationId.split('_')[1]
    let type = notificationId.split('_')[2]
    if (batch && batch.length > 1) {
      switch (batch) {
        case 'baitiao':
          chrome.tabs.create({
            url: "https://vip.jr.jd.com/coupon/myCoupons?default=IOU"
          })
          break;
        case 'bean':
          chrome.tabs.create({
            url: "http://bean.jd.com/myJingBean/list"
          })
          break;
        case 'jiabao':
          openWebPageAsMobile(priceProUrl)
          break;
        case 'login-failed':
          if (type == 'pc') {
            chrome.tabs.create({
              url: "https://passport.jd.com/uc/login"
            })
          } else {
            openWebPageAsMobile(mLoginUrl)
          }
          break;
        default:
          if (batch && batch != 'undefined' && type == 'coupon') {
            chrome.tabs.create({
              url: "https://search.jd.com/Search?coupon_batch=" + batch
            })
          } else {
            chrome.tabs.create({
              url: "https://zaoshu.so/coupon"
            })
          }
      }
    }
  }
})

// 按钮点击
chrome.notifications.onButtonClicked.addListener(function (notificationId, buttonIndex) {
  if (notificationId.split('_').length > 0) {
    let batch = notificationId.split('_')[1]
    let type = notificationId.split('_')[2]
    if (batch != 'login-failed') {
      return
    }
    switch (type) {
      case 'pc':
        if (buttonIndex == 0) {
          chrome.tabs.create({
            url: "https://passport.jd.com/uc/login"
          })
        }
        break;
      case 'm':
        if (buttonIndex == 0) {
          openWebPageAsMobile(mLoginUrl)
        }
        break;
      default:
        chrome.tabs.create({
          url: "https://zaoshu.so/coupon"
        })
    }
  }
})

// 根据登录状态调整图标显示
function updateIcon() {
  let loginState = getLoginState()
  switch (loginState.class) {
    case 'alive':
      chrome.browserAction.getBadgeText({}, function (text){
        if (text == "X" || text == " ! ") {
          chrome.browserAction.setBadgeText({
            text: ""
          });
          chrome.browserAction.setTitle({
            title: "京价保"
          })
        }
      })
      chrome.browserAction.setIcon({
        path : {
          "19": "static/image/icon/jjb19x.png",
          "38": "static/image/icon/jjb38x.png"
        }
      });
      chrome.contextMenus.removeAll();
      break;
    case 'failed':
      chrome.browserAction.setBadgeBackgroundColor({
        color: [190, 190, 190, 230]
      });
      chrome.browserAction.setBadgeText({
        text: "X"
      });
      chrome.browserAction.setTitle({
        title: "账号登录失效"
      })
      chrome.browserAction.setIcon({
        path : {
          "19": "static/image/icon/offline19x.png",
          "38": "static/image/icon/offline38x.png"
        }
      });
      chrome.contextMenus.removeAll();
      chrome.contextMenus.create({
        title: "账号登录失效，点击登录",
        contexts: ["browser_action"],
        onclick: function() {
          openLoginPage(loginState)
        }
      });
      break;
    case 'warning':
      chrome.browserAction.setBadgeBackgroundColor({
        color: "#EE7E1B"
      });
      chrome.browserAction.setBadgeText({
        text: " ! "
      });
      chrome.browserAction.setIcon({
        path : {
          "19": "static/image/icon/partial-offline19x.png",
          "38": "static/image/icon/partial-offline38x.png"
        }
      });
      chrome.contextMenus.removeAll();
      chrome.contextMenus.create({
        title: "登录部分失效，点击登录",
        contexts: ["browser_action"],
        onclick: function() {
          openLoginPage(loginState)
        }
      });
      break;
    default:
      break;
  }
}

// 保存登录状态
function saveLoginState(loginState) {
  let previousState = getLoginState()
  localStorage.setItem('jjb_login-state_' + loginState.type, JSON.stringify({
    time: new Date(),
    message: loginState.content || loginState.message,
    state: loginState.state
  }));
  chrome.runtime.sendMessage({
    action: "loginState_updated",
    data: loginState
  });
  // 如果登录状态从失败转换到了在线
  if (previousState[loginState.type].state != 'alive' && loginState.state == "alive") {
    setTimeout(() => {
      findJobs(loginState.type)
    }, 30000);
  }
  // 如果账号首次登录，马上运行一次价保
  if (previousState.class == 'unknown' && loginState.state == "alive") {
    setTimeout(() => {
      runJob('1')
    }, 15000);
  }
}

// 浏览器通知（合并）
// mute_night
function sendChromeNotification(id, content) {
  let hour = DateTime.local().hour;
  let muteNight = getSetting('mute_night');
  if (muteNight && hour < 6) {
    log('background', 'mute_night', content);
  } else {
    chrome.notifications.create(id, content)
    log('message', id, content);
  }
}

// 价保设置
function getPriceProtectionSetting() {
  let pro_min = getSetting('price_pro_min', 0.1);
  let pro_days = getSetting('price_pro_days', 15)
  let is_plus = (getSetting('is_plus') ? getSetting('is_plus') == 'checked' : false ) || (getSetting('jjb_plus') == 'Y')
  let prompt_only = getSetting('prompt_only') ? getSetting('prompt_only') == 'checked' : false
  let suspendedApplyIds = getSetting("suspendedApplyIds", []);
  return {
    pro_min,
    prompt_only,
    pro_days,
    is_plus,
    suspendedApplyIds
  }
}

// 报告价格
function reportPrice(priceInfo) {
  if (!priceInfo.sku) return
  log('background', 'reportPrice', priceInfo)
  $.ajax({
    method: "POST",
    url: `https://jjb.zaoshu.so/price/${priceInfo.sku}`,
    data: {
      name: priceInfo.name,
      sku: priceInfo.sku,
      price: priceInfo.normal_price ? Number(priceInfo.normal_price) : null,
      normal_price: priceInfo.normal_price ? Number(priceInfo.normal_price) : null,
      plus_price: priceInfo.plus_price ? Number(priceInfo.plus_price) : null,
      pingou_price: priceInfo.pingou_price ? Number(priceInfo.pingou_price) : null,
    },
    timeout: 3000,
    dataType: "json"
  })
}

// 报告优惠信息
function reportPromotions(promInfo) {
  let disable_pricechart = (getSetting('disable_pricechart') ? getSetting('disable_pricechart') == 'checked' : false)
  if (disable_pricechart || !promInfo.sku) return
  log('background', 'reportPromotions', promInfo)
  $.ajax({
    method: "PUT",
    url: `https://jjb.zaoshu.so/price/${promInfo.sku}/promotions`,
    data: promInfo,
    timeout: 3000,
    dataType: "json"
  })
}

// 加载任务参数
function loadSettingsToLocalStorage(key) {
  $.getJSON(`https://jjb.zaoshu.so/setting/${key}`, function (json) {
    saveSetting(key, json)
  })
}
// 加载推荐设置
function loadRecommendSettingsToLocalStorage() {
  $.getJSON("https://jjb.zaoshu.so/recommend/settings", function (json) {
    if (json.displayPopup) {
      saveSetting('displayPopup', json.displayPopup)
    }
    if (json.events) {
      saveSetting('events', json.events)
    }
    if (json.announcements && json.announcements.length > 0) {
      saveSetting('announcements', json.announcements)
    }
    if (json.promotions) {
      saveSetting('promotions', json.promotions)
    }
    if (json.recommendedLinks && json.recommendedLinks.length > 0) {
      saveSetting('recommendedLinks', json.recommendedLinks)
    } else {
      localStorage.removeItem('recommendedLinks')
    }
    if (json.recommendServices && json.recommendServices.length > 0) {
      saveSetting('recommendServices', json.recommendServices)
    }
  });
}

// 处理消息通知
chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if (!msg.action) {
    msg.action = msg.text
  }
  let task
  let loginState = getLoginState()
  let hourInYear = DateTime.local().toFormat("oHH")
  switch(msg.action){
    // 获取移动页商品价格
    case 'getProductPrice':
      let url = `https://item.m.jd.com/product/${msg.sku}.html`
      priceProPage = sender

      setTimeout(() => {
        openByIframe(url, 'temporary')
      }, rand(5) * 1000);

      sendResponse({
        working: true
      })
      break;
    // 通知商品价格
    case 'productPrice':
      let is_plus = (getSetting('is_plus') ? getSetting('is_plus') == 'checked' : false ) || (getSetting('jjb_plus') == 'Y')
      let disable_pricechart = (getSetting('disable_pricechart') ? getSetting('disable_pricechart') == 'checked' : false)
      let priceInfo = {
        sku: msg.sku,
        name: msg.name,
        price: is_plus ? (msg.plus_price || msg.normal_price) : msg.normal_price,
        normal_price: msg.normal_price,
        plus_price: msg.plus_price,
        pingou_price: msg.pingou_price
      }
      // 当前有价保页面
      if (priceProPage) {
        console.log('existence PriceProPage:', priceProPage)
        if (priceProPage.tab){
          chrome.tabs.sendMessage(priceProPage.tab.id, Object.assign({
            action: 'productPrice',
            setting: getPriceProtectionSetting(),
          }, priceInfo), {}, function (response) {
            console.log('send productPrice to tabs response', response)
          })
        } else if (priceProPage.id) {
          document.getElementById('iframe').contentWindow.postMessage(Object.assign({
            action: 'productPrice',
            setting: getPriceProtectionSetting(),
          }, priceInfo),'*');
        }
      }
      // 价格追踪
      savePrice(priceInfo)
      if (!disable_pricechart && priceInfo.sku) {
        reportPrice(priceInfo)
      }
      sendResponse(priceInfo)
      break;
    // 促销信息
    case 'promotions':
      reportPromotions(msg)
      break;
    // 保存登录状态
    case 'saveLoginState':
      saveLoginState(msg)
      sendResponse(msg)
      break;
    // 获取登录状态
    case 'getLoginState':
      sendResponse(loginState)
      break;
    case 'getPriceProtectionSetting':
      let priceProtectionSetting = getPriceProtectionSetting()
      sendResponse(priceProtectionSetting)
      break;
    // 记住账号
    case 'saveAccount':
      if (msg.content.username && msg.content.password) {
        saveSetting('jjb_account', msg.content);
      }
      break;
    // 自动登录
    case 'autoLogin':
      if (autoLoginQuota[hourInYear]) {
        autoLoginQuota[hourInYear][msg.type] = 0
      } else {
        autoLoginQuota[hourInYear] = {
          [msg.type]: 0
        }
      }
      sendResponse(autoLoginQuota[hourInYear])
      break;
    // 保存变量值
    case 'setVariable':
      localStorage.setItem(msg.key, JSON.stringify(msg.value));
      break;
    // 获取设置
    case 'getSetting':
      let setting = getSetting(msg.content)
      let temporarySetting = localStorage.getItem('temporary_' + msg.content)
      // 如果存在临时设置
      if (temporarySetting) {
        // 临时设置5分钟失效
        setTimeout(() => {
          localStorage.removeItem('temporary_' + msg.content)
        }, 60*5*1000);
        sendResponse(temporarySetting)
      }
      sendResponse(setting)
      break;
    // 获取页面参数
    case 'getPageSetting':
      let matchedTasks = findTasksByLocation(msg.location)
      sendResponse({
        tasks: matchedTasks
      })
      break;
    case 'getAccount':
      let account = getSetting('jjb_account', null)
      let loginTypeState = getSetting('jjb_login-state_' + msg.type, {})
      // 如果有 loginTypeState
      if (account && loginTypeState && loginTypeState.time) {
        loginTypeState.displayTime = DateTime.fromISO(loginTypeState.time).setLocale('zh-cn').toFormat('f')
        account.loginState = loginTypeState
      }
      // 如果有自动登录次数配额限制
      if (account && autoLoginQuota[hourInYear]) {
        account.autoLoginQuota = autoLoginQuota[hourInYear][msg.type]
      }
      sendResponse(account)
      break;
    case 'paid':
      localStorage.setItem('jjb_paid', 'Y');
      sendChromeNotification(new Date().getTime().toString(), {
        type: "basic",
        title: "谢谢老板",
        message: "我会努力签到、领券、申请价格保护来回报你的",
        iconUrl: 'static/image/128.png'
      })
      break;
    case 'openLogin':
      openLoginPage(loginState)
      break;
    case 'openUrlAsMoblie':
      openWebPageAsMobile(msg.url)
      break;
    case 'openPricePro':
      openWebPageAsMobile(priceProUrl)
      break;
    // 登录失败
    case 'loginFailed':
      // 保存状态
      saveLoginState(msg)
      let loginErrMsg = (msg.type == 'pc' ? 'PC网页版' : '移动网页版') + "自动登录失败：" + msg.content
      if (msg.notice) {
        sendChromeNotification(new Date().getTime().toString() + "_login-failed_" + msg.type, {
          type: "basic",
          title: loginErrMsg,
          message: "请点击本通知手动完成登录",
          iconUrl: 'static/image/128.png',
          buttons: [
            {
              "title": "现在登录"
            }
          ]
        })
      }
      break;
    case 'option':
      localStorage.setItem('jjb_'+msg.title, msg.content);
      break;
    // 获取任务
    case 'getTask':
      task = getTask(msg.taskId)
      sendResponse(task)
      break;
    // 手动运行任务
    case 'runTask':
      task = getTask(msg.taskId)
      // set 临时运行
      localStorage.setItem(`temporary_job${task.id}_frequency`, 'onetime');
      // 任务因为频率受限无法运行
      if (task.pause) {
        let taskPauseMsg = `${task.title}已达到当前时段最大时段频率，每小时：${task.rateLimit.hour} 次，请勿重复运行等待自动运行`
        sendChromeNotification(new Date().getTime().toString(), {
          type: "basic",
          title: "任务因为频率受限无法运行",
          message: taskPauseMsg,
          iconUrl: 'static/image/128.png'
        })
        sendResponse({
          result: "pause",
          message: taskPauseMsg
        })
      } else {
        runJob(task.id, true)
        if (!msg.hideNotice) {
          sendChromeNotification(new Date().getTime().toString(), {
            type: "basic",
            title: "正在重新运行" + task.title,
            message: "任务运行大约需要2分钟，如果有情况我再叫你（请勿连续运行）",
            iconUrl: 'static/image/128.png'
          })
        }
        sendResponse({
          result: "success"
        })
      }
      break;
    case 'priceProtectionNotice':
      var play_audio = getSetting('play_audio')
      var hide_good = getSetting('hide_good')
      if (play_audio && play_audio == 'checked' || msg.test) {
        var myAudio = new Audio();
        myAudio.src = "static/audio/price_protection.ogg";
        myAudio.play();
      }
      if (!hide_good || hide_good != 'checked') {
        msg.content = (msg.product_name ? msg.product_name.substr(0, 22) : '') + msg.content
      }
      sendChromeNotification(new Date().getTime().toString() + '_' + msg.batch, {
        type: "basic",
        title: msg.title,
        message: msg.content,
        iconUrl: 'static/image/money.png'
      })
      break;
    case 'checkin_notice':
      var mute_checkin = getSetting('mute_checkin')
      if (mute_checkin && mute_checkin == 'checked' && !msg.test) {
        console.log('checkin', msg)
      } else {
        var play_audio = getSetting('play_audio')
        if (play_audio && play_audio == 'checked' || msg.test) {
          var myAudio = new Audio();
          myAudio.src = "static/audio/beans.ogg";
          if (msg.batch == 'coin') {
            myAudio.src = "static/audio/coin_drop.ogg";
          }
          myAudio.play();
        }
        let icon = 'static/image/bean.png'
        if (msg.batch == 'coin') {
          icon = 'static/image/coin.png'
        }
        sendChromeNotification( new Date().getTime().toString() + '_' + msg.batch, {
          type: "basic",
          title: msg.title,
          message: msg.content,
          iconUrl: icon
        })
      }
      break;
    // 签到状态
    case 'markCheckinStatus':
      let currentStatus = getSetting('jjb_checkin_' + msg.batch, null)
      let data = {
        date: DateTime.local().toFormat("o"),
        time: new Date(),
        value: msg.value
      }
      if (currentStatus && currentStatus.date == DateTime.local().toFormat("o")) {
        console.log('已经记录过今日签到状态了')
      } else {
        localStorage.setItem('jjb_checkin_' + msg.batch, JSON.stringify(data));
        sendResponse(data)
      }
      break;
    // 运行状态
    case 'runStatus':
      task = getTask(msg.task.id)
      localStorage.setItem('job' + task.id + '_lasttime', new Date().getTime())
      saveLoginState({
        content: task.title + "成功运行",
        state: "alive",
        type: msg.mode || task.type[0]
      })
      // 如果任务周期小于10小时，且不是计划任务，则安排下一次运行
      if (mapFrequency[task.frequency] < 600 && !task.schedule) {
        chrome.alarms.create('runJob_' + task.id, {
          delayInMinutes: mapFrequency[task.frequency]
        })
      }
      sendResponse({
        result: true
      })
      break;
    case 'create_tab':
      var content = JSON.parse(msg.content)
      chrome.tabs.create({
        index: content.index,
        url: content.url,
        active: content.active == 'true',
        pinned: content.pinned == 'true'
      }, function (tab) {
        chrome.tabs.update(tab.id, {
          muted: true
        }, function (result) {
          log('background', "muted tab", result)
        })
        chrome.alarms.create('closeTab_' + tab.id, { delayInMinutes: 1 })
      })
      break;
    case 'remove_tab':
      chrome.tabs.query({
        url: msg.content.url,
        pinned: msg.content.pinned
      }, function (tabs) {
        let tabIds = $.map(tabs, function (tab) {
          return tab.id
        })
        chrome.tabs.remove(tabIds)
      })
      break;
    // 高亮Tab
    case 'highlightTab':
      var content = JSON.parse(msg.content)
      chrome.tabs.query({
        url: content.url,
        pinned: content.pinned == 'true'
      }, function (tabs) {
        $.map(tabs, function (tab) {
          chrome.tabs.update(tab.id, { pinned: false }, function (newTab) {
            sendChromeNotification(new Date().getTime().toString(), {
              type: "basic",
              title: content.title ? content.title : "京价保未能自动完成任务",
              message: "需要人工辅助，已将窗口切换至需要操作的标签" ,
              iconUrl: 'static/image/128.png'
            })
            chrome.tabs.highlight({
              tabs: newTab.index
            })
          })
          return tab.id
        })
      })
      break;
    case 'couponReceived':
      var coupon = msg.content
      var mute_coupon = getSetting('mute_coupon')
      if (mute_coupon && mute_coupon == 'checked') {
        console.log('coupon', msg)
      } else {
        sendChromeNotification( new Date().getTime().toString() + "_coupon_" + coupon.batch, {
          type: "basic",
          title: msg.title,
          message: coupon.name + coupon.price,
          isClickable: true,
          iconUrl: 'static/image/coupon.png'
        })
      }
      break;
    // 发现新订单
    case 'findOrder':
      setTimeout(async () => {
        findOrder(msg.orderId, msg.order);
      }, 50);
      break;
    // 新的订单商品
    case 'findGood':
      setTimeout(async () => {
        findGood(msg.orderId, msg.good);
      }, 500);
      setTimeout(async () => {
        await updateOrders()
      }, 1000);
      break;
    // 查询商品列表
    case 'getOrders':
      setTimeout(async () => {
        await updateOrders()
      }, 50);
      break;
    // 查询消息列表
    case 'getMessages':
      setTimeout(async () => {
        await updateMessages()
      }, 50);
      break;
    case 'clearUnread':
      updateUnreadCount(-999)
      break;
    case 'myTab':
      sendResponse({
        tab: sender.tab
      });
      break;
    default:
      console.log("Received %o from %o, frame", msg, sender.tab, sender.frameId);
  }
  // 更新图标
  updateIcon()
  // task log
  if (msg.log && msg.task) {
    setTimeout(async () => {
      await findAndUpdateTaskResult(msg.task.id, {
        action: msg.action,
        title: msg.title,
        content: msg.content,
        timestamp: Date.now()
      })
    }, 50);
  }
  // 保存消息
  switch (msg.action) {
    case 'notice':
    case 'priceProtectionNotice':
    case 'couponReceived':
    case 'goldCoinReceived':
    case 'beanReceived':
    case 'checkin_notice':
      if (msg.test) {
        break;
      }
      // 如果是单次任务完成的通知
      if (msg.task && msg.task.onetimeKey) {
        saveSetting(`task_onetime_${msg.task.onetimeKey}`, {
          time: new Date(),
          message: msg.message
        })
      }
      let message = {
        taskId: msg.task ? msg.task.id : null,
        type: msg.type || msg.action || msg.text, // 通知的类型
        batch: msg.batch, // 批次，通常是优惠券的属性
        reward: msg.reward, // 奖励的类型
        unit: msg.unit || msg.reward || msg.batch, // 奖励的单位
        value: msg.value, // 奖励的数量
        title: msg.title,
        content: msg.content,
        timestamp: Date.now()
      }
      let uuid = msg.uuid || Date.now()
      updateUnreadCount(1)
      setTimeout(async () => {
        await newMessage(uuid, message);
      }, 50);
      setTimeout(async () => {
        await updateMessages()
      }, 3000);
      break;
  }
  if (msg.action != 'saveAccount') {
    log('message', msg.text, msg);
  }
  return true
});

Logline.keep(3);


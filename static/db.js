import Dexie from 'dexie';
import { readableTime, getSetting, saveSetting } from './utils'
import { DateTime } from 'luxon'

//
// Declare Database
//
const db = new Dexie("orders");

db.version(1).stores({ orders: "++id,timestamp" });
db.version(1).stores({ messages: "++id,type,timestamp" });

db.version(2).stores({
  orders: "++id,timestamp",
  messages: "++id,type,timestamp",
});

db.version(3).stores({
  orders: "++id,timestamp",
  messages: "++id,type,timestamp",
  taskLogs: "++id,taskId,timestamp",
});

async function findGood(orderId, good) {
  await db.orders.where('id').equals(orderId).modify(order => {
    order.goods.push(good);
  });
}

async function findOrder(orderId, data) {
  let order = await db.orders.where('id').equals(orderId).toArray();
  if (order && order.length > 0) return await db.orders.update(orderId, data)
  let orderInfo = Object.assign(data, {
    id: orderId,
  })
  return await db.orders.add(orderInfo);
}

async function updateOrders() {
  let proDays = getSetting('price_pro_days', 15)
  let proTime = Date.now() - 60*60*1000*24*proDays;
  let orders = await db.orders.where('timestamp').above(proTime).reverse().sortBy('timestamp')

  if (orders && orders.length > 0) {
    orders = orders.filter(order => order.goods && order.goods.length > 0);
  }
  saveSetting('jjb_orders', orders)
  chrome.runtime.sendMessage({
    action: "orders_updated",
    orders: orders
  });
}

async function newMessage(messageId, data) {
  let message = await db.messages.where('id').equals(messageId).toArray();
  if (message && message.length > 0) return await db.messages.update(messageId, data)
  let messageInfo = Object.assign(data, {
    id: messageId,
  })
  return await db.messages.add(messageInfo);
}

async function updateMessages() {
  // 最多只展示最近 30 天的消息
  let last30Day = Date.now() - 60*60*1000*24*30;
  let messages = await db.messages.where('timestamp').above(last30Day).reverse().sortBy('timestamp')
  saveSetting('jjb_messages', messages)
  chrome.runtime.sendMessage({
    action: "messages_updated",
    messages: messages
  });
}

async function getTodayMessagesByTaskId(taskId) {
  let now = new Date();
  let startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()) / 1
  let messages = await db.messages.where('timestamp').above(startOfDay).reverse().sortBy('timestamp')
  let todayMessages = messages.filter((message) => {
    return message.taskId == taskId
  })
  saveSetting(`temporary:task-messages:${taskId}:${startOfDay}`, todayMessages)
}

async function addTaskLog(task) {
  const timestamp = Date.now()
  await db.taskLogs.add({
    id: timestamp,
    taskId: task.id,
    timestamp: timestamp,
    mode: task.mode,
    results: []
  });
}

async function findAndUpdateTaskResult(taskId, result) {
  let lastTwoMinute = Date.now() - 60*60*5;
  const lastRunLog = (await db.taskLogs.where('timestamp').above(lastTwoMinute).reverse().sortBy('timestamp')).find((log) => {
    return log.taskId == taskId
  })
  console.log('lastRunLog', lastRunLog)
  if (lastRunLog) {
    await db.taskLogs.where('id').equals(lastRunLog.id).modify(log => {
      log.results.push(result);
    });
  }
}

async function getTaskLog(taskId, days = 7) {
  let lastWeek = Date.now() - 60*60*1000*24*days;
  const taskLogs = await db.taskLogs.where('timestamp').above(lastWeek).filter((log) => {
    return log.taskId == taskId
  }).reverse().sortBy('timestamp')
  return taskLogs.map((log) => {
    log.displayTime = readableTime(DateTime.fromMillis(log.timestamp));
    return log
  })
}

async function countTaskLog(taskId, hours = 1) {
  let lastHours = Date.now() - 60*60*1000*hours;
  return await db.taskLogs.where('timestamp').above(lastHours).filter((log) => {
    return log.taskId == taskId
  }).count()
}

async function getTaskUsageAndSave(taskId) {
  const actualUsage = {
    hour: await countTaskLog(taskId, 1) || 0,
    daily: await countTaskLog(taskId, 24) || 0,
    weekly: await countTaskLog(taskId, 24*7) || 0,
  }
  saveSetting(`task-usage:${taskId}`, actualUsage)
}

function getTaskUsageImmediately(taskId) {
  const usage = getSetting(`task-usage:${taskId}`, {
    hour: 0,
    daily: 0,
    weekly: 0
  })
  getTaskUsageAndSave(taskId)
  return usage
}

function getTodayMessagesByTaskIdImmediately(taskId) {
  let now = new Date();
  let startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()) / 1
  const messages = getSetting(`temporary:task-messages:${taskId}:${startOfDay}`, [])
  getTodayMessagesByTaskId(taskId)
  return messages
}

module.exports = {
  findGood,
  findOrder,
  updateOrders,
  newMessage,
  updateMessages,
  addTaskLog,
  getTaskLog,
  findAndUpdateTaskResult,
  getTaskUsageImmediately,
  getTodayMessagesByTaskIdImmediately
};
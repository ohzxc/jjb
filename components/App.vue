<template>
  <div>
    <settings :login-state="loginState" @show-login="showLoginState = true" @update-order-link="updateDisableOrderLink"></settings>
    <div class="contents">
      <div class="weui-tab">
        <div class="weui-navbar">
          <div :class="`weui-navbar__item ${contentType == 'orders' ? 'weui-bar__item_on' : ''}`" @click="switchContentType('orders')">
            最近订单
            <a
              href="https://order.jd.com/center/list.action"
              target="_blank"
              data-tippy-placement="top-start"
              class="tippy"
              data-tippy-content="打开京东订单列表"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                style="margin-bottom: -1px"
              >
                <path fill="#fff" stroke="#888" d="M1.5 4.518h5.982V10.5H1.5z"></path>
                <path
                  d="M5.765 1H11v5.39L9.427 7.937l-1.31-1.31L5.393 9.35l-2.69-2.688 2.81-2.808L4.2 2.544z"
                  fill="#888"
                ></path>
                <path
                  d="M9.995 2.004l.022 4.885L8.2 5.07 5.32 7.95 4.09 6.723l2.882-2.88-1.85-1.852z"
                  fill="#fff"
                ></path>
              </svg>
            </a>
          </div>
          <div :class="`weui-navbar__item ${contentType == 'messages' ? 'weui-bar__item_on' : ''}`" @click="switchContentType('messages')">
            最近通知
            <span class="weui-badge" v-if="unreadCount > 0">{{unreadCount}}</span>
          </div>
          <div :class="`weui-navbar__item zaoshu-tab ${contentType == 'discounts' ? 'weui-bar__item_on' : ''}`" @click="switchContentType('discounts')">
            <img src="../static/image/zaoshu.png" alt="" class="zaoshu-icon">
            枣树集惠
            <span
              class="weui-badge weui-badge_dot new-discounts"
              v-if="newDiscounts"
            ></span>
          </div>
        </div>
        <div class="weui-tab__panel">
          <div id="orders" v-if="contentType == 'orders'" class="weui-cells contents-box orders">
            <ul v-if="orders && orders.length > 0">
              <li
                v-for="order in orders"
                :key="order.id"
                v-show="(order.promotionInfo && hiddenPromotionIds.indexOf(order.id) < 0) || (order.goods && order.goods.length > 0)"
              >
                <div class="order_time">
                  <span v-show="order.displayTime">下单时间： {{order.displayTime}}</span>
                  <span v-show="order.promotionInfo">{{order.promotionInfo}}</span>
                  <span
                    v-if="order.promotionInfo"
                    v-tippy
                    title="不感兴趣"
                    class="dismiss"
                    @click="dismiss(order)"
                  >&times;</span>
                  <span
                    v-else
                    v-show="order.id"
                    v-tippy
                    :title="hiddenOrderIds.indexOf(order.id) > -1 ? '显示订单' : '隐藏订单'"
                    :class="hiddenOrderIds.indexOf(order.id) > -1 ? 'show-order' : 'hide-order'"
                    @click="toggleOrder(order)"
                  ></span>
                </div>
                <div class="weui-cell promotion" v-if="order.promotionInfo">
                  <div class="weui-cell__bd">
                    <div class="good_title">
                      <img
                        v-if="order.img"
                        :src="`https:${order.img}`"
                        @error.once="backup_picture($event)"
                        class="promotion_title backup_picture"
                        :alt="order.title"
                      >
                      <a :href="`${order.link}`" target="_blank">{{order.title}}</a>
                      <p class="description">{{order.description}}</p>
                    </div>
                  </div>
                  <div class="weui-cell__ft">
                    <span class="promotion_price">{{order.priceInfo}}</span>
                    <a
                      :href="`${order.link}`"
                      target="_blank"
                      class="buy-btn weui-btn weui-btn_mini weui-btn_primary"
                    >{{order.buttonText}}</a>
                  </div>
                </div>
                <div
                  v-for="(good, index) in order.goods"
                  :key="index"
                  :class="`order-good ${good.suspended}`"
                  v-show="hiddenOrderIds.indexOf(order.id) > -1 ? false : true"
                >
                  <div class="weui-cell good" v-if="good && good.order_price > 0">
                    <div class="weui-cell__bd">
                      <div class="good_title">
                        <div class="good_img">
                          <img
                            v-if="good.img"
                            :src="`https:${good.img}`"
                            @error.once="backup_picture($event)"
                            class="backup_picture"
                            :alt="good.name"
                          >
                          <div class="monitoring">
                            <span v-if="good.suspended" @click="toggleSuspend(order, good, index)" class="resume" v-tippy title="恢复价保"></span>
                            <span v-else class="suspend" @click="toggleSuspend(order, good, index)" v-tippy title="停止价保"></span>
                          </div>
                        </div>
                        <p v-if="good.sku">
                          <a v-if="!disableOrderLink" :href="`https://jjb.zaoshu.so/good/${good.sku}`" target="_blank"> {{good.name}}</a>
                          <a v-else>{{good.name}}</a>
                          <span
                            class="count"
                            v-if="good.quantity"
                          >&times; {{good.quantity}}</span>
                        </p>
                      </div>
                    </div>
                    <div class="weui-cell__ft">
                      <span class="order_price">￥{{good.order_price}}</span>
                      <div class="sku_price" v-if="skuPriceList[good.sku]">
                        <span
                          class="new_price down"
                          v-if="good.order_price > skuPriceList[good.sku].price"
                        >￥{{skuPriceList[good.sku].price}}</span>
                        <span
                          class="new_price up"
                          v-else-if="good.order_price < skuPriceList[good.sku].price"
                        >￥{{skuPriceList[good.sku].price}}</span>
                        <span class="new_price" v-else>￥{{skuPriceList[good.sku].price}}</span>
                      </div>
                    </div>
                  </div>
                  <p :class="`log ${log.status}`" v-for="(log, index) in good.logs" :key="index">{{log.message}}</p>
                </div>
              </li>
              <p class="text-tips">
                <a
                  href="https://blog.jjb.im/price-protection-policy.html"
                  target="_block"
                  v-tippy
                  title="点击了解京东价格保护政策"
                >只显示在价保监控范围内且下单金额大于0的订单（默认15天内）</a>
              </p>
            </ul>
            <div class="no_order" v-else>
              <div v-if="loadingOrder">
                <h4>正在加载最近订单</h4>
              </div>
              <div v-else>
                <h4>暂时还没有监控到订单</h4>
                <p class="tips">只显示选定范围的订单(默认为最近7天)</p>
              </div>
            </div>
          </div>
          <div id="messages" v-if="contentType == 'messages'" class="weui-cells contents-box messages">
            <div class="messages-top">
              <div class="messages-header message-type">
                <div role="radiogroup" class="el-radio-group">
                  <label
                    role="radio"
                    tabindex="-1"
                    class="el-radio-button el-radio-button--mini is-active"
                  >
                    <input
                      type="radio"
                      v-model="selectedTab"
                      tabindex="-1"
                      class="el-radio-button__orig-radio"
                      value="checkin_notice"
                    >
                    <span class="el-radio-button__inner">签到记录</span>
                  </label>
                  <label
                    role="radio"
                    aria-disabled="true"
                    tabindex="-1"
                    class="el-radio-button el-radio-button--mini"
                  >
                    <input
                      type="radio"
                      v-model="selectedTab"
                      tabindex="-1"
                      class="el-radio-button__orig-radio"
                      value="notice"
                    >
                    <span class="el-radio-button__inner">价保记录</span>
                  </label>
                  <label
                    role="radio"
                    aria-disabled="true"
                    tabindex="-1"
                    class="el-radio-button el-radio-button--mini"
                  >
                    <input
                      type="radio"
                      v-model="selectedTab"
                      tabindex="-1"
                      class="el-radio-button__orig-radio"
                      value="coupon"
                    >
                    <div class="el-radio-button__inner">
                      领券记录
                    </div>
                  </label>
              </div>
              </div>
            </div>
            <div class="message-items" v-if="messages && messages.length > 0">
              <li v-for="(message, index) in messages" :key="index">
                <div
                  :class="`weui-panel__bd message-item type-${message.type}`"
                  v-show="!selectedTab || selectedTab == message.type"
                >
                  <div class="weui-media-box weui-media-box_text">
                    <h4 class="weui-media-box__title message">
                      <i :class="`${message.type} ${message.batch} ${message.unit}`"></i>
                      {{message.title}}
                    </h4>
                    <div class="coupon-box" v-if="message.coupon">
                      <p>
                        <span class="price">{{message.coupon.price}}</span>
                      </p>
                      <a
                        v-if="message.coupon.batch == 'baitiao'"
                        href="https://vip.jr.jd.com/coupon/myCoupons?default=IOU"
                        target="_blank"
                      >{{message.coupon.name}}</a>
                      <a
                        v-else-if="message.coupon.batch"
                        :href="`https://search.jd.com/Search?coupon_batch=${message.coupon.batch}`"
                        target="_blank"
                      >{{message.coupon.name}}</a>
                      <a
                        v-else
                        href="https://jjb.zaoshu.so/event/jdc?e=0&p=AyIPZRprFDJWWA1FBCVbV0IUWVALHFRBEwQAQB1AWQkrW1N8UGM3WyZ1VmxSCHMIE1dEbytsKxkOfARUG1IJAhMbVR5KFQsZBFUQWhAyEQ5UH10XARcFZRhYFAQRN2UbWiVJfAZlG1sdBhEBXR5dFDISA1cTXxUBFwBQG1McMhU3F18ES1kiN2UrayUCEjdVKwRRX08%3D&t=W1dCFFlQCxxUQRMEAEAdQFkJ"
                        target="_blank"
                      >{{message.coupon.name}}</a>
                    </div>
                    <p v-else class="weui-media-box__desc">{{message.content}}</p>
                    <ul class="weui-media-box__info">
                      <li class="weui-media-box__info__meta">时间: {{message.time}}</li>
                    </ul>
                  </div>
                </div>
              </li>
            </div>
            <div class="no_message" v-else>暂时还没有未读消息</div>
          </div>
          <discounts v-if="contentType == 'discounts'"/>
        </div>
      </div>
      <div class="bottom">
        <div class="weui-tabbar">
          <a id="pricePro" class="weui-tabbar__item" v-tippy title="打开京东价格保护页面">
            <img src="../static/image/money.png" alt="" class="weui-tabbar__icon">
            <p class="weui-tabbar__label">价保页面</p>
          </a>
          <a
            class="showChangelog weui-tabbar__item"
            @click="showChangelog"
            v-tippy
            :title="`当前版本：${currentVersion}，查看京价保最近更新记录`"
            style="position: relative;"
          >
            <img src="../static/image/update.png" alt="" class="weui-tabbar__icon">
            <p class="weui-tabbar__label">
              最近更新
              <span
                class="weui-badge weui-badge_dot"
                style="position: absolute;top: 0;right: 4em;"
                v-if="newChangelog"
              ></span>
              <span
                class="weui-badge"
                style="position: absolute;top: -.4em;right: 2em;"
                v-if="newVersion"
              >有新版</span>
            </p>
          </a>
          <a
            id="openGithub"
            class="weui-tabbar__item"
            href="https://github.com/sunoj/jjb"
            v-tippy
            title="点击查看本插件的全部代码"
            target="_blank"
          >
            <img src="../static/image/github.png" alt="" class="weui-tabbar__icon">
            <p class="weui-tabbar__label">源代码</p>
          </a>
        </div>
      </div>
    </div>
    <div class="dialogs">
      <guide v-if="showGuide" :login-state="loginState"></guide>
      <login-notice v-if="showLoginState" :state="loginState" @close="showLoginState = false"></login-notice>
      <popup v-if="showPopup" @close="showPopup = false"></popup>
    </div>
  </div>
</template>

<script>
import * as _ from "lodash";
import tippy from "tippy.js";
import weui from "weui.js";
import Vue from "vue";

import { DateTime } from 'luxon'
import { getLoginState } from '../static/account'
import { getSetting, versionCompare, readableTime, saveSetting } from "../static/utils";
import { stateText } from "../static/variables";

function tippyElement(el) {
  setTimeout(() => {
    let title = el.getAttribute("title");
    if (title) {
      if (el._tippy) {
        el._tippy.setContent(title)
      } else {
        tippy(el, {
          content: title
        });
      }
    }
  }, 50);
}

Vue.directive("tippy", {
  componentUpdated: tippyElement,
  inserted: tippyElement
});

Vue.directive("autoSave", {
  bind(el, binding, vnode) {
    function revertValue(el, binding) {
      let current = getSetting(el.name, (binding.value && binding.value.current) ? binding.value.current : null);
      if (el.type == "checkbox") {
        if (current == "checked") {
          el.checked = true;
        } else {
          el.checked = false;
        }
      } else if (el.type == "select-one") {
        el.value = current || el.options[0].value;
      } else {
        el.value = current;
      }
    }
    let autoSaveEvent = new Event('auto-save');
    function saveToLocalStorage(el, binding) {
      if (el.type == "checkbox") {
        if (el.checked) {
          localStorage.setItem(el.name, "checked");
        } else {
          localStorage.removeItem(el.name);
        }
      } else {
        localStorage.setItem(el.name, el.value);
      }
      el.dispatchEvent(autoSaveEvent);
      weui.toast("设置已保存", 500);
    }
    revertValue(el, binding);
    el.addEventListener("change", function(event) {
      if (binding.value && binding.value.notice && el.checked) {
        weui.confirm(
          binding.value.notice,
          function() {
            saveToLocalStorage(el, binding);
          },
          function() {
            event.preventDefault();
            setTimeout(() => {
              revertValue(el, binding);
            }, 50);
          },
          {
            title: "选项确认"
          }
        );
      } else {
        saveToLocalStorage(el, binding);
      }
    });
  }
});

import loginNotice from './login-notice.vue';
import discounts from './discounts.vue';
import settings from './settings.vue';
import guide from './guide.vue';
import popup from './popup.vue';

export default {
  name: "App",
  components: { loginNotice, discounts, settings, guide, popup },
  data() {
    return {
      messages: [],
      orders: [],
      skuPriceList: {},
      stateText: stateText,
      newDiscounts: false,
      loadingOrder: false,
      showPopup: true,
      showLoginState: false,
      currentVersion: "{{version}}",
      disableOrderLink: getSetting("disabled_link") == "checked" ? true : false,
      newChangelog: versionCompare(getSetting("changelog_version", "2.0"), "{{version}}") < 0,
      hiddenOrderIds: getSetting("hiddenOrderIds", []),
      hiddenPromotionIds: getSetting("hiddenPromotionIds", []),
      selectedTab: null,
      contentType: 'orders',
      newVersion: getSetting("newVersion", null),
      unreadCount: getSetting("unreadCount", null),
      olduser: getSetting('jjb_admission-test', false),
      showGuideAt: getSetting('showGuideAt', false),
      loginState: {
        default: true,
        description: "未能获取登录状态",
        m: {
          state: "unknown"
        },
        pc: {
          state: "unknown"
        }
      }
    };
  },
  mounted: async function() {
    // 渲染订单
    setTimeout(() => {
      this.renderOrders()
    }, 50);
    // 查询最新优惠
    setTimeout(() => {
      this.getLastDiscount()
    }, 100);
    // 渲染通知
    setTimeout(() => {
      this.renderMessages()
    }, 500);
    this.dealWithLoginState()

    // 接收消息
    chrome.runtime.onMessage.addListener((
      message,
      sender,
      sendResponse
    ) => {
      switch (message.action) {
        case "orders_updated":
          this.renderOrders(message.orders)
          break;
        case "messages_updated":
          this.renderMessages(message.messages);
          break;
        case "loginState_updated":
          this.dealWithLoginState();
          break;
        default:
          break;
      }
    });
  },
  computed: {
    showGuide: function() {
      if (!this.olduser && !this.showGuideAt) {
        return true
      } else {
        return false
      }
    }
  },
  methods: {
    getLastDiscount: async function() {
      let response = await fetch("https://jjb.zaoshu.so/discount/last");
      let lastDiscount = await response.json();
      let readDiscountAt = localStorage.getItem("readDiscountAt");
      if (
        !readDiscountAt ||
        new Date(lastDiscount.createdAt) > new Date(readDiscountAt)
      ) {
        this.newDiscounts = true;
      }
    },
    switchContentType: function(type) {
      this.contentType = type
      switch (type) {
        case "messages":
          this.renderMessages()
          this.readMessages()
          break;
        case "discounts":
          this.readDiscounts()
          break;
        case "orders":
          this.renderOrders()
          break;
        default:
          break;
      }
    },
    updateDisableOrderLink: function() {
      setTimeout(() => {
        this.disableOrderLink = getSetting("disabled_link") == "checked" ? true : false
      }, 1000);
    },
    readMessages: function () {
      this.unreadCount = 0
      chrome.runtime.sendMessage({
        action: "clearUnread"
      }, function (response) {
        console.log("Response: ", response);
      });
    },
    readDiscounts: function() {
      this.newDiscounts = false
    },
    getPromotions: function() {
      let promotions = getSetting("promotions", []);
      promotions = _.reject(promotions, promotion => {
        return (
          DateTime.fromJSDate(new Date(promotion.validDate)) < DateTime.local()
        );
      });
      saveSetting("promotions", promotions);
      return promotions;
    },
    renderMessages: function(messages) {
      if (!messages) {
        messages = getSetting('jjb_messages', [])
        chrome.runtime.sendMessage({ action: "getMessages" })
      }
      this.messages = messages.map(function(message) {
        if (message.type == "coupon") {
          message.coupon = message.content;
        }
        message.time = readableTime(message.timestamp ? DateTime.fromMillis(message.timestamp) : DateTime.fromISO(message.time));
        return message;
      });
    },
    renderOrders: function(orders) {
      if (!orders) {
        orders = getSetting("jjb_orders", [])
        chrome.runtime.sendMessage({ action: "getOrders" })
      }
      let skuPriceList = getSetting("skuPriceList", {});
      let suspendedApplyIds = getSetting("suspendedApplyIds", []);
      if (orders) {
        orders = orders.map(function(order) {
          order.displayTime = readableTime(DateTime.fromMillis(order.timestamp));
          order.goods = order.goods.map(function(good, index) {
            good.suspended = _.indexOf(suspendedApplyIds, `applyBT_${order.id}_${good.sku}_${index+1}`) > -1 ? "suspended" : false
            return good
          })
          return order;
        });
      } else {
        orders = [];
      }
      let promotions = this.getPromotions();
      orders.splice(1, 0, ...promotions);
      this.orders = orders;
      this.skuPriceList = skuPriceList;
    },
    // 处理登录状态
    dealWithLoginState: function() {
      function getStateDescription(loginState, type) {
        return (
          stateText[loginState[type].state] +
          (loginState[type].message
            ? `（ ${loginState[type].message} 上次检查： ${readableTime(
                DateTime.fromISO(loginState[type].time)
              )} ）`
            : "")
        );
      }

      let loginState = getLoginState();
      this.loginState = loginState;

      this.loginState["pc"].description = "当前登录状态" + getStateDescription(loginState, "pc");
      this.loginState["m"].description = "当前登录状态" + getStateDescription(loginState, "m");
      this.loginState.description = "PC网页版登录" + getStateDescription(loginState, 'pc') + "，移动网页版登录" + getStateDescription(loginState, 'm')

      // 如果登录失败，那么显示提示
      if (loginState.class == "failed") {
        this.showLoginState = true
      }
    },
    selectType: function(type) {
      this.selectedTab = type;
    },
    dismiss: function(order) {
      this.hiddenPromotionIds.push(order.id);
      saveSetting("hiddenPromotionIds", this.hiddenPromotionIds);
      this.$forceUpdate();
    },
    toggleOrder: function(order) {
      if (_.indexOf(this.hiddenOrderIds, order.id) > -1) {
        this.hiddenOrderIds = _.pull(this.hiddenOrderIds, order.id);
      } else {
        this.hiddenOrderIds.push(order.id);
      }
      saveSetting("hiddenOrderIds", this.hiddenOrderIds);
      this.$forceUpdate();
    },
    toggleSuspend: function (order, good, index) {
      // localStorage.setItem(`order_${order.id}_index_${index}`, 'suspended')
      let suspendedApplyIds = getSetting("suspendedApplyIds", []);
      let applyId = `applyBT_${order.id}_${good.sku}_${index+1}`
      if (_.indexOf(suspendedApplyIds, applyId) > -1) {
        suspendedApplyIds = _.pull(suspendedApplyIds, applyId);
        good.suspended = false
      } else {
        suspendedApplyIds.push(applyId);
        good.suspended = "suspended"
      }
      localStorage.setItem(
        "suspendedApplyIds",
        JSON.stringify(suspendedApplyIds)
      );
    },
    showChangelog: function() {
      this.newChangelog = false;
      localStorage.setItem("changelog_version", this.currentVersion);
      weui.dialog({
        title: "更新记录",
        content: `
          <iframe id="changelogIframe" frameborder="0" src="https://jjb.zaoshu.so/changelog?buildId={{buildid}}&browser={{browser}}" style="width: 100%;min-height: 350px;"
          ></iframe>
        `,
        className: "changelog",
        buttons: [
          {
            label: "完成",
            type: "primary"
          }
        ]
      });
    }
  }
};
</script>

<style scoped>
.orders, .messages, .discounts{
  overflow: hidden;
  height: 510px;
  width: 431px;
}

.contents-box.orders ul{
  height: 510px;
  overflow-y: auto;
}
.message-items {
  margin-top: 45px;
  height: 460px;
  overflow-y: auto;
}
.order-good.suspended{
  opacity: 0.5
}
.weui-navbar.true .weui-navbar__item.weui-bar__item_on{
  background-image: linear-gradient(180deg,#09bb07,#06a90c94);
}

.messages-header {
    display: flex;
    border-bottom: 1px solid #ebeef5;
    height: 32px;
    padding-top: 6px;
    position: fixed;
    width: 432px;
    background: #fafafa;
    z-index: 10;
}

.el-radio-group{
  margin: 0 auto;
}
</style>
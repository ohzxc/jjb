<template>
  <div class="settings">
    <div class="weui-tab">
      <div :class="`${scienceOnline} weui-navbar`">
        <div class="weui-navbar__item weui-bar__item_on" data-type="frequency_settings">
          任务设置
        </div>
        <div class="weui-navbar__item" data-type="notice_settings">通知设置</div>
        <div class="weui-navbar__item" data-type="other_settings">高级设置</div>
      </div>
      <div class="weui-tab__panel">
        <form
          id="settings"
          data-persist="garlic"
          data-domain="true"
          data-destroy="false"
          method="POST"
        >
          <div class="frequency_settings settings_box">
            <div class="tasks">
              <div class="task-type">
                <div role="radiogroup" class="el-radio-group">
                  <label
                    role="radio"
                    tabindex="-1"
                    class="el-radio-button el-radio-button--mini is-active"
                  >
                    <input
                      type="radio"
                      v-model="taskType"
                      tabindex="-1"
                      class="el-radio-button__orig-radio"
                      value="enabled"
                    >
                    <span class="el-radio-button__inner">自动运行</span>
                  </label>
                  <label
                    role="radio"
                    aria-disabled="true"
                    tabindex="-1"
                    class="el-radio-button el-radio-button--mini"
                  >
                    <input
                      type="radio"
                      v-model="taskType"
                      tabindex="-1"
                      class="el-radio-button__orig-radio"
                      value="disabled"
                    >
                    <span class="el-radio-button__inner">暂未启用</span>
                  </label>
                  <label
                    role="radio"
                    aria-disabled="true"
                    tabindex="-1"
                    v-if="newTasks && newTasks.length > 0"
                    class="el-radio-button el-radio-button--mini"
                  >
                    <input
                      type="radio"
                      v-model="taskType"
                      tabindex="-1"
                      class="el-radio-button__orig-radio"
                      value="new"
                    >
                    <div class="el-radio-button__inner">
                      新任务
                    </div>
                  </label>
                </div>
              </div>
              <div class="task-list">
                <div class="weui-cells weui-cells_form">
                  <div
                    class="task-item"
                    v-for="task in tasks"
                    :key="task.id"
                    @mouseover="hover = task.id" @mouseleave="hover = false"
                  >
                    <div class="weui-cell weui-cell_select weui-cell_select-after">
                      <div class="weui-cell__bd job-m">
                        <span :title="task.description" v-tippy>
                          <a
                            v-if="task.platform == 'm'"
                            class="openMobilePage"
                            :data-url="task.url"
                          >{{task.title}}</a>
                          <a v-else :href="task.baseUrl || task.url" target="_blank">{{task.title}}</a>
                        </span>
                        <span v-show="task.suspended && !task.checked" v-tippy title="因账号未登录任务已暂停运行">
                          <i class="job-state weui-icon-waiting-circle" @click="showLogin()"></i>
                        </span>
                        <i
                          v-show="task.checked"
                          v-tippy
                          :title="task.checkin_description"
                          class="today weui-icon-success-circle"
                        ></i>
                        <i
                          v-show="!task.checked && !task.suspended && !task.new"
                          @click="retryTask(task)"
                          class="reload-icon"
                          v-tippy
                          :title="task.last_run_description"
                        ></i>
                      </div>
                      <div class="weui-cell__bd">
                        <select class="weui-select" @auto-save="getTaskList" v-auto-save="{ current: `${task.frequency}` }" :name="`job${task.id}_frequency`">
                          <option
                            v-for="option in task.frequencyOption"
                            :value="option"
                            :key="option"
                          >{{ frequencyOptionText[option] }}</option>
                        </select>
                        <span class="enabled-task" v-if="task.new" @click="enabledTask(task)" v-tippy title="点击以启用新的任务">启用</span>
                        <i v-else v-show="hover == task.id" class="setting-task weui-icon-info-circle" @click="currentSettingTask = task.id" v-tippy title="查看任务设置"></i>
                      </div>
                    </div>
                    <task-setting :task="task" :current-task="currentSettingTask" @close="currentSettingTask = null"></task-setting>
                  </div>
                </div>
              </div>
            </div>
            <div class="tips bottom-tips">
              <p class="page__desc">
                <a id="notice">京东页面经常更新，唯有你的支持才能让京价保保持更新。</a>
                <span
                  class="weui-btn weui-btn_mini weui-btn_primary"
                  @click="switchPaymethod('wechat', 'ming')"
                >打赏</span>
              </p>
            </div>
          </div>
          <div class="notice_settings settings_box" style="display: none">
            <div class="weui-cells weui-cells_form">
              <div class="weui-cell weui-cell_switch">
                <div class="weui-cell__bd">不再提示签到通知</div>
                <div class="weui-cell__ft">
                  <input class="weui-switch" v-auto-save type="checkbox" name="mute_checkin">
                </div>
              </div>
              <div class="weui-cell weui-cell_switch">
                <div class="weui-cell__bd">不再提示领券通知</div>
                <div class="weui-cell__ft">
                  <input class="weui-switch" v-auto-save type="checkbox" name="mute_coupon">
                </div>
              </div>
              <div class="weui-cell weui-cell_switch">
                <div class="weui-cell__bd">隐藏价保商品信息</div>
                <div class="weui-cell__ft">
                  <input class="weui-switch" type="checkbox" v-auto-save name="hide_good">
                </div>
              </div>
              <div class="weui-cell weui-cell_switch">
                <div class="weui-cell__bd">
                  <span
                    data-tippy-placement="top-start"
                    class="tippy"
                    data-tippy-content="开启后不再晚上12点至凌晨6点发送浏览器通知"
                  >开启夜晚防打扰</span>
                </div>
                <div class="weui-cell__ft">
                  <input class="weui-switch" type="checkbox" v-auto-save name="mute_night">
                </div>
              </div>
              <div class="weui-cell weui-cell_switch">
                <div class="weui-cell__bd">
                  <span>
                    播放提示音效
                    <i
                      id="listen"
                      @click="listenAudio = true"
                      class="weui-icon-info-circle tippy"
                      data-tippy-content="试听全部提示音效"
                    ></i>
                  </span>
                </div>
                <div class="weui-cell__ft">
                  <input class="weui-switch" type="checkbox" v-auto-save name="play_audio">
                </div>
              </div>
            </div>
            <div class="other_actions">
              <div class="recommendation">
                <h3 style="text-align: center;color: #666;">服务推荐</h3>
                <p class="recommendServices">
                  <span
                    :class="service.class"
                    v-for="service in recommendServices"
                    :key="service.title"
                  >
                    <a
                      target="_blank"
                      v-tippy
                      :title="service.description"
                      :href="service.link"
                    >{{service.title}}</a>
                  </span>
                </p>
                <div class="recommendedLink">
                  <p v-for="link in recommendedLinks" :key="link.title">
                    <a
                      v-if="link.mobile"
                      class="openMobilePage"
                      :style="link.style"
                      :data-url="link.url"
                    >{{link.title}}</a>
                    <a
                      v-else
                      :href="link.url"
                      :style="link.style"
                      class="weui-form-preview__btn weui-form-preview__btn_primary"
                      target="_blank"
                    >{{link.title}}</a>
                  </p>
                </div>
              </div>
              <h3 style="text-align: center;color: #666;">关注京价保</h3>
              <p style="text-align: center;margin-top: -10px;">
                <a
                  href="https://t.me/jingjiabao"
                  class="weui-btn weui-btn_mini weui-btn_plain-default tippy"
                  data-tippy-placement="top-start"
                  data-tippy-content="通过电报群接收京价保的最新消息"
                  target="_blank"
                >京价保@Telegram</a>
                <a
                  href="#"
                  id="openWechatCard"
                  class="weui-btn weui-btn_mini weui-btn_plain-default tippy"
                  data-tippy-placement="top-start"
                  data-tippy-content="关注京价保的公众号"
                >京价保公众号</a>
              </p>
            </div>
          </div>
          <div class="other_settings settings_box" style="display: none">
            <div class="weui-cells weui-cells_form">
              <div class="weui-cell weui-cell_select weui-cell_select-after">
                <div class="weui-cell__bd">
                  <span
                    data-tippy-placement="top-start"
                    class="tippy"
                    data-tippy-content="京东价格保护的时间不同商品不同，大部分商品是7天价保"
                  >监控订单范围</span>
                </div>
                <div class="weui-cell__bd">
                  <select class="weui-select" v-auto-save name="price_pro_days">
                    <option value="7">最近7天</option>
                    <option value="15">最近15天</option>
                    <option value="30">最近30天</option>
                  </select>
                </div>
              </div>
              <div class="weui-cell weui-cell_select weui-cell_select-after">
                <div class="weui-cell__bd">
                  <span
                    data-tippy-placement="top-start"
                    class="tippy"
                    data-tippy-content="商品降价小于“最小价差”时将不会自动申请价保"
                  >最小价差</span>
                </div>
                <div class="weui-cell__bd">
                  <select class="weui-select" v-auto-save name="price_pro_min">
                    <option value="0.1">0.1元</option>
                    <option value="0.5">0.5元</option>
                    <option value="1">1元</option>
                    <option value="5">5元</option>
                  </select>
                </div>
              </div>
              <div class="weui-cell weui-cell_select weui-cell_select-after">
                <div class="weui-cell__bd">
                  <span
                    data-tippy-placement="top-start"
                    class="tippy"
                    data-tippy-content="京东生鲜类价格保护时默认提供“生鲜品类券”，可手动修改为“原返”，设置本选项后京价保将为您自动选择"
                  >生鲜价保模式</span>
                </div>
                <div class="weui-cell__bd">
                  <select class="weui-select" v-auto-save name="refund_type">
                    <option value="1">原返</option>
                    <option value="2">限生鲜品类京券</option>
                  </select>
                </div>
              </div>
              <div class="weui-cell weui-cell_switch">
                <div class="weui-cell__bd">
                  <span
                    data-tippy-placement="top-start"
                    class="tippy"
                    data-tippy-content="如果您是Plus会员，在价保时会选择使用Plus价格来做对比"
                  >我是Plus会员</span>
                </div>
                <div class="weui-cell__ft">
                  <input class="weui-switch" type="checkbox" v-auto-save name="is_plus">
                </div>
              </div>
              <!-- @if Browser='chrome' -->

              <div class="weui-cell weui-cell_switch" v-if="currentBrowser == 'chrome'">
                <div class="weui-cell__bd">
                  <span
                    data-tippy-placement="top-start"
                    class="tippy"
                    data-tippy-content="开启剁手保护模式后，每次购物时京价保将向你发起灵魂质问，帮你极致省钱"
                  >剁手保护模式</span>
                </div>
                <div class="weui-cell__ft">
                  <input class="weui-switch" type="checkbox" v-auto-save name="hand_protection">
                </div>
              </div>
              <div class="weui-cell weui-cell_switch" v-if="currentBrowser == 'chrome'">
                <div class="weui-cell__bd">
                  <span
                    data-tippy-placement="top-start"
                    class="tippy"
                    data-tippy-content="京东热卖是带有推荐的链接落地页，开启本选项后将自动为你把该页面跳转到商品页"
                  >自动跳转热卖页</span>
                </div>
                <div class="weui-cell__ft">
                  <input class="weui-switch" type="checkbox" v-auto-save name="auto_gobuy">
                </div>
              </div>
              <!-- @endif -->

              <div class="weui-cell weui-cell_switch">
                <div class="weui-cell__bd">
                  <span
                    data-tippy-placement="top-start"
                    class="tippy"
                    data-tippy-content="开启本选项后，发现商品降价有价保机会时，京价保只会发送浏览器提醒，而不会自动提交价保申请（不推荐开启此选项）"
                  >被动价保模式</span>
                </div>
                <div class="weui-cell__ft">
                  <input
                    class="weui-switch"
                    type="checkbox"
                    v-auto-save="{ notice: '开启本选项后，发现商品降价有价保机会时，京价保只会发送浏览器提醒，而不会自动提交价保申请' }"
                    name="prompt_only"
                  >
                </div>
              </div>
              <div class="weui-cell weui-cell_switch">
                <div class="weui-cell__bd">
                  <span
                    v-tippy
                    title="在右侧“最近订单”中京价保提供的商品链接包含了京东联盟的跳转，它不会影响你，却能给开发者提供一些收入，帮助京价保保持更新。"
                  >停用最近订单的链接</span>
                </div>
                <div class="weui-cell__ft">
                  <input
                    class="weui-switch"
                    type="checkbox"
                    v-on:change="updateDisableOrderLink"
                    v-auto-save="{
                        notice: '京价保展示的最近订单商品链接带有京东联盟的返利，使用该链接购买能给开发者提供一些收入，帮助京价保保持更新。确认要停用该链接吗？'
                      }"
                    name="disabled_link"
                  >
                </div>
              </div>
              <div class="weui-cell weui-cell_switch">
                <div class="weui-cell__bd">
                  <span
                    data-tippy-placement="top-start"
                    class="tippy"
                    data-tippy-content="停用价格走势功能将停止上报京价保在本地获取到的商品价格同时停止展示价格走势图"
                  >停用价格走势图</span>
                </div>
                <div class="weui-cell__ft">
                  <input
                    class="weui-switch"
                    type="checkbox"
                    v-auto-save="{ notice: '停用价格走势功能将停止上报京价保在本地获取到的商品价格，同时也会停止展示价格走势图' }"
                    name="disable_pricechart"
                  >
                </div>
              </div>
            </div>
            <div class="other_actions">
              <p class="help_btns" style="text-align: center;">
                <span class="el-tag el-tag--success">
                  <a
                    href="#"
                    id="openFeedback"
                    data-tippy-placement="top-start"
                    class="tippy"
                    data-tippy-content="向作者提供功能建议或京东活动的地址，帮助京价保及时更新"
                  >建议反馈</a>
                </span>
                <span class="el-tag el-tag--warning">
                  <a
                    href="https://blog.jjb.im/faq.html"
                    target="_blank"
                    data-tippy-placement="top-start"
                    class="tippy"
                    data-tippy-content="了解一些常见问题的解答"
                  >常见问题</a>
                </span>
              </p>
              <p style="text-align: center;">
                <a
                  href="#"
                  id="clearAccount"
                  class="weui-btn weui-btn_mini weui-btn_plain-default tippy"
                  data-tippy-placement="top-start"
                  data-tippy-content="在登录时勾选记住密码可保存新的密码"
                >清除账号密码和记录</a>
              </p>
            </div>
            <p class="text-tips version">当前版本：{{currentVersion}}</p>
          </div>
        </form>
      </div>
    </div>
    <div class="bottom-box">
      <div class="avatar">
        <a
          id="loginState"
          :class="`${loginState.class} login-state`"
          v-tippy
          @click="showLogin()"
          :title="loginState.description"
        ></a>
      </div>
      <div class="links">
        <span class="el-tag el-tag--success">
          <a
            href="#"
            class="switch-paymethod tippy"
            @click="switchPaymethod('wechat', 'ming')"
            data-tippy-placement="top-start"
            data-tippy-content="打赏开发者"
          >打赏开发者</a>
        </span>
        <span class="el-tag el-tag--danger">
          <a
            href="#"
            class="switch-paymethod"
            @click="switchPaymethod('alipay', 'redpack')"
            title="天天领支付宝红包"
            v-tippy
          >支付宝红包</a>
        </span>
        <span class="el-tag el-tag--warning">
          <a
            href="#"
            id="openjEventCard"
            data-tippy-placement="top-start"
            class="tippy"
            data-tippy-content="热门的促销活动推荐"
          >活动推荐</a>
        </span>
        <span class="el-tag">
          <a
            data-tippy-placement="top-start"
            class="tippy"
            data-tippy-content="PLUS会员每个月可以领取总额100元的全品类券，但是领取后24小时就会失效，因此推荐每次购物前领取"
            href="https://plus.jd.com/coupon/index"
            target="_blank"
          >领PLUS券</a>
        </span>
      </div>
    </div>
    <support v-if="showSupport" @close="showSupport = false" :initialPaymethod="paymethod" :initialTarget="target"></support>
    <!-- 试听音效 -->
    <div id="listenAudio" v-if="listenAudio">
      <div class="js_dialog" style="opacity: 1;">
        <div class="weui-mask"></div>
        <div class="weui-dialog">
          <div class="weui-dialog__hd">
            <strong class="weui-dialog__title">
              试听语言提示
            </strong>
          </div>
          <div class="weui-dialog__bd">
            <div class="weui-cells">
              <div class="weui-cell weui-cell_access">
                <div class="weui-cell__bd message listenVoice" data-type="notice" data-batch="jiabao">
                  <span>
                    <i class="notice jiabao"></i>发现价格保护机会
                  </span>
                </div>
                <div class="weui-cell__ft"></div>
              </div>
              <div class="weui-cell weui-cell_access">
                <div class="weui-cell__bd message listenVoice" data-type="notice" data-batch="rebate">
                  <span><i class="notice rebate"></i>金融会员领取到返利</span>
                </div>
                <div class="weui-cell__ft"></div>
              </div>
              <div class="weui-cell weui-cell_access">
                <div class="weui-cell__bd message listenVoice" data-type="checkin_notice" data-batch="bean">
                  <span><i class="checkin_notice bean"></i>签到成功，京豆入账</span>
                </div>
                <div class="weui-cell__ft"></div>
              </div>
              <div class="weui-cell weui-cell_access">
                <div class="weui-cell__bd message listenVoice" data-type="checkin_notice" data-batch="coin">
                  <span><i class="checkin_notice coin"></i>金融签到，钢镚掉落</span>
                </div>
                <div class="weui-cell__ft"></div>
              </div>
            </div>
          </div>
          <div class="weui-dialog__ft">
            <a class="weui-dialog__btn weui-dialog__btn_primary switch-paymethod" @click="() => {
                listenAudio = false;
                switchPaymethod('wechat', 'samedi')
              }">
              <i class="weui-icon-success"></i> 打赏声优</a>
            <a class="weui-dialog__btn weui-dialog__btn_default" @click="listenAudio = false">下次吧</a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { frequencyOptionText, getTasks  } from "../static/tasks";
import { recommendServices } from "../static/variables";
import { getSetting, saveSetting } from "../static/utils";
import taskSetting from "./task-setting.vue";
import support from './support.vue';

import weui from "weui.js";
export default {
  name: "settings",
  props: ["loginState"],
  components: { taskSetting, support },
  data() {
    return {
      frequencyOptionText: frequencyOptionText,
      recommendServices: getSetting("recommendServices", recommendServices),
      recommendedLinks: getSetting("recommendedLinks", []),
      currentBrowser: "{{browser}}",
      currentVersion: "{{version}}",
      scienceOnline: false,
      listenAudio: false,
      taskType: 'enabled',
      paymethod: 'weixin',
      target: 'ming',
      showSupport: false,
      currentSettingTask: null,
      taskList: [],
      hover: null
    };
  },
  mounted: async function() {
    this.getTaskList();
    // 测试是否科学上网
    setTimeout(() => {
      this.tryGoogle();
    }, 50);
  },
  watch: {
    loginState: function(newState, oldState) {
      this.getTaskList();
    }
  },
  computed: {
    newTasks: function() {
      return this.taskList.filter(task => task.new);
    },
    tasks: function() {
      switch (this.taskType) {
        case 'enabled':
          return this.taskList.filter(task => (task.frequency != "never" && !task.new));
          break;
        case 'disabled':
          return this.taskList.filter(task => task.frequency == "never");
          break;
        case 'new':
          return this.taskList.filter(task => task.new);
          break;
        default:
          return this.taskList
          break;
      }
    }
  },
  methods: {
    tryGoogle: async function() {
      try {
        let response = await fetch(
          "https://www.googleapis.com/discovery/v1/apis?name=abusiveexperiencereport"
        );
        if (response.status == "200") {
          this.scienceOnline = true;
        } else {
          this.scienceOnline = false;
        }
      } catch (error) {
        this.scienceOnline = false;
      }
    },
    showLogin: function() {
      this.$emit("show-login");
    },
    switchPaymethod: function(paymethod, target) {
      this.paymethod = paymethod
      this.target = target
      this.showSupport = true
    },
    updateDisableOrderLink: function() {
      this.$emit("update-order-link");
    },
    // 任务列表
    getTaskList: async function() {
      this.taskList = getTasks();
    },
    retryTask: function(task, hideNotice = false) {
      chrome.runtime.sendMessage(
        {
          action: "runTask",
          hideNotice: hideNotice,
          taskId: task.id
        },
        function(response) {
          if (!hideNotice) {
            if (response.result == "success") {
              weui.toast("手动运行成功", 3000);
            } else if (response.result == "pause") {
              weui.alert(response.message, { title: "任务已暂停运行" });
            } else {
              weui.alert(response.message, { title: "任务暂未运行" });
            }
          }
        }
      );
    },
    enabledTask: function (task) {
      saveSetting(`task-${task.id}:settings`, {
        new: false
      })
      weui.toast("任务启用成功", 1000);
      setTimeout(() => {
        this.getTaskList();
      }, 250);
      setTimeout(() => {
        this.taskType = "enabled"
      }, 500);
    }
  }
};
</script>
<style scoped>
.settings_box{
  overflow: hidden;
  height: 510px;
}

.settings .page__desc{
    font-size: 12px;
    height: 40px;
    line-height: 18px;
    color: #666;
}

.frequency_settings .weui-select {
  width: 9em;
}
.settings .task-list{
  margin-top: 5px;
  height: 425px;
  overflow-y: auto;
}

.task-item{
  position: relative;
}

.task-item:after {
  content: " ";
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  height: 1px;
  border-top: 1px solid #e5e5e5;
  color: #e5e5e5;
  -webkit-transform-origin: 0 0;
  transform-origin: 0 0;
  -webkit-transform: scaleY(.5);
  transform: scaleY(.5);
  left: 15px;
  z-index: 2;
}

.settings .task-list .weui-cells{
  margin-top: 0;
}

.tasks {
  height: 456px;
}

.enabled-task{
    color: #690;
    margin-left: 6px;
    cursor: pointer;
}

.setting-task{
  font-size: 19px;
  color: #6cc7f1;
  margin-left: 5px;
  margin-top: 0px;
  cursor: pointer;
}

.other_settings .other_actions{
  height: 140px;
}

.frequency_settings .weui-cell_select .weui-cell__bd:after {
  right: 60px;
}

.task-type {
  margin-top: 6px;
  text-align: center
}

</style>

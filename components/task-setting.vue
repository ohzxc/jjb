<template>
  <div class="task-setting" v-if="currentTask == task.id">
    <div class="js_dialog" style="opacity: 1;">
      <div class="weui-mask"></div>
      <div class="weui-dialog">
        <span class="js-close" @click="close">x</span>
        <div class="weui-dialog__hd title">
          <strong class="weui-dialog__title" >{{ task.title }}</strong>
        </div>
        <div class="weui-dialog__bd">
          <div role="radiogroup" class="el-radio-group">
            <label
              role="radio"
              tabindex="-1"
              class="el-radio-button el-radio-button--mini is-active"
            >
              <input
                type="radio"
                v-model="tab"
                tabindex="-1"
                class="el-radio-button__orig-radio"
                value="setting"
              >
              <span class="el-radio-button__inner">频率限制</span>
            </label>
            <label
              role="radio"
              aria-disabled="true"
              tabindex="-1"
              class="el-radio-button el-radio-button--mini"
            >
              <input
                type="radio"
                v-model="tab"
                tabindex="-1"
                class="el-radio-button__orig-radio"
                value="log"
              >
              <span class="el-radio-button__inner">运行记录</span>
            </label>
          </div>
          <div class="page__bd">
            <div class="weui-cells weui-cells_form rate-setting" v-if="tab == 'setting'">
              <div class="weui-cell">
                <div class="weui-cell__hd"><label class="weui-label">每小时</label></div>
                <div class="weui-cell__bd">
                  <input class="weui-input" v-model="setting.rateLimit.hour" type="number" pattern="[0-9]*" required placeholder="每小时的频率限制"/>
                  <span class="usage">当前已使用：{{task.usage.hour}} </span>
                </div>
              </div>
              <div class="weui-cell">
                <div class="weui-cell__hd"><label class="weui-label">每天</label></div>
                <div class="weui-cell__bd">
                  <input class="weui-input" v-model="setting.rateLimit.daily" type="number" pattern="[0-9]*" required placeholder="请设置每天的频率限制">
                  <span class="usage">当前已使用：{{task.usage.daily}} </span>
                </div>
              </div>
              <div class="weui-cell">
                <div class="weui-cell__hd"><label class="weui-label">每周</label></div>
                <div class="weui-cell__bd">
                  <input class="weui-input" v-model="setting.rateLimit.weekly" type="number" pattern="[0-9]*" placeholder="留空表示不限制">
                  <span class="usage">当前已使用：{{task.usage.weekly}} </span>
                </div>
              </div>
            </div>
            <div class="weui-cells weui-cells_form" v-if="tab == 'log'">
              <ul class="task-log">
                <li v-for="(log, index) in logs" :key="index">
                  运行时间: {{log.displayTime}}
                  <div class="action">
                    <span class="more" v-if="!log.showResults" @click="log.showResults = true"> + </span>
                    <span class="less" v-if="log.showResults" @click="log.showResults = false"> - </span>
                  </div>
                  <div class="results" v-if="log.showResults">
                    <p v-for="(result, i) in log.results" :key="i" >
                      <span class="action">{{actionText(result.action)}}</span>
                      <span class="time">{{readableTime(result.timestamp)}}</span>
                    </p>
                  </div>
                </li>
              </ul>
              <div class="no_logs" v-if="!logs || logs.length < 1">暂时还没有运行记录</div>
            </div>
          </div>
        </div>
        <div class="weui-dialog__ft">
          <a class="weui-dialog__btn weui-dialog__btn_primary" @click="save">保存</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import weui from "weui.js";
import { DateTime } from "luxon";
import { getSetting, saveSetting, readableTime } from "../static/utils";
import { getTaskLog } from '../static/db';

export default {
  name: "taskSetting",
  props: ["task", "currentTask"],
  data() {
    return {
      setting: {},
      logs: [],
      tab: "setting"
    };
  },
  mounted: async function() {
    this.setting = {
      rateLimit: this.task.rateLimit
    }
    this.logs = (await getTaskLog(this.task.id, 7)).map((log) => {
      log.showResults = false
      return log
    })
  },
  methods: {
    close: function () {
      this.$emit('close')
    },
    actionText: function (key) {
      switch (key) {
        case 'runStatus':
          return "脚本运行"
          break;
        case 'checkin_notice':
          return "签到成功"
          break;
        case 'goldCoinReceived':
          return "收到金币"
          break;
        case 'couponReceived':
          return "优惠券领取"
          break;
        case 'create_tab':
          return "开标签页"
          break;
        case 'remove_tab':
          return "关闭标签页"
          break;
        case 'priceProtectionNotice':
          return "价保提醒"
          break;
        case 'findOrder':
          return "找到订单"
          break;
        case 'findGood':
          return "有效商品"
          break;
        default:
          return ""
          break;
      }
    },
    readableTime: function (timestamp) {
      return readableTime(DateTime.fromMillis(Number(timestamp)), true)
    },
    save: async function() {
      let oldSetting  = getSetting(`task-${this.task.id}:settings`, {})
      saveSetting(`task-${this.task.id}:settings`, Object.assign(oldSetting, this.setting))
      weui.toast("设置保存成功", 1000);
      this.$emit('close')
    }
  }
};
</script>
<style scoped>

.rate-setting .weui-input{
  border: 0.5px solid #eee;
  padding: 0.5em;
  width: 50%;
}

.task-setting .page__bd{
  text-align: left;
}

.results{
  font-size: 12px;
  padding: .5em 0.2em;
  background: #eee;
}

.action {
  display: inline-block;
  float: right;
  cursor: pointer;
  padding: 0 .5em;
}

.task-setting .weui-cell{
  font-size: 14px;
}

.task-log{
  max-height: 200px;
  overflow-y: auto;
}

.no_logs{
  text-align: center;
  padding: 2em;
}

.task-log li{
  font-size: 14px;
  padding: .5em;
}

</style>
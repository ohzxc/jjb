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
          <div class="page__bd">
            <div class="weui-cells__title">频率限制</div>
            <div class="weui-cells weui-cells_form">
              <div class="weui-cell">
                <div class="weui-cell__hd"><label class="weui-label">每小时</label></div>
                <div class="weui-cell__bd">
                  <input class="weui-input" v-model="setting.rateLimit.hour" type="number" pattern="[0-9]*" required placeholder="每小时的频率限制">
                </div>
              </div>
              <div class="weui-cell">
                <div class="weui-cell__hd"><label class="weui-label">每天</label></div>
                <div class="weui-cell__bd">
                  <input class="weui-input" v-model="setting.rateLimit.daily" type="number" pattern="[0-9]*" required placeholder="请设置每天的频率限制">
                </div>
              </div>
              <div class="weui-cell">
                <div class="weui-cell__hd"><label class="weui-label">每周</label></div>
                <div class="weui-cell__bd">
                  <input class="weui-input" v-model="setting.rateLimit.weekly" type="number" pattern="[0-9]*" placeholder="留空表示不限制">
                </div>
              </div>
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

import { getSetting, saveSetting } from "../static/utils";

export default {
  name: "taskSetting",
  props: ["task", "currentTask"],
  data() {
    return {
      setting: {}
    };
  },
  mounted: async function() {
    this.setting = {
      rateLimit: this.task.rateLimit
    }
  },
  methods: {
    close: function () {
      this.$emit('close')
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
.task-setting .page__bd{
  text-align: left;
}

.task-setting .weui-cell{
  font-size: 14px;
}

</style>
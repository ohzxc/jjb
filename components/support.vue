<template>
  <div id="dialogs">
    <div class="js_dialog" style="opacity: 1;">
      <div class="weui-mask"></div>
      <div class="weui-dialog">
        <div class="weui-dialog__hd">
          <strong class="weui-dialog__title">支持开发者</strong>
        </div>
        <span class="js-close" @click="done('dismiss')">x</span>
        <ul class="segmented-control">
          <li :class="`segmented-control__item wechat ${paymethod == 'wechat' ? 'checked' : ''}`">
            <span
              class="segmented-control__label switch-paymethod"
              @click="switchPaymethod('wechat', 'ming')"
            >微信</span>
          </li>
          <li :class="`segmented-control__item alipay ${paymethod == 'alipay' ? 'checked' : ''}`">
            <span
              class="segmented-control__label switch-paymethod"
              @click="switchPaymethod('alipay', 'alipay')"
            >支付宝</span>
          </li>
        </ul>
        <div class="weui-dialog__bd wechat_pay" v-if="paymethod == 'wechat'">
          <div class="samedi" v-if="target == 'samedi'">
            <div class="reward switch-paymethod" @click="switchPaymethod('wechat', 'ming')">
              <h4>打赏声优：Samedi</h4>
              <img src="../static/image/samedi.png" class="qrcode">
              <p class="switch-tips">切换打赏 小明（作者）</p>
            </div>
          </div>
          <div class="ming" v-else>
            <div class="reward switch-paymethod" @click="switchPaymethod('wechat', 'samedi')">
              <h4>打赏插件作者：小明</h4>
              <img src="../static/image/weixin_pay.png" class="qrcode">
              <p class="switch-tips">切换打赏 Samedi（声优）</p>
            </div>
          </div>
        </div>
        <div class="weui-dialog__bd alipay_pay" v-else>
          <div class="redpack" v-if="target == 'redpack'">
            <div class="pay_reward switch-paymethod" @click="switchPaymethod('alipay')">
              <img :src="`https://jjbcdn.zaoshu.so/chrome/alipayred.png`" height="320px">
              <p class="alipay_action">
                <svg
                  t="1514096092051"
                  class="icon"
                  viewBox="0 0 1024 1024"
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  p-id="3558"
                  xmlns:xlink="http://www.w3.org/1999/xlink"
                  width="24"
                  height="24"
                >
                  <path
                    d="M248.384 527.36h-34.56c-29.696 0-53.824 18.176-53.824 40.512v223.36c0 22.336 24.128 40.512 53.888 40.512h34.56c29.76 0 53.888-18.112 53.888-40.512v-223.36c-0.064-22.336-24.192-40.512-53.952-40.512z m491.776-85.888c-46.528-2.752-139.52 2.752-149.12-2.752-9.6-5.44-2.752-46.528 38.272-128.64 31.168-72.256-24.576-142.4-56.064-141.056-31.488 1.408-32.832 4.096-32.832 4.096s-65.28 219.072-135.424 308.032c-26.048 71.232-82.112 56.192-82.112 56.192v277.952s179.2 39.68 273.6 39.68c94.4 0 157.312-20.544 166.912-60.224 9.6-39.68-5.504-41.088 9.6-54.784s31.488-20.544 28.736-43.84c-2.752-23.296-23.232-43.84-6.848-60.224 16.384-16.448 21.888-49.28 5.44-65.728-16.384-16.448 12.288-34.24 17.792-56.128 5.504-21.888-31.424-69.824-77.952-72.576z"
                    fill="#F54E4E"
                    p-id="3559"
                  ></path>
                </svg>
                继续打赏
              </p>
            </div>
          </div>
          <div class="alipay" v-else>
            <div class="switch-paymethod" @click="switchPaymethod('alipay', 'redpack')">
              <img src="../static/image/alipay_pay.png" height="200px">
              <p class="alipay_action">
                <svg
                  t="1514045821272"
                  class="icon"
                  viewBox="0 0 1024 1024"
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  p-id="6338"
                  xmlns:xlink="http://www.w3.org/1999/xlink"
                  width="20"
                  height="20"
                >
                  <path
                    d="M60.220235 215.311059V90.413176A90.473412 90.473412 0 0 1 150.573176 0h722.82353a90.352941 90.352941 0 0 1 90.352941 90.413176v120.470589c-2.800941-0.301176-5.662118 0.903529-8.432941 3.915294-59.632941 66.710588-281.298824 159.864471-292.261647 165.827765-10.962824 5.963294 168.387765 24.003765 292.291765-54.814118a57.524706 57.524706 0 0 0 8.402823-6.475294v614.249412A90.473412 90.473412 0 0 1 873.396706 1024H150.573176a90.352941 90.352941 0 0 1-90.352941-90.413176v-607.472942c123.873882 78.456471 302.802824 60.476235 291.84 54.512942-10.932706-5.963294-231.574588-98.665412-291.84-165.345883zM511.984941 662.588235a150.588235 150.588235 0 1 0 0-301.17647 150.588235 150.588235 0 0 0 0 301.17647z"
                    fill="#F54E4E"
                    p-id="6339"
                  ></path>
                </svg>
                我先领个红包
              </p>
            </div>
          </div>
        </div>
        <div class="weui-dialog__bd reward_tips">
          <p class="reward-tips">因为你的支持，京价保才能一直保持更新，适配京东的页面修改，增加更多自动功能。</p>
        </div>
        <div class="weui-dialog__ft">
          <a class="weui-dialog__btn weui-dialog__btn_primary" @click="done('paid')">付好了</a>
          <a class="weui-dialog__btn weui-dialog__btn_default" @click="done('dismiss')">下次吧</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "support",
  props: ["initialPaymethod", "initialTarget"],
  data() {
    return {
      paymethod: this.initialPaymethod,
      target: this.initialTarget
    };
  },
  watch: {
    initialPaymethod: function(newVal, oldVal) {
      this.paymethod = newVal
    },
    initialTarget: function(newVal, oldVal) {
      this.target = newVal
    }
  },
  methods: {
    switchPaymethod: async function(paymethod, target) {
      this.paymethod = paymethod
      this.target = target
    },
    done: async function(action) {
      this.$emit('close')
    }
  }
};
</script>
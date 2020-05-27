<template>
  <div class="dialog_views" v-show="isShowMessageBox" @touchmove.prevent>
    <div class="UImask" @click="cancel"></div>
    <transition name="confirm-fade">
      <div class="UIdialog" v-show="isShowMessageBox">
        <div class="UIdialog_hd">{{title}}</div>
        <div class="UIdialog_bd">
          <slot>{{content}}</slot>
        </div>
        <div :class="[ isShowCancelBtn ? 'UIdialog_ft' : 'UIdialog_ft UIdialog_ft_one']">
          <span v-if="isShowCancelBtn" class="UIdialog_btn" @click="cancel">{{cancelVal}}</span>
          <span v-if="isShowConfimrBtn" class="UIdialog_btn" @click="confirm">{{confirmVal}}</span>
        </div>

      </div>
    </transition>
  </div>

</template>

<script>
export default {
  components: {
  },
  data() {
    return {
      isShowMessageBox: false,
      resolve: '',
      reject: '',
      promise: '', // 保存promise对象
    };
  },
  props: {
    isShowConfimrBtn: {
      type: Boolean,
      default: true
    },
    content: {
      type: String,
      default: '这是弹框内容'
    },
    isShowCancelBtn: {  //是否展示取消按钮
      type: Boolean,
      default: true
    },
    title: {   //标题
      type: String,
      default: '提示',
    },
    confirmVal: {
      type: String,  //确认文字
      default: '确定'
    },
    cancelVal: {   //取消文字
      type: String,
      default: '取消'
    },
    maskHide: {
      type: Boolean,   //是否可以点击蒙层关闭
      default: true
    }
  },


  methods: {
    // 确定,将promise断定为resolve状态
    confirm() {
      this.isShowMessageBox = false;
      this.resolve('confirm');
      this.remove();
    },
    // 取消,将promise断定为reject状态
    cancel() {
      this.isShowMessageBox = false;
      this.reject('cancel');
      this.remove();
    },
    // 弹出messageBox,并创建promise对象
    showMsgBox() {
      this.isShowMessageBox = true;
      this.promise = new Promise((resolve, reject) => {
        this.resolve = resolve;
        this.reject = reject;
      });
      // 返回promise对象
      return this.promise;
    },
    remove() {
      setTimeout(() => {
        this.destroy();
      }, 100);
    },
    destroy() {
      this.$destroy();
      document.body.removeChild(this.$el);
    },

  }
};

</script>
<style lang='less' scoped>
.UImask {
  position: fixed;
  z-index: 999;
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
}
.UIdialog {
  position: fixed;
  z-index: 999;
  width: 80%;
  max-width: 400px;
  display: table;
  z-index: 5000;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  margin: auto;
  transition: opacity 0.3s, transform 0.4s;
  text-align: center;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
  padding: 30px 40px;
}
.UIdialog_hd {
  font-weight: bold;
  font-size: 24px;
  letter-spacing: 1px;
}
.UIdialog_bd {
  margin: 40px 0;
  text-align: center;
  font-size: 18px;
  slot,
  p {
    display: inline-block;
    text-align: left;
  }
}
.UIdialog_ft {
  position: relative;
  font-size: 22px;
  color: #fff;
  display: flex;
  justify-content: center;
  align-items: center;
  justify-content: space-between;
  margin: 0 20px;
  margin-bottom: -5px;
  padding-top: 15px;
}
.UIdialog_btn {
  display: block;
  text-decoration: none;
  position: relative;
  display: block;
  background-color: #000;
  border-radius: 40px;
  padding: 12px 45px;
      cursor: pointer;
}
.UIdialog_ft_one {
  text-align: center;
  justify-content: center;
}

/* 进入和出去的动画 */
.confirm-fade-enter-active {
  animation: bounce-in 0.5s;
}
.confirm-fade-leave-active {
  animation: bounce-in 0.5s reverse;
}
.confirm-fade-enter,
.confirm-fade-leave-to {
  opacity: 0;
}

@keyframes bounce-in {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}
</style>


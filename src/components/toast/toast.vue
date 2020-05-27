<template>
  <transition :name="fadeIn">
    <div class="alertBox" v-show="show">
      <div class="alert-mask" v-show="isShowMask"></div>
      <transition :name="translate">
        <div class="box" :class="position" v-show="show">
          <p>{{text}}</p>
          <p v-if="message">{{message}}</p>
        </div>
      </transition>
    </div>
  </transition>
</template>

<script>
export default {
  data() {
    return {
    }
  },
  props: {
    show: { // 是否显示此toast
      default: false
    },
    text: { // 提醒文字
      default: 'loading'
    },
    message: {
      default: null
    },
    position: { // 提醒容器位置
      default: 'center' //这里应该是middle 我没有改动画 所以暂时不用
    },
    isShowMask: { // 是否显示遮罩层
      default: false
    },
    time: { // 显示时间
      default: 1500
    },
    transition: { // 是否开启动画
      default: true
    }
  },
  mounted() { // 时间控制
    // setTimeout(() => {
    //   this.show = false
    // }, this.time)
  },
  computed: {
    translate() { // 根据props，生成相对应的动画
      if (!this.transition) {
        return ''
      } else {
        if (this.position === 'top') {
          return 'translate-top'
        } else if (this.position === 'middle') {
          return 'translate-middle'
        } else if (this.position === 'bottom') {
          return 'translate-bottom'
        }
      }
    },
    fadeIn() { // 同上
      if (!this.transition) {
        return ''
      } else {
        return 'fadeIn'
      }
    },
  }
}
</script>
<style lang='less'>
.box {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%,-50%);
  min-width: 130px;
  background: rgba(0, 0, 0, 0.5);
  text-align: center;
  color: #fff;
  z-index: 5000;
  color: #fff;
  padding: 20px 30px;
  border-radius: 10px;
  word-wrap: normal ;
  p {
    display: inline-block;
    text-align: left;
  }
}

.box.top {
  top: 50px;
  margin-top: 150px;
}
.box.center {
  top: 50%;
  margin-top: -100px;
}
.box.bottom {
  top: auto;
  bottom: 50px;
  margin-top: 0;
}
.alert-mask {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 4999;
}
.fadeIn-enter-active,
.fadeIn-leave-active {
  transition: opacity 0.3s;
}
.fadeIn-enter,
.fadeIn-leave-active {
  opacity: 0;
}
.translate-top-enter-active,
.translate-top-leave-active {
  transition: all 0.3s cubic-bezier(0.36, 0.66, 0.04, 1);
}
.translate-top-enter,
.translate-top-leave-active {
  transform: translateY(-50%);
  opacity: 0;
}
.translate-middle-enter-active,
.translate-middle-leave-active {
  transition: all 0.3s cubic-bezier(0.36, 0.66, 0.04, 1);
}
.translate-middle-enter,
.translate-middle-leave-active {
  transform: translateY(80%);
  opacity: 0;
}
.translate-bottom-enter-active,
.translate-bottom-leave-active {
  transition: all 0.3s cubic-bezier(0.36, 0.66, 0.04, 1);
}
.translate-bottom-enter,
.translate-bottom-leave-active {
  transform: translateY(100%);
  opacity: 0;
}
</style>

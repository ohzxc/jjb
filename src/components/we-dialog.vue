<template>
  <div :class="`dialog ${className}`">
    <div class="weui-mask"></div>
    <div class="weui-dialog">
      <div class="weui-dialog__hd">
        <strong class="weui-dialog__title">{{title}}</strong>
      </div>
      <span class="js-close" @click="close">x</span>
      <div class="weui-dialog__bd">
        <span v-if="!content.mode" v-html="content"></span>
        <img v-if="content.mode == 'image'" :src="content.url" style="width: 270px;" />
        <iframe  v-if="content.mode == 'iframe'" frameborder="0" :src="content.url" style="width: 100%;min-height: 420px;min-width: 400px;"></iframe>
      </div>
      <div class="weui-dialog__ft">
        <a :class="`weui-dialog__btn weui-dialog__btn_${type} `" v-for="(button, index) in buttons" :key="index" @click="button.onClick ? button.onClick() : close() ">{{button.label}}</a>
      </div>
    </div>
  </div>
</template>

<script>
import { getSetting } from "../utils";

export default {
  name: "weDialog",
  props: ["title", "content", "className", "buttons"],
  data() {
    return {
    };
  },
  methods: {
    close: async function() {
      this.$emit('close')
    }
  }
};
</script>

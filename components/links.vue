<template>
  <div class="links">
    <span :class="action.class" v-for="(action, index)  in actionLinks" :key="action.id" :index="index" :style="action.style">
      <a
        v-if="action.type == 'dialog'"
        href="#"
        data-tippy-placement="top-start"
        :data-tippy-content="action.description"
        :style="action.linkStyle"
        :class="action.linkClass"
        @click="showDialog(action)"
      >{{action.title}}
      </a>
      <a
        v-if="action.type == 'link'"
        data-tippy-placement="top-start"
        :data-tippy-content="action.description"
        :href="action.url"
        :style="action.linkStyle"
        :class="action.linkClass"
        target="_blank"
      >{{action.title}}</a>
    </span>
  </div>
</template>

<script>
import weui from "weui.js";
import { getSetting } from "../static/utils";
export default {
  name: "links",
  data() {
    return {
      actionLinks: getSetting("action-links", [
        {
          type: "dialog",
          class: "el-tag el-tag--warning",
          linkClass: "tippy",
          title: "活动推荐",
          description: "热门的促销活动推荐",
          style: "margin-right: 3px;",
          mode: "iframe",
          url: "https://jjb.zaoshu.so/recommend"
        },
        {
          type: "link",
          class: "el-tag",
          linkClass: "tippy",
          title: "PLUS券",
          description: "PLUS会员每个月可以领取总额100元的全品类券，但是领取后24小时就会失效，因此推荐每次购物前领取",
          url: "https://plus.jd.com/coupon/index"
        }
      ])
    };
  },
  methods: {
    showDialog: async function(action) {
      let content = ""
      if (action.mode == "iframe") {
        content = `
          <iframe frameborder="0" src="${action.url}" style="width: 100%;min-height: 420px;min-width: 400px;"></iframe>
        `
      }
      if (action.mode == "image") {
        content = `
          <img src="${action.url}" style="width: 270px;"></img>
        `
      }
      weui.dialog({
        title: action.title,
        content: content,
        className: "dialog",
        buttons: [
          {
            label: "完成",
            type: "primary"
          }
        ]
      });
    },
  }
};
</script>

<style scoped>
  .links {
    display: inline-block;
  }
</style>
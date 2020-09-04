<template>
  <div class="links-box">
    <div class="links">
      <span
        :class="action.class"
        v-for="(action, index)  in actionLinks"
        :key="action.id"
        :index="index"
        :style="action.style"
      >
        <a
          v-if="action.type == 'dialog'"
          href="#"
          data-tippy-placement="top-start"
          :data-tippy-content="action.description"
          :style="action.linkStyle"
          :class="action.linkClass"
          @click="openDialog(action)"
        >{{action.title}}</a>
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
    <we-dialog
      v-if="dialog && showDialog"
      @close="showDialog = false"
      :title="dialog.title"
      :content="dialog.content"
      :className="dialog.className"
      :buttons="dialog.buttons"
    ></we-dialog>
  </div>
</template>

<script>
import { getSetting } from "../utils";
import weDialog from "./we-dialog.vue";

export default {
  name: "links",
  components: { weDialog },
  data() {
    return {
      dialog: {},
      showDialog: false,
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
        }
      ])
    };
  },
  methods: {
    openDialog: async function(action) {
      this.dialog = {
        title: action.title,
        content: action,
        className: "dialog",
        buttons: [
          {
            label: "完成",
            type: "primary"
          }
        ]
      };
      this.showDialog = true
    }
  }
};
</script>

<style  scoped>
.links-box {
  display: inline-block;
}
</style>
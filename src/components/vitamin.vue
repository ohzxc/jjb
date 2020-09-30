<template>
  <div v-if="currentPromote" class="vitamin">
    <a
      v-tippy
      :title="currentPromote.description"
      :href="currentPromote.url"
      :style="currentPromote.inlineStyle"
      class="promote"
      target="_blank"
    >
      <img class="icon" v-if="currentPromote.icon" :src="currentPromote.icon.publicUrl"></img>
      <span>{{currentPromote.title}}</span>
    </a>
  </div>
</template>

<script>
import { DateTime } from 'luxon'
import { getSetting, saveSetting } from "../utils";

const today = DateTime.local().toFormat("o")

export default {
  name: "vitamin",
  components: {
  },
  data() {
    return {
      promotes: getSetting('vitamin:promotes', []),
      currentPromote: null,
    };
  },
  mounted: async function() {
    setTimeout(() => {
      this.getPromotes()
    }, 50);
    setTimeout(() => {
      this.show()
    }, 100);
  },
  methods: {
    show: function () {
      if (this.promotes && this.promotes.length > 0) {
        this.currentPromote = this.promotes[Math.floor(Math.random() * this.promotes.length)];
        this.markUsed(`temporary:vitamin:usage_${today}_${this.currentPromote.id}`)
        this.markUsed(`vitamin:usage_${this.currentPromote.id}`)
      }
    },
    markUsed: function(key) {
      const usage = getSetting(key, 0);
      saveSetting(key, usage + 1)
    },
    loadPromotesFormApi: async function() {
      let response = await fetch("https://vitamin.h5r.cn/api/project/1");
      const data = await response.json();
      if (data && data.allPromotes) {
        saveSetting("vitamin:promotes", data.allPromotes)
        saveSetting('vitamin:lastLoadPromotesAt', DateTime.local().toISO())
      }
    },
    getPromotes: function() {
      let promotes = getSetting("vitamin:promotes", []);
      let lastLoadPromotesAt = getSetting('vitamin:lastLoadPromotesAt', null)
      if ( !lastLoadPromotesAt || DateTime.local().diff(DateTime.fromISO(lastLoadPromotesAt)).as('days') > 1) {
        this.loadPromotesFormApi()
      }
      promotes = promotes.filter((promote) => {
        const promoteUsedInTotal = getSetting(`vitamin:usage_${promote.id}`, 0)
        const usageToday = getSetting(`temporary:vitamin:usage_${today}_${promote.id}`, 0);
        const isStarted = promote.startAt ? DateTime.fromJSDate(new Date(promote.startAt)) < DateTime.local() : true
        const isValid = promote.endAt ? DateTime.fromJSDate(new Date(promote.endAt)) > DateTime.local() : true
        const isOverUsedToday = usageToday >= promote.dailyLimit
        const isOverUsedInTotal = promote.totalLimit && promoteUsedInTotal >= promote.totalLimit

        return isValid && isStarted && !isOverUsedToday && !isOverUsedInTotal
      });
      this.promotes = promotes
      return promotes;
    },
  }
};
</script>
<style  scoped>
.vitamin{
  text-align: center;
  height: 2em;
}

.vitamin a.promote {
  display: flex;
  justify-content: center;
  align-items: center;
  line-height: 14px;
}

.vitamin .icon {
    height: 1em;
    display: flex;
    margin: 0 4px;
}
</style>
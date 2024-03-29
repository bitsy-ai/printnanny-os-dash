<template>
  <div
    class="w-full max-w-sm bg-white rounded-lg border border-gray-200 shadow-2xl"
  >
    <div class="flex px-4 pt-4 grid grid-cols-2">
      <!-- toggle-->
      <div class="grid w-full justify-self-start">
        <WidgetStatus :item="item" />
      </div>

      <div class="w-full flex justify-end">
        <router-link
          v-if="item.settings"
          :to="item.settings"
          class="border-transparent text-gray-500 hover:text-gray-700 inline-flex items-center text-sm font-medium"
        >
          <Cog6ToothIcon class="h-6 w-6 mr-4" />
        </router-link>
        <Switch
          v-model="enabled"
          v-if="store.loading === false"
          :class="enabled ? 'bg-blue-600' : 'bg-gray-200'"
          class="relative inline-flex h-6 w-11 items-center justify-self-end rounded-full"
        >
          <span class="sr-only">Enable {{ item.name }}</span>
          <span
            :class="enabled ? 'translate-x-6' : 'translate-x-1'"
            class="inline-block h-4 w-4 transform rounded-full bg-white transition"
          />
        </Switch>
      </div>
    </div>
    <div class="flex flex-col items-center pb-10">
      <img
        class="mb-3 p-2 w-24 h-24 rounded-full shadow-lg"
        :src="item.logo"
        :alt="item.name"
      />
      <h5 class="mb-1 text-xl font-medium text-gray-900">
        {{ item.name }}
      </h5>
      <span class="text-sm text-gray-500 text-center">{{
        item.description
      }}</span>

      <div class="flex mt-4 space-x-3 md:mt-6">
        <a
          :href="item.href"
          target="_blank"
          class="inline-flex items-center py-2 px-4 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300"
        >
          <ArrowUpRightIcon
            class="w-4 h-4 text-sm font-medium mr-1 text-white-600"
          />
          Open {{ item.name }}
        </a>
        <WidgetMenu :items="item.menuItems" v-if="item.menuItems.length > 0" />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { PropType } from "vue";
import { ref } from "vue";
import { RouterLink } from "vue-router";
import { Switch } from "@headlessui/vue";
import { Cog6ToothIcon } from "@heroicons/vue/24/solid";

import { ArrowUpRightIcon } from "@heroicons/vue/24/outline";
import WidgetMenu from "@/components/WidgetMenu.vue";
import WidgetStatus from "@/components/WidgetStatus.vue";
import type { WidgetItem } from "@/types";
import { watch } from "vue";

import { useSystemdServiceStore } from "@/stores/systemdService";
import { onMounted } from "vue";
import { SystemdUnitFileState } from "@bitsy-ai/printnanny-asyncapi-models";

const props = defineProps({
  item: {
    type: Object as PropType<WidgetItem>,
    required: true,
  },
});

const store = useSystemdServiceStore(props.item, false);

onMounted(async () => {
  await store.load();
});

const enabled = ref(undefined as undefined | boolean);

// watch component refrence, update store state reference when component state changes
watch(
  enabled,
  async (newValue: undefined | boolean, oldValue: undefined | boolean) => {
    console.log(`${props.item.service}: ${oldValue} -> ${newValue}`);
    if (oldValue === undefined) {
      return;
    }
    if (
      newValue === true &&
      store.unit?.unit_file_state != SystemdUnitFileState.ENABLED
    ) {
      await store.enableService();
    } else if (
      newValue === false &&
      store.unit?.unit_file_state != SystemdUnitFileState.DISABLED
    ) {
      await store.disableService();
    }
  }
);

// watch store state reference, update component reference when store state changes
watch(store, async (_newValue, _oldValue) => {
  if (store.unit !== undefined) {
    enabled.value = store.unit?.unit_file_state == SystemdUnitFileState.ENABLED;
  }
});
</script>

// import './polyfills'
import { createApp } from "vue";
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import posthog from "posthog-js";
import VueCodemirror from "vue-codemirror";
import { basicSetup } from "codemirror";
import { StreamLanguage } from "@codemirror/language";
import { toml } from "@codemirror/legacy-modes/mode/toml";
import { yaml } from "@codemirror/legacy-modes/mode/yaml";

import "@/utils/logging";

import App from "./App.vue";
import router from "./router";

import "./style.css";

const app = createApp(App);

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

app.use(pinia);
app.use(router);
app.use(VueCodemirror, {
  autofocus: true,
  tabSize: 2,
  extensions: [
    basicSetup,
    StreamLanguage.define(toml),
    StreamLanguage.define(yaml),
  ],
});

if (
  !window.location.href.includes("127.0.0.1") &&
  !window.location.href.includes("localhost")
) {
  posthog.init(import.meta.env.VITE_POSTHOG_CLIENT_KEY, {
    api_host: import.meta.env.VITE_POSTHOG_API_URL,
  });
}
app.mount("#app");

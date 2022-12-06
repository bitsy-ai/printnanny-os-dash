import { defineStore, acceptHMRUpdate } from "pinia";
import type { ConfigFile, DeviceInfo, WidgetItem } from "@/types";
import { toRaw } from "vue";

import { JSONCodec, type NatsConnection } from "nats.ws";

import ocotoprintLogo from "@/assets/logos/octoprint/octoprint_logo_rgb_250px.png";
import mainsailLogo from "@/assets/logos/mainsail/icon-192-maskable.png";
import printNannyLogo from "@/assets/logos/printnanny/logo.svg";
import syncThingLogo from "@/assets/logos/syncthing/logo-256.png";
import { useNatsStore } from "./nats";
import {
  NatsSubjectPattern,
  SystemctlCommand,
  SystemdUnitStatus,
  WidgetCategory,
  type NatsRequest,
  type NatsResponse,
  type SystemctlCommandResponse,
  type SystemctlCommandRequest,
  type UiStickyAlert,
} from "@/types";
import { handleError } from "@/utils";
import { useAlertStore } from "./alerts";

const DEFAULT_NATS_TIMEOUT = 12000;

export const useWidgetStore = defineStore({
  id: "widgets",
  state: () => ({
    enabledServices: {},
    deviceInfo: undefined as undefined | DeviceInfo,
    configs: undefined as undefined | Array<ConfigFile>,
    selectedConfig: undefined as undefined | string,
    items: [
      {
        name: "OctoPrint",
        loaded: false,
        href: "/octoprint/",
        service: "octoprint.service",
        logo: ocotoprintLogo,
        description: "The snappy web interface for your 3D Printer",
        category: WidgetCategory.PrinterManagement,
        status: SystemdUnitStatus.Unknown,
        enabled: undefined,
        menuItems: [
          { name: "Documentation", href: "https://docs.octoprint.org" },
          { name: "Plugin Repo", href: "https://plugins.octoprint.org" },
          { name: "/r/octoprint", href: "https://www.reddit.com/r/octoprint/" },
          {
            name: "OctoPrint Community",
            href: "https://community.octoprint.org/",
          },
          { name: "Discord", href: "https://discord.octoprint.org/" },
        ],
      } as WidgetItem,
      {
        name: "Mainsail",
        href: "/mainsail/",
        loaded: false,
        service: "mainsail.target",
        logo: mainsailLogo,
        category: WidgetCategory.PrinterManagement,
        enabled: undefined,
        status: SystemdUnitStatus.Unknown,
        description:
          "Mainsail makes Klipper more accessible by adding a lightweight, responsive web user interface.",
        menuItems: [
          { name: "Documentation", href: "https://docs.mainsail.xyz/" },
          { name: "/r/klippers", href: "https://www.reddit.com/r/klippers/" },
          { name: "Discord", href: "https://discord.gg/skWTwTD" },
          {
            name: "Github Issues",
            href: "https://github.com/mainsail-crew/mainsail/issues",
          },
        ],
      } as WidgetItem,

      {
        name: "PrintNanny Vision",
        loaded: false,
        href: "/vision/",
        service: "printnanny-vision.service",
        logo: printNannyLogo,
        category: WidgetCategory.PrintNannyApps,
        enabled: undefined,
        status: SystemdUnitStatus.Unknown,
        description:
          "The privacy-first defect and failure detection system. No internet connection required.",
        menuItems: [],
      } as WidgetItem,
      {
        name: "PrintNanny Cloud",
        loaded: false,
        href: "https://printnanny.ai/devices",
        service: "printnanny-cloud.target",
        logo: printNannyLogo,
        category: WidgetCategory.PrintNannyApps,
        enabled: undefined,
        status: SystemdUnitStatus.Unknown,
        description:
          "Get email notifications, view camera feed from anywhere, and sync settings with PrintNanny Cloud.",
        menuItems: [],
      } as WidgetItem,
      {
        name: "OS Updates",
        loaded: false,
        href: "/update/",
        service: "swupdate.service",
        logo: printNannyLogo,
        category: WidgetCategory.PrintNannyApps,
        enabled: undefined,
        status: SystemdUnitStatus.Unknown,
        description: "Update PrintNanny OS to the latest build.",
        menuItems: [
          {
            name: "How to Update PrintNanny OS",
            href: "https://printnanny.ai/docs/docs/update-printnanny-os/",
          },
        ],
      } as WidgetItem,
      {
        name: "Syncthing",
        href: "/syncthing/",
        logo: syncThingLogo,
        category: WidgetCategory.OtherApps,
        status: SystemdUnitStatus.Unknown,
        enabled: undefined,
        description:
          "Sync files between two or more computers. Like having a private Dropbox.",
        service: "syncthing@printnanny.service",
        menuItems: [
          {
            name: "Quick Start",
            href: "https://printnanny.ai/docs/docs/quick-start/configure-file-sync/",
          },
          { name: "Syncthing Docs", href: "https://docs.syncthing.net/" },
          { name: "Commmunity Forum", href: "https://forum.syncthing.net/" },
        ],
      } as WidgetItem,
    ],
  }),

  getters: {
    printerManagementItems(state): Array<WidgetItem> {
      return Object.values(state.items).filter(
        (x) => x.category === WidgetCategory.PrinterManagement
      );
    },
    printNannyAppItems(state): Array<WidgetItem> {
      return Object.values(state.items).filter(
        (x) => x.category === WidgetCategory.PrintNannyApps
      );
    },
    otherAppItems(state): Array<WidgetItem> {
      return Object.values(state.items).filter(
        (x) => x.category === WidgetCategory.OtherApps
      );
    },
  },

  actions: {
    async loadConfigs() {
      const basePath = import.meta.env.VITE_BASE_API_URL;
      const res = await window
        .fetch(`${basePath}pi/configs`)
        .catch((e) => handleError("Failed to load config data", e));

      const configs = await res?.json().catch((e) => {
        console.error("Failed to parse JSON from response: ", res);
        return handleError("Failed to parse json", e);
      });

      if (configs !== undefined) {
        this.$patch({ configs: configs as Array<ConfigFile> });
        if (this.selectedConfig === undefined) {
          this.$patch({ selectedConfig: configs[0].filename });
        }
      }
    },

    // async startService(item: WidgetItem) {
    //   const natsStore = useNatsStore();
    //   const alertStore = useAlertStore();
    //   if (natsStore.natsConnection === undefined) {
    //     console.warn("startService called before NATS connection initialized");
    //     return;
    //   }
    //   const natsClient = toRaw(natsStore.natsConnection);
    //   const req = {
    //     service: item.service,
    //     command: SystemctlCommand.Start,
    //     subject: NatsSubjectPattern.SystemctlCommand,
    //   } as NatsRequest;
    //   const requestCodec = JSONCodec<NatsRequest>();
    //   console.log(`Starting ${item.service}`);
    //   const resMsg = await natsClient
    //     ?.request(req.subject, requestCodec.encode(req), {
    //       timeout: DEFAULT_NATS_TIMEOUT,
    //     })
    //     .catch((e) => {
    //       handleError(`Error starting ${item.service}`, e);
    //     });

    //   if (resMsg) {
    //     const successAlert: UiStickyAlert = {
    //       message: `${item.service} will start automatically.`,
    //       header: `Enabled ${item.service}`,
    //       actions: [],
    //     };
    //     alertStore.pushAlert(successAlert);
    //   }
    // },
    // async stopService(item: WidgetItem) {
    //   const natsStore = useNatsStore();
    //   const alertStore = useAlertStore();

    //   if (natsStore.natsConnection === undefined) {
    //     console.warn("stopService called before NATS connection initialized");
    //     return;
    //   }
    //   const natsClient = toRaw(natsStore.natsConnection);
    //   const req = {
    //     service: item.service,
    //     command: SystemctlCommand.Stop,
    //     subject: NatsSubjectPattern.SystemctlCommand,
    //   } as NatsRequest;
    //   const requestCodec = JSONCodec<NatsRequest>();
    //   console.log(`Stopping ${item.service}`);
    //   const resMsg = await natsClient
    //     ?.request(req.subject, requestCodec.encode(req), {
    //       timeout: DEFAULT_NATS_TIMEOUT,
    //     })
    //     .catch((e) => {
    //       handleError(`Error stopping ${item.service}`, e);
    //     });

    //   if (resMsg) {
    //     const successAlert: UiStickyAlert = {
    //       message: `${item.service} will no longer start automatically.`,
    //       header: `Disabled ${item.service}`,
    //       actions: [],
    //     };
    //     alertStore.pushAlert(successAlert);
    //   }
    // },

  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useWidgetStore, import.meta.hot));
}

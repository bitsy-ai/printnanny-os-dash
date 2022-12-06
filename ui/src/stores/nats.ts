import { retry } from "@lifeomic/attempt";

import { defineStore, acceptHMRUpdate } from "pinia";
import { toRaw } from "vue";

import { connect, JSONCodec, type NatsConnection } from "nats.ws";
import { handleError } from "@/utils";
import {
  ConnectionStatus,
  NatsSubjectPattern,
  type ConnectCloudAccountRequest,
} from "@/types";
import { useWidgetStore } from "./widgets";

function getNatsURI() {
  const hostname = window.location.hostname;
  const uri = `ws://${hostname}:${
    import.meta.env.VITE_PRINTNANNY_EDGE_NATS_WS_PORT
  }`;
  return uri;
}

export const useNatsStore = defineStore({
  id: "nats",

  state: () => ({
    natsConnection: undefined as NatsConnection | undefined,
    status: ConnectionStatus.ConnectionNotStarted,
  }),

  actions: {
    async onConnected(natsConnection: NatsConnection) {
      const widgets = useWidgetStore();
      return await Promise.all([
        widgets.loadEnabledServices(natsConnection),
        widgets.loadStatuses(natsConnection),
      ]);
    },
    async connect(): Promise<NatsConnection | undefined> {
      // create nats connection if not initialized
      if (
        this.natsConnection === undefined &&
        this.status !== ConnectionStatus.ConnectionLoading
      ) {
        this.$patch({ status: ConnectionStatus.ConnectionLoading });
        const servers = [getNatsURI()];
        console.log(`Connecting to NATS server: ${servers}`);

        const connectOptions = {
          servers,
          debug: false,
        };

        if (import.meta.env.VITE_PRINTNANNY_DEBUG == true) {
          connectOptions.debug = true;
        }
        const natsConnection = await connect(connectOptions).catch((e: Error) =>
          handleError("Failed to connect to NATS server", e)
        );
        if (natsConnection) {
          console.log(`Initialized NATs connection to ${servers}`);
          this.$patch({
            natsConnection,
            status: ConnectionStatus.ConnectionReady,
          });
          return natsConnection;
        }
        this.$patch({ status: ConnectionStatus.ConnectionError });
      }
      return this.natsConnection;
    },
    async getNatsConnection(): Promise<NatsConnection | undefined> {
      while (this.natsConnection === undefined) {
        await this.connect();
        console.warn("Establishing NatsConnection...");
        await new Promise((r) => setTimeout(r, 2000));
      }
      return await this.connect();
    },
    async connectCloudAccount(
      email: string,
      api_token: string,
      api_uri: string
    ) {
      const req: ConnectCloudAccountRequest = {
        subject: NatsSubjectPattern.ConnectCloudAccount,
        email,
        api_token,
        api_uri,
      };

      const natsClient = toRaw(this.natsConnection);
      const jsonCodec = JSONCodec<ConnectCloudAccountRequest>();

      console.debug("Publishing NATS ConnectCloudAccountRequest:", req);
      const res = await natsClient
        ?.request(req.subject, jsonCodec.encode(req), {
          timeout: 120000, // 120 seconds
        })
        .catch((e) => handleError("Failed to sync with PrintNanny Cloud", e));

      console.log(
        "Success! Synced with PrintNanny Cloud. ConnectCloudAccountResponse:",
        res
      );
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useNatsStore, import.meta.hot));
}

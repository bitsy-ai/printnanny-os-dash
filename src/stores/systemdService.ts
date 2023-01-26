import { JSONCodec, type NatsConnection } from "nats.ws";

import type {
  SystemdManagerGetUnitRequest,
  SystemdManagerGetUnitError,
  SystemdManagerGetUnitReply,
  SystemdManagerEnableUnitsReply,
  SystemdManagerEnableUnitsError,
  SystemdManagerDisableUnitsReply,
  SystemdManagerUnitFilesRequest,
  SystemdManagerDisableUnitsError,
  SystemdManagerStartUnitReply,
  SystemdManagerStartUnitError,
  SystemdManagerStartUnitRequest,
  SystemdUnit,
  SystemdManagerStopUnitRequest,
  SystemdManagerStopUnitReply,
  SystemdManagerStopUnitError,
  SystemdManagerGetUnitFileStateReply,
  SystemdManagerGetUnitFileStateError,
  SystemdUnitFileState,
  SystemdManagerRestartUnitReply,
  SystemdManagerRestartUnitError,
  SystemdManagerRestartUnitRequest,
} from "@bitsy-ai/printnanny-asyncapi-models";
import { ConnectionStatus, DEFAULT_NATS_TIMEOUT } from "@/types";

import {
  NatsSubjectPattern,
  renderNatsSubjectPattern,
  type WidgetItem,
} from "@/types";
import { defineStore, acceptHMRUpdate } from "pinia";
import { useNatsStore } from "./nats";
import { handleError } from "@/utils";
import { success } from "./alerts";
import type { bool } from "yup";

function isSystemdManagerGetUnitError(
  res: SystemdManagerGetUnitReply | SystemdManagerGetUnitError
) {
  return (res as SystemdManagerGetUnitError).error !== undefined;
}

function isSystemdManagerEnableUnitError(
  res: SystemdManagerEnableUnitsReply | SystemdManagerEnableUnitsError
) {
  return (res as SystemdManagerEnableUnitsError).error !== undefined;
}

function isSystemdManagerStartUnitError(
  res: SystemdManagerStartUnitReply | SystemdManagerStartUnitError
) {
  return (res as SystemdManagerStartUnitError).error !== undefined;
}

function isSystemdManagerRestartUnitError(
  res: SystemdManagerStartUnitReply | SystemdManagerStartUnitError
) {
  return (res as SystemdManagerStartUnitError).error !== undefined;
}

function isSystemdManagerGetUnitFileState(
  res: SystemdManagerGetUnitFileStateReply | SystemdManagerGetUnitFileStateError
) {
  return (res as SystemdManagerGetUnitFileStateError).error !== undefined;
}

export const useSystemdServiceStore = (widget: WidgetItem) => {
  const scopedStoreDefinition = defineStore(`systemd/${widget.service}`, {
    state: () => ({
      widget: widget,
      loading: true,
      unitFileState: null as null | SystemdUnitFileState,
      unit: null as null | SystemdUnit,
      error: null as null | Error,
    }),
    actions: {
      async disableService() {
        await this.stopService();

        // get nats connection (awaits until NATS server is available)
        const natsStore = useNatsStore();
        const natsConnection: NatsConnection =
          await natsStore.getNatsConnection();

        const subject = renderNatsSubjectPattern(
          NatsSubjectPattern.SystemdManagerDisableUnits
        );

        const requestCodec = JSONCodec<SystemdManagerUnitFilesRequest>();
        const req = {
          files: [this.widget.service],
        } as SystemdManagerUnitFilesRequest;
        console.log(`Sending request to ${subject}`, req);
        const resMsg = await natsConnection
          ?.request(subject, requestCodec.encode(req), {
            timeout: DEFAULT_NATS_TIMEOUT,
          })
          .catch((e) => {
            const msg = `Error disabling ${this.widget?.service}`;
            handleError(msg, e);
          });
        if (resMsg) {
          const resCodec = JSONCodec<
            SystemdManagerDisableUnitsReply | SystemdManagerDisableUnitsError
          >();
          let res = resCodec.decode(resMsg?.data);
          console.log(`Received reply to ${subject}`, res);

          if (isSystemdManagerEnableUnitError(res)) {
            res = res as SystemdManagerEnableUnitsError;
            const error = new Error(res.error);
            const msg = `Error disabling ${this.widget.service}`;
            handleError(msg, error);
            this.$patch({ error });
          } else {
            res = res as SystemdManagerEnableUnitsReply;
            console.log(
              `Enabled ${widget.service}, with changes:`,
              res.changes
            );
          }
        }
      },
      async enableService() {
        // get nats connection (awaits until NATS server is available)
        const natsStore = useNatsStore();
        const natsConnection: NatsConnection =
          await natsStore.getNatsConnection();

        const subject = renderNatsSubjectPattern(
          NatsSubjectPattern.SystemdManagerEnableUnits
        );

        const requestCodec = JSONCodec<SystemdManagerUnitFilesRequest>();

        const req = {
          files: [this.widget.service],
        } as SystemdManagerUnitFilesRequest;
        console.log(`Sending request to ${subject}`, req);
        const resMsg = await natsConnection
          ?.request(subject, requestCodec.encode(req), {
            timeout: DEFAULT_NATS_TIMEOUT,
          })
          .catch((e) => {
            const msg = `Error enabling ${this.widget?.service}`;
            handleError(msg, e);
          });

        if (resMsg) {
          const resCodec = JSONCodec<
            SystemdManagerEnableUnitsReply | SystemdManagerEnableUnitsError
          >();
          let res = resCodec.decode(resMsg?.data);
          console.log(`Received reply to ${subject}`, res);

          if (isSystemdManagerEnableUnitError(res)) {
            res = res as SystemdManagerEnableUnitsError;
            const error = new Error(res.error);
            const msg = `Error enabling ${this.widget.service}`;
            handleError(msg, error);
            this.$patch({ error });
          } else {
            res = res as SystemdManagerEnableUnitsReply;
            console.log(
              `Enabled ${widget.service}, with changes:`,
              res.changes
            );
          }

          await this.startService();
        }
      },
      async startService() {
        // get nats connection (awaits until NATS server is available)
        const natsStore = useNatsStore();
        const natsConnection: NatsConnection =
          await natsStore.getNatsConnection();

        const subject = renderNatsSubjectPattern(
          NatsSubjectPattern.SystemdManagerStartUnit
        );

        const requestCodec = JSONCodec<SystemdManagerStartUnitRequest>();
        const req = {
          unit_name: this.widget.service,
        } as SystemdManagerStartUnitRequest;

        console.log(`Sending request to ${subject}`, req);

        const resMsg = await natsConnection
          ?.request(subject, requestCodec.encode(req), {
            timeout: DEFAULT_NATS_TIMEOUT,
          })
          .catch((e) => {
            const msg = `Error starting ${this.widget?.service}`;
            handleError(msg, e);
          });

        if (resMsg) {
          const resCodec = JSONCodec<
            SystemdManagerStartUnitReply | SystemdManagerStartUnitError
          >();
          let res = resCodec.decode(resMsg?.data);
          console.log(`Received reply to ${subject}`, res);

          if (isSystemdManagerStartUnitError(res)) {
            res = res as SystemdManagerEnableUnitsError;
            const error = new Error(res.error);
            const msg = `Error starting ${this.widget.service}`;
            handleError(msg, error);
            this.$patch({ error });
          } else {
            res = res as SystemdManagerStartUnitReply;
            success(
              `Started ${widget.service}`,
              `${widget.name} is now available.`
            );
            console.log(`Started ${widget.service}, start job id:`, res.job);
          }
        }
      },

      async stopService(notify: boolean) {
        // get nats connection (awaits until NATS server is available)
        const natsStore = useNatsStore();
        const natsConnection: NatsConnection =
          await natsStore.getNatsConnection();

        const subject = renderNatsSubjectPattern(
          NatsSubjectPattern.SystemdManagerStopUnit
        );

        const requestCodec = JSONCodec<SystemdManagerStopUnitRequest>();
        const req = {
          unit_name: this.widget.service,
        } as SystemdManagerStopUnitRequest;

        console.log(`Sending request to ${subject}`, req);

        const resMsg = await natsConnection
          ?.request(subject, requestCodec.encode(req), {
            timeout: DEFAULT_NATS_TIMEOUT,
          })
          .catch((e) => {
            const msg = `Error stopping ${this.widget?.service}`;
            handleError(msg, e);
          });
        if (resMsg) {
          const resCodec = JSONCodec<
            SystemdManagerStopUnitReply | SystemdManagerStopUnitError
          >();
          let res = resCodec.decode(resMsg?.data);
          console.log(`Received reply to ${subject}`, res);

          if (isSystemdManagerStartUnitError(res)) {
            res = res as SystemdManagerEnableUnitsError;
            const error = new Error(res.error);
            const msg = `Error stopping ${this.widget.service}`;
            handleError(msg, error);
            this.$patch({ error });
          } else {
            res = res as SystemdManagerStartUnitReply;
            if (notify) {
              success(
                `Stopped ${widget.service}`,
                `${widget.name} is no longer running.`
              );
            }

            console.log(`Started ${widget.service}, start job id:`, res.job);
          }
        }
      },

      async restartService(notify: boolean) {
        // get nats connection (awaits until NATS server is available)
        const natsStore = useNatsStore();
        const natsConnection: NatsConnection =
          await natsStore.getNatsConnection();

        const subject = renderNatsSubjectPattern(
          NatsSubjectPattern.SystemdManagerRestartUnit
        );

        const requestCodec = JSONCodec<SystemdManagerRestartUnitRequest>();
        const req = {
          unit_name: this.widget.service,
        } as SystemdManagerRestartUnitRequest;

        console.log(`Sending request to ${subject}`, req);
        const resMsg = await natsConnection
          ?.request(subject, requestCodec.encode(req), {
            timeout: DEFAULT_NATS_TIMEOUT,
          })
          .catch((e) => {
            const msg = `Error stopping ${this.widget?.service}`;
            handleError(msg, e);
          });
        if (resMsg) {
          const resCodec = JSONCodec<
            SystemdManagerRestartUnitReply | SystemdManagerRestartUnitError
          >();
          let res = resCodec.decode(resMsg?.data);
          console.log(`Received reply to ${subject}`, res);

          if (isSystemdManagerRestartUnitError(res)) {
            res = res as SystemdManagerEnableUnitsError;
            const error = new Error(res.error);
            const msg = `Error stopping ${this.widget.service}`;
            handleError(msg, error);
            this.$patch({ error });
          } else {
            res = res as SystemdManagerRestartUnitReply;
            if (notify) {
              success(
                `Restarted ${widget.service}`,
                `${widget.name} is starting up.`
              );
            }
            console.log(`Started ${widget.service}, start job id:`, res.job);
          }
        }
      },

      async loadUnit() {
        const natsStore = useNatsStore();
        const natsConnection: NatsConnection =
          await natsStore.getNatsConnection();
        const subject = renderNatsSubjectPattern(
          NatsSubjectPattern.SystemdManagerGetUnit
        );

        const requestCodec = JSONCodec<SystemdManagerGetUnitRequest>();

        const req = {
          unit_name: this.widget?.service,
        } as SystemdManagerGetUnitRequest;
        console.log(`Sending request to ${subject}`, req);
        const resMsg = await natsConnection
          ?.request(subject, requestCodec.encode(req), {
            timeout: DEFAULT_NATS_TIMEOUT,
          })
          .catch((e) => {
            const msg = `Error loading ${this.widget?.service}`;
            natsStore.$patch({ status: ConnectionStatus.ConnectionError });
            handleError(msg, e);
          });

        if (resMsg) {
          const resCodec = JSONCodec<
            SystemdManagerGetUnitReply | SystemdManagerGetUnitError
          >();
          let res = resCodec.decode(resMsg?.data);
          console.log(`Received reply to ${subject}`, res);

          if (isSystemdManagerGetUnitError(res)) {
            res = res as SystemdManagerGetUnitError;
            const error = new Error(res.error);
            const msg = `Error loading ${this.widget.service}`;
            handleError(msg, error);
            this.$patch({ error });
          } else {
            res = res as SystemdManagerGetUnitReply;
            this.$patch({ unit: res.unit });
          }
        }
      },
      async loadUnitFileState(): Promise<SystemdUnitFileState | undefined> {
        const natsStore = useNatsStore();
        const natsConnection: NatsConnection =
          await natsStore.getNatsConnection();
        const subject = renderNatsSubjectPattern(
          NatsSubjectPattern.SystemdManagerGetUnitFileState
        );
        const req = {
          unit_name: this.widget?.service,
        } as SystemdManagerGetUnitRequest;
        console.log(`Sending request to ${subject}`, req);

        const requestCodec = JSONCodec<SystemdManagerGetUnitRequest>();

        const resMsg = await natsConnection
          ?.request(subject, requestCodec.encode(req), {
            timeout: DEFAULT_NATS_TIMEOUT,
          })
          .catch((e) => {
            const msg = `Error loading ${this.widget?.service}`;
            handleError(msg, e);
          });

        if (resMsg) {
          const resCodec = JSONCodec<
            | SystemdManagerGetUnitFileStateReply
            | SystemdManagerGetUnitFileStateError
          >();
          let res = resCodec.decode(resMsg?.data);
          console.log(`Received reply to ${subject}`, res);

          if (isSystemdManagerGetUnitFileState(res)) {
            res = res as SystemdManagerGetUnitError;
            const error = new Error(res.error);
            const msg = `Error loading ${this.widget.service}`;
            handleError(msg, error);
            this.$patch({ error });
          } else {
            res = res as SystemdManagerGetUnitFileStateReply;
            this.$patch({ unitFileState: res.unit_file_state });
            return res.unit_file_state;
          }
        }
      },
      async load() {
        await this.loadUnit();
        this.$patch({ loading: false });
      },
    },
  });
  if (import.meta.hot) {
    import.meta.hot.accept(
      acceptHMRUpdate(scopedStoreDefinition, import.meta.hot)
    );
  }
  return scopedStoreDefinition();
};

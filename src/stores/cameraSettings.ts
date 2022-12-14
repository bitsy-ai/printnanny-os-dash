import { toRaw } from "vue";
import { JSONCodec, type NatsConnection } from "nats.ws";
import { defineStore, acceptHMRUpdate } from "pinia";
import { useNatsStore } from "./nats";
import {
  type PrintNannyCameraSettings,
  type GstreamerCaps,
  type Camera,
  CameraSourceType,
} from "@bitsy-ai/printnanny-asyncapi-models";
import { NatsSubjectPattern, renderNatsSubjectPattern } from "@/types";
import { success } from "./alerts";

const DEFAULT_NATS_TIMEOUT = 12000;

export interface CameraSettingsForm {
  videoFramerate: number;
  hlsEnabled: boolean;
  selectedCaps: GstreamerCaps;
  selectedCamera: Camera;
  showDetectionOverlay: boolean;
  showDetectionGraphs: boolean;
}

const DEFAULT_CAPS = {
  media_type: "video/x-raw",
  format: "YUY2",
  width: 640,
  height: 480,
} as GstreamerCaps;

const DEFAULT_CAMERA = {
  index: 0,
  device_name: "/base/soc/i2c0mux/i2c@1/imx219@10",
  label: "imx219",
  src_type: CameraSourceType.CSI,
  selected_caps: DEFAULT_CAPS,
} as Camera;

const DEFAULT_FORM = {
  hlsEnabled: true,
  videoFramerate: 16,
  selectedCaps: DEFAULT_CAPS,
  selectedCamera: DEFAULT_CAMERA,
  showDetectionOverlay: false,
  showDetectionGraphs: false,
} as CameraSettingsForm;

export const useCameraSettingsStore = defineStore({
  id: "cameraSettings",
  state: () => ({
    loading: true,
    saving: false,
    cameras: [] as Array<Camera>,
    form: DEFAULT_FORM,
    settings: undefined as undefined | PrintNannyCameraSettings,
  }),
  actions: {
    async loadCameras() {
      const natsStore = useNatsStore();
      const natsConnection: NatsConnection =
        await natsStore.getNatsConnection();

      const subject = renderNatsSubjectPattern(NatsSubjectPattern.CamerasLoad);

      const resCodec = JSONCodec<{ cameras: Array<Camera> }>();
      const resMsg = await natsConnection?.request(subject, undefined, {
        timeout: DEFAULT_NATS_TIMEOUT,
      });

      if (resMsg) {
        const data = resCodec.decode(resMsg?.data);
        console.log("Loaded available cameras", data);
        this.$patch({ cameras: data.cameras });
      }
    },
    async loadSettings() {
      const natsStore = useNatsStore();
      const natsConnection: NatsConnection =
        await natsStore.getNatsConnection();

      const subject = renderNatsSubjectPattern(
        NatsSubjectPattern.CameraSettingsLoad
      );

      const resCodec = JSONCodec<PrintNannyCameraSettings>();
      const resMsg = await natsConnection?.request(subject, undefined, {
        timeout: DEFAULT_NATS_TIMEOUT,
      });

      if (resMsg) {
        const settings = resCodec.decode(resMsg?.data);
        console.log("Loaded camera settings:", settings);

        const camera = settings.video_src as Camera;

        const form = {
          videoFramerate: settings.video_framerate,
          hlsEnabled: settings.hls.hls_enabled,
          selectedCamera: camera,
          selectedCaps: camera.selected_caps,
          showDetectionOverlay: settings.detection.overlay,
          showDetectionGraphs: settings.detection.graphs,
        } as CameraSettingsForm;

        this.$patch({ form, settings });
      }
    },

    async save() {
      this.$patch({ saving: true });

      const natsStore = useNatsStore();
      const natsConnection: NatsConnection =
        await natsStore.getNatsConnection();

      const subject = renderNatsSubjectPattern(
        NatsSubjectPattern.CameraSettingsApply
      );

      const reqCodec = JSONCodec<PrintNannyCameraSettings>();

      const req = toRaw(this.settings) as PrintNannyCameraSettings;
      req.hls.hls_enabled = this.form?.hlsEnabled;
      req.video_framerate = this.form?.videoFramerate as number;
      req.video_src = this.form?.selectedCamera as Camera;
      req.video_src.selected_caps = this.form?.selectedCaps as GstreamerCaps;
      req.detection.graphs = this.form?.showDetectionGraphs as boolean;
      req.detection.overlay = this.form?.showDetectionOverlay as boolean;

      console.log("Submitting camera settings request:", req);
      const resMsg = await natsConnection?.request(
        subject,
        reqCodec.encode(req),
        {
          timeout: DEFAULT_NATS_TIMEOUT,
        }
      );
      if (resMsg) {
        const resCodec = JSONCodec<PrintNannyCameraSettings>();
        const settings = resCodec.decode(resMsg?.data);
        console.log("Applied camera settings:", settings);

        const camera = settings.video_src as Camera;
        const form = {
          videoFramerate: settings.video_framerate,
          hlsEnabled: settings.hls.hls_enabled,
          selectedCamera: camera,
          selectedCaps: camera.selected_caps,
          showDetectionOverlay: settings.detection.overlay,
          showDetectionGraphs: settings.detection.graphs,
        } as CameraSettingsForm;

        this.$patch({ form, settings });
        success(
          `Updated Camera Settings`,
          `PrintNanny Cam was automatically restarted`
        );
      }
      this.$patch({ saving: false });
    },

    async load() {
      await Promise.all([this.loadSettings(), this.loadCameras()]);
      this.$patch({ loading: false });
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(
    acceptHMRUpdate(useCameraSettingsStore, import.meta.hot)
  );
}

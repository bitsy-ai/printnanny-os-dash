import { useAlertStore } from "@/stores/alerts";
import type { UiStickyAlert, AlertAction } from "@/types";
import type { AxiosError } from "axios";
import axios from "axios";

function handleError(header: string, e: Error | AxiosError) {
  const store = useAlertStore();
  console.error(header, e);
  let message = e.message || e.toString();
  const actions = [
    {
      bgColor: "bg-red-500",
      hoverBgColor: "bg-red-700",
      textColor: "text-white",
      hoverTextColor: "text-white",
      text: "Send Crash Report",
      onClick: () => {
        store.openCrashReport(header);
      },
    },
    {
      bgColor: "bg-white",
      hoverBgColor: "bg-gray-50",
      textColor: "text-gray-700",
      hoverTextColor: "text-gray-700",
      text: "Refresh",
      onClick: () => {
        window.location.reload();
      },
    },
  ] as Array<AlertAction>;

  if (axios.isAxiosError(e)) {
    const container = { message: "", error_uuid: "" };
    if (
      e.response?.data.non_field_errors &&
      e.response?.data.non_field_errors.length > 0
    ) {
      message = e.response.data.non_field_errors.join("\n");
      container["message"] = e.response.data.non_field_errors.join("\n");
    } else if (e.response?.data.detail) {
      container["message"] = e.response.data.detail;
    } else if (e.response?.data.error) {
      container["message"] = e.response.data.error;
    } else {
      container["message"] = e.response?.data;
    }
    message = JSON.stringify(container, null, 2);
  }

  const alert: UiStickyAlert = {
    header,
    message,
    actions,
    error: e,
  };
  store.pushAlert(alert);
}

function alertMessage(header: string, message: string) {
  const actions = [
    {
      bgColor: "bg-white",
      hoverBgColor: "bg-gray-50",
      textColor: "text-gray-700",
      hoverTextColor: "text-gray-700",
      text: "Refresh",
      onClick: () => {
        window.location.reload();
      },
    },
  ] as Array<AlertAction>;
  const alert: UiStickyAlert = {
    header,
    message,
    actions,
    error: undefined,
  };
  const store = useAlertStore();
  store.pushAlert(alert);
}

export { handleError };

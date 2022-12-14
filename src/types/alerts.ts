import type { FunctionalComponent, HTMLAttributes, VNodeProps } from "vue";

export interface AlertAction {
  bgColor: string;
  hoverBgColor: string;
  textColor: string;
  hoverTextColor: string;

  text: string;
  onClick: () => void;
  routeName?: string;
}

export interface UiStickyAlert {
  message: string;
  header: string;
  actions: Array<AlertAction>;
  error?: Error | undefined | string;
  icon?: FunctionalComponent<HTMLAttributes & VNodeProps>;
  iconClass?: string;
}

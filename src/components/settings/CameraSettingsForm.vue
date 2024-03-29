<template>
  <Transition name="fade" mode="out-in">
    <div
      class="flex w-full h-full align-items-center justify-center lg:col-span-9"
      v-if="store.settings === undefined"
    >
      <TextSpinner class="m-auto text-gray-500 stroke-gray-500" />
    </div>

    <Form
      class="space-y-8 divide-y divide-gray-200 lg:col-span-9 p-4 h-full"
      :validation-schema="schema"
      v-else
      :initial-values="initialValues"
      @submit="submitForm"
    >
      <div class="space-y-8 divide-y divide-gray-200">
        <div class="">
          <div>
            <h2
              class="text-left text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl"
            >
              Camera
            </h2>
            <p class="mt-1 text-sm text-gray-500">
              Configure PrintNanny Cam settings.
            </p>
          </div>
          <div class="mt-4 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div class="sm:col-span-3">
              <Listbox as="div" v-model="store.selectedCamera">
                <ListboxLabel class="block text-sm font-medium text-gray-700"
                  >Select a camera:</ListboxLabel
                >
                <div class="relative mt-1">
                  <ListboxButton
                    class="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                  >
                    <span class="block truncate"
                      ><strong>{{ store.settings.camera.label }}</strong>
                      {{ store.settings.camera.device_name }}</span
                    >
                    <span
                      class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2"
                    >
                      <ChevronUpDownIcon
                        class="h-5 w-5 text-gray-400"
                        aria-hidden="true"
                      />
                    </span>
                  </ListboxButton>

                  <transition
                    leave-active-class="transition ease-in duration-100"
                    leave-from-class="opacity-100"
                    leave-to-class="opacity-0"
                  >
                    <ListboxOptions
                      class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
                    >
                      <ListboxOption
                        as="template"
                        v-for="camera in store.cameras"
                        :key="camera.device_name"
                        :value="camera"
                        v-slot="{ active, selected }"
                      >
                        <li
                          :class="[
                            active
                              ? 'text-white bg-indigo-600'
                              : 'text-gray-900',
                            'relative cursor-default select-none py-2 pl-3 pr-9',
                          ]"
                        >
                          <span
                            :class="[
                              selected ? 'font-semibold' : 'font-normal',
                              'block truncate',
                            ]"
                            ><strong>
                              {{ camera.label }}
                            </strong>
                            {{ camera.device_name }}</span
                          >

                          <span
                            v-if="selected"
                            :class="[
                              active ? 'text-white' : 'text-indigo-600',
                              'absolute inset-y-0 right-0 flex items-center pr-4',
                            ]"
                          >
                            <CheckIcon class="h-5 w-5" aria-hidden="true" />
                          </span>
                        </li>
                      </ListboxOption>
                    </ListboxOptions>
                  </transition>
                </div>
              </Listbox>
            </div>

            <div class="sm:col-span-3">
              <Listbox as="div" v-model="store.selectedCaps">
                <ListboxLabel class="block text-sm font-medium text-gray-700"
                  >Select camera resolution:</ListboxLabel
                >
                <div class="relative mt-1">
                  <ListboxButton
                    class="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                  >
                    <span class="block truncate"
                      >width={{ store.settings?.camera.width }} height={{
                        store.settings.camera.height
                      }}
                      format={{ store.settings.camera.format }} color={{
                        store.settings.camera.colorimetry
                      }}</span
                    >
                    <span
                      class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2"
                    >
                      <ChevronUpDownIcon
                        class="h-5 w-5 text-gray-400"
                        aria-hidden="true"
                      />
                    </span>
                  </ListboxButton>

                  <transition
                    leave-active-class="transition ease-in duration-100"
                    leave-from-class="opacity-100"
                    leave-to-class="opacity-0"
                  >
                    <ListboxOptions
                      class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
                    >
                      <ListboxOption
                        as="template"
                        v-for="(caps, idx) in store.selectedCamera
                          ?.available_caps"
                        :key="idx"
                        :value="caps"
                        v-slot="{ active, selected }"
                      >
                        <li
                          :class="[
                            active
                              ? 'text-white bg-indigo-600'
                              : 'text-gray-900',
                            'relative cursor-default select-none py-2 pl-3 pr-9',
                          ]"
                        >
                          <span
                            :class="[
                              selected ? 'font-semibold' : 'font-normal',
                              'block truncate',
                            ]"
                            >width={{ caps.width }} height={{
                              caps.height
                            }}
                            format={{ caps.format }} color={{
                              store.settings.camera.colorimetry
                            }}</span
                          >

                          <span
                            v-if="selected"
                            :class="[
                              active ? 'text-white' : 'text-indigo-600',
                              'absolute inset-y-0 right-0 flex items-center pr-4',
                            ]"
                          >
                            <CheckIcon class="h-5 w-5" aria-hidden="true" />
                          </span>
                        </li>
                      </ListboxOption>
                    </ListboxOptions>
                  </transition>
                </div>
              </Listbox>
            </div>

            <div class="sm:col-span-1">
              <label
                for="videoFramerate"
                class="block text-sm font-medium text-gray-700"
                >Video Framerate</label
              >
              <div class="mt-1">
                <Field
                  type="number"
                  name="videoFramerate"
                  id="videoFramerate"
                  :value="store.settings.camera.framerate_n"
                  class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div class="sm:col-span-4">
              <div class="relative flex items-start">
                <div class="flex h-5 items-center">
                  <Field
                    id="hlsEnabled"
                    name="hlsEnabled"
                    type="checkbox"
                    :value="store.settings.hls.enabled"
                    :unchecked-value="false"
                    class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </div>
                <div class="ml-3 text-sm">
                  <label for="hlsEnabled" class="font-medium text-gray-700"
                    >Enable HLS Compatibility</label
                  >
                  <p class="text-gray-500">
                    Required for compatibility with OctoPrint camera plugins.
                    Disable to improve performance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="pt-8">
          <div>
            <fieldset>
              <h3 class="text-lg font-medium leading-6 text-gray-900">
                Snapshot Settings
              </h3>
              <p class="mt-1 text-sm text-gray-500">
                Capture print job snapshots.
              </p>
              <div class="mt-4 space-y-4">
                <div class="relative flex items-start">
                  <div class="flex h-5 items-center">
                    <Field
                      id="cameraSnapshotEnabled"
                      name="cameraSnapshotEnabled"
                      type="checkbox"
                      :value="store.settings.snapshot.enabled"
                      :unchecked-value="false"
                      class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </div>
                  <div class="ml-3 text-sm">
                    <label
                      for="cameraSnapshotEnabled"
                      class="font-medium text-gray-700"
                      >Save print job snapshots to PrintNanny Cloud</label
                    >
                    <p class="text-gray-500">
                      View your 3D printer's progress from anywhere in the
                      world. Help improve PrintNanny's AI.
                    </p>
                  </div>
                </div>
              </div>
            </fieldset>
          </div>
        </div>

        <div class="pt-8">
          <div>
            <h3 class="text-lg font-medium leading-6 text-gray-900">
              Detection Settings
            </h3>
            <p class="mt-1 text-sm text-gray-500">
              Adjust PrintNanny's quality monitoring and failure detection
              settings.
            </p>
          </div>
          <div class="mt-6">
            <fieldset>
              <legend class="sr-only">Debug Settings</legend>
              <div
                class="text-base font-medium text-gray-900"
                aria-hidden="true"
              >
                Debug Utilities
              </div>
              <p class="text-gray-500 text-sm">
                These settings let you inspect PrintNanny's detection system,
                but may impact video stream performance.
              </p>
              <div class="mt-4 space-y-4">
                <div class="relative flex items-start">
                  <div class="flex h-5 items-center">
                    <Field
                      id="showDetectionOverlay"
                      name="showDetectionOverlay"
                      type="checkbox"
                      :value="store.settings.detection.overlay"
                      :unchecked-value="false"
                      class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </div>
                  <div class="ml-3 text-sm">
                    <label
                      for="showDetectionOverlay"
                      class="font-medium text-gray-700"
                      >Show Detection Overlay</label
                    >
                    <p class="text-gray-500">
                      Draw boxes around detected objects.
                    </p>
                  </div>
                </div>
                <div class="relative flex items-start">
                  <div class="flex h-5 items-center">
                    <Field
                      id="showDetectionGraphs"
                      name="showDetectionGraphs"
                      type="checkbox"
                      :value="store.settings.detection.graphs"
                      :unchecked-value="false"
                      class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </div>
                  <div class="ml-3 text-sm">
                    <label
                      for="showDetectionGraphs"
                      class="font-medium text-gray-700"
                      >Show Detection Graphs</label
                    >
                    <p class="text-gray-500">
                      Graph last 30 seconds of detections.
                    </p>
                  </div>
                </div>
              </div>
            </fieldset>
          </div>
        </div>
      </div>

      <div class="pt-5">
        <div class="flex justify-end">
          <TextSpinner
            class="m-auto text-gray-500 stroke-gray-500"
            text="Saving your settings..."
            v-if="store.saving"
          />
          <button
            type="button"
            class="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="ml-3 inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Save
          </button>
        </div>
      </div>
    </Form>
  </Transition>
</template>
<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
<script setup lang="ts">
import { Form, Field } from "vee-validate";
import { onMounted, ref, toRaw } from "vue";

import { ChevronUpDownIcon, CheckIcon } from "@heroicons/vue/24/outline";

import TextSpinner from "@/components/TextSpinner.vue";
import {
  useCameraSettingsStore,
  type CameraSettingsForm,
} from "@/stores/cameraSettings";
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
  ListboxLabel,
} from "@headlessui/vue";
import * as yup from "yup";
import type {
  Camera,
  GstreamerCaps,
} from "@bitsy-ai/printnanny-asyncapi-models";
const store = useCameraSettingsStore();

const schema = yup.object({
  videoFramerate: yup.number().required(),
  hlsEnabled: yup.boolean().required(),
  showDetectionGraphs: yup.boolean(),
  showDetectionOverlay: yup.boolean(),
  recordAutoStart: yup.boolean(),
  cameraSnapshotEnabled: yup.boolean(),
});

const initialValues = ref(undefined as undefined | CameraSettingsForm);

async function submitForm(form: any) {
  console.log("Form submitted:", toRaw(form));
  // field value is a string, but NATS message format requires an integer
  form.videoFramerate = parseInt(form.videoFramerate);
  await store.save(form as CameraSettingsForm);
}

onMounted(async () => {
  await store.load();

  initialValues.value = {
    // vee-validate will set form.<field> to undefined if checkbox is unchecked, coorce boolean to undefined
    recordAutoStart:
      store.settings?.recording.auto_start === true ? true : undefined,
    cameraSnapshotEnabled:
      store.settings?.recording.cloud_sync === true ? true : undefined,
    videoFramerate: store.settings?.camera.framerate_n as number,
    hlsEnabled: store.settings?.hls.enabled === true ? true : undefined,
    showDetectionGraphs:
      store.settings?.detection.graphs === true ? true : undefined,
    showDetectionOverlay:
      store.settings?.detection.overlay === true ? true : undefined,
    selectedCaps: store.selectedCaps as GstreamerCaps,
    selectedCamera: store.selectedCamera as Camera,
  };
});
</script>

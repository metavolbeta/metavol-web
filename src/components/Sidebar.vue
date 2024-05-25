<script setup lang="ts">

import { ref } from 'vue';

const props = defineProps(["sortVisible"]);
const emit = defineEmits([
  "sort",
  "fileLoaded",
  "dirLoaded",
  "leftButtonFunctionChanged",
  "openSample",
  "presetSelected"
]);

const leftButtonFunction = ref('none');

const openFile: any = ref(null);
const openDir: any = ref(null);
const openFileClicked = () => {openFile.value.click()}
const openDirClicked = () => {openDir.value.click()}
const dicom_open = (e: any) => emit("fileLoaded", e.target.files[0]);
const dicom_dir_open = (e: any) => emit("dirLoaded", e.target.files);
// const openSampleClicked = () => emit("openSample");
const sortClicked = () => emit("sort");
const leftButtonFunctionChanged = () =>{
  emit("leftButtonFunctionChanged", leftButtonFunction.value);
}
const presetClicked = (e:string) => emit("presetSelected", e);

</script>

<template>
<div style="display:flex; flex-flow: column;">

  <div style="display:flex; flex-flow: column;">

    <v-file-input label="Open file"></v-file-input>

    <button @click="openFileClicked">Open File</button>
    <input ref="openFile" type="file" class="hidden-input" @change="dicom_open">

    <button @click="openDirClicked">Open Folder</button>
    <input ref="openDir" type="file" class="hidden-input" @change="dicom_dir_open" webkitdirectory multiple>

    <button v-if="props.sortVisible==1" @click="sortClicked">Sort</button>

    <!-- <button @click="openSampleClicked">Open Sample</button> -->

  </div>

  <div  style="display:flex; flex-flow: column; text-align: left;">
    <label>Left button</label>

    <v-container
    class="px-0"
    fluid
  >
    <v-radio-group v-model="radioGroup">
      <v-radio
        v-for="n in 3"
        :key="n"
        :label="`Radio ${n}`"
        :value="n"
      ></v-radio>
    </v-radio-group>
  </v-container>


    <div>
      <input type="radio" id = "radio_none" value = "none" v-model="leftButtonFunction" @change="leftButtonFunctionChanged"/>
      <label for="radio_none">None</label>
    </div>

    <div>
      <input type="radio" id = "radio_windowing" value = "window" v-model="leftButtonFunction" @change="leftButtonFunctionChanged"/>
      <label for="radio_windowing">Window</label>
    </div>

    <div>
      <input type="radio" id = "radio_pan" value = "pan" v-model="leftButtonFunction" @change="leftButtonFunctionChanged"/>
      <label for="radio_pan">Pan</label>
    </div>

    <div>
      <input type="radio" id = "radio_zoom" value = "zoom" v-model="leftButtonFunction" @change="leftButtonFunctionChanged"/>
      <label for="radio_zoom">Zoom</label>
    </div>

    <div>
      <input type="radio" id = "radio_paging" value = "page" v-model="leftButtonFunction" @change="leftButtonFunctionChanged"/>
      <label for="radio_paging">Page</label>
    </div>
  </div>

  <br>
  <label>Preset</label>
  <div style="display:flex; flex-flow: column;">
    <div style="display:flex; flex-flow: row;">
      <v-btn @click="presetClicked('Reset')">Reset</v-btn>
      <v-btn @click="presetClicked('Lung')">Lung</v-btn>
    </div>
    <div style="display:flex; flex-flow: row;">
      <v-btn @click="presetClicked('Bone')">Bone</v-btn>
      <v-btn @click="presetClicked('Brain')">Brain</v-btn>
    </div>
  </div>

</div>

</template>
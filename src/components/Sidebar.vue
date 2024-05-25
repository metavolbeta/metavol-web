<script setup lang="ts">

import { ref } from 'vue';

const radioGroup = ref("");

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

    <!-- <v-file-input label="Open file"></v-file-input>

    <button @click="openFileClicked">Open File</button>
    <input ref="openFile" type="file" class="hidden-input" @change="dicom_open">

    <button @click="openDirClicked">Open Folder</button>
    <input ref="openDir" type="file" class="hidden-input" @change="dicom_dir_open" webkitdirectory multiple>

    <button v-if="props.sortVisible==1" @click="sortClicked">Sort</button> -->

    <!-- <button @click="openSampleClicked">Open Sample</button> -->

  </div>

  <div  style="display:flex; flex-flow: column; text-align: left;">
    <label>Left button</label>

    <v-radio-group v-model="leftButtonFunction" @change="leftButtonFunctionChanged">
      <v-radio key="none" label="None" value="none" />
      <v-radio key="window" label="Window" value="window" />
      <v-radio key="pan" label="Pan" value="pan" />
      <v-radio key="zoom" label="Zoom" value="zoom" />
      <v-radio key="page" label="Page" value="page" />
    </v-radio-group>

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
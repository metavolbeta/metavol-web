<script setup lang="ts">

import { ref } from 'vue';

const emit = defineEmits([
  "fileLoaded",
  "dirLoaded",
  "leftButtonFunctionChanged",
  "openSample",
  "presetSelected",
  "changeSeries",
  "changeSlice",
  "mpr",
  "axi",
  "cor",
  "mip",
  "smip",
  "monochrome",
  "rainbow",
  "hot",
  "reverse",
  "phantom1",
  "phantom2",
  "phantom3",
  "fusion",
  "maximize",
]);

// const leftButtonFunction = ref('none');

const openFile: any = ref(null);
const openDir: any = ref(null);
const openFileClicked = () => {openFile.value.click()}
const openDirClicked = () => {openDir.value.click()}
const dicom_open = (e: any) => emit("fileLoaded", e.target.files[0]);
const dicom_dir_open = (e: any) => emit("dirLoaded", e.target.files);
// const openSampleClicked = () => emit("openSample");
// const leftButtonFunctionChanged = (func: string) =>{
//   leftButtonFunction.value = func;
//   emit("leftButtonFunctionChanged", leftButtonFunction.value);
// }
const presetClicked = (e:string) => emit("presetSelected", e);
const changeSeries = (e:number) => emit("changeSeries", e);
const changeSlice = (e:number) => emit("changeSlice", e);

const showUnderConstruction = ref(false);
const showSummary = ref(false);
const showTag = ref(false);

</script>

<template>

  <v-container fluid>

    <v-row>
      <h3>Window preset</h3>
    </v-row>
    <v-row>
      <v-btn @click="presetClicked('Lung')">Lung</v-btn>
      <v-btn @click="presetClicked('Med')">Med</v-btn>
      <v-btn @click="presetClicked('Abd')">Abd</v-btn>
      <v-btn @click="presetClicked('Bone')">Bone</v-btn>
      <v-btn @click="presetClicked('Brain')">Brain</v-btn>
      <v-btn @click="presetClicked('Fat')">Fat</v-btn>
      <v-btn @click="presetClicked('Reset')">Reset</v-btn>
    </v-row>

    <v-row style="padding-top: 9px;">
      <h3>Slice</h3>
    </v-row>
    <v-row>
      <v-btn @click="changeSlice(-100000)"><v-icon icon="mdi-arrow-collapse-left" ></v-icon></v-btn>
      <v-btn @click="changeSlice(-1)"><v-icon icon="mdi-arrow-left" ></v-icon></v-btn>
      <v-btn @click="changeSlice(1)"><v-icon icon="mdi-arrow-right" ></v-icon></v-btn>
      <v-btn @click="changeSlice(100000)"><v-icon icon="mdi-arrow-collapse-right" ></v-icon></v-btn>
    </v-row>

    <v-row style="padding-top: 9px;">
      <h3>Color</h3>
    </v-row>
    <v-row>
      <v-btn @click="emit('monochrome')">Monochrome</v-btn>
      <v-btn @click="emit('rainbow')">Rainbow</v-btn>
      <v-btn @click="emit('hot')">Hot</v-btn>
      <v-btn @click="emit('reverse')">Reverse</v-btn>
    </v-row>

    <v-row style="padding-top: 9px;">
      <h3>3D</h3>
    </v-row>
    <v-row>
      <v-btn @click="emit('mpr')">MPR</v-btn>
      <v-btn @click="emit('axi')">Axi</v-btn>
      <v-btn @click="emit('cor')">Cor</v-btn>
      <v-btn @click="emit('mip')">MIP</v-btn>
      <v-btn @click="emit('smip')">sMIP</v-btn>
    </v-row>

    <v-row style="padding-top: 9px;">
      <h3>Series</h3>
    </v-row>
    <v-row>
      <v-btn @click="changeSeries(-1)"><v-icon icon="mdi-arrow-left" ></v-icon></v-btn>
      <v-btn @click="changeSeries(1)"><v-icon icon="mdi-arrow-right" ></v-icon></v-btn>
    </v-row>


    <v-row style="padding-top: 9px;">
      <h3>Demo</h3>
    </v-row>
    <v-row>
      <v-btn @click="emit('phantom3')">Earth</v-btn>
      <v-btn @click="emit('phantom1')">Humanoid</v-btn>
      <v-btn @click="emit('phantom2')">Voronoi</v-btn>
    </v-row>

    <v-row style="padding-top: 9px;">
      <v-checkbox label="Under construction" v-model="showUnderConstruction"></v-checkbox>
    </v-row>
    <v-row v-if="showUnderConstruction">
      <v-btn @click="emit('fusion')">Fusion</v-btn>
      <v-btn @click="emit('maximize')">Maximize</v-btn>
      <v-switch label="Show summary" v-model="showSummary" style="padding-top: 36px;" hide-details></v-switch>
      <v-switch label="Show tag" v-model="showTag" hide-details></v-switch>
    </v-row>


  </v-container>

</template>


<style scoped>
.v-btn {
  margin: 2px 2px 2px 2px;
  min-width: 0;
  min-height: 0;
  padding: 0px 10px;
  text-transform: none;
  transition: border-color 0.25s, box-shadow 0.25s;
  background-color: #3e2723;
  border: 1px solid transparent;
}


.v-btn:hover {
  background-color: #4e342e;
  box-shadow: 0 0 7px 2px #feee95;
}


</style>

<template>
  <v-app>
    <v-main>
      <v-app-bar color="brown-darken-4">
        <template v-slot:prepend>
          <v-app-bar-nav-icon @click.stop="drawer = !drawer" variant="text"></v-app-bar-nav-icon>
        </template>
        <!-- <div> -->
          <h1 class="d-inline mr-10" style="font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif">
            Metavol
          </h1>

          <!-- <v-checkbox>Hello</v-checkbox> -->
          <v-switch class="d-inline mr-5" label="Synchronize" base-color="brown-darken-2" color="orange-lighten-1" v-model="syncImageBox" style="padding-top: 18px;"></v-switch>

          <v-btn-toggle  class="mr-5" v-model="leftButtonFunction" base-color="brown-darken-3" color="brown-darken-2" divided>
              <v-btn value="window" >
                <v-icon icon="mdi-network-strength-4" ></v-icon>
                <v-tooltip activator="parent" location="bottom">Window</v-tooltip>
              </v-btn>
              <v-btn value="pan">
                <v-icon icon="mdi-hand-back-right-outline" ></v-icon>
                <v-tooltip activator="parent" location="bottom">Pan</v-tooltip>
              </v-btn>
              <v-btn value="zoom">
                <v-icon icon="mdi-magnify-plus-outline" ></v-icon>
                <v-tooltip activator="parent" location="bottom">Zoom</v-tooltip>
              </v-btn>
              <v-btn value="page">
                <v-icon icon="mdi-arrow-up-down"></v-icon>
                <v-tooltip activator="parent" location="bottom">Page</v-tooltip>
              </v-btn>
              <v-btn value="roi">
                <v-icon icon="mdi-arrow-up-down"></v-icon>
                <v-tooltip activator="parent" location="bottom">ROI</v-tooltip>
              </v-btn>
             </v-btn-toggle>

          <v-btn class="myBtn ml-12" @click="changeImageBoxSize(-100)">
            <v-icon icon="mdi-minus" ></v-icon>
          </v-btn>
          <p class="ml-3 mr-3">Box size</p>
          <v-btn class="myBtn mr-12" @click="changeImageBoxSize(100)">
            <v-icon icon="mdi-plus" ></v-icon>
          </v-btn>


        <template v-slot:append>
          <v-btn class="myBtn" @click="closingImages=true">Close all</v-btn>
        </template>


          
    <v-menu>
      <template v-slot:activator="{ props }">
        <v-btn class="myBtn"
          v-bind="props"
        >
          Box number
        </v-btn>
      </template>
      <v-list @click:select="clickItem">
        <v-list-item key="1" value="1"><v-list-item-title>1</v-list-item-title></v-list-item>
        <v-list-item key="2" value="2"><v-list-item-title>2</v-list-item-title></v-list-item>
        <v-list-item key="3" value="3"><v-list-item-title>3</v-list-item-title></v-list-item>
        <v-list-item key="4" value="4"><v-list-item-title>4</v-list-item-title></v-list-item>
        <v-list-item key="6" value="6"><v-list-item-title>6</v-list-item-title></v-list-item>
        <v-list-item key="8" value="8"><v-list-item-title>8</v-list-item-title></v-list-item>
        <v-list-item key="9" value="9"><v-list-item-title>9</v-list-item-title></v-list-item>
        <v-list-item key="10" value="10"><v-list-item-title>10</v-list-item-title></v-list-item>
        <v-list-item key="12" value="12"><v-list-item-title>12</v-list-item-title></v-list-item>
      </v-list>
    </v-menu>


        <v-app-bar-title  class="text-h4">
        </v-app-bar-title>

      </v-app-bar>

      
      <DicomView v-model:drawer="drawer" v-model:leftButtonFunction="leftButtonFunction"
        v-model:imageBoxW="imageBoxW" v-model:imageBoxH="imageBoxW" v-model:tileN="tileN"
        v-model:syncImageBox="syncImageBox" v-model:closingImages="closingImages"
      />

      <!-- <HelloWorld /> -->

    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import {ref} from 'vue';
import HelloWorld from './components/HelloWorld.vue'
import DicomView from "./components/DicomView.vue";
import { getWH, getTileN } from "./components/UrlParser.ts";


const drawer = ref(true);
const leftButtonFunction = ref(null);
const [w,h] = getWH();
const imageBoxW = ref(w);
const imageBoxH = ref(h);
const closingImages = ref(false);

const tileN = ref(getTileN());

const syncImageBox = ref(false);

const changeImageBoxSize = (d: number) => {
  let a = imageBoxH.value;
  a += d;
  if (a<100){
    a=100;
  }
  if (a>1000){
    a=1000;
  }
  imageBoxH.value=a;
  imageBoxW.value=a;

}

const clickItem = (e) => {
  // debugger;
  tileN.value = Number(e.id);
};


</script>

<style scoped>
.v-btn {
  min-width: 0;
  min-height: 0;
}

.myBtn{
  background-color:#4E342E;
  text-transform: none;
  padding: 0px 10px;
}

</style>

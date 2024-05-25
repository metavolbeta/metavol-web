<script setup lang="ts">

//5/21 今後付け加える機能
// PNGを読み込めるように
// MIP/surfaceMIP
// Niftiの読み込み/fusion/できれば位置合わせ/rainbowCLUTが遅い
// 1つでもエラーの出るファイルがあると開けない
// 2Dの表示、右上に
// 上下さかさま　spinal tumor
// 画像をクローズするボタン

import {solve} from './linalg.ts';
import { ref } from "vue";
import { DataSet, parseDicom } from "dicom-parser";
import * as DicomLib from './dicomLib.ts';
import axios from "axios";
import sidebar from "./Sidebar.vue";
import imagebox from "./ImageBox.vue";
import { ImageBoxInfoBase, DicomImageBoxInfo, DicomVolumeImageBoxInfo, defaultInfo } from "./DicomImageBoxInfo";
import { getAllFilesRecursive } from "./DragAndDropUtil";
import { generateDicomVolumeFromDicom } from './dicom2dicomVolume';
import * as DecompressJpegLossless from "./decompressJpegLossless";
import { DicomVolume } from "./DicomVolume";
import * as THREE from 'three';
import {cluts} from './Clut.ts';

interface MyDataSet extends DataSet {
  decompressed: ArrayBuffer;
}

const isMipCheckbox = ref(true);
const isMipChanged = () => {
  const info = getSelectedInfo();
  info.isMip = !info.isMip;
  show();
}

const selectedImageBoxId = ref(0);
const imageBoxWH = ref([500,500]);
const isLoading = ref(false);
const isEnter = ref(false);

const syncImageBox = ref(false);
const showSummary = ref(false);
const showTag = ref(false);
const summaryText = ref('');
const tagText = ref('');

const imb = ref<InstanceType<typeof imagebox>[]>();
const tileXY = ref([2,1]);

let urlList: string[];
let unsortedDicomDataSetList: MyDataSet[];
let dicomDataSetList: MyDataSet[][];
let dicomVolumeList: DicomVolume[];

const imageBoxInfos = ref<ImageBoxInfoBase[]>([]);
const getDicomImageBoxInfo = (index: number) => imageBoxInfos.value[index] as DicomImageBoxInfo;
const getDicomVolumeImageBoxInfo = (index: number) => imageBoxInfos.value[index] as DicomVolumeImageBoxInfo;
const isDicomImageBoxInfo = (i:number) => {
  return "currentDicomSeriesNumber" in imageBoxInfos.value[i];
}
const getSelectedInfo = () => getDicomVolumeImageBoxInfo(selectedImageBoxId.value);

let leftButtonFunction = "None";
const leftButtonFunctionChanged = (e: any) => {
  leftButtonFunction = e;
};

const initializeDicomListsImagesBoxInfos = () => {
  urlList = [];
  unsortedDicomDataSetList = [];
  dicomDataSetList = [];
  dicomVolumeList = [];
  imageBoxInfos.value = [defaultInfo(0), defaultInfo(1)];
};
initializeDicomListsImagesBoxInfos();

const changeSlice = (index: number, add_number: number) => {
  if (isDicomImageBoxInfo(index)){
    const a = getDicomImageBoxInfo(index);
    let c = a.currentSliceNumber;
    c += add_number;
    const len = dicomDataSetList[a.currentDicomSeriesNumber].length

    if (c < 0) c = 0;
    if (c >= len) c = len - 1;

    a.currentSliceNumber = c;
  }else{
    const a = getDicomVolumeImageBoxInfo(index);
    if (a.isMip){
      a.mip!.mipAngle += 15*add_number;
    }else{
      a.centerInWorld.addScaledVector(a.vecz, add_number);
    }
  }
};

const setMyWCWW = (i:number, wc:number | null, ww: number | null) => {
  imageBoxInfos.value[i].myWC= wc;
  imageBoxInfos.value[i].myWW= ww;
}
const getMyWCWW = (i:number) => {
  return [imageBoxInfos.value[i].myWC, imageBoxInfos.value[i].myWW];
}

const presetSelected = (e: string) => {
  const id = selectedImageBoxId.value;
  if (e === "Lung") setMyWCWW(id, -700, 1500);
  if (e === "Bone") setMyWCWW(id, 200, 2000);
  if (e === "Brain") setMyWCWW(id, 40, 80);
  if (e === "Reset") setMyWCWW(id, null, null);
  show();
};

const dragEnter = () => { isEnter.value = true; }
const dragLeave = () => { isEnter.value = false; }
const dropFile = async (e: DragEvent) => {
  const files = await getAllFilesRecursive(e);
  loadFiles(files);
  isEnter.value = false;
};

const doOneOrAll = (id: number, action: (i:number) => void ) => {
  if (syncImageBox.value){
    for (let i=0; i<imb.value!.length; i++){
      action(i);
    }
  }else{
    action(id);
  }
}

const mouseMove = (e: MouseEvent) => {
  const id = getIdOfEventOccured(e);
  const info = getDicomImageBoxInfo;
  const infoV = getDicomVolumeImageBoxInfo;

  if (leftButtonFunction == "window") {
    if (e.buttons == 1) {
      let [wc,ww] = getMyWCWW(id);
      if (wc === null) {
        wc = Number(dicomDataSetList[id][info(id).currentSliceNumber].string("x00281050", 0)) ?? 0;
      }
      if (ww === null) {
        ww = Number(dicomDataSetList[id][info(id).currentSliceNumber].string("x00281051", 0)) ?? 0;
      }
      wc += e.movementY;
      ww += e.movementX;
      if (ww < 1) ww = 1;
      setMyWCWW(id, wc, ww);
      show();
    }
  }

  if (leftButtonFunction == "page") {
    if (e.buttons == 1) {
      doOneOrAll(id, (i:number) => changeSlice(i, e.movementY));
      show();
    }
  }

  if (leftButtonFunction == "zoom") {
    if (e.buttons == 1) {
      doOneOrAll(id, (i:number) => {
        if (isDicomImageBoxInfo(id)){
          let r = 1.02;
          if (e.movementY > 0) r = 1 / r;
          info(i).zoom *= r;
          showImage(i);
        }else{
          let r = Math.pow(1.02, e.movementY);
          const a = infoV(i);
          a.vecx.multiplyScalar(r);
          a.vecy.multiplyScalar(r);
          showImage(i);
        }
      });
    }
  }

  if (leftButtonFunction == "pan") {
    if (e.buttons == 1) {
      doOneOrAll(id, (i:number) => {
        if (isDicomImageBoxInfo(id)){
          const zoom = info(i).zoom;
          info(i).centerX -= e.movementX / zoom;
          info(i).centerY -= e.movementY / zoom;
        }else{
          const a = infoV(i);
          infoV(i).centerInWorld.x -= (e.movementX * a.vecx.x + e.movementY * a.vecy.x);
          a.centerInWorld.y -= (e.movementX * a.vecx.y + e.movementY * a.vecy.y);
          a.centerInWorld.z -= (e.movementX * a.vecx.z + e.movementY * a.vecy.z);
        }
        showImage(i);
      });
    }
  }
}

const wheel = (e: WheelEvent) => {
  const id = getIdOfEventOccured(e);
  doOneOrAll(id, (id: number) => {
    const change = e.deltaY > 0 ? 1 : -1;
    changeSlice(id, change);
    showImage(id);
  });
};

const getIdOfEventOccured = (e:MouseEvent | WheelEvent) => 
  Number((e.currentTarget! as any).getAttribute("imageBoxId"));; // anyじゃないほうがいいのだけど

const imageBoxClicked = (e:MouseEvent) => {
  selectedImageBoxId.value = getIdOfEventOccured(e);
}

const changeSeries = (i:number) => {
  const j = (imageBoxInfos.value[selectedImageBoxId.value] as DicomImageBoxInfo).currentDicomSeriesNumber;
  if (j+i >=0 && j+i < dicomDataSetList.length){
    const info = imageBoxInfos.value[selectedImageBoxId.value] as DicomImageBoxInfo;
    info.currentDicomSeriesNumber = j+i;
    info.currentSliceNumber=0;
    show();
  }
}

const loadFile = async (file: File) => {
  loadFiles([file]);
};

const loadFiles = (files: FileList | File[]) => {
  initializeDicomListsImagesBoxInfos();
  const localFileList = Array.from(files);

  isLoading.value = true;
  for (const f of localFileList) {
    loadFromLocal(f);
  }

  // loadFromLocalは非同期に読み込むので、この段階では全部読み込み終了していない。
  // setIntervalで定期的にチェックして、読み込みが終了していたらソートしてインターバルをキャンセルする。
  let intervalId : any | null = null;
  const callback = () => {
    const msg = `${unsortedDicomDataSetList.length} / ${localFileList.length}`;
    imb.value![0].clear(msg);
    if (localFileList.length === unsortedDicomDataSetList.length){
      clearInterval(intervalId!);
      doSort();
      show();
      isLoading.value = false;
    }
  };
  intervalId = setInterval(callback, 100);
};

const openSample = async () => {
  // unsortedDicomDataSetList = [];
  // urlList = [
  //   "https://metavol.github.io/metavol-web/s789cjku34/IMG48",
  //   "https://metavol.github.io/metavol-web/s789cjku34/IMG49",
  //   "https://metavol.github.io/metavol-web/s789cjku34/IMG50",
  // ];

  // imageBoxInfos.value[0].currentSliceNumber = 0;

  // for (let i = 0; i < urlList.length; i++) {
  //   loadFromUrl(i);
  // }
};

const doSort = () => {
  let serieses:string[] = [];
  for (const d of unsortedDicomDataSetList){
    const suid = d.string("x0020000e") ?? ""; // series instance uid
    const sd = d.string("x0008103e") ?? ""; // series description
    const name = suid+sd;
    let id = serieses.indexOf(name!);
    if (id === -1){
      id = serieses.length;
      serieses.push(name!);
    }
    if (dicomDataSetList[id] == null){
      dicomDataSetList[id] = [];
    }
    dicomDataSetList[id].push(d);
  }
  unsortedDicomDataSetList=[];

  for (const d of dicomDataSetList){
    d.sort((a: DataSet, b: DataSet) => {
      return Number(a.string("x00200013")) - Number(b.string("x00200013"));
    });
  }

  summaryText.value = "";
  for (let i=0; i<serieses.length; i++){
    summaryText.value += `${serieses[i]}  ${dicomDataSetList[i].length} images \n`;
  }
};

const loadFromLocal = async (f: File) => {
  const reader = new FileReader();
  reader.onload = () => {
    if (reader.result !== null) {
      const u8a = new Uint8Array(reader.result as ArrayBuffer);
      const dataSet = parseDicom(u8a) as MyDataSet;
      unsortedDicomDataSetList.push(dataSet);
    }
  };
  reader.readAsArrayBuffer(f);
};

const loadFromUrl = (i: number) => {
  axios
    .get(urlList[i], { responseType: "arraybuffer"})
    .then(function (response) {
      const u8a = new Uint8Array(response.data);
      const options = { TransferSyntaxUID: "1.2.840.10008.1.2" };
      const dataSet = parseDicom(u8a, options) as MyDataSet;
      unsortedDicomDataSetList[i] = dataSet;
      if (i === 0) {
        show();
      }
    });
};

const show = () => {
  if (imb.value == null) return;
  for (let i=0; i<imb.value!.length; i++){
    showImage(i);
  }
};

const showImage = (i:number) => {

  const info1 = imageBoxInfos.value[i];

  if (isDicomImageBoxInfo(i)){
    const info = info1 as DicomImageBoxInfo;

    const j = info.currentDicomSeriesNumber;
    const dataSet = dicomDataSetList[j][info.currentSliceNumber];

    if (showTag.value && i == selectedImageBoxId.value){
      tagText.value = DicomLib.allDicomTagToString(dataSet);
    }

    try {
      if (dataSet === undefined) {
        imb.value![i].clear();
      } else {
        // DICOM Library https://www.dicomlibrary.com/dicom/dicom-tags/
        // const studyInstanceUid = dataSet.string('x0020000d');
        // const patientid = dataSet.string('x00100020');
        // const mod = dataSet.string('x00080060');
        const rows = dataSet.int16("x00280010");
        const cols = dataSet.int16("x00280011");

        const wc = imageBoxInfos.value[i].myWC ?? Number(dataSet.string("x00281050", 0) ?? "0");
        const ww = imageBoxInfos.value[i].myWW ?? Number(dataSet.string("x00281051", 0) ?? "1");

        const intercept = Number(dataSet.string("x00281052") ?? "0");
        const slope = Number(dataSet.string("x00281053") ?? "1");

        const centerX = info.centerX;
        const centerY = info.centerY;
        const zoom = info.zoom;

        info.imageNumberOfDicomTag = Number(dataSet.string("x00200013"));
        info.description = dataSet.string("x0008103e") ?? "SeriesName";

        const pixelDataElement = dataSet.elements.x7fe00010;

        // 2024/5/12 ここでjpeg解凍するのはあまりよろしくない。事前に非同期でしたい。今日のところは我慢する。
        if (DecompressJpegLossless.check(dataSet) && dataSet.decompressed == null){
          dataSet.decompressed = DecompressJpegLossless.decode(dataSet);
        }

        const buf = dataSet.decompressed == null ? dataSet.byteArray.buffer as ArrayBuffer : dataSet.decompressed;
        const offset = dataSet.decompressed == null ? pixelDataElement.dataOffset : 0;
        const length = dataSet.decompressed == null ? pixelDataElement.length : buf.byteLength;

        if (dataSet.string("x00280004") == "RGB") {
          const ui8a = new Uint8Array(buf, offset, length);
          imb.value![i].showRgb(ui8a, rows!, cols!, centerX, centerY, zoom);
        } else {
          const i16a = new Int16Array(buf, offset, length / 2);
          imb.value![i].show(
            i16a, rows!, cols!, wc, ww, intercept, slope, centerX, centerY, zoom
          );
        }
      }
    } catch (ex) {
      console.log("Error parsing byte stream", ex);
    }
  }
  else{
    const info = info1 as DicomVolumeImageBoxInfo;

    const j = info.dicomVolumeNumber;
    const dv = dicomVolumeList[j];
    const pixelData0 = dv.voxel;
    const nx = dv.nx;
    const ny = dv.ny;
    const nz = dv.nz;
    const p00 = worldToVoxel(screenToWorld(i,0,0),j);
    const v01 = worldToVoxel(screenToWorld(i,0,1),j).sub(p00);
    const v10 = worldToVoxel(screenToWorld(i,1,0),j).sub(p00);
    const [wc,ww] = getMyWCWW(i);
    const clut = cluts[info.clut];


    if (!info.isMip){
      imb.value![i].drawNiftiSlice(pixelData0,nx,ny,nz, wc!, ww!, p00,v01,v10,clut);
    }else{
      const angle = info.mip!.mipAngle;
      imb.value![i].drawNiftiMip(pixelData0,nx,ny,nz, wc!, ww!, p00,v01,v10,
        angle, info.mip!.thresholdSurfaceMip, info.mip!.depthSurfaceMip, clut,
        info.mip!.isSurface);
    }
  }
};

const screenToWorld = (imageBoxNumber: number, x: number, y:number) => {

  // 今はVolumeのときしか対応していないが、理論的にはDicomにも対応できる。

  const world = new THREE.Vector3(0,0,0);
  const a = imageBoxInfos.value[imageBoxNumber] as DicomVolumeImageBoxInfo;
  world.add(a.centerInWorld).addScaledVector(a.vecx,x-imageBoxWH.value[0]/2).addScaledVector(a.vecy,y-imageBoxWH.value[1]/2);
  return world;
}

const voxelToWorld = (p: THREE.Vector3, vol_id:number) => {
  const v = dicomVolumeList[vol_id];
  const worldx = v.imagePosition.x + p.x * v.vectorX.x + p.y * v.vectorX.y + p.z * v.vectorX.z;
  const worldy = v.imagePosition.y + p.x * v.vectorY.x + p.y * v.vectorY.y + p.z * v.vectorY.z;
  const worldz = v.imagePosition.z + p.x * v.vectorZ.x + p.y * v.vectorZ.y + p.z * v.vectorZ.z;
  // const worldx = af[0][3] + p.x * af[0][0] + p.y * af[0][1] + p.z * af[0][2];
  // const worldy = af[1][3] + p.x * af[1][0] + p.y * af[1][1] + p.z * af[1][2];
  // const worldz = af[2][3] + p.x * af[2][0] + p.y * af[2][1] + p.z * af[2][2];
  return new THREE.Vector3(worldx,worldy,worldz);
}

const worldToVoxel = (p: THREE.Vector3, vol_id:number) => {
  const v = dicomVolumeList[vol_id];
  const right = [p.x - v.imagePosition.x, p.y- v.imagePosition.y, p.z - v.imagePosition.z];
  const left = [[v.vectorX.x,v.vectorX.y,v.vectorX.z],
   [v.vectorY.x,v.vectorY.y, v.vectorY.z, ],
   [v.vectorZ.x,v.vectorZ.y, v.vectorZ.z, ]];
  const ans = solve(left, right)
  return new THREE.Vector3(ans[0],ans[1],ans[2]);
}

const changeSuv = (a:number,b:number) => {

  for (let i=0; i<imageBoxInfos.value.length; i++){
    setMyWCWW(i, (a+b)/2, b-a);
  }
  show();
}


const generateNifti = () => {

  const i = (imageBoxInfos.value[selectedImageBoxId.value] as DicomImageBoxInfo).currentDicomSeriesNumber;
  const d = generateDicomVolumeFromDicom(dicomDataSetList[i]);
  dicomVolumeList.push(d);
  const n = dicomVolumeList.length - 1;

  const p0 = voxelToWorld(new THREE.Vector3(0,0,0),n);
  const p1 = voxelToWorld(new THREE.Vector3(d.nx,d.ny, d.nz),n);
  p0.add(p1).divideScalar(2); // 中点

  const c = {
    clut: 0,
    myWC: 3,
    myWW: 6,
    description: "metavol generated",
    dicomVolumeNumber: n,
    centerInWorld: p0,
    vecx: d.vectorX.clone(),
    vecy: d.vectorY.clone(),
    vecz: d.vectorZ.clone(),
    isMip: false,
    mip: null,
  };

  imageBoxInfos.value[selectedImageBoxId.value] = c;
}

const acExchange = () => {
  const d = getSelectedInfo();
  const temp = d.vecy;
  d.vecy = d.vecz;
  d.vecy.normalize().multiplyScalar(d.vecx.length());
  d.vecz = temp;
}

const clickReverse = () => {
  const d = getSelectedInfo();
  if (d.clut == 0) d.clut = 1;
  else if (d.clut == 1) d.clut = 0;
  else if (d.clut == 2) d.clut = 3;
  else if (d.clut == 3) d.clut = 2;
}

const clickMonochrome = () => {
  getSelectedInfo().clut=0;
}

const clickRainbow = () => {
  getSelectedInfo().clut=2;
}

const clickMip = () => {
  const d = getSelectedInfo();
  d.isMip = !d.isMip;
  if (d.isMip && d.mip == null){
    d.mip = {
      mipAngle: 0,
      isSurface: false,
      thresholdSurfaceMip: 0.3,
      depthSurfaceMip: 3,
    }
  }
}

const clickSurfaceMip = () => {
  const d = getSelectedInfo();
  if (!d.isMip) clickMip();
  if (d.mip != null){
    d.mip.isSurface = !d.mip?.isSurface;
  }
}

// const generateDemoNifti = () => {
//   const buf = generateDemoNii();
//   emit("NiftiDataSent", buf);
// }

// const showLocalDicom = (dcmFile: File) => {

//   const reader = new FileReader();

//   reader.onload = () => {
//       if (reader.result !== null){
//         const u8a = new Uint8Array(reader.result as ArrayBuffer);
//         showImage(u8a);
//       }
//   };
//   reader.readAsArrayBuffer(dcmFile);
// }

// const showRemoteDicom = (fileUrl: string) => {
//   axios.get(fileUrl, {responseType: "arraybuffer"})
//   .then(function (response){
//     const u8a = new Uint8Array(response.data);
//     showImage(u8a);
//   });
// }

// const dicomFileDicSummary = () => {
//   let s = "";
//   for (const a in dicomFileDic){
//     s += a + " " + Number(dicomFileDic[a].length);
//   }
//   console.log("dicom_file_dic_summary computed")
//   return s;
// };
</script>

<template>
  <v-container>
  <div style="display: flex; flex-flow: row;">
    <div>
    <sidebar @fileLoaded="loadFile" @dirLoaded="loadFiles" @sort="doSort" @openSample="openSample"
      @leftButtonFunctionChanged="leftButtonFunctionChanged"
      @presetSelected="presetSelected"
      sortVisible="0"></sidebar>

<div>
<input type="checkbox" id="sync_checkbox" v-model="syncImageBox" />
<label for="sync_checkbox">Sync</label>
</div>
<div>
<input type="checkbox" id="showSummary_checkbox" v-model="showSummary" />
<label for="showSummary_checkbox">Show summary</label>
</div>
<div>
<input type="checkbox" id="showTag_checkbox" v-model="showTag" />
<label for="showTag_checkbox">Show tag</label>
</div>

</div>
    <div style="display: flex; flex-direction: column;">
      <div class="wrapper">
        <div v-for="i in tileXY[0] * tileXY[1]">
          <imagebox ref="imb" :imageBoxId="i-1" :width="imageBoxWH[0]" :height="imageBoxWH[1]" @wheel.prevent="wheel"
            @click="imageBoxClicked" @mousemove="mouseMove"
            @dragenter="dragEnter" @dragleave="dragLeave" @dropover.prevent @drop.prevent="dropFile"
            :isEnter="isEnter" :selected="i-1 === selectedImageBoxId">
          </imagebox>
          <div>
            <p>
              {{ imageBoxInfos[i-1].description }} <br>
              Im {{ imageBoxInfos[i-1].imageNumberOfDicomTag }} /
              WC {{ imageBoxInfos[i-1].myWC ?? "default" }} /
              WW {{ imageBoxInfos[i-1].myWW ?? "default" }}
            </p>
          </div>
        </div>
      </div>

      <div style="display: flex; flex-flow: row; vertical-align: auto;">
        <v-btn @click="changeSeries(-1)">Previous Series</v-btn>
        <v-btn @click="changeSeries(1)">Next Series</v-btn>
      <!-- <button @click="generateDemoNifti">test</button> -->

      <v-btn @click="generateNifti();show();">MPR</v-btn>
      <v-btn @click="acExchange();show();">AC exchange</v-btn>
      <v-btn @click="clickMonochrome();show();">Monochrome</v-btn>
      <v-btn @click="clickRainbow();show();">Rainbow</v-btn>
      <v-btn @click="clickReverse();show();">Reverse</v-btn>
      <v-btn @click="clickMip();show();">MIP</v-btn>
      <v-btn @click="clickSurfaceMip();show();">sMIP</v-btn>

      <!-- <input type="checkbox" id="mip_checkbox" v-model="isMipCheckbox" @change="isMipChanged" />
      <label for="mip_checkbox">MIP</label> -->

        </div>

        

      <textarea v-if="showSummary" v-model="summaryText" style="height: auto;" />
      <textarea v-if="showTag" v-model="tagText" style="height: 400px;" />

    </div>

</div>

</v-container>

  <!-- <p>
    <a href="https://www.dropbox.com/scl/fi/ad6g3ij4qj5w1mnvvdbw5/SE1.zip?rlkey=ji5pkkr0ddtci3t2xyfglj18d&dl=0" target="_blank">Download sample</a>
  </p> -->

  <!-- <p>{{ currentProgress }}</p> -->
  <!-- <p>{{ dicomFileDicSummary() }}</p> -->
</template>

<style scoped>
.wrapper {
  display: flex;
  /* grid-template-columns: repeat(4, 1fr); */
}

</style>



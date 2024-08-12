<script setup lang="ts">

//6/29 今後付け加える機能
// ctrl + wheelで拡大縮小
// ROIツール ROIツールへの切り替えのボタン、球体の表示、値の抽出、テスト用の画像書き換え
// 
// fusion -> プロトタイプ完成 -> 機能性を高める
// bilinear interpolation
// シリーズ切り替えコンボボックス
// DicomView.vueが肥大化しているので他ファイルに分散
// Nrrdも
// 1つでもエラーの出るファイルがあると開けない
// 上下さかさま　spinal tumor
// できれば位置合わせ　ブラウザ上で果たして出来るか
// 断面指示線
// DICOMの情報表示ボタン
//
// 優先順位は低い
// Windowを説明するためのグラデーションデモ
// 上記と合わせて、学生用にpixel mappingやマウス下のCT値を表示するシステム
//
//
// MIP/surfaceMIP -> done
// Niftiの読み込み -> done
// rainbowCLUTが遅い -> done
// phantomボタン -> done
// pagingボタン、シリーズ切り替えボタン -> done
// 2Dの表示、右上に -> done
// スライス←→ボタンがsyncに対応していない -> done
// 画像をクローズするボタン -> done
// 画像をもっと大きくしたいので、サイドバーを隠したり画像サイズをレスポンシブに -> done
// backup用の別URL -> done
// ここまでを常田先生の講義(2024/6/27)に間に合わせた
//
// PNGを読み込めるように->→ボツ->かわりにPNGをDICOM変換して対応した -> done
// 描画時間を測定する機能　いろいろなPCでのパフォーマンスを比較したい -> done
//



import { ref, watch } from "vue";
import { DataSet, parseDicom } from "dicom-parser";
import * as DicomLib from './dicomLib.ts';
import sidebar from "./Sidebar.vue";
import imagebox from "./ImageBox.vue";
import { ImageBoxInfoBase, DicomImageBoxInfo, VolumeImageBoxInfo, defaultInfo, pushVolume, FusedVolumeImageBoxInfo } from "./DicomImageBoxInfo";
import { getAllFilesRecursive } from "./DragAndDropUtil";
import { generateVolumeFromDicom } from './dicom2volume.ts';
import * as DecompressJpegLossless from "./decompressJpegLossless";
import { Volume, voxelToWorld, worldToVoxel } from "./Volume.ts";
import * as THREE from 'three';
import {cluts} from './Clut.ts';
import * as nifti from 'nifti-reader-js';
import * as Phantom from './phantom.ts';

const showPerformance = ref("");
const benchmarkMessage = ref("");
const closingImages = defineModel<boolean>("closingImages");
const drawer = defineModel<boolean>("drawer");
const leftButtonFunction = defineModel<LeftButtonFunction>("leftButtonFunction");

const imageBoxW = defineModel<number>("imageBoxW");
const imageBoxH = defineModel<number>("imageBoxH");
const tileN = defineModel<number>("tileN");
const syncImageBox = defineModel<boolean>("syncImageBox");

const setTimeOutInitAndShow = () => {
  setTimeout(() => {
    for (let a of imb.value!){
      a.init();
    }
    show();
  }, 10);
}

const imageBoxSizeChanged = () => {
  setTimeOutInitAndShow();
}

watch(imageBoxW, imageBoxSizeChanged);
watch(imageBoxH, imageBoxSizeChanged);
watch(closingImages, () => {
  if (closingImages.value){
    initializeDicomListsImagesBoxInfos();
    closingImages.value = false;
    setTimeOutInitAndShow();
  }
});

interface MyDicom extends DataSet {
  decompressed: ArrayBuffer;
}
interface Nii {
  niftiHeader: nifti.NIFTI1,
  pixelData: Float32Array
}

type OtherFile = Uint8Array;

let bagOfFiles: (MyDicom | Nii | OtherFile)[];

const selectedImageBoxId = ref(0);
const isLoading = ref(false);
const isEnter = ref(false);

const showSummary = ref(false);
const showTag = ref(false);
const summaryText = ref('');
const tagText = ref('');

const imb = ref<InstanceType<typeof imagebox>[]>();

interface SeriesList { // 複数のDICOMファイル、もしくはVolumeデータ、もしくは両方（同一画像）、、ということはnx,ny,nzを共有するという案もあるが・・
  myDicom: MyDicom[] | null,
  volume: Volume | null,
}
let seriesList: SeriesList[];

const imageBoxInfos = ref<ImageBoxInfoBase[]>([]);
const getDicomImageBoxInfo = (index: number) => imageBoxInfos.value[index] as DicomImageBoxInfo;
const getVolumeImageBoxInfo = (index: number) => imageBoxInfos.value[index] as VolumeImageBoxInfo;
const isDicomImageBoxInfo = (i:number) => {
  return "currentSliceNumber" in imageBoxInfos.value[i]; //この方法では、プロパティ名を変更したときにバグった。
}
const isVolumeImageBoxInfo = (i:number) => {
  return ("clut" in imageBoxInfos.value[i]) && !("clut1" in imageBoxInfos.value[i]); //この方法では、プロパティ名を変更したときにバグった。
}

const getSelectedInfo = () => getVolumeImageBoxInfo(selectedImageBoxId.value);

type LeftButtonFunction = "window" | "pan" | "zoom" | "page" | "roi";
// const leftButtonFunction = ref<LeftButtonFunction>("none");
const leftButtonFunctionChanged = (e: LeftButtonFunction) => {
  leftButtonFunction.value = e;
};

const initializeDicomListsImagesBoxInfos = () => {
  bagOfFiles = [];
  seriesList = [];
  imageBoxInfos.value = [defaultInfo(0), defaultInfo(1), defaultInfo(2), defaultInfo(3),defaultInfo(4),defaultInfo(5),defaultInfo(6),defaultInfo(7)];
};
initializeDicomListsImagesBoxInfos();

const changeSlice_ = (add_number: number) => {
  doOneOrAll(selectedImageBoxId.value, (id: number) => {
    changeSlice(id, add_number);
    showImage(id);
  });
}

const changeSlice = (index: number, add_number: number) => {
  if (isDicomImageBoxInfo(index)){
    const info = getDicomImageBoxInfo(index);
    let temp = info.currentSliceNumber + add_number;
    const len = seriesList[info.currentSeriesNumber].myDicom!.length
    if (temp < 0) temp = 0;
    if (temp >= len) temp = len - 1;
    info.currentSliceNumber = temp;
  }else{
    const a = getVolumeImageBoxInfo(index);
    if (a.isMip && a.mip != null){
      a.mip.mipAngle += 5*add_number;
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
const getMyWCWW1 = (i:number) => {
  const info = (imageBoxInfos.value[i] as FusedVolumeImageBoxInfo);
  return [info.myWC1, info.myWW1];
}

const presetSelected = (e: string) => {
  const id = selectedImageBoxId.value;
  if (e === "Lung") setMyWCWW(id, -700, 1800);
  if (e === "Abd") setMyWCWW(id, 30, 200);
  if (e === "Med") setMyWCWW(id, 0, 320);
  if (e === "Fat") setMyWCWW(id, 10, 275);
  if (e === "Bone") setMyWCWW(id, 200, 2000);
  if (e === "Brain") setMyWCWW(id, 30, 80);
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
  const infoV = getVolumeImageBoxInfo;

  if (leftButtonFunction.value == "window") {
    if (e.buttons == 1) {
      let [wc,ww] = getMyWCWW(id);
      if (wc === null) {
        wc = Number(seriesList[info(id).currentSeriesNumber].myDicom![info(id).currentSliceNumber].string("x00281050", 0)) ?? 0;
      }
      if (ww === null) {
        ww = Number(seriesList[info(id).currentSeriesNumber].myDicom![info(id).currentSliceNumber].string("x00281051", 0)) ?? 0;
        // ww = Number(dicomDataSetList[id][info(id).currentSliceNumber].string("x00281051", 0)) ?? 0;
      }
      wc += e.movementY;
      ww += e.movementX;
      if (ww < 1) ww = 1;
      setMyWCWW(id, wc, ww);
      show();
    }
  }

  if (leftButtonFunction.value == "page") {
    if (e.buttons == 1) {
      doOneOrAll(id, (i:number) => changeSlice(i, e.movementY));
      show();
    }
  }

  if (leftButtonFunction.value == "zoom") {
    if (e.buttons == 1) {
      doOneOrAll(id, (i:number) => {
        if (isDicomImageBoxInfo(id)){
          let r = 1.02;
          if (e.movementY > 0) r = 1 / r;
          const zoom = info(i).zoom ?? 1;
          info(i).zoom = zoom * r;
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

  if (leftButtonFunction.value == "pan") {
    if (e.buttons == 1) {
      doOneOrAll(id, (i:number) => {
        if (isDicomImageBoxInfo(id)){
          const zoom = info(i).zoom!;
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

  if (leftButtonFunction.value == "roi") {
    if (e.buttons == 1) {

      const p = screenToWorld(0, e.offsetX, e.offsetY);
      const q = worldToVoxel_(p,0);

      debugger;

      const x0 = Math.floor(q.x);
      const y0 = Math.floor(q.y);
      const z0 = Math.floor(q.z);
      const v = seriesList[0].volume!;
      v.voxel[x0+y0*v.nx+z0*v.nx*v.ny] = 0;

      showImage(0);

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
  const j = imageBoxInfos.value[selectedImageBoxId.value].currentSeriesNumber;
  // const j = (imageBoxInfos.value[selectedImageBoxId.value] as DicomImageBoxInfo).currentDicomSeriesNumber;
  if (j+i >=0 && j+i < seriesList.length){
    const info = imageBoxInfos.value[selectedImageBoxId.value] as DicomImageBoxInfo;
    info.currentSeriesNumber = j+i;
    info.currentSliceNumber=0;
    show();
  }
}

const doSort = () => {
  let serieses:string[] = [];
  for (const f of bagOfFiles){

    if (f instanceof Uint8Array){
      console.log(`otherfile: ${f.length} bytes`);
    }else if ("niftiHeader" in f){
      const dim = f['niftiHeader']['dims'];
      const af = f['niftiHeader']['affine'];

      const vx = new THREE.Vector3(af[0][0],af[0][1],af[0][2]).multiplyScalar(-1);
      const vy = new THREE.Vector3(af[1][0],af[1][1],af[1][2]).multiplyScalar(-1);
      const vz = new THREE.Vector3(af[2][0],af[2][1],af[2][2]);
      const pos = new THREE.Vector3(af[0][3], af[1][3], af[2][3]);

      seriesList.push({
        myDicom: null,
        volume:{
          nx: dim[1],
          ny: dim[2],
          nz: dim[3],
          imagePosition: pos,
          vectorX: vx,
          vectorY: vy,
          vectorZ: vz,
          voxel: f.pixelData,
        }
      });

    }else{

      const suid = f.string("x0020000e") ?? ""; // series instance uid
      const sd = f.string("x0008103e") ?? ""; // series description
      const name = suid+sd;

      let id = serieses.indexOf(name);
      if (id === -1){
        id = serieses.length;
        serieses.push(name);
      }
      if (seriesList[id] == null){
        seriesList[id] = {myDicom:null, volume:null};
      }
      if (seriesList[id].myDicom == null){
        seriesList[id].myDicom = [];
      }
      seriesList[id].myDicom!.push(f);
    }

  }
  bagOfFiles=[];

  for (const d of seriesList){
    if (d.myDicom != null){
      d.myDicom.sort((a: DataSet, b: DataSet) => {
        return Number(a.string("x00200013")) - Number(b.string("x00200013"));
      });
    }
  }

  summaryText.value = "";
  // for (let i=0; i<serieses.length; i++){
  //   summaryText.value += `${serieses[i]}  ${seriesList[i].length} images \n`;
  // }
  // for (let i=0; i<volumeList.length; i++){
  //   summaryText.value += `${volumeList[i].nx} ${volumeList[i].ny} ${volumeList[i].ny} \n`;
  // }
};


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
    const msg = `${bagOfFiles.length} / ${localFileList.length}`;
    imb.value![0].clear(msg);
    if (localFileList.length === bagOfFiles.length){
      clearInterval(intervalId!);
      doSort();
      show();
      isLoading.value = false;
    }
  };
  intervalId = setInterval(callback, 100);
};

const loadFromLocal = (f: File) => {
  const reader = new FileReader();
  reader.onload = () => {

    if (reader.result !== null) {
      const buf = reader.result as ArrayBuffer;
      const u8a = new Uint8Array(buf);
      try{
        const dataSet = parseDicom(u8a) as MyDicom;
        bagOfFiles.push(dataSet);
      }catch{
        try{
          loadNii(buf);
        }catch{
          bagOfFiles.push(u8a);
        }
      }
    }
  };
  reader.readAsArrayBuffer(f);
};

const loadNii = (arraybuffer: ArrayBuffer) => {

  if (nifti.isCompressed(arraybuffer)){
    arraybuffer = nifti.decompress(arraybuffer);
  }

  if (nifti.isNIFTI(arraybuffer)) {
    const hdr = nifti.readHeader(arraybuffer) as nifti.NIFTI1;
    const px: ArrayBuffer = nifti.readImage(hdr, arraybuffer);

    if (hdr["numBitsPerVoxel"] == 32) {
      const px0 = new Float32Array(px);
      bagOfFiles.push({ niftiHeader: hdr, pixelData: px0 });
    } else if (hdr["numBitsPerVoxel"] == 64) {
      const px1 = new Float64Array(px);
      bagOfFiles.push({ niftiHeader: hdr, pixelData: new Float32Array(px1) });
    } else {
      const px1 = new Int16Array(px);
      bagOfFiles.push({ niftiHeader: hdr, pixelData: new Float32Array(px1) });
    }
  }
}

const show = () => {
  if (imb.value == null) return;
  for (let i=0; i<imb.value.length; i++){
    showImage(i);
  }
};

const showImage = (i:number) => {
  const t0 = performance.now();

  const info1 = imageBoxInfos.value[i];

  if (isDicomImageBoxInfo(i)){
    const info = info1 as DicomImageBoxInfo;

    const j = info.currentSeriesNumber;
    
    if (seriesList[j] == null || seriesList[j].myDicom == null) return;

    const dataSet = seriesList[j].myDicom![info.currentSliceNumber];

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
        const rows = dataSet.int16("x00280010") ?? 512;
        const cols = dataSet.int16("x00280011") ?? 512;

        const wc = imageBoxInfos.value[i].myWC ?? Number(dataSet.string("x00281050", 0) ?? "0");
        const ww = imageBoxInfos.value[i].myWW ?? Number(dataSet.string("x00281051", 0) ?? "1");

        const intercept = Number(dataSet.string("x00281052") ?? "0");
        const slope = Number(dataSet.string("x00281053") ?? "1");

        const centerX = info.centerX;
        const centerY = info.centerY;
        
        if (info.zoom == null){
          info.zoom = imageBoxW.value! / rows;
        }
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
            i16a, rows, cols, wc, ww, intercept, slope, centerX, centerY, zoom
          );
        }
      }
    } catch (ex) {
      console.log("Error parsing byte stream", ex);
    }
  }
  else if (isVolumeImageBoxInfo(i)){
    const info = info1 as VolumeImageBoxInfo;

    const j = info.currentSeriesNumber;
    const dv = seriesList[j].volume!;
    const pixelData0 = dv.voxel;
    const nx = dv.nx;
    const ny = dv.ny;
    const nz = dv.nz;
    const p00 = worldToVoxel_(screenToWorld(i,0,0),j);
    const v01 = worldToVoxel_(screenToWorld(i,0,1),j).sub(p00);
    const v10 = worldToVoxel_(screenToWorld(i,1,0),j).sub(p00);
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
  }else{ // fusion
    const info = info1 as FusedVolumeImageBoxInfo;

    const j0 = info.currentSeriesNumber;
    const j1 = info.currentSeriesNumber1;

    const dv0 = seriesList[j0].volume!;
    const dv1 = seriesList[j1].volume!;

    const pixelData0 = dv0.voxel;
    const pixelData1 = dv1.voxel;

    const nx0 = dv0.nx;
    const ny0 = dv0.ny;
    const nz0 = dv0.nz;
    const nx1 = dv1.nx;
    const ny1 = dv1.ny;
    const nz1 = dv1.nz;

    const [wc0,ww0] = getMyWCWW(i);
    const [wc1,ww1] = getMyWCWW1(i);

    const p00_0 = worldToVoxel_(screenToWorld(i,0,0),j0);
    const v01_0 = worldToVoxel_(screenToWorld(i,0,1),j0).sub(p00_0);
    const v10_0 = worldToVoxel_(screenToWorld(i,1,0),j0).sub(p00_0);

    const p00_1 = worldToVoxel_(screenToWorld(i,0,0),j1);
    const v01_1 = worldToVoxel_(screenToWorld(i,0,1),j1).sub(p00_1);
    const v10_1 = worldToVoxel_(screenToWorld(i,1,0),j1).sub(p00_1);

    const clut0 = cluts[info.clut];
    const clut1 = cluts[info.clut1];

    imb.value![i].drawNiftiSliceFusion(
      pixelData0, nx0,ny0,nz0, wc0!, ww0!, p00_0,v01_0,v10_0,clut0,
      pixelData1, nx1,ny1,nz1, wc1!, ww1!, p00_1,v01_1,v10_1,clut1,
    );

  }

  const t1 = performance.now();
  benchmarkMessage.value += `${String(t1-t0)}\n`;

};

const screenToWorld = (imageBoxNumber: number, x: number, y:number) => {
  // 今はVolumeのときしか対応していないが、理論的にはDicomにも対応できる。
  const world = new THREE.Vector3(0,0,0);
  const a = imageBoxInfos.value[imageBoxNumber] as VolumeImageBoxInfo;
  world.add(a.centerInWorld).addScaledVector(a.vecx,x-imageBoxW.value!/2).addScaledVector(a.vecy,y-imageBoxH.value!/2);
  return world;
}

const voxelToWorld_ = (p: THREE.Vector3, vol_id:number) => {
  const v = seriesList[vol_id].volume!;
  return voxelToWorld(p, v);
}

const worldToVoxel_ = (p: THREE.Vector3, vol_id:number) => {
  const v = seriesList[vol_id].volume!;
  return worldToVoxel(p,v);
}

const changeSuv = (a:number,b:number, doShow: boolean) => {
  for (let i=0; i<imageBoxInfos.value.length; i++){
    setMyWCWW(i, (a+b)/2, b-a);
  }
  if (doShow){
    show();
  }
}

const mpr_ = (i: number) => {
  const d = generateVolumeFromDicom(seriesList[i].myDicom!);
  seriesList[i].volume = d;

  const p0 = voxelToWorld_(new THREE.Vector3(0,0,0),i);
  const p1 = voxelToWorld_(new THREE.Vector3(d.nx,d.ny, d.nz),i);
  p0.add(p1).divideScalar(2); // 中点

  imageBoxInfos.value[i] = {
    clut: 0,
    myWC: 3,
    myWW: 6,
    description: "metavol generated",
    currentSeriesNumber: i,
    centerInWorld: p0,
    vecx: d.vectorX.clone(),
    vecy: d.vectorY.clone(),
    vecz: d.vectorZ.clone(),
    isMip: false,
    mip: null,
  } as VolumeImageBoxInfo;

}


const mpr = (doShow: boolean) => {

  const i = imageBoxInfos.value[selectedImageBoxId.value].currentSeriesNumber;
  mpr_(i);
  if (doShow){
    show();
  }

}

const fusion = () => {

  mpr_(0);
  mpr_(1);
  const info = (imageBoxInfos.value[1] as VolumeImageBoxInfo) as VolumeImageBoxInfo;

  imageBoxInfos.value![0] = {
    centerInWorld: info.centerInWorld,
    vecx: info.vecx,
    vecy: info.vecy,
    vecz: info.vecz,
    clut: 2, // white-black
    clut1: 0, // rainbow
    currentSeriesNumber: 0,
    currentSeriesNumber1: 1,
    description: "fusion",
    myWC: 3,
    myWW: 6,
    myWC1: 40,
    myWW1: 340,
  } as FusedVolumeImageBoxInfo;

  show();

}


const findMaximumAxis = (v: THREE.Vector3) => {
  if (v.x>v.y && v.x>v.z){
    return 0;
  }
  else if (v.y>v.x && v.y>v.z){
    return 1;
  }
  else{
    return 2
  }
}

const determinePlaneDirection = (d: VolumeImageBoxInfo) => {
  if (findMaximumAxis(d.vecx)===0 && findMaximumAxis(d.vecy)===1){
    return "axial";
  }
  else if (findMaximumAxis(d.vecx)===0 && findMaximumAxis(d.vecy)===2){
    return "coronal";
  }
  else if (findMaximumAxis(d.vecx)===1 && findMaximumAxis(d.vecy)===2){
    return "sagittal";
  }
  else return "unknown";
}


const switchToAxial = (doShow: boolean) => {
  const d = getSelectedInfo();
  if (determinePlaneDirection(d)=="coronal"){
    const temp = d.vecy;
    d.vecy = d.vecz;
    d.vecy.normalize().multiplyScalar(d.vecx.length());
    d.vecz = temp;
    if (doShow){
      show();
    }
  }
}

const switchToCoronal = (doShow: boolean) => {
  const d = getSelectedInfo();
  if (determinePlaneDirection(d)=="axial"){
    const temp = d.vecy;
    d.vecy = d.vecz;
    d.vecy.normalize().multiplyScalar(d.vecx.length());
    d.vecz = temp;
    if (doShow){
      show();
    }
  }
}


const reverse = (doShow: boolean) => {
  const d = getSelectedInfo();
  if (d.clut == 0) d.clut = 1;
  else if (d.clut == 1) d.clut = 0;
  else if (d.clut == 2) d.clut = 3;
  else if (d.clut == 3) d.clut = 2;
  else if (d.clut == 4) d.clut = 5;
  else if (d.clut == 5) d.clut = 4;
  if (doShow){
    show();
  }
}

const switchToMonochrome = (doShow: boolean) => { 
  getSelectedInfo().clut=0;
  if (doShow){
    show();
  }
}
const switchToRainbow = (doShow: boolean) => {
   getSelectedInfo().clut=2;
   if (doShow){
    show();
  }
}
const switchToHot = (doShow: boolean) => { 
  getSelectedInfo().clut=4;
  if (doShow){
    show();
  }
}

const switchToMip = (doShow: boolean) => {
  switchToCoronal(false);

  const d = getSelectedInfo();
  d.isMip = true;
  if (d.mip == null){
    d.mip = {
      mipAngle: 0,
      isSurface: false,
      thresholdSurfaceMip: 0.3,
      depthSurfaceMip: 3,
    }
  }else{
    d.mip.isSurface = false;
  }
  if (doShow){
    show();
  }
}

const switchToSMip = (doShow: boolean) => {
  const d = getSelectedInfo();
  if (!d.isMip) switchToMip(false);
  d.mip!.isSurface = true;
  if (doShow){
    show();
  }
}

const phantom1 = () => {
  const P = Phantom.generatePhantom();
  const c = pushVolume(seriesList, P);
  imageBoxInfos.value[selectedImageBoxId.value] = c;
  show();
}
const phantom2 = () => {
  const P = Phantom.generatePhantom2();
  const c = pushVolume(seriesList, P);
  imageBoxInfos.value[selectedImageBoxId.value] = c;
  show();
}

const phantom3 = () => {
  const P = Phantom.generatePhantom3();
  const c = pushVolume(seriesList, P);
  c.clut=2;
  imageBoxInfos.value[selectedImageBoxId.value] = c;
  switchToSMip(true);
}

const runDebugger = () => {
  console.log(innerWidth);
};

const maximize = () => {
  const hello = document.getElementById("hello");
  debugger;
  imageBoxW.value=hello!.scrollWidth! / 2 - 10;
}



</script>

<template>
  <v-container fluid>
    <v-row>
      <v-navigation-drawer v-model="drawer" style="background-color: #000;">
        <v-container>
          <sidebar @fileLoaded="loadFile"
            @dirLoaded="loadFiles"
            @sort="doSort"
            @leftButtonFunctionChanged="leftButtonFunctionChanged"
            @presetSelected="presetSelected"
            @changeSlice="changeSlice_"
            @changeSeries="changeSeries"
            @mpr="mpr(true)"
            @axi="switchToAxial(true)"
            @cor="switchToCoronal(true)"
            @mip="switchToMip(true)"
            @smip="switchToSMip(true)"
            @monochrome="switchToMonochrome"
            @rainbow="switchToRainbow"
            @hot="switchToHot"
            @reverse="reverse"
            @phantom1="phantom1"
            @phantom2="phantom2"
            @phantom3="phantom3"
            @fusion="fusion"
            @maximize="maximize"
            :benchmark = "benchmarkMessage"
          ></sidebar>
          <v-checkbox label="Performance" v-model="showPerformance"></v-checkbox>
          <p v-if="showPerformance">{{ benchmarkMessage }}</p>

      </v-container>
        
      </v-navigation-drawer>

      <v-col>
        <v-row no-gutters id="hello">
          <v-col cols="auto" v-for="i in tileN" >
            <imagebox :class="{'cursor-grab': leftButtonFunction==='pan'}" ref="imb" :imageBoxId="i-1"
             :width="imageBoxW" :height="imageBoxH" @wheel.prevent="wheel"
              @click="imageBoxClicked" @mousemove="mouseMove"
              @dragenter="dragEnter" @dragleave="dragLeave" @dropover.prevent @drop.prevent="dropFile"
              :isEnter="isEnter" :selected="i-1 === selectedImageBoxId">
            </imagebox>
          </v-col>
        </v-row>

        <v-row>
          <textarea v-if="showSummary" v-model="summaryText" style="height: auto;" />
        </v-row>

        <v-row>
          <textarea v-if="showTag" v-model="tagText" style="height: 400px;" />
        </v-row>

      </v-col>

  </v-row>

</v-container>

</template>



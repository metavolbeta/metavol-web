<script setup lang="ts">

// 2024/6/9 
// Kenji Hirata
// important class, responsible for drawing image box.
//


import { ref, onMounted} from 'vue';
import * as THREE from 'three';


const prop = defineProps(["width","height","selected","isEnter"]);

const isEnter = ref(false);

const cv1 = ref<HTMLCanvasElement | null>(null);
let ctx: CanvasRenderingContext2D | null = null;

const init = () => {
  if (cv1.value === null) {
    return;
  }
  ctx = cv1.value.getContext("2d", {willReadFrequently: true});
  clear();
}

onMounted(() => {
  init();
});

const show = (ppp: Float32Array | Int16Array, cols: number, rows: number, wc: number, ww: number, intercept: number, slope: number, centerX:number, centerY:number, zoom: number) => {
    drawImageCvZoom(ppp, cols, rows, wc, ww, intercept, slope, centerX, centerY, zoom);
}

const showDirect = (ppp: Float32Array | Int16Array, wc: number, ww: number) => {
    drawImageCvDirect(ppp, wc, ww);
}

const show2 = (ppp: Float32Array, qqq: Float32Array, cols: number, rows: number, wc: number, ww: number, wc2: number, ww2: number, intercept: number, slope: number, centerX:number, centerY:number, zoom: number) => {
    drawImageCv2(ppp, qqq, cols, rows, wc, ww, wc2, ww2, intercept, slope, centerX, centerY, zoom);
}

const showRgb = (ppp: Uint8Array, cols: number, rows: number, centerX:number, centerY:number, zoom: number) => {
    drawImageCvRgb(ppp, cols, rows, centerX, centerY, zoom);
}

const drawImageCvZoom = async function(pix: Float32Array | Int16Array, ny:number, nx:number, wc:number, ww:number, intercept:number, slope:number, shiftX:number, shiftY:number, zoom:number) {
  if (cv1.value === null || ctx === null) return;
  const canvasx = cv1.value.width;
  const canvasy = cv1.value.height;
  const myImageData = ctx.getImageData(0,0,canvasx,canvasy); // メモリーを新たに確保しないので、createImageDataよりも有利だと思う（想像）
  let ad = 0;

  for (let y = 0; y<canvasy; y++){
    for (let x = 0; x<canvasx; x++){
      const x1 = Math.floor((x-canvasx/2)/zoom +nx/2 + shiftX);
      const y1 = Math.floor((y-canvasy/2)/zoom +ny/2 + shiftY);
      if (x1<0 || x1>nx || y1<0 || y1>ny){
        myImageData.data[ad] = 0; //red
        myImageData.data[ad+1] = 0; //green
        myImageData.data[ad+2] = 0; //blue
        ad += 4;
        continue;
      }
      const raw = pix[x1+y1*nx] * slope + intercept;
      let p = (raw-(wc-ww/2)) * (255/ww);
      if (p<0) p=0;
      if (p>255) p=255;
      myImageData.data[ad] = p; //red
      myImageData.data[ad+1] = p; //green
      myImageData.data[ad+2] = p; //blue
      ad += 4;
    }
  }
  ctx.putImageData(myImageData, 0,0,0,0,canvasx, canvasy);
  showTextTopRight("2D");
  showTextBottomLeft(`WC:${wc}/WW:${ww}`);

}

const drawImageCvDirect = async function(pix: Float32Array | Int16Array, wc:number, ww:number) {
  if (cv1.value === null || ctx === null) return;
  const canvasx = cv1.value.width;
  const canvasy = cv1.value.height;
  const myImageData = ctx.getImageData(0,0,canvasx,canvasy); // メモリーを新たに確保しないので、createImageDataよりも有利だと思う（想像）
  let ad = 0;

  for (let y1 = 0; y1<canvasy; y1++){
    for (let x1 = 0; x1<canvasx; x1++){
      const raw = pix[x1+y1*canvasx];
      let p = (raw-(wc-ww/2)) * (255/ww);
      if (p<0) p=0;
      if (p>255) p=255;
      myImageData.data[ad] = p; //red
      myImageData.data[ad+1] = p; //green
      myImageData.data[ad+2] = p; //blue
      ad += 4;
    }
  }
  ctx.putImageData(myImageData, 0,0,0,0,canvasx, canvasy);
}


const drawNiftiSlice = async function(pix: Float32Array | Int16Array,
    nx:number, ny:number, nz:number, wc:number, ww:number,
    p00:THREE.Vector3, v01:THREE.Vector3,v10:THREE.Vector3, clut: number[][],
    showVoi: boolean, voiPosFromScreenCenterX: number, voiPosFromScreenCenterY: number, voiRadius: number
  ) {

  if (cv1.value === null || ctx === null) return;
  const canvasx = cv1.value.width;
  const canvasy = cv1.value.height;
  const myImageData = ctx.getImageData(0,0,canvasx,canvasy); // メモリーを新たに確保しないので、createImageDataよりも有利だと思う（想像）
  let ad = 0;

  for (let i = 0; i<canvasy; i++){
    let v = p00.clone().addScaledVector(v01,i);
    for (let j = 0; j<canvasx; j++){

      const v0 = v.clone().floor();
      if (v0.x>=0 && v0.x<nx && v0.y>=0 && v0.y<ny && v0.z>=0 && v0.z<nz){
        const raw = pix[ny*nx*v0.z+nx*v0.y+v0.x];
        let p = Math.floor((raw-(wc-ww/2)) * (255/ww));
        if (p<0) p=0;
        if (p>255) p=255;
        myImageData.data[ad] = clut[p][0]; //red
        myImageData.data[ad+1] = clut[p][1]; //green
        myImageData.data[ad+2] = clut[p][2]; //blue
      }else{
        myImageData.data[ad] = clut[0][0];
        myImageData.data[ad+1] = clut[0][1];
        myImageData.data[ad+2] = clut[0][2];
      }
      ad += 4;
      v.add(v10);
    }
  }

  ctx.putImageData(myImageData, 0,0,0,0,canvasx, canvasy);

  if (showVoi){
    ctx.beginPath(); // パスの初期化
    ctx.arc(voiPosFromScreenCenterX + canvasx/2, voiPosFromScreenCenterY + canvasy/2, voiRadius, 0, 2 * Math.PI); // (100, 50)の位置に半径30pxの円
    ctx.closePath(); // パスを閉じる
    ctx.strokeStyle = "red";
    ctx.stroke(); // 軌跡の範囲を塗りつぶす
  }


  // new THREE.Sphere(THREE.Vector3(100,50,))

  showTextTopRight("3D");
}

const drawNiftiSliceFusion = async function(pix0: Float32Array | Int16Array,
    nx0:number, ny0:number, nz0:number, wc0:number, ww0:number,
    p00_0:THREE.Vector3, v01_0:THREE.Vector3,v10_0:THREE.Vector3, clut0: number[][],
    pix1: Float32Array | Int16Array,
    nx1:number, ny1:number, nz1:number, wc1:number, ww1:number,
    p00_1:THREE.Vector3, v01_1:THREE.Vector3,v10_1:THREE.Vector3, clut1: number[][],
  ) {

      if (cv1.value === null || ctx === null) return;
      const canvasx = cv1.value.width;
      const canvasy = cv1.value.height;
      const myImageData = ctx.getImageData(0,0,canvasx,canvasy); // メモリーを新たに確保しないので、createImageDataよりも有利だと思う（想像）
      let ad = 0;

      for (let i = 0; i<canvasy; i++){
        let v_0 = p00_0.clone().addScaledVector(v01_0,i);
        let v_1 = p00_1.clone().addScaledVector(v01_1,i);
        for (let j = 0; j<canvasx; j++){

          const v0_0 = v_0.clone().floor();
          const v0_1 = v_1.clone().floor();

          if (v0_0.x >= 0 && v0_0.x < nx0 && v0_0.y >= 0 && v0_0.y < ny0 && v0_0.z >= 0 && v0_0.z < nz0){
            const raw = pix0[ny0*nx0*v0_0.z+nx0*v0_0.y+v0_0.x];
            let p = Math.floor((raw-(wc0-ww0/2)) * (255/ww0));
            if (p<0) p=0;
            if (p>255) p=255;
            myImageData.data[ad] = clut0[p][0] * 0.5; //red
            myImageData.data[ad+1] = clut0[p][1] * 0.5; //green
            myImageData.data[ad+2] = clut0[p][2] * 0.5; //blue
          }else{
            myImageData.data[ad] = clut0[0][0] * 0.5;
            myImageData.data[ad+1] = clut0[0][1] * 0.5;
            myImageData.data[ad+2] = clut0[0][2] * 0.5;
          }

          if (v0_1.x >= 0 && v0_1.x < nx1 && v0_1.y >= 0 && v0_1.y < ny1 && v0_1.z >= 0 && v0_1.z < nz1){
            const raw = pix1[ny1*nx1*v0_1.z+nx1*v0_1.y+v0_1.x];
            let p = Math.floor((raw-(wc1-ww1/2)) * (255/ww1));
            if (p<0) p=0;
            if (p>255) p=255;
            myImageData.data[ad] += clut1[p][0] * 0.5; //red
            myImageData.data[ad+1] += clut1[p][1] * 0.5; //green
            myImageData.data[ad+2] += clut1[p][2] * 0.5; //blue
          }else{
            myImageData.data[ad] += clut1[0][0] * 0.5;
            myImageData.data[ad+1] += clut1[0][1] * 0.5;
            myImageData.data[ad+2] += clut1[0][2] * 0.5;
          }

          ad += 4;
          v_0.add(v10_0);
          v_1.add(v10_1);
        }
      }

  ctx.putImageData(myImageData, 0,0,0,0,canvasx, canvasy);
  showTextTopRight("Fused");
}

// let mipDataSet: Float32Array[] = new Float32Array[];

const drawNiftiMip = async function(pix: Float32Array | Int16Array,
    nx:number, ny:number, nz:number, wc:number, ww:number,
    p00:THREE.Vector3, v01:THREE.Vector3,v10:THREE.Vector3,
    angle:number, thresh:number, depth:number, clut: number[][], isSurface: boolean) {

      const time0 = performance.now();

      if (cv1.value === null || ctx === null) return;
      const canvasx = cv1.value.width;
      const canvasy = cv1.value.height;
      const myImageData = ctx.getImageData(0,0,canvasx,canvasy);
      let ad = 0;

      let mipData = new Float32Array(ny*nz);

      // let flag = false;
      // if (mipDataSet[angle] == null){
      //   mipDataSet[angle] = new Float32Array(ny*nz);
      //   flag = true;
      // }

      // const mipData = mipDataSet[angle];

      // if (flag){

      const s = Math.sin((angle-90) *3.1415926535 / 180);
      const c = Math.cos((angle-90) *3.1415926535 / 180);

      // const isSurface = true;
      // const thresh = 0.5;
      // const depth = 3;

      const time1 = performance.now();


      if (!isSurface){
        for (let k = 0; k<nz; k++){
          for (let j = 0; j<ny; j++){
            let m = -Infinity;
            const j0 = j - ny/2;
            for (let i=nx-1; i>=0; i--){
              const i0 = i - nx/2;
              const x = Math.floor(i0*c-j0*s)+nx/2;
              const y = Math.floor(i0*s+j0*c)+ny/2;
              if (x >= 0 && x < nx && y >= 0 && y < ny) {
                const a = pix[k*nx*ny + y*nx + x];
                if (m < a){
                  m = a;
                }
              }
            }
            mipData[k*ny+j] = m;
          }
        }
      }else{
        for (let k = 0; k<nz; k++){
          for (let j = 0; j<ny; j++){
            let m = -Infinity;
            const j0 = j - ny/2;
            for (let i=nx-1; i>=0; i--){
              const i0 = i - nx/2;
              const x = Math.floor(i0*c-j0*s)+nx/2;
              const y = Math.floor(i0*s+j0*c)+ny/2;
              if (x >= 0 && x < nx && y >= 0 && y < ny) {
                const a = pix[k*nx*ny + y*nx + x];
                if (a<thresh) continue;

                for (let d = 0; d<depth; d++){
                  const id0 = (i-d) - nx/2;
                  const x1 = Math.floor(id0*c-j0*s)+nx/2;
                  const y1 = Math.floor(id0*s+j0*c)+ny/2;
                  const a = pix[k*nx*ny + y1*nx + x1];
                  if (m < a){
                    m = a;
                  }
                }
                i=0;
              }
            }
            mipData[k*ny+j] = m;
          }
        }
      }

    // }

      const time2 = performance.now();

      for (let i = 0; i<canvasy; i++){
        let v = p00.clone().addScaledVector(v01,i);
        for (let j = 0; j<canvasx; j++){

          const v0 = v.clone().floor();
          if (v0.x>=0 && v0.x<nx && v0.y>=0 && v0.y<ny && v0.z>=0 && v0.z<nz){
            const raw = mipData[nx*v0.z+v0.x];
            let p = Math.floor((raw-(wc-ww/2)) * (255/ww));
            if (p<0) p=0;
            if (p>255) p=255;
            myImageData.data[ad] = clut[p][0];
            myImageData.data[ad+1] = clut[p][1];
            myImageData.data[ad+2] = clut[p][2];
          }else{
            myImageData.data[ad] = clut[0][0];
            myImageData.data[ad+1] = clut[0][1];
            myImageData.data[ad+2] = clut[0][2];
          }
          ad += 4;
          v.add(v10);
        }
      }

      const time3 = performance.now();

  ctx.putImageData(myImageData, 0,0,0,0,canvasx, canvasy);
  const time4 = performance.now();
  console.log(time1-time0, time2-time1, time3-time2, time4-time3);

  if (isSurface){
    showTextTopRight("sMIP");
  }else{
    showTextTopRight("MIP");
  }


}




// const drawImageCv1 = async function(pix: Float32Array | Int16Array, ny:number, nx:number, wc:number, ww:number, intercept:number, slope:number) {
//   if (cv1.value === null || ctx === null) return;
  
//   const myImageData = ctx.getImageData(0,0,nx,ny); // メモリーを新たに確保しないので、createImageDataよりも有利だと思う（想像）
//   let ad = 0;

//   for (let y = 0; y<ny; y++){
//     for (let x = 0; x<nx; x++){
//       const raw = pix[x+y*nx] * slope + intercept;
//       let p = (raw-(wc-ww/2)) * (255/ww);

//       if (p<0) p=0;
//       if (p>255) p=255;

//       myImageData.data[ad] = p; //red
//       myImageData.data[ad+1] = p; //green
//       myImageData.data[ad+2] = p; //blue
//       ad += 4;
//     }
//   }

//   const ibm = await window.createImageBitmap(myImageData, 0,0, nx, ny); // awaitにするのがポイントだった
 
//   if (nx==512 && ny==512){
//     ctx.putImageData(myImageData, 0,0,0,0,cv1.value.width, cv1.value.height);
//   }else{
//     const zoom = 512/nx;
//     ctx.scale(zoom, zoom);
//     ctx.drawImage(ibm, 0,0);
//     ctx.scale(1/zoom, 1/zoom); //これをしないと毎回どんどん拡大されていく。
//   }
// }

const drawImageCv2 = async function(pix: Float32Array, pix2:Float32Array,
 ny:number, nx:number, wc:number, ww:number, wc2:number, ww2:number,
  intercept:number, slope:number, shiftX:number, shiftY:number, zoom:number) {

    if (cv1.value === null || ctx === null) return;
    const canvasx = cv1.value.width;
    const canvasy = cv1.value.height;

    const myImageData = ctx.getImageData(0,0,canvasx,canvasy); // メモリーを新たに確保しないので、createImageDataよりも有利だと思う（想像）
    let ad = 0;

  for (let y = 0; y<canvasy; y++){
    for (let x = 0; x<canvasx; x++){
      const x1 = Math.floor((x-canvasx/2)/zoom +nx/2 + shiftX);
      const y1 = Math.floor((y-canvasy/2)/zoom +ny/2 + shiftY);

      if (x1<0 || x1>nx || y1<0 || y1>ny){
        myImageData.data[ad] = 0; //red
        myImageData.data[ad+1] = 0; //green
        myImageData.data[ad+2] = 0; //blue
        ad += 4;
        continue;
      }

      const ad_p = x1+y1*nx;
      const raw = pix[ad_p] * slope + intercept;
      let p = (raw-(wc-ww/2)) * (255/ww);
      const raw2 = pix2[ad_p] * slope + intercept;
      let q = (raw2-(wc2-ww2/2)) * (255/ww2);
      
      if (p<0) p=0;
      if (p>255) p=255;

      if (q>0){
        myImageData.data[ad] = 255; //red
        myImageData.data[ad+1] = p; //green
        myImageData.data[ad+2] = p; //blue

      }else{
        myImageData.data[ad] = p; //red
        myImageData.data[ad+1] = p; //green
        myImageData.data[ad+2] = p; //blue
      }
      ad += 4;
    }
  }

  const ibm = await window.createImageBitmap(myImageData, 0,0, nx, ny); // awaitにするのがポイントだった
 


  if (nx==512 && ny==512){
    ctx.putImageData(myImageData, 0,0,0,0,cv1.value.width, cv1.value.height);
  }else{
    const zoom = 512/nx;
    ctx.scale(zoom, zoom);
    ctx.drawImage(ibm, 0,0);
    ctx.scale(1/zoom, 1/zoom); //これをしないと毎回どんどん拡大されていく。
  }
}

const drawImageCvRgb = async function(pix:Uint8Array, ny:number, nx:number, shiftX:number, shiftY:number, zoom:number) {

  if (cv1.value === null || ctx === null) return;
  const canvasx = cv1.value.width;
  const canvasy = cv1.value.height;
  const myImageData = ctx.getImageData(0,0,canvasx,canvasy); // メモリーを新たに確保しないので、createImageDataよりも有利だと思う（想像）
  let ad = 0;

  for (let y = 0; y<canvasy; y++){
    for (let x = 0; x<canvasx; x++){
      const x1 = Math.floor((x-canvasx/2)/zoom +nx/2 + shiftX);
      const y1 = Math.floor((y-canvasy/2)/zoom +ny/2 + shiftY);
      if (x1<0 || x1>nx || y1<0 || y1>ny){
        myImageData.data[ad] = 0; //red
        myImageData.data[ad+1] = 0; //green
        myImageData.data[ad+2] = 0; //blue
        ad += 4;
        continue;
      }

      const ad_p = (x1+y1*nx)*3;
      myImageData.data[ad] = pix[ad_p]; //red
      myImageData.data[ad+1] = pix[ad_p+1]; //green
      myImageData.data[ad+2] = pix[ad_p+2]; //blue
      ad += 4;
    }
  }
  ctx.putImageData(myImageData, 0,0,0,0,canvasx, canvasy);
  showTextTopRight("RGB");
}


const clear = (text = "No image") => {

  if (cv1.value === null || ctx === null) return;

  ctx.fillStyle = "#000000";
  ctx.fillRect(0,0,cv1.value.width, cv1.value.height);

  ctx.font = "48px Arial";
  ctx.fillStyle = "#660505";
  ctx.fillText(text,20,50);
}

const showTextTopRight = (text: string) => {
  if (cv1.value === null || ctx === null) return;
  ctx.font = "18px Arial";
  ctx.fillStyle = "#66aa44";
  const mes = ctx.measureText(text);
  
  ctx.fillText(text, cv1.value.width-mes.width, mes.fontBoundingBoxAscent);
}

const showTextBottomLeft = (text: string) => {
  if (cv1.value === null || ctx === null) return;
  ctx.font = "18px Arial";
  ctx.fillStyle = "#66aa44";
  const mes = ctx.measureText(text);
  
  ctx.fillText(text, 0, cv1.value.height - mes.fontBoundingBoxDescent );
}


defineExpose({init, show, show2, showRgb, showDirect,
   drawNiftiSlice, drawNiftiSliceFusion, drawNiftiMip, clear});

</script>


<template>
    <div class = "drop_area"
        @dragover.prevent
        :class="{enter: isEnter}">
        <span>
            <canvas ref="cv1" :width="prop.width" :height="prop.height"
             :class="[prop.selected ? 'selectedStyle' : 'unselectedStyle', prop.isEnter ? 'isEnter' : '']">
            </canvas>
        </span>
    </div>

</template>

<style scoped>

.unselectedStyle{
  border: 3px solid #444 
}

.selectedStyle{
  border: 3px solid #a44
}

.isEnter{
  border: 3px solid #4a4
}

</style>

// 2024/6/9
//
// homework: MyDataSet is dupulicated with DicomView.vue

import { DataSet } from "dicom-parser";
import * as THREE from 'three';
import { Volume } from "./Volume";

interface MyDataSet extends DataSet {
    decompressed: ArrayBuffer;
  }

export const generateVolumeFromDicom = (dcmList: MyDataSet[]) => {

    let suvFactor = 1;
    try{
        suvFactor = getSuvFactor(dcmList) ?? 1;
    }catch{
        
    }

    const d = dcmList[0];
    const d1 = dcmList[1];

    const nx = d.int16("x00280011")!; // columns
    const ny = d.int16("x00280010")!; // rows
    const nz = dcmList.length;

    const vx = new THREE.Vector3(
        d.floatString("x00200037",0)!, // 	Image Orientation (Patient)
        d.floatString("x00200037",1)!,
        d.floatString("x00200037",2)!
    );
    const px = d.floatString("x00280030",0)!; // pixel spacing
    vx.multiplyScalar(px / vx.length());

    const vy = new THREE.Vector3(
        d.floatString("x00200037",3)!, // 	Image Orientation (Patient)
        d.floatString("x00200037",4)!,
        d.floatString("x00200037",5)!
    );
    const py = d.floatString("x00280030",1)!; // pixel spacing
    vy.multiplyScalar(py / vy.length());

    // slice locationは、たまに、image positionのz座標と符号が反対のことがある。
    // そのため、下記の式は使えない。
    // const sl = d.floatString("x00201041")!; // slice location
    // const sl1 = d1.floatString("x00201041")!; // slice location

    const pos0 = new THREE.Vector3(
        d.floatString("x00200032",0)!, //	Image Position (Patient)
        d.floatString("x00200032",1)!,
        d.floatString("x00200032",2)!
    );

    const pos1 = new THREE.Vector3(
        d1.floatString("x00200032",0)!,
        d1.floatString("x00200032",1)!,
        d1.floatString("x00200032",2)!
    );

    const vz = pos1.clone();
    vz.sub(pos0);

    // let buffer = new ArrayBuffer(nx*ny*nz*4);
    // let dv = new DataView(buffer);

    let vox = new Float32Array(nx*ny*nz);

    let ad = 0;
    for (let i = 0; i<nz; i++){
        const dataSet = dcmList[i];
        const pixelDataElement = dataSet.elements.x7fe00010;
        const intercept = Number(dataSet.string("x00281052") ?? "0");
        const slope = Number(dataSet.string("x00281053") ?? "1");
        const aaa = new Int16Array(
            dataSet.byteArray.buffer,
            pixelDataElement.dataOffset,
            pixelDataElement.length / 2
          );
        

        for (let j = 0; j<ny; j++){
            for (let k = 0; k<nx; k++){
                const v = (aaa[j*nx+k] * slope + intercept)*suvFactor;
                vox[ad] = v;
                ad+=1;
            }
        }
    }

    const dicomVolume: Volume = {
        nx: nx,
        ny: ny,
        nz: nz,
        imagePosition: pos0,
        vectorX: vx,
        vectorY: vy,
        vectorZ: vz,
        voxel: vox,
    };

    return dicomVolume;
}




let log:string[] = [];

const getSuvFactor = (dd: MyDataSet[]) => {

    log = [];

    const d = dd[0];
    let constant = 1;
    // let text = "";
    const unit = d.string("x00541001");
    log.push("unit: "+unit);
    const bw = d.floatString("x00101030");
    log.push("bw: " + bw);
    const pf = d.floatString("x70531000");
    log.push("philips factor: " + pf);

    if ((unit!.toLowerCase() == "bq/cc" || unit?.toLowerCase() == "bqml")
        && getCorrectedDosage(dd) != 0 && bw != 0){
            constant = 1.0 / getBqmlPerSuv(dd, bw!);
            log.push("constant "+constant);
    }else if (unit == "CNTS" && pf != null){
        constant = Number(pf);
    }

    console.log(log);

    return constant;
}

const parseSecond6digits = (str:string) => {
    const h = Number(str.substring(0,2));
    const m = Number(str.substring(2,4));
    const s = Number(str.substring(4,6));
    return h*3600+m*60+s;
}

const getCorrectedDosage = (dd: MyDataSet[]) => {
    const d0 = dd[0];

    let hl = d0.floatString("x00181075"); // half life
    if (hl == null){
        hl = d0.elements.x00540016.items![0].dataSet!.floatString("x00181075") // ネスト
    }
    log.push("half life "+hl);

    const dc = d0.string("x00541102"); // decay correction
    let dosage = d0.floatString("x00181074"); // radionuclide total dose
    if (dosage == null){
        dosage = d0.elements.x00540016.items![0].dataSet!.floatString("x00181074") // ネスト
    }
    log.push("dosage (uncorrected) "+dosage);

    if (dc!.startsWith("START")){

        //すべてのDICOMファイルのscanstarttimeを調べてearliestのものを採択する
        let scanstarttime_earliest = "99999999999999999";
        for (let d of dd){
            const t = d.string("x00080032");
            if (t == undefined){
                continue;
            }
            if (t < scanstarttime_earliest){
                scanstarttime_earliest = t;
            }
        }
        // const scanstarttime_ = d0.string("x00080032");
        // log.push("scanstarttime "+scanstarttime_);
        // const scanstarttime = parseSecond6digits(scanstarttime_!); // acuisition time
        log.push("scanstarttime "+scanstarttime_earliest);
        const scanstarttime = parseSecond6digits(scanstarttime_earliest); // acuisition time


        let dosestarttime_ = d0.string("x00181072"); // Radiopharmaceutical Start Time
        if (dosestarttime_ == null){
            dosestarttime_ = d0.elements.x00540016.items![0].dataSet!.string("x00181072") // ネスト
        }
        log.push("dosestarttime "+dosestarttime_);
        const dosestarttime = parseSecond6digits(dosestarttime_!)

        dosage! *= Math.pow(0.5, (scanstarttime - dosestarttime) / hl!);
        log.push("dosage (corrected) "+dosage);
    }
    return dosage!;
};

const getBqmlPerSuv = (dd: MyDataSet[], bw:number) => {
    return getCorrectedDosage(dd) / (bw * 1000);
};



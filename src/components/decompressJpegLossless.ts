// 2024/5/12

import { Decoder } from 'jpeg-lossless-decoder-js';
import { DataSet } from "dicom-parser";

const decoder = new Decoder();

export const check = (dataSet: DataSet) => {
    return dataSet.string("x00020010")?.endsWith("4.70");
}


export const decode = (dataSet: DataSet) => {

    // const time0 = performance.now();
    const pixelDataElement = dataSet.elements.x7fe00010;
    const k=pixelDataElement.fragments![0].position;
    const output = decoder.decompress(dataSet.byteArray.buffer, k);
    return output
    // const time1 = performance.now();
    // console.log(time1-time0);

}

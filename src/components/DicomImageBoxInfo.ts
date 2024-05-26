// 2024/5/4
// modified 2024/5/19

import * as THREE from 'three';

export type ImageBoxInfoBase = {
    myWC: number | null,
    myWW: number | null,
    description: string,
}

export type DicomImageBoxInfo = ImageBoxInfoBase &  {
    currentDicomSeriesNumber: number,
    currentSliceNumber: number,
    imageNumberOfDicomTag: number | null,
    centerX:number,
    centerY:number
    zoom: number | null,
}

export type DicomVolumeImageBoxInfo = ImageBoxInfoBase & {
    dicomVolumeNumber: number,
    centerInWorld:THREE.Vector3,
    vecx: THREE.Vector3,
    vecy: THREE.Vector3,
    vecz: THREE.Vector3,
    clut: number,
    isMip: boolean,
    mip: {
        mipAngle: number,
        isSurface: boolean,
        thresholdSurfaceMip: number,
        depthSurfaceMip: number
    } | null,
}


export const defaultInfo = (i: number) => {
    return {
        currentDicomSeriesNumber: i,
        currentSliceNumber:0,
        imageNumberOfDicomTag: null,
        description: "",
        myWC:null,
        myWW:null,
        centerX:0,
        centerY:0,
        zoom:null,
        clut:0,
    };
    // centerの意味は、画面上のcanvasの中心（canvasが800x800なら(400,400)）が、DICOMファイル上に対応する画素の座標（一般的には256,256）からのオフセットである。
}


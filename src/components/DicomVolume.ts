import * as THREE from 'three';

export type DicomVolume = {
    voxel: Float32Array;
    nx: number;
    ny: number;
    nz: number;
    imagePosition: THREE.Vector3;
    vectorX: THREE.Vector3;
    vectorY: THREE.Vector3;
    vectorZ: THREE.Vector3;
}

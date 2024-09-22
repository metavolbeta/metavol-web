import * as THREE from 'three';
import { solve } from './linalg'

export type Volume = {
    voxel: Float32Array;
    nx: number;
    ny: number;
    nz: number;
    imagePosition: THREE.Vector3;
    vectorX: THREE.Vector3;
    vectorY: THREE.Vector3;
    vectorZ: THREE.Vector3;
}

export const voxelToWorld = (p: THREE.Vector3, v: Volume) => {
    const worldx = v.imagePosition.x + p.x * v.vectorX.x + p.y * v.vectorX.y + p.z * v.vectorX.z;
    const worldy = v.imagePosition.y + p.x * v.vectorY.x + p.y * v.vectorY.y + p.z * v.vectorY.z;
    const worldz = v.imagePosition.z + p.x * v.vectorZ.x + p.y * v.vectorZ.y + p.z * v.vectorZ.z;
    return new THREE.Vector3(worldx,worldy,worldz);
}

export const worldToVoxel = (p: THREE.Vector3, v: Volume) => {
    const right = [p.x - v.imagePosition.x, p.y- v.imagePosition.y, p.z - v.imagePosition.z];


    // 2024/8/19 leftが転置かも？？？
    const left = [[v.vectorX.x,v.vectorX.y,v.vectorX.z],
     [v.vectorY.x,v.vectorY.y, v.vectorY.z, ],
     [v.vectorZ.x,v.vectorZ.y, v.vectorZ.z, ]];
    const ans = solve(left, right)
    return new THREE.Vector3(ans[0],ans[1],ans[2]);
}

export const getVoxels = (spInWorld: THREE.Sphere, v: Volume) => {

    const center = worldToVoxel(spInWorld.center, v);
    const radius_x = Math.abs(spInWorld.radius / v.vectorX.x);
    const radius_y = Math.abs(spInWorld.radius / v.vectorY.y);
    const radius_z = Math.abs(spInWorld.radius / v.vectorZ.z);
    const radius_x2 = radius_x * radius_x;
    const radius_y2 = radius_y * radius_y;
    const radius_z2 = radius_z * radius_z;



    let voxels: THREE.Vector3[] = [];


    let x0 = Math.floor(center.x - radius_x - 1);
    let x1 = Math.floor(center.x + radius_x + 1);
    let y0 = Math.floor(center.y - radius_y - 1);
    let y1 = Math.floor(center.y + radius_y + 1);
    let z0 = Math.floor(center.z - radius_z - 1);
    let z1 = Math.floor(center.z + radius_z + 1);

    for (let z=z0; z<=z1; z++){
        for (let y=y0; y<=y1; y++){
            for (let x=x0; x<=x1; x++){

                // 各方向のボクセルサイズが異なることが反映されていない
                if ((x-center.x)*(x-center.x)/radius_x2 + (y-center.y)*(y-center.y)/radius_y2 + (z-center.z)*(z-center.z)/radius_z2 < 1){
                    voxels.push(new THREE.Vector3(x,y,z))

                }


            }
        }
    }

    return voxels;
}

export const fillVoxels = (voxels: THREE.Vector3[], fillValue: number, v: Volume ) => {
    for (const a of voxels){
        v.voxel[a.x+a.y*v.nx+a.z*v.nx*v.ny] = fillValue;
    }
}

export const getMax = (voxels: THREE.Vector3[], v: Volume ) : number => {

    let max : number = 0;
    for (const a of voxels){
        const k = v.voxel[a.x+a.y*v.nx+a.z*v.nx*v.ny];
        if (max < k){
            max = k
        }
    }
    return max;
}
  
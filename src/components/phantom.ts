import { Volume } from "./Volume.ts";
import * as THREE from 'three';


export const generatePhantom = () => {

    const [nx,ny,nz] = [100,100,100];
    let voxel = new Float32Array(nx*ny*nz);
    const sphere = (x,y,z,px,py,pz,r2) => 1/(((x-px)*(x-px) + (y-py)*(y-py) + (z-pz)*(z-pz))/r2);
    for (let z=0; z<nz; z++){
      for (let y=0; y<ny; y++){
        for (let x=0; x<nx; x++){
  
          let a = sphere(x,y,z,50,50,40,20*20) // 体上
          + sphere(x,y,z,50,50,50,20*20) // 体中
          + sphere(x,y,z,50,50,60,20*20) // 体下
          + sphere(x,y,z,50,50,30,10*10) // 首
          + sphere(x,y,z,50,50,20,10*10) // 首
          + sphere(x,y,z,50,50,10,20*20) // 頭
           + sphere(x,y,z,40,50,30,10*10) // 右肩
           + sphere(x,y,z,60,50,30,10*10) // 左肩
           + sphere(x,y,z,30,50,20,10*10) // 右上腕
           + sphere(x,y,z,70,50,20,10*10) // 左上腕
           + sphere(x,y,z,30,50,10,10*10) // 右上腕
           + sphere(x,y,z,70,50,10,10*10) // 左上腕
           + sphere(x,y,z,30,50,0,10*10) // 右上腕
           + sphere(x,y,z,70,50,0,10*10) // 左上腕
           + sphere(x,y,z,45,50,70,10*10) // 右大腿
           + sphere(x,y,z,45,50,80,10*10) // 右大腿
           + sphere(x,y,z,55,50,70,10*10) // 左大腿
           + sphere(x,y,z,55,50,80,10*10) // 左大腿

           
          voxel[z*nx*ny+y*nx+x] = a;
  
        }
      }
    }
  
    const volume = {
      voxel,
      nx,
      ny,
      nz,
      imagePosition: new THREE.Vector3(0,0,0),
      vectorX: new THREE.Vector3(1,0,0),
      vectorY: new THREE.Vector3(0,1,0),
      vectorZ: new THREE.Vector3(0,0,1),
    };
  
    return volume;
}

export const generatePhantom2 = () => {

  const n = 200;

  const [nx,ny,nz] = [n,n,n];
  let voxel = new Float32Array(nx*ny*nz);
  const sphere = (x,y,z,px,py,pz,r2) => 1/(((x-px)*(x-px) + (y-py)*(y-py) + (z-pz)*(z-pz))/r2);

  //const points = [[50,50,50],[20,40,50],[60,90,50],[80,10,50],[30,30,50]];

  const points: number[][] = [];
  const N = 100;
  for (let i = 0; i<N; i++){
    points.push([Math.random()*nx, Math.random()*ny,Math.random()*nz])
  }

  for (let z=0; z<nz; z++){
    for (let y=0; y<ny; y++){
      for (let x=0; x<nx; x++){

        if ((x-nx/2)*(x-nx/2)+(y-ny/2)*(y-ny/2)+(z-nz/2)*(z-nz/2)>=(nx/2)*(nx/2)){
          continue;

        }


        let min = 9999999999999999999;
        let n = -1;
        for (let i=0; i<points.length; i++){
          const p = points[i];
          const d2 = (p[0]-x)*(p[0]-x) + (p[1]-y)*(p[1]-y) + (p[2]-z)*(p[2]-z);
          if (min > d2){
            n = i;
            min = d2;
          }
        }

        voxel[z*nx*ny+y*nx+x] = n;

      }
    }
  }

  const volume = {
    voxel,
    nx,
    ny,
    nz,
    imagePosition: new THREE.Vector3(0,0,0),
    vectorX: new THREE.Vector3(1,0,0),
    vectorY: new THREE.Vector3(0,1,0),
    vectorZ: new THREE.Vector3(0,0,1),
  };


  return volume;
}



export const generatePhantom3 = () => {

  const n = 400;

  const [nx,ny,nz] = [n,n,n];
  let voxel = new Float32Array(nx*ny*nz);

  for (let z=0; z<nz; z++){
    for (let y=0; y<ny; y++){
      for (let x=0; x<nx; x++){

        const x0 = x-nx/2;
        const y0 = y-ny/2;
        const z0 = z-nz/2;
        const r = nx/2;
        const r0 = r*0.7;

        if (x0*x0+y0*y0+z0*z0>=r*r){
          continue;
        }

        if (x0*x0+y0*y0+z0*z0<=r0*r0){
          continue;
        }

        const d = Math.sqrt(x0*x0+y0*y0);
        

        const v0 = Math.atan(y0/(x0+0.000001)) + Math.PI/2;
        const v1 = Math.atan(z0/(d+0.00001))  + Math.PI/2;
        // const v = v0 + v1 + 1.57;
        // const v = v1 + 1.57;

        const f = (x:number) => {
          const X = Math.floor(x * 18 / Math.PI);
          return X % 2;
        };

        const F = f(v0) ^ f(v1);
        const v = F ? 2:4;


        voxel[z*nx*ny+y*nx+x] = v;

      }
    }
  }

  const zoom = n/200;

  const volume = {
    voxel,
    nx,
    ny,
    nz,
    imagePosition: new THREE.Vector3(0,0,0),
    vectorX: new THREE.Vector3(zoom,0,0),
    vectorY: new THREE.Vector3(0,zoom,0),
    vectorZ: new THREE.Vector3(0,0,zoom),
  };


  return volume;
}


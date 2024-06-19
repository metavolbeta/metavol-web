import { Volume } from "./Volume.ts";
import * as THREE from 'three';


export const generatePhantom = () => {

    const [nx,ny,nz] = [100,100,100];
    let voxel = new Float32Array(nx*ny*nz);
    const sphere = (x,y,z,px,py,pz,r2) => 1/(((x-px)*(x-px) + (y-py)*(y-py) + (z-pz)*(z-pz))/r2);
    for (let z=0; z<nz; z++){
      for (let y=0; y<ny; y++){
        for (let x=0; x<nx; x++){
  
          let a = sphere(x,y,z,50,50,50,500)
           + sphere(x,y,z,40,40,40,200)
  
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

  const n = 200;

  const [nx,ny,nz] = [n,n,n];
  let voxel = new Float32Array(nx*ny*nz);
  const sphere = (x,y,z,px,py,pz,r2) => 1/(((x-px)*(x-px) + (y-py)*(y-py) + (z-pz)*(z-pz))/r2);

  for (let z=0; z<nz; z++){
    for (let y=0; y<ny; y++){
      for (let x=0; x<nx; x++){

        const x0 = x-nx/2;
        const y0 = y-ny/2;
        const z0 = z-nz/2;
        const r = nx/2;

        if (x0*x0+y0*y0+z0*z0>=r*r){
          continue;
        }

        const v = Math.cos(y0/(x0+0.000001))+3;


        voxel[z*nx*ny+y*nx+x] = v;

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


import { cnv as mapCnv } from "./drawmap";
import * as THREE from "three";

//THREE.Object3D.DefaultUp = new THREE.Vector3(0, 0, 1);

export const scene = new THREE.Scene();
export const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

export const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth, window.innerHeight);

export const cnv = renderer.domElement;
//cnv.style.visibility = "hidden";
//document.body.appendChild(cnv);

camera.position.z = 2;

const mapTexture = new THREE.Texture(mapCnv);

const globeGeo = new THREE.SphereGeometry(1, 64, 32);
const globeMat = new THREE.MeshBasicMaterial({map: mapTexture});
const globe = new THREE.Mesh(globeGeo, globeMat);
globe.rotateY(Math.PI);
globe.rotateX(-Math.PI/20);
scene.add(globe);

export function render() {
  globe.rotateY(0.001);
  mapTexture.needsUpdate = true;
  renderer.render(scene, camera);
}

export {globe as object};

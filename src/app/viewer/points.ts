import * as THREE from "three";
import {integerToColor} from "./pickingColors.ts";
import {IUniform} from "three";

// @ts-expect-error typescript does not know about vite-plugin-glsl
import displayVertex from "./shaders/display/vertex.glsl"
// @ts-expect-error typescript does not know about vite-plugin-glsl
import displayFragment from "./shaders/display/fragment.glsl"

// @ts-expect-error typescript does not know about vite-plugin-glsl
import pickerVertex from "./shaders/picker/vertex.glsl"
// @ts-expect-error typescript does not know about vite-plugin-glsl
import pickerFragment from "./shaders/picker/fragment.glsl"


export function createPoints(uniforms: { [uniform: string]: IUniform; }) {
    const {positions, uvs, size} = generatePositions(316);
    const colors = generateColors(size);

    const pickerGeometry = new THREE.BufferGeometry();
    const displayGeometry = new THREE.BufferGeometry();

    pickerGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    pickerGeometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    pickerGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const hoveredArr = new Float32Array(size).fill(0);
    displayGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    displayGeometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    displayGeometry.setAttribute('hover', new THREE.BufferAttribute(hoveredArr, 1));


    const displayPoints = new THREE.Points(displayGeometry, new THREE.ShaderMaterial({
        transparent: true,
        uniforms,
        vertexShader: displayVertex,
        fragmentShader: displayFragment,
    }));

    const pickingPoints = new THREE.Points(pickerGeometry, new THREE.ShaderMaterial({
        uniforms,
        vertexShader: pickerVertex,
        fragmentShader: pickerFragment,
    }));

    return {
        displayPoints,
        pickingPoints,
        size
    };
}

function generateColors(size: number): Float32Array {
    const colors = new Float32Array(size * 3);
    for (let i = 0; i < size; i++) {
        const [r, g, b] = integerToColor(i + 1);
        colors[i * 3] = r / 255;
        colors[i * 3 + 1] = g / 255;
        colors[i * 3 + 2] = b / 255;
    }
    return colors;
}

function generatePositions(detail: number) {
    if (detail < 0) detail = 0;
    if (detail > 520) detail = 520;

    const geometry = new THREE.IcosahedronGeometry(1, detail);
    const pos = geometry.attributes.position.array;
    const uvs = geometry.attributes.uv.array;

    // filter out duplicate vertices (one vertex is created PER face it is part of)
    const retPositions: number[] = []
    const retUVs: number[] = [];
    const uniqueVertices = new Map<string, { index: number }>();

    for (let i = 0; i < pos.length; i += 3) {
        const x = pos[i].toFixed(6); // Limit to 6 decimal places to avoid floating point errors
        const y = pos[i + 1].toFixed(6);
        const z = pos[i + 2].toFixed(6);

        const key = `${x},${y},${z}`;
        if (!uniqueVertices.has(key)) {
            uniqueVertices.set(key, {index: retPositions.length / 3});
            retPositions.push(pos[i], pos[i + 1], pos[i + 2]);

            const uvIndex = (i / 3) * 2;
            retUVs.push(uvs[uvIndex], uvs[uvIndex + 1]);
        }
    }

    return {
        positions: new Float32Array(retPositions),
        uvs: new Float32Array(retUVs),
        size: retPositions.length / 3
    };
}
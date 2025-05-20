attribute vec2 texPos;

varying vec2 vTexPos;
varying vec3 vNormal;

void main() {
    vTexPos = texPos;
    vNormal = normal;
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
}
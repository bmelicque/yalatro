uniform sampler2D tex;

varying vec2 vTexPos;
varying vec3 vNormal;

void main() {
    gl_FragColor = texture2D(tex, vec2(.98094-vTexPos.x, 1. - vTexPos.y));
    if (gl_FragColor.w < .5) {
        gl_FragColor = vec4(0.3+0.7*vec3(vNormal.y), 1.);
    }
}
#define ROTATION_SPEED 0.05
#define DISTANCE_FACTOR 1.0
#define colour_1 vec4(.15, .3, .2, 1.)
#define colour_2 vec4(.3,  .6, .4,  1.)
#define colour_3 vec4(0., 0., 0., 1.)
#define contrast 1.5

uniform float time;
uniform float aspect;

varying vec2 vUv;

vec2 distort(vec2 uv) {
    uv *= 15.;

    float new_pixel_angle = (atan(uv.y, uv.x)) - DISTANCE_FACTOR*cos(sqrt(length(uv)))+.25;
    uv = length(uv)*vec2(cos(new_pixel_angle), sin(new_pixel_angle));

    vec2 uv2 = vec2(0.,0.);
    for(int i = 0; i < 5; i++) {
        uv2 += uv + cos(length(uv));
        uv  += 0.5*cos(0.5*uv2 + time*0.13);
        uv  += sin(uv.x - uv.y) - cos(uv.x + uv.y);
    }
    return uv;
}

void main() {
    vec2 uv = vec2((vUv.x-.5)*aspect, vUv.y-.5);
    vec2 pos = distort(uv);
    gl_FragColor = mix(colour_1, colour_2, length(pos)*0.075-length(uv));
}
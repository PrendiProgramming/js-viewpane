# 3D camera

**usage**

...

## css3D setup

```html
<div class="viewport"
  style="perspective: {persp-value};"
>
  <!-- for version 1, camera {position, -persp} is always on origin  -->
  <div class="camera"
    style="transform: translate3d(0px, 0px, -<persp>px) rotateX(0deg) rotateY(0deg) rotateZ(0deg);"
  >
    <!-- for version 2, -persp must be applied here as start z-offset -->
    <div class="world" 
      style="transform: translate3d(0px, 0px, 0px) rotateX(0deg) rotateY(0deg) rotateZ(0deg);"
    >
      <!-- all .world__object containers -->
```

```css
.viewport {
  position: relative;
  overflow: hidden;
  width: 100%;
  height: 100%;
}

.camera {
    position: absolute;
    left: 50%;
    top: 50%;
    transform-style: preserve-3d;
}

.world {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 3960px;
    height: 3060px;
    margin-left: -1980px;
    margin-top: -1530px;
    transform-style: preserve-3d;
}

#square1 {
    width: 500px;
    height: 500px;
    margin-left: -250px;
    margin-top: -250px;
    /* or transform: translate3d(-250px, -250px, 0) */
}
```

- `.camera` has a size of 0x0 and is centered in viewport
- `.world` requires a width and height and is centered in viewport

This ensure our world and camera is setup on origin 0/0/0, the origin is placed in the viewport center. To compensate the initial perspective, the `.camera` has to be translated by a perspective-value in z-direction (if z is positive, camera has to be rotated -90deg). Internally, this value has to be set for initial position, to allow correct calculations based in 2d interaction (click from screen to world).

> opengl's z-axis is positive towards user (from screen)

Alternatively, any world entities (.world, neightbours or included objects) may be translated by transform. In this case, this has to be setup to position-vector on init.


### camera movement

There are two possibilities to assign camera translation and rotation, where its behaviours are identical

1. assign camera-rotation to `.camera`, assign camera-position to `.world` (and neighbours)
2. create a modelViewMatrix and assign it to `.world` (and neighbours)

> Any rotation applied is a rotation around the origin 0/0/0 and not a rotation around the camera's own axis.
> Changing `.camera`-transform-order to rotate, then translate, changes rotation point to camera


#### (1.) using two vectors

```js
// create camera-position and rotation
const position = v.create();
const rotation = v.create();

// invert rotation
document.querySelector(".world").style.transform = 
  `translate3d(0,0,${-persp}px) 
  rotateX(${-rotation[0]}deg) rotateY(${-rotation[1]}deg) rotateZ(${-rotation[2]}deg))`;

// invert camera position to object (camera moving right or object moving left)
document.querySelector(".world").style.transform = 
  `translate3d(${-position[0]}px, ${-position[1]}px, ${-position[2]}px,)`;
```


#### (2.) using a modelViewMatrix

```js
// create camera-matrix
const position = v.create();
const rotation = v.create();
const camera = mat4.create();

mat4.identity(camera);
// translate, rotate z -> x, skew
mat4.translate(camera, camera, this.position);
// @todo order of rotations is still unclear
mat4.rotateZ(camera, camera, glMatrix.toRadian(this.rotation[2]));
mat4.rotateY(camera, camera, glMatrix.toRadian(this.rotation[1]));
mat4.rotateX(camera, camera, glMatrix.toRadian(this.rotation[0]));

// convert to view-matrix (to apply on model)
const viewMatrix = mat4.invert(mat4.create(), camera);

// create final matrix per model (.world)
const modelMatrix = mat4.create(); // any local object transformations
const modelViewMatrix = mat4.multiply(mat4.create(), modelMatrix, viewMatrix);

// assign to css3d setup
document.querySelector(".world").style.transform = `matrix(${modelViewMatrix.join(",")})`;
```

## rotation

there are basically two types of rotation

1. rotation of camera (_look around_)
2. rotation around a point (_look at_)

rotations dot not necessarily require a rotation-vector. In both cases, direction vectors can be used to calculate the camera orientation. but an angle must still be applied for a change in rotation. Simple rotation of vectors around origin do not suffice. Instead, a rotation by euler-angles (yaw, pitch, roll) or quaternions is required to have result in a stable and repeatable orientation. In both cases, rotation occurs around cameras axis, not on world axis. Euler angles are easier to understand.


```js
/* rotate around */
const centerToCam = v.subtract(v.create(), this.position, lookAt);
// rotate camera around lookAt point
const quatIdent = quat.create();
const rotationTransformation = quat.create();
quat.rotateX(rotationTransformation, quatIdent, toRadian(-rotation[0]));
// this would tilt cam, but we want to turn it @see below
quat.rotateZ(rotationTransformation, rotationTransformation, toRadian(rotation[2]));
v.transformQuat(centerToCam, centerToCam, rotationTransformation);
// update position
v.add(this.position, centerToCam, lookAt);
// update direction vector
v.negate(this.direction, centerToCam);

// its all about the up vector. why does this influence position? wtf
const turnTransformation = quat.create();
quat.rotateZ(turnTransformation, turnTransformation, toRadian(rotation[2]));
v.transformQuat(this.up, this.up, turnTransformation);
```

```js
/* look around */
quat.rotateY(rotationTransformation, rotationTransformation, toRadian(rotation[2]));
quat.rotateX(rotationTransformation, rotationTransformation, toRadian(-rotation[0]));
v.transformQuat(this.direction, this.direction, rotationTransformation);
```


## references

- css setup https://keithclark.co.uk/labs/css-fps/desktop/

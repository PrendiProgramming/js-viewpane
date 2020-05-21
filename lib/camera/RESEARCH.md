# camera rotation and the web

> - for rotation use euler angles (quaternions are tough to understand)


## euler angles

- https://learnopengl.com/Getting-started/Camera
    - lookAt explained
    - [+] lookAround with euler angles
- Tutorial on euler angles and quarternions https://www.weizmann.ac.il/sci-tea/benari/sites/sci-tea.benari/files/uploads/softwareAndLearningMaterials/quaternion-tutorial-2-0-1.pdf


## read list

good
- https://webglfundamentals.org/webgl/lessons/webgl-3d-camera.html
    - [+] nice basics of camera look at, easy retrieval
    - [-] but no camera rotation (based on previous rotation)
    - [-] no retrieval of rotation-vector
    - [+] no rotation-vector required
    - [!]: lookAt produces `cameraMatrix`


read later
- https://webglfundamentals.org/webgl/lessons/webgl-3d-camera.html
- euler and quarterions for rotation https://www.gamasutra.com/view/feature/3278/rotating_objects_using_quaternions.php?print=1

- https://gamedev.stackexchange.com/questions/72565/3d-camera-rotation
- http://www.songho.ca/opengl/gl_transform.html
- https://en.wikibooks.org/wiki/OpenGL_Programming/Modern_OpenGL_Tutorial_Arcball
- https://www.scratchapixel.com/lessons/mathematics-physics-for-computer-graphics/lookat-function

general
- http://www.opengl-tutorial.org/intermediate-tutorials/tutorial-17-quaternions/

implementation examples
- ThreeJS Orbit: https://github.com/mrdoob/three.js/blob/dev/examples/js/controls/OrbitControls.js

- https://github.com/mikolalysenko/Arcball/blob/master/arcball.js
- https://github.com/chinedufn/create-orbit-camera/blob/master/src/create-orbit-camera.js
- https://codepen.io/arcollector/pen/JoGJMq?editors=0010
- http://nehe.gamedev.net/tutorial/arcball_rotation/19003/
- rotation with quarternions https://stackoverflow.com/questions/33845276/rotate-camera-with-quaternions

euler
- https://doc.babylonjs.com/resources/rotation_conventions (babylon)

guideline
- yaw/pitch looks promising (eulerangles)
- quarternions are commonly used
- matrices seem to be built each frame

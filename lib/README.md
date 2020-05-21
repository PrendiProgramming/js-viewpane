# features

- [✓] orbit rotation
- [✓] visual translation of rotated plane
- [✓] visual rotation
- [✓] restrict orbit rotation
- [✓] rubberband for orbit rotation
- [✓] visual zoom
- [ ] "visual" x-rotation
- [ ] rotation hard limits

**restrictions**
> orbit rotation vs 2d-map

- [ ] snap targets for rotation
- [ ] restrict translation
- [ ] rubberband for translation

**input**
- [✓] trackpad-handler
- [✓] gesture-handler (trackpad)
- [✓] refactor mouse-handler
- [ ] refactor touch-handler
- [ ] input-handler setup based on device
- [ ] configurable user-input transforms (interaction -> transform)


# bugfixes

- [✓] touch changes


# performance

- [ ] debounce user input calculations at camera-handler(!)
- [ ] debounce rendering
- [ ] simplify & cache calculations
- [ ] math optional depending on config


# code design

- [ ] setup dom
- [ ] viewpane, scene, world, camera
- [ ] api, options

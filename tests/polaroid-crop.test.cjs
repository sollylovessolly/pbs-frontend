const test = require("node:test");
const assert = require("node:assert/strict");
const {
  polaroidCrop,
  POLAROID_ASPECT,
} = require("../src/lib/image/polaroidCrop.ts");

test("portrait and landscape photos cover the opening at every rotation and drag limit", () => {
  for (const [width, height] of [
    [1200, 1800],
    [1800, 1200],
    [800, 800],
  ]) {
    for (const rotation of [0, 90, 180, 270]) {
      for (const zoom of [1, 1.5, 3]) {
        for (const position of [
          { x: -100, y: -100 },
          { x: 100, y: 100 },
          { x: 0, y: 0 },
        ]) {
          const { pixels } = polaroidCrop(
            width,
            height,
            rotation,
            zoom,
            position,
          );
          const rw = rotation % 180 ? height : width;
          const rh = rotation % 180 ? width : height;
          assert.ok(pixels.x >= -1e-9 && pixels.y >= -1e-9);
          assert.ok(pixels.x + pixels.width <= rw + 1e-9);
          assert.ok(pixels.y + pixels.height <= rh + 1e-9);
          assert.ok(
            Math.abs(pixels.width / pixels.height - POLAROID_ASPECT) < 1e-9,
          );
        }
      }
    }
  }
});

test("preview percentages describe the same source crop at card, editor and print sizes", () => {
  const result = polaroidCrop(1200, 1800, 90, 1.8, { x: 0.2, y: -0.1 });
  for (const frameWidth of [90, 203, 696]) {
    const frameHeight = frameWidth / POLAROID_ASPECT;
    const rotatedWidth = (result.imageHeight / 100) * frameHeight;
    const scale = rotatedWidth / 1800;
    const left = frameWidth * (0.5 + result.position.x) - rotatedWidth / 2;
    assert.ok(Math.abs(-left / scale - result.pixels.x) < 1e-9);
    assert.ok(Math.abs(frameWidth / scale - result.pixels.width) < 1e-9);
  }
});

test("photostrip openings stay covered across template proportions, rotations and zoom levels", () => {
  for (const aspect of [
    589 / 430,
    589 / 463,
    267.6 / 252.74,
    113.55 / 66.65,
    1,
    0.75,
  ]) {
    for (const [width, height] of [
      [900, 1600],
      [1600, 900],
    ]) {
      for (const rotation of [0, 90, 180, 270]) {
        for (const zoom of [1, 2, 3]) {
          const { pixels } = polaroidCrop(
            width,
            height,
            rotation,
            zoom,
            { x: 100, y: -100 },
            aspect,
          );
          const rw = rotation % 180 ? height : width;
          const rh = rotation % 180 ? width : height;
          assert.ok(pixels.x >= -1e-9 && pixels.y >= -1e-9);
          assert.ok(pixels.x + pixels.width <= rw + 1e-9);
          assert.ok(pixels.y + pixels.height <= rh + 1e-9);
          assert.ok(Math.abs(pixels.width / pixels.height - aspect) < 1e-9);
        }
      }
    }
  }
});

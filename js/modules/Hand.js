import * as THREE from "three";
import Common from "./Common";
import * as handTrack from "handtrackjs";

class Hand {
  constructor() {
    this.mouseMoved = false;
    this.coords = new THREE.Vector2();
    this.coords_old = new THREE.Vector2();
    this.diff = new THREE.Vector2();
    this.timer = null;
    this.count = 0;
  }

  setCoords(x, y) {
    console.log("HAND: x, y", x, y);
    if (this.timer) clearTimeout(this.timer);
    this.coords.set((x / Common.width) * 2 - 1, -(y / Common.height) * 2 + 1);
    this.mouseMoved = true;
    this.timer = setTimeout(() => {
      this.mouseMoved = false;
    }, 100);
  }

  init() {
    const video = document.getElementById("video");
    const canvas = document.getElementById("canvas");
    const context = canvas.getContext("2d");
    console.log("video", typeof video);
    const modelParams = {
      flipHorizontal: true, // flip for webcam
      maxNumBoxes: 3, // number of hands to detect
      iouThreshold: 0.5, // used for non-max suppression
      scoreThreshold: 0.6, // confidence threshold for predictions
    };

    let model = null;

    const runDetection = () => {
      model.detect(video).then((predictions) => {
        const hands = predictions
          .filter((prediction) => prediction.label != "face")
          .map((prediction) => {
            // normalize the coordinates
            const x = prediction.bbox[0] / video.width;
            const y = prediction.bbox[1] / video.height;
            const width = prediction.bbox[2] / video.width;
            const height = prediction.bbox[3] / video.height;
            return {
              x: x,
              y: y,
              width: width,
              height: height,
            };
          });

        if (hands.length) {
          console.log("Hands: ", hands);
          this.setCoords(hands[0].x * Common.width, hands[0].y * Common.height);
        }
        // console.log("Predictions: ", predictions);
        model.renderPredictions(predictions, canvas, context, video);
        requestAnimationFrame(runDetection);
      });
    };

    // Load the model
    handTrack.load(modelParams).then((lmodel) => {
      model = lmodel;
      // Start video after model is loaded
      handTrack.startVideo(video).then((status) => {
        if (status) {
          runDetection();
        } else {
          console.error("Please enable video");
        }
      });
    });
  }

  update() {
    this.diff.subVectors(this.coords, this.coords_old);
    this.coords_old.copy(this.coords);

    if (this.coords_old.x === 0 && this.coords_old.y === 0) this.diff.set(0, 0);
  }
}

export default new Hand();

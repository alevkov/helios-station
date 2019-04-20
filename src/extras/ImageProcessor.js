const { ipcRenderer, remote } = window.require('electron');
const path = require('path');
const os = window.require('os');
const graphicsmagick = remote.require('graphicsmagick-static');
const imagemagick = remote.require('imagemagick-darwin-static');
let imagemagickPath = remote.require('imagemagick-darwin-static').path;

const { subClass } = remote.require('gm');
let gm;

export default class ImageProcessor {
  constructor() {
    if (os.platform() == "win32") {
        gm = subClass({imageMagick: true})
    } else {
        gm = subClass({
            imageMagick: true,
            appPath: path.join(`${imagemagickPath}`, '/')
        });
    }
  }

  get() {
    return gm;
  }
}
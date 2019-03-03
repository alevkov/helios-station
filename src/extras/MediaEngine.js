/* IPC ONLY
  The following functions are executed in a BrowserWindow background process using electron-remote.
  This file must be included in the "public" folder before distribution, since it is used by the application starter.
*/
const path = require('path');
class AppPaths {
    static replaceAsar(path = "") {
        return path.replace(".asar", ".asar.unpacked");
    }
}
const gifshot = require('gifshot');
const electron = require('electron');
const settings = require('electron-settings');
const fs = require('fs');
const os = require('os');
const graphicsmagick = require('graphicsmagick-static');
const imagemagick = require('imagemagick-darwin-static');
let imagemagickPath = require('imagemagick-darwin-static').path;
let fixedPath = AppPaths.replaceAsar(imagemagickPath);

const { subClass } = require('gm');
let gm;

if (os.platform() == "win32") {
    gm = subClass({imageMagick: true})
} else {
    gm = subClass({
        imageMagick: true,
        appPath: AppPaths.replaceAsar(path.join(imagemagick.path, "/"))
    })
}

function sortedFrames(frames, ascending) {
  return frames.concat().sort((a, b) => {
    const aFile = a.replace(/^.*[\\\/]/, '');
    const aIndex = aFile.split('_')[1].split('.')[0];
    const bFile = b.replace(/^.*[\\\/]/, '');
    const bIndex = bFile.split('_')[1].split('.')[0];
    return ascending ? 
      (aIndex > bIndex ? 1 : -1) : 
      (aIndex < bIndex ? 1 : -1);
  });
}

function generate(frames, type) {
  return new Promise(async (resolve, reject) => {
    switch (type) {
      case 'gif': {
        try {
          let result = await generateGif(frames);
          resolve(result);         
        } catch (err) {
          reject(new Error(JSON.stringify(err)));
        }
        break;
      }
      default: {
        break;
      }
    }    
  });
}

function generateGif(frames) {
  return new Promise((resolve, reject) => {
    console.log('in generate');
    // get cached parameters
    const boomerang = Boolean(settings.get('media.boomerang'));
    const loop = Boolean(settings.get('media.loop'));
    const numFrames = Number.parseInt(settings.get('media.frames'), 10);
    const width = Number.parseInt(settings.get(`media.width`), 10);
    const height = Number.parseInt(settings.get(`media.height`), 10);
    const duration = (1.0 / Number.parseInt(settings.get('media.fps'), 10)) * 100;
    // sort frames
    const sorted = sortedFrames(frames, true);
    const sortedDescending = sortedFrames(frames, false);
    // remove first element
    sortedDescending.shift();
    sorted.splice(-1, 1);
    // if boomerang, append descending array
    const orderedFrames = boomerang ? 
      sorted.concat(sortedDescending) : sorted;
    let finalFrames = [];
    // append file URL prefix
    for (let i = 0; i < orderedFrames.length; i++) {
      finalFrames.push(orderedFrames[i]);
    }
    const frameName = orderedFrames[0].replace(/^.*[\\\/]/, '');
    const index = frameName.split('_')[0];
    const dest = settings.get('dir.media') + 
          (os.platform() === 'darwin' ? '/' : '\\') + 
          index + '.gif';
    const convert = gm().command('convert');
    for (let i = 0; i < finalFrames.length; i++) {
      convert.in(finalFrames[i]);
    }
    convert.delay(duration);
    convert.resize(width, height);
    convert.quality(100);
    convert.write(dest, function(err) {
      if (err) { alert(err); reject(err); }
      resolve(dest);
    }) 
  });

}

function generateMpeg(frames) {
  return null;
}

module.exports = generateGif;
/* IPC ONLY */
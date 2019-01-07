/* IPC ONLY */
const gifshot = require('gifshot');
const electron = require('electron');
const settings = require('electron-settings');
const fs = require('fs');
const os = require('os');

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
    const numFrames = Number.parseInt(settings.get('media.frames'), 10);
    const width = Number.parseInt(settings.get(`media.width`), 10);
    const height = Number.parseInt(settings.get(`media.height`), 10);
    const duration = 1.0 / Number.parseInt(settings.get('media.fps'), 10);
    // sort frames
    const sorted = sortedFrames(frames, true);
    const sortedDescending = sortedFrames(frames, false);
    // remove first element
    sortedDescending.shift();
    // if boomerang, append descending array
    const orderedFrames = boomerang ? 
      sorted.concat(sortedDescending) : sorted;
    let finalFrames = [];
    // append file URL
    for (let i = 0; i < orderedFrames.length; i++) {
      finalFrames.push('file://' + orderedFrames[i]);
    }
    const frameName = orderedFrames[0].replace(/^.*[\\\/]/, '');
    const index = frameName.split('_')[0];
    gifshot.createGIF({
      'images': finalFrames,
      'numFrames': boomerang ? (2 * numFrames - 1) : numFrames,
      'keepCameraOn': false,
      'gifWidth': width,
      'gifHeight': height,
      'filter': '',
      'interval': duration,
      'frameDuration': duration,
      'text': '',
      'fontWeight': 'normal',
      // The font size of the text that covers the animated GIF
      'fontSize': '16px',
      // The minimum font size of the text that covers the animated GIF
      // Note: This option is only applied if the text being applied is cut off
      'minFontSize': '10px',
      // Whether or not the animated GIF text will be resized to fit within the GIF container
      'resizeFont': false,
      // The font family of the text that covers the animated GIF
      'fontFamily': 'sans-serif',
      // The font color of the text that covers the animated GIF
      'fontColor': '#ffffff',
      // The horizontal text alignment of the text that covers the animated GIF
      'textAlign': 'center',
      // The vertical text alignment of the text that covers the animated GIF
      'textBaseline': 'bottom',
      // The X (horizontal) Coordinate of the text that covers the animated GIF (only use this if the default textAlign and textBaseline options don't work for you)
      'textXCoordinate': null,
      // The Y (vertical) Coordinate of the text that covers the animated GIF (only use this if the default textAlign and textBaseline options don't work for you)
      'textYCoordinate': null,
      // Callback function that provides the current progress of the current image
      //'progressCallback': null,
      // how many web workers to use to process the animated GIF frames. Default is 2.
      'numWorkers': 10,
      'sampleInterval': 1
    }, (obj) => {
      if (!obj.error) {
        const data = obj.image.replace(/^data:image\/\w+;base64,/, '');
        const buf = new Buffer(data, 'base64');
        const dest = settings.get('dir.media') + 
          (os.platform() === 'darwin' ? '/' : '\\') + 
          index + '.gif';
        fs.writeFileSync(dest, buf);
        resolve(logo_dir);
      } else {
        resolve(obj);
      }
    });    
  });

}

function generateMpeg(frames) {
  return null;
}

module.exports = generateGif;
/* IPC ONLY */
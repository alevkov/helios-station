import gifshot from 'gifshot';

const electron = window.require('electron');
const settings = electron.remote.require('electron-settings');
const fs = electron.remote.require('fs');
const os = window.require('os');

export default class MediaEngine  {
  constructor(type, frames) {
    this.frames = frames;
    this.type = type;
  }

  sortedFrames = (ascending) => {
    return this.frames.concat().sort((a, b) => {
      const aFile = a.replace(/^.*[\\\/]/, '');
      const aIndex = aFile.split('_')[1].split('.')[0];
      const bFile = b.replace(/^.*[\\\/]/, '');
      const bIndex = bFile.split('_')[1].split('.')[0];
      return ascending ? 
        (aIndex > bIndex ? 1 : -1) : 
        (aIndex < bIndex ? 1 : -1);
    });
  }

  generate = () => {
    switch (this.type) {
      case 'gif': {
        const boomerang = Boolean(settings.get('media.boomerang'));
        const numFrames = Number.parseInt(settings.get('media.frames'));
        const width = Number.parseInt(settings.get('media.width'));
        const height = Number.parseInt(settings.get('media.height'));
        const duration = 1.0 / Number.parseInt(settings.get('media.fps')); 
        // sort frames
        const sorted = this.sortedFrames(true);
        const sortedDescending = this.sortedFrames(false);
        // remove first element
        sortedDescending.shift();
        // if boomerang, append descending array
        const orderedFrames = boomerang ? 
          sorted.concat(sortedDescending) : sorted;
        let finalFrames = [];
        // append file URL
        for (var i = 0; i < orderedFrames.length; i++) {
          finalFrames.push('file://' + orderedFrames[i]);
        }
        gifshot.createGIF({
          'images': finalFrames,
          'numFrames': boomerang ? (2 * numFrames - 1) : numFrames,
          'keepCameraOn': false,
          'gifWidth': width,
          'gifHeight': height,
          'filter': '',
          /*'interval': interval,*/
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
          'numWorkers': 2,
          'waterMark': null,
          // If an image is given here, it will be stamped on top of the GIF frames
          'waterMarkHeight': null,
          // Height of the waterMark
          'waterMarkWidth': null,
          // Height of the waterMark
          'waterMarkXCoordinate': 1,
          // The X (horizontal) Coordinate of the watermark image
          'waterMarkYCoordinate': 1
          // The Y (vertical) Coordinate of the watermark image
        }, (obj) => {
          if (!obj.error) {
            console.log(obj);
            const data = obj.image.replace(/^data:image\/\w+;base64,/, "");
            const buf = new Buffer(data, 'base64');
            fs.writeFile(settings.get('dir.media') + 
              (os.platform() === 'darwin' ? '/' : '\\') + 
              'image.gif', buf);
          } else {
            console.log(obj);
          }
        });
        break;
      }
      default: {
        break;
      }
    }
  }
}
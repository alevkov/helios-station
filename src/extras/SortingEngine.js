import { 
  emitter,
  settings,
  EVENT_SOURCE_FOLDER_SELECTED,
  EVENT_PHOTO_ADDED,
  EVENT_PHOTO_REMOVED
} from '../common';
import AppPaths from './AppPaths';

const { ipcRenderer, remote } = window.require('electron');
const choker = remote.require('chokidar');
const path = remote.require('path');
const moveFile = remote.require('move-file');
const fs = remote.require('fs');
const jimp = remote.require('jimp');
const os = window.require('os');
const graphicsmagick = remote.require('graphicsmagick-static');
const imagemagick = remote.require('imagemagick-darwin-static');
let imagemagickPath = remote.require('imagemagick-darwin-static').path;
let fixedPath = AppPaths.replaceAsar(imagemagickPath);

const { subClass } = remote.require('gm');
let gm;

if (os.platform() == "win32") {
    gm = subClass({
        appPath: AppPaths.replaceAsar(path.join(graphicsmagick.path, "/"))
    })
} else {
    gm = subClass({
        imageMagick: true,
        appPath: AppPaths.replaceAsar(path.join(imagemagick.path, "/"))
    })
}

export default class SortingEngine {
  // dirs
  static _sourceDir = null;
  static _sortDir = null;
  static _mediaDir = null;
  static _sortDirMap = new Map(); // [string: Set<string>]
  static _dirWatchMap = new Map(); // [string: Watcher]

  constructor(source, sort, media) {
    SortingEngine._sourceDir = source;
    SortingEngine._sortDir = sort;
    SortingEngine._mediaDir = media;
    // emit source folder event for subscribing components
    emitter.emit(EVENT_SOURCE_FOLDER_SELECTED, SortingEngine._sourceDir);
    this.initWatchDir('source', SortingEngine._sourceDir);
    console.log('media dir: ' + SortingEngine._mediaDir);
    this.initWatchDir('media', SortingEngine._mediaDir);
  }

  sortedFrames = (frames, ascending) => {
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

  initWatchDir = (type, dir) => {
    // initialize dir string to watch
    let watchGlob = dir;
    //set the watch dir according to OS
    if (os.platform() === 'darwin') {
      watchGlob = dir + '/*.jpg';
    } else {
      watchGlob = dir + '\\*.jpg'
    }
    console.log(watchGlob);
    switch (type) {
      case 'source': {   
        // watch the source dir
        const sourceWatcher = choker.watch(dir, {
          ignored: /(^|[\/\\])\../,
          persistent: true
        });
        // when a file is added, send event to subs
        sourceWatcher.on('add', addedFilePath => {
          if (path.basename(addedFilePath) === '.DS_Store') {
            return;
          }
          if (path.extname(addedFilePath) === '.jpg' || path.extname(addedFilePath) === '.JPG') {
            this.onSourcePhotoAdded(addedFilePath);
          }
        });
        break;
      }
      // e.g. _sortDir/000/
      // this is the "shot number"
      case 'index': {
        const filename = dir.replace(/^.*[\\\/]/, '');
        const index = filename.split('_')[0];
        if (!fs.existsSync(dir)) {
          if (SortingEngine._dirWatchMap.get(dir)) {
            SortingEngine._dirWatchMap.get(dir).close();
            SortingEngine._dirWatchMap.delete(dir);
          }
          fs.mkdirSync(dir);
        }
        if (!SortingEngine._dirWatchMap.get(dir)) {
          SortingEngine._sortDirMap.set(index, new Set());
          const indexPathWatcher = choker.watch(dir, {
            ignored: /(^|[\/\\])\../,
            persistent: true
          });
          indexPathWatcher.on('add', addedFilePath => {
            if (path.basename(addedFilePath) === '.DS_Store') {
              return;
            }
            if (path.extname(addedFilePath) === '.jpg' || path.extname(addedFilePath) === '.JPG') {
              this.onSortedPhotoAdded(index, addedFilePath);
            }
          });
          indexPathWatcher.on('unlink', removedFilePath => {
            if (path.basename(removedFilePath) === '.DS_Store') {
              return;
            }
            this.onSortedPhotoRemoved(index, removedFilePath);
          });  
          SortingEngine._dirWatchMap.set(dir, indexPathWatcher);
        }
        break;
      }
      case 'media': {
        let mediaGlob = dir;
        // set the watch dir according to OS
        if (os.platform() === 'darwin') {
          mediaGlob = dir + '/*.gif';
        } else {
          mediaGlob = dir + '\\*.gif'
        }
        console.log('glob: ' + mediaGlob);
        const mediaWatcher = choker.watch(dir, {
          ignored: /(^|[\/\\])\../,
          persistent: true
        });
        mediaWatcher.on('add', addedFilePath => {
          if (path.basename(addedFilePath) === '.DS_Store') {
            return;
          }
          this.onMediaAdded(addedFilePath);
        });
        mediaWatcher.on('unlink', removedFilePath => {
          this.onMediaRemoved(removedFilePath);
        });
        break;
      }
      default: {
        break;
      }
    }
  }

  onSourcePhotoAdded = dir => {
    console.log('file added!');
    let overlayFrames = []
    let applyOverlay = settings.get('media.applyOverlay') && settings.get('media.overlay') != undefined;
    let applyLogo = settings.get('media.applyLogo') && settings.get('dir.logo') != undefined;
    console.log(applyOverlay);
    console.log(applyLogo);

    if (applyOverlay) {
      console.log('getting overlay frames');
      fs.readdirSync(settings.get('media.overlay').value).forEach(file => {
        overlayFrames.push(settings.get('media.overlay').value + (os.platform() === 'darwin' ? '/' : '\\') + file);
      });
      if (overlayFrames.length < Number.parseInt(settings.get('media.frames'), 10)) {
        console.log('Warning! Not enough overlay frames');
        applyOverlay = false;
      }
    }

    overlayFrames = this.sortedFrames(overlayFrames, true);
    console.log(overlayFrames);

    const filename = dir.replace(/^.*[\\\/]/, '');
    const index = filename.split('_')[0]; // shot number
    const camera = filename.split('_')[1].split('.')[0];
    const cameraNum = Number.parseInt(camera, 10);
    const indexPath = SortingEngine._sortDir +
      (os.platform() === 'darwin' ? '/' : '\\') +
      index;
    // start watching index dir
    this.initWatchDir('index', indexPath);
    // move photo to index dir
    const destination = indexPath + 
      (os.platform() === 'darwin' ? '/' : '\\') +
      filename
    // TODO: apply xform in ImageProcessor
    const zoom =  Number.parseInt(settings.get(`photo.zoom.f_${cameraNum}`), 10);
    const cropW = Number.parseInt(settings.get(`photo.crop_w`), 10);
    const cropH = Number.parseInt(settings.get(`photo.crop_h`), 10);
    const cropDeltaX = Number.parseInt(settings.get(`photo.crop_delta_x.f_${cameraNum}`), 10);
    const cropDeltaY = Number.parseInt(settings.get(`photo.crop_delta_y.f_${cameraNum}`), 10);
    const fullW = Number.parseInt(settings.get(`photo.full_w`), 10);
    const fullH = Number.parseInt(settings.get(`photo.full_h`), 10);
    const rotate = Number.parseFloat(settings.get(`photo.rotate.f_${cameraNum}`));
    const logoX = Number.parseInt(settings.get('media.logo_x'), 10);
    const logoY = Number.parseInt(settings.get('media.logo_y'), 10);

    const cropOffsetX = ((fullW - cropW)/2) + cropDeltaX + 
    ((cropW * (zoom / 100) - cropW) / 2);
    const cropOffsetY = ((fullH - cropH)/2) + cropDeltaY + 
    ((cropH * (zoom / 100) - cropH) / 2);

    const logoDir = settings.get('dir.logo');
    console.log('camera ' + cameraNum);
    console.log(logoDir);
    console.log([cropOffsetX, cropOffsetY]);
    console.log([zoom, cropW, cropH, rotate]);
    //TODO: convert to pipeline
    gm(dir)
        .crop((zoom / 100.0) * cropW,
              (zoom / 100.0) * cropH,
              cropOffsetX,
              cropOffsetY)
        .rotate('white', rotate)
        .write(dir, err => {
          if (err) {
            console.log('Error! ' + err);
          } else {
            if (applyLogo) { // logo
              gm(dir)
                .composite(logoDir)
                .geometry(`+${logoX}+${logoY}`)
                .write(dir, err => {
                  if(err) {
                    console.log('Error! ' + err)
                  } else {
                    if (applyOverlay) { // logo + overlay
                      gm(dir)
                        .composite(overlayFrames[cameraNum])
                        .geometry(`${(zoom / 100.0) * cropW}x${(zoom / 100.0) * cropH}+0+0`)
                        .write(dir, err => {
                          if (err) {
                            console.log('Error! ' + err);
                          } else {
                            moveFile(dir, destination)
                              .then(() => {
                                console.log(filename + ' moved to ' + destination);
                              });
                          }
                      })
                    } else {
                      moveFile(dir, destination)
                        .then(() => {
                          console.log(filename + ' moved to ' + destination);
                        });
                    }
                  }
                })
            } else {
              if (applyOverlay) { // overlay, no logo
                gm(dir)
                  .composite(overlayFrames[cameraNum])
                  .geometry(`${(zoom / 100.0) * cropW}x${(zoom / 100.0) * cropH}+0+0`)
                  .write(dir, err => {
                    if (err) {
                      console.log('Error! ' + err);
                    } else {
                      moveFile(dir, destination)
                        .then(() => {
                          console.log(filename + ' moved to ' + destination);
                        });
                    }
                })
              } else { // no overlay, no logo
                 moveFile(dir, destination)
                  .then(() => {
                    console.log(filename + ' moved to ' + destination);
                  });
              }
            }
          }
        });
  }

  // effects must be already applied at this point
  onSortedPhotoAdded = (index, dir) => {
    SortingEngine._sortDirMap.get(index).add(dir);
    const maxNum = Number.parseInt(settings.get('media.frames'), 10);
    console.log('Number of frames in ' + index + ': ' + SortingEngine._sortDirMap.get(index).size);
    console.log('Max num: ' + maxNum);
    if (SortingEngine._sortDirMap.get(index).size === maxNum) {
      let frames = Array.from(SortingEngine._sortDirMap.get(index));
      console.log('About to generate gif...');
      ipcRenderer.send('generate-media', frames);
      ipcRenderer.on('media-reply', (event, arg) => {  
        console.log(arg);
      });
    }
  }

  onMediaAdded = dir => {
    console.log('SortingEngine: media added: ' + dir);
    emitter.emit(EVENT_PHOTO_ADDED, dir);
  }

  onSortedPhotoRemoved = (index, dir) => {
    console.log(`Removed ${dir}, ${index}`);
    SortingEngine._sortDirMap.get(index).delete(dir);
    //emitter.emit(EVENT_PHOTO_REMOVED, dir);
  }

  onMediaRemoved = dir => {
    emitter.emit(EVENT_PHOTO_REMOVED, dir);
  }

  unpackOverlays = dir => {
    const overlays = []
    fs.readdirSync(dir).forEach(file => {
      overlays.push(dir + (os.platform() === 'darwin' ? '/' : '\\') + file);
    });
    return overlays;
  }
}
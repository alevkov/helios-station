import { 
  emitter,
  settings,
  EVENT_SOURCE_FOLDER_SELECTED,
  EVENT_PHOTO_ADDED,
  EVENT_PHOTO_REMOVED,
  getInt,
  getFloat
} from '../common';

const { ipcRenderer, remote } = window.require('electron');
const choker = remote.require('chokidar');
const path = require('path');
const fs = remote.require('fs-extra');
const stream = remote.require('stream');
const os = window.require('os');
const graphicsmagick = remote.require('graphicsmagick-static');
const imagemagick = remote.require('imagemagick-darwin-static');
let imagemagickPath = remote.require('imagemagick-darwin-static').path;
console.log(imagemagickPath);

const { subClass } = remote.require('gm');
let gm;

if (os.platform() == "win32") {
    gm = subClass({imageMagick: true})
} else {
    gm = subClass({
        imageMagick: true,
        appPath: path.join(`${imagemagickPath}`, '/')
    });
}

export default class SortingEngine {
  // dirs
  static _sourceDir = null;
  static _sortDir = null;
  static _mediaDir = null;
  static _sortDirMap = new Map(); // [string: Set<string>]
  static _dirWatchMap = new Map(); // [string: Watcher]
  static _isCreatingMedia = false;

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
          fs.mkdirSync(`${dir}-backup`)
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
    let overlayFrames = []
    let applyOverlay = Boolean(settings.get('media.applyOverlay')) && settings.has('dir.overlay');
    let applyLogo = settings.get('media.applyLogo') && settings.has('dir.logo');
    console.log('overlay: ' + applyOverlay);
    console.log('logo: ' + applyLogo);

    if (applyOverlay) {
      fs.readdirSync(settings.get('media.overlay').value).forEach(file => {
        overlayFrames.push(settings.get('media.overlay').value + (os.platform() === 'darwin' ? '/' : '\\') + file);
      });
      if (overlayFrames.length < getInt('media.frames')) {
        console.log('Warning! Not enough overlay frames');
        applyOverlay = false;
      }
    }

    overlayFrames = this.sortedFrames(overlayFrames, true);

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
    const backupDestination = `${indexPath}-backup` + 
      (os.platform() === 'darwin' ? '/' : '\\') +
      filename;
    // TODO: apply xform in ImageProcessor
    const zoom =  getFloat(`photo.zoom.f_${cameraNum}`);
    const cropW = getInt(`photo.crop_w`);
    const cropH = getInt(`photo.crop_h`);
    const cropDeltaX = getInt(`photo.crop_delta_x.f_${cameraNum}`);
    const cropDeltaY = getInt(`photo.crop_delta_y.f_${cameraNum}`);
    const fullW = getInt(`photo.full_w`);
    const fullH = getInt(`photo.full_h`);
    const rotate = getFloat(`photo.rotate.f_${cameraNum}`);
    const logoX = getInt('media.logo_x');
    const logoY = getInt('media.logo_y');
    const cropOffsetX = cropDeltaX;
    const cropOffsetY = cropDeltaY;
    const logoDir = settings.get('dir.logo');
    console.log(cameraNum);
    console.log(overlayFrames);
    console.log(overlayFrames[cameraNum-1]);
    //TODO: convert to pipeline
    let passThrough = new stream.PassThrough();
    // make backup copy
    gm(dir).write(backupDestination, err => {
      gm(backupDestination)
      // xform: zoom -> rotate abt center -> crop
      .command('convert')
      .in('-resize', `${zoom}%`)
      .in('-distort', 'SRT', `${rotate}`)
      .in('-crop', `${cropW}x${cropH}+${cropOffsetX}+${cropOffsetY}`)
      .stream()
      .pipe(passThrough)
      if (applyLogo) {
        let str = gm(passThrough)
        .composite(logoDir)
        .geometry(`+${logoX}+${logoY}`)
        .stream()
        passThrough = new stream.PassThrough();
        str.pipe(passThrough)
      }
      if (applyOverlay) {
        let str = gm(passThrough)
        .composite(overlayFrames[cameraNum-1])
        .geometry(`${cropW}x${cropH}+0+0`)
        .stream()
        passThrough = new stream.PassThrough();
        str.pipe(passThrough)
      }
      const boomerang = Boolean(settings.get('media.boomerang'));
      console.log(boomerang);
      gm(passThrough)
      .write(dir, err => {
        if (err) { console.log(err); }
        else {
          fs.move(dir, destination, err => {
            if (err) { console.log(err); }
            console.log(filename + ' moved to ' + destination);
          })
        }
      });      
    });
  }

  // effects must be already applied at this point
  onSortedPhotoAdded = (index, dir) => {
    SortingEngine._sortDirMap.get(index).add(dir);
    const maxNum = getInt('media.frames');
    console.log('frame ' + SortingEngine._sortDirMap.get(index).size + ' out of ' + maxNum);
    if (SortingEngine._sortDirMap.get(index).size === maxNum) {
      SortingEngine._isCreatingMedia = true;
      let frames = Array.from(SortingEngine._sortDirMap.get(index));
      console.log('About to generate gif...');
      ipcRenderer.send('generate-media', frames);
      ipcRenderer.once('media-reply', (event, arg) => {  
        emitter.emit(EVENT_PHOTO_ADDED, arg);
      });
    }
  }

  onMediaAdded = dir => {
    console.log('SortingEngine: media added: ' + dir);
    if (!SortingEngine._isCreatingMedia) {
      emitter.emit(EVENT_PHOTO_ADDED, dir);
    }
  }

  onSortedPhotoRemoved = (index, dir) => {
    console.log(`Removed ${dir}, ${index}`);
    SortingEngine._sortDirMap.get(index).delete(dir);
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
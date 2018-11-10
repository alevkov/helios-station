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
          console.log(path.extname(addedFilePath));
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
    const crop_x = Number.parseFloat(settings.get(`photo.crop_x.f_${cameraNum}`));
    const crop_y = Number.parseFloat(settings.get(`photo.crop_y.f_${cameraNum}`));
    const crop_w = Number.parseFloat(settings.get(`photo.crop_w.f_${cameraNum}`));
    const crop_h = Number.parseFloat(settings.get(`photo.crop_h.f_${cameraNum}`));
    const resize_w = Number.parseFloat(settings.get(`photo.resize_w.f_${cameraNum}`));
    const resize_h = Number.parseFloat(settings.get(`photo.resize_h.f_${cameraNum}`));
    const rotate = Number.parseFloat(settings.get(`photo.rotate.f_${cameraNum}`))
    console.log([crop_x, crop_y, crop_w, crop_h, resize_h, resize_w]);
    gm(dir)
        .rotate('white', rotate)
        .crop(crop_w, crop_h, crop_x, crop_y)
        .resize(resize_w, resize_h)
        .write(dir, err => {
          if (err) {
            console.log('Error! ' + err);
          } else {
            moveFile(dir, destination)
              .then(() => {
                console.log(filename + ' moved to ' + destination);
              });
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
      ipcRenderer.on('media-error', (event, arg) => {  
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
}
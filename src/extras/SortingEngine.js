import { 
  emitter,
  settings,
  EVENT_SOURCE_FOLDER_SELECTED,
  EVENT_PHOTO_ADDED,
  EVENT_PHOTO_REMOVED,
  getInt,
  getFloat
} from '../common';
import ImageProcessor from './ImageProcessor';

const { ipcRenderer, remote } = window.require('electron');
const choker = remote.require('chokidar');
const path = require('path');
const fs = remote.require('fs-extra');
const stream = remote.require('stream');
const os = window.require('os');

export default class SortingEngine {
  // dirs
  static SourceDir = null;
  static SortDir = null;
  static MediaDir = null;
  static SortDirMap = new Map(); // [string: Set<string>]
  static DirWatchMap = new Map(); // [string: Watcher]
  static IsCreatingMedia = false;

  constructor(source, sort, media) {
    SortingEngine.SourceDir = source;
    SortingEngine.SortDir = sort;
    SortingEngine.MediaDir = media;
    // emit source folder event for subscribing components
    emitter.emit(EVENT_SOURCE_FOLDER_SELECTED, SortingEngine.SourceDir);
    this.initWatchDir('source', SortingEngine.SourceDir);
    console.log('media dir: ' + SortingEngine.MediaDir);
    this.initWatchDir('media', SortingEngine.MediaDir);
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
      // e.g. SortDir/000/
      // this is the "shot number"
      case 'index': {
        const filename = dir.replace(/^.*[\\\/]/, '');
        const index = filename.split('_')[0];
        if (!fs.existsSync(dir)) {
          if (SortingEngine.DirWatchMap.get(dir)) {
            SortingEngine.DirWatchMap.get(dir).close();
            SortingEngine.DirWatchMap.delete(dir);
          }
          fs.mkdirSync(dir);
          fs.mkdirSync(`${dir}-backup`)
        }
        if (!SortingEngine.DirWatchMap.get(dir)) {
          SortingEngine.SortDirMap.set(index, new Set());
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
          SortingEngine.DirWatchMap.set(dir, indexPathWatcher);
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
    const indexPath = SortingEngine.SortDir +
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
    const processor = new ImageProcessor();
    processor.get()(dir).write(backupDestination, err => {
      processor.get()(backupDestination)
      // xform: zoom -> rotate abt center -> crop
      .command('convert')
      .in('-resize', `${zoom}%`)
      .in('-distort', 'SRT', `${rotate}`)
      .in('-crop', `${cropW}x${cropH}+${cropOffsetX}+${cropOffsetY}`)
      .stream()
      .pipe(passThrough)
      if (applyLogo) {
        let str = processor.get()(passThrough)
        .composite(logoDir)
        .geometry(`+${logoX}+${logoY}`)
        .stream()
        passThrough = new stream.PassThrough();
        str.pipe(passThrough)
      }
      if (applyOverlay) {
        let str = processor.get()(passThrough)
        .composite(overlayFrames[cameraNum-1])
        .geometry(`${cropW}x${cropH}+0+0`)
        .stream()
        passThrough = new stream.PassThrough();
        str.pipe(passThrough)
      }
      const boomerang = Boolean(settings.get('media.boomerang'));
      console.log(boomerang);
      processor.get()(passThrough)
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
    SortingEngine.SortDirMap.get(index).add(dir);
    const maxNum = getInt('media.frames');
    console.log('frame ' + SortingEngine.SortDirMap.get(index).size + ' out of ' + maxNum);
    if (SortingEngine.SortDirMap.get(index).size === maxNum) {
      let staticFrame = Array.from(SortingEngine.SortDirMap.get(index))[SortingEngine.SortDirMap.get(index).size / 2];
      SortingEngine.IsCreatingMedia = true;
      let frames = Array.from(SortingEngine.SortDirMap.get(index));
      console.log('About to generate gif...');
      ipcRenderer.send('generate-media', frames);
      ipcRenderer.once('media-reply', (event, arg) => {
        settings.set(`static.${arg}`, staticFrame);
        emitter.emit(EVENT_PHOTO_ADDED, {full: arg, static: staticFrame});
      });
    }
  }

  onMediaAdded = dir => {
    console.log('SortingEngine: media added: ' + dir);
    if (!SortingEngine.IsCreatingMedia) {
      if (settings.has(`static.${dir}`)) {
        emitter.emit(EVENT_PHOTO_ADDED, {full: dir, static: settings.get(`static.${dir}`)});
      }
    }
  }

  onSortedPhotoRemoved = (index, dir) => {
    console.log(`Removed ${dir}, ${index}`);
    SortingEngine.SortDirMap.get(index).delete(dir);
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
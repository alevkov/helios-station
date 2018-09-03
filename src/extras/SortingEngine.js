import { 
  emitter,
  settings,
  EVENT_SOURCE_FOLDER_SELECTED,
  EVENT_PHOTO_ADDED,
  EVENT_PHOTO_REMOVED
} from '../common';
import MediaEngine from './MediaEngine';
import ImageProcessor from './ImageProcessor';
import CloudInterface from './CloudInterface';

const electron = window.require('electron');
const choker = electron.remote.require('chokidar');
const moveFile = electron.remote.require('move-file');
const fs = electron.remote.require('fs');
const os = window.require('os');

export default class SortingEngine {
  // dirs
  static _sourceDir = null;
  static _sortDir = null;
  static _mediaDir = null;
  static _sortDirMap = new Map(); // [string: Set<string>]
  static _dirWatchSet = new Set() // [string: bool]

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
        console.log(sourceWatcher);
        // when a file is added, send event to subs
        sourceWatcher.on('add', path => {
          this.onSourcePhotoAdded(path);
        });
        break;
      }
      // e.g. _sortDir/000/
      case 'index': {
        const filename = dir.replace(/^.*[\\\/]/, '');
        const index = filename.split('_')[0];
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir);
        }
        if (SortingEngine._dirWatchSet.has(dir) === false) {
          SortingEngine._sortDirMap.set(index, new Set());
          const indexPathWatcher = choker.watch(watchGlob, {
            ignored: /(^|[\/\\])\../,
            persistent: true
          });
          indexPathWatcher.on('add', path => {
            this.onSortedPhotoAdded(index, path);
          });
          indexPathWatcher.on('unlink', path => {
            this.onSortedPhotoRemoved(index, path);
          });  
          SortingEngine._dirWatchSet.add(dir);    
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
        mediaWatcher.on('add', path => {
          console.log('FILE ADDED!!!!');
          this.onMediaAdded(path);
        });
        mediaWatcher.on('unlink', path => {
          this.onMediaRemoved(path);
        });
        break;
      }
      default: {
        break;
      }
    }
  }

  onSourcePhotoAdded = path => {
    console.log('file added!');
    const filename = path.replace(/^.*[\\\/]/, '');
    const index = filename.split('_')[0];
    const camera = filename.split('_')[1].split('.')[0];
    const indexPath = SortingEngine._sortDir +
      (os.platform() === 'darwin' ? '/' : '\\') +
      index;
    // start watching index path
    this.initWatchDir('index', indexPath);
    // move photo to index path
    const destination = indexPath + 
      (os.platform() === 'darwin' ? '/' : '\\') +
      filename
    // Appy effects before moving
    const cloud = new CloudInterface();
    const proc = new ImageProcessor();
    const focalParams = proc.effectParamsFromSettings(
      'focal', Number.parseInt(index), Number.parseInt(camera));
    const scaleParams = proc.effectParamsFromSettings(
      'scale', Number.parseInt(index), Number.parseInt(camera));
    const cropParams = proc.effectParamsFromSettings(
      'crop');
    cloud.uploadSource(path)
      .then(location => {
        console.log('applying focal to ' + path);
        proc.doImgixEffect(focalParams, path)
          .then(image => {
            // console.log('applying scale to ' + path);
            // const scaled = proc.doEffect(scaleParams, image);
            console.log('applying crop to ' + path);
            const cropped = proc.doEffect(cropParams, image);
            proc.writeImage(cropped, path)
              .then(() => {
                console.log('wrote new image to ' + path);
                moveFile(path, destination)
                .then(() => {
                  console.log(filename + ' moved to ' + destination);
                });
              });
          });
        });
  }

  // effects must be already applied at this point
  onSortedPhotoAdded = (index, path) => {
    SortingEngine._sortDirMap.get(index).add(path);
    const maxNum = Number.parseInt(settings.get('media.frames'));
    if (SortingEngine._sortDirMap.get(index).size == maxNum) {
      let frames = Array.from(SortingEngine._sortDirMap.get(index));
      const mediaEngine = new MediaEngine(frames);
      mediaEngine.generate('gif');
    }
  }

  onMediaAdded = path => {
    console.log('SortingEngine: media added: ' + path);
    emitter.emit(EVENT_PHOTO_ADDED, path);
  }

  onSortedPhotoRemoved = (index, path) => {
    //emitter.emit(EVENT_PHOTO_REMOVED, path);
  }

  onMediaRemoved = path => {
    emitter.emit(EVENT_PHOTO_REMOVED, path);
  }
}
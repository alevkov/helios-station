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
const path = electron.remote.require('path');
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
        sourceWatcher.on('add', dir => {
          console.log(path.extname(dir));
          if (path.basename(dir) === '.DS_Store') {
            return;
          }
          if (path.extname(dir) === '.jpg' || path.extname(dir) === '.JPG') {
            this.onSourcePhotoAdded(dir);
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
          fs.mkdirSync(dir);
        }
        if (SortingEngine._dirWatchSet.has(dir) === false) {
          SortingEngine._sortDirMap.set(index, new Set());
          const indexPathWatcher = choker.watch(watchGlob, {
            ignored: /(^|[\/\\])\../,
            persistent: true
          });
          indexPathWatcher.on('add', dir => {
            if (path.basename(dir) === '.DS_Store') {
              return;
            }
            this.onSortedPhotoAdded(index, dir);
          });
          indexPathWatcher.on('unlink', dir => {
            if (path.basename(dir) === '.DS_Store') {
              return;
            }
            this.onSortedPhotoRemoved(index, dir);
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
        mediaWatcher.on('add', dir => {
          console.log('FILE ADDED!!!!');
          if (path.basename(dir) === '.DS_Store') {
            return;
          }
          this.onMediaAdded(dir);
        });
        mediaWatcher.on('unlink', dir => {
          this.onMediaRemoved(dir);
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
    const indexPath = SortingEngine._sortDir +
      (os.platform() === 'darwin' ? '/' : '\\') +
      index;
    // start watching index dir
    this.initWatchDir('index', indexPath);
    // move photo to index dir
    const destination = indexPath + 
      (os.platform() === 'darwin' ? '/' : '\\') +
      filename
    const cloud = new CloudInterface();
    // Appy effects before moving
    const proc = new ImageProcessor();
    const focalParams = proc.effectParamsFromSettings(
      'focal', Number.parseInt(index), Number.parseInt(camera));
    /*
    const scaleParams = proc.effectParamsFromSettings(
      'scale', Number.parseInt(index), Number.parseInt(camera));
    */
    const cropParams = proc.effectParamsFromSettings(
      'crop');
    // upload the source
    cloud.uploadSource(dir)
      .then(location => {
        console.log('applying focal to ' + dir);
        proc.doImgixEffect(focalParams, dir)
          .then(image => {
            // console.log('applying scale to ' + dir);
            // const scaled = proc.doEffect(scaleParams, image);
            console.log('applying crop to ' + dir);
            const cropped = proc.doEffect(cropParams, image);
            proc.writeImage(cropped, dir)
              .then(() => {
                console.log('wrote new image to ' + dir);
                moveFile(dir, destination)
                .then(() => {
                  console.log(filename + ' moved to ' + destination);
                });
              });
          });
        })
      .catch(err => {
        console.log('Failed uploading source: ' + dir);
        console.log(err);
      });
  }

  // effects must be already applied at this point
  onSortedPhotoAdded = (index, dir) => {
    SortingEngine._sortDirMap.get(index).add(dir);
    const maxNum = Number.parseInt(settings.get('media.frames'));
    if (SortingEngine._sortDirMap.get(index).size == maxNum) {
      let frames = Array.from(SortingEngine._sortDirMap.get(index));
      const mediaEngine = new MediaEngine(frames);
      mediaEngine.generate('gif');
    }
  }

  onMediaAdded = dir => {
    console.log('SortingEngine: media added: ' + dir);
    emitter.emit(EVENT_PHOTO_ADDED, dir);
  }

  onSortedPhotoRemoved = (index, dir) => {
    //emitter.emit(EVENT_PHOTO_REMOVED, dir);
  }

  onMediaRemoved = dir => {
    emitter.emit(EVENT_PHOTO_REMOVED, dir);
  }
}
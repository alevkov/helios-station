import { emitter,
  EVENT_SOURCE_FOLDER_SELECTED,
  EVENT_PHOTO_ADDED,
  EVENT_PHOTO_REMOVED
} from '../common';
import MediaEngine from './MediaEngine';

const electron = window.require('electron');
const settings = electron.remote.require('electron-settings');
const choker = electron.remote.require('chokidar');
const moveFile = electron.remote.require('move-file');
const fs = electron.remote.require('fs');
const os = window.require('os');

export default class SortingEngine {
  // dirs
  static _sourceDir = null;
  static _sortDir = null;
  static _sortDirMap = new Map(); // [string: Set<string>]
  static _dirWatchSet = new Set() // [string: bool]

  constructor(source, sort) {
    //TODO: delete this shit
    // let gifSettings = {
    //   frames: 4
    // };
    //settings.set('gif', gifSettings);
    // init dir strings
    SortingEngine._sourceDir = source;
    SortingEngine._sortDir = sort;
    // emit source folder event for subscribing components
    emitter.emit(EVENT_SOURCE_FOLDER_SELECTED, SortingEngine._sourceDir);
    this.initWatchDir('source', SortingEngine._sourceDir);
  }

  initWatchDir = (type, dir) => {
    // initialize dir string to watch
    let watchGlob = null;
    // set the watch dir according to OS
    if (os.platform() === 'darwin') {
      watchGlob = dir + '/*.jpg';
    } else {
      watchGlob = dir + '\\*.jpg'
    }
    console.log(watchGlob);
    switch (type) {
      case 'source': {   
        // watch the source dir
        const sourceWatcher = choker.watch(watchGlob, {
          ignored: /(^|[\/\\])\../,
          persistent: true
        });
        // when a file is added, send event to subs
        sourceWatcher.on('add', path => {
          this.onSourcePhotoAddedHandler(path);
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
            this.onSortedPhotoAddedHandler(index, path);
          });
          indexPathWatcher.on('unlink', path => {
            this.onSortedPhotoRemovedHandler(index, path);
          });  
          SortingEngine._dirWatchSet.add(dir);    
        }
        break;
      }
      default: {
        break;
      }
    }
  }

  onSourcePhotoAddedHandler = path => {
    const filename = path.replace(/^.*[\\\/]/, '');
    const index = filename.split('_')[0];
    const indexPath = SortingEngine._sortDir +
      (os.platform() === 'darwin' ? '/' : '\\') +
      index;
    // start watching index path
    this.initWatchDir('index', indexPath);
    // move photo to index path
    const destination = indexPath + 
      (os.platform() === 'darwin' ? '/' : '\\') +
      filename
    moveFile(path, destination)
    .then(() => {
      console.log(filename + ' moved.');
    });
  }

  onSortedPhotoAddedHandler = (index, path) => {
    emitter.emit(EVENT_PHOTO_ADDED, path);
    SortingEngine._sortDirMap.get(index).add(path);
    const maxNum = Number.parseInt(settings.get('gif.frames'));
    if (SortingEngine._sortDirMap.get(index).size == maxNum) {
      let frames = Array.from(SortingEngine._sortDirMap.get(index));
      const mediaEngine = new MediaEngine(frames);
      mediaEngine.generate('gif');
    }
  }

  onSortedPhotoRemovedHandler = (index, path) => {
    emitter.emit(EVENT_PHOTO_REMOVED, path);
  }
}
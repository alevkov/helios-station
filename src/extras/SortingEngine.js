import { emitter,
  EVENT_SOURCE_FOLDER_SELECTED,
  EVENT_PHOTO_ADDED,
  EVENT_PHOTO_REMOVED
} from '../common';

const electron = window.require('electron'); 
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
    // set up class methods
    this.routePhoto = this.routePhoto.bind(this);
    this.onSourcePhotoAddedHandler = this.onSourcePhotoAddedHandler.bind(this);
    this.initWatchDir = this.initWatchDir.bind(this);
    this.onSourcePhotoRemovedHandler = this.onSourcePhotoRemovedHandler.bind(this);
    this.onSortedPhotoAddedHandler = this.onSortedPhotoAddedHandler.bind(this);
    this.onSortedPhotoRemovedHandler = this.onSortedPhotoRemovedHandler.bind(this);
    // init dir strings
    SortingEngine._sourceDir = source;
    SortingEngine._sortDir = sort;
    // emit source folder event for subscribing components
    emitter.emit(EVENT_SOURCE_FOLDER_SELECTED, SortingEngine._sourceDir);
    this.initWatchDir('source', SortingEngine._sourceDir);
  }

  initWatchDir(type, dir) {
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
        sourceWatcher.on('unlink', path => {
          this.onSourcePhotoRemovedHandler(path);
        })
        break;
      }
      // e.g. _sortDir/000/
      case 'index': {
        //TODO: handle when index folder already exists
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir);
          const filename = dir.replace(/^.*[\\\/]/, '');
          const index = filename.split('_')[0];
          SortingEngine._sortDirMap.set(index, new Set());
        }
        if (SortingEngine._dirWatchSet.has(dir) === false) {
          const indexPathWatcher = choker.watch(watchGlob, {
            ignored: /(^|[\/\\])\../,
            persistent: true
          });
          indexPathWatcher.on('add', path => {
            this.onSortedPhotoAddedHandler(path);
          });
          indexPathWatcher.on('unlink', path => {
            this.onSortedPhotoRemovedHandler(path);
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

  onSourcePhotoAddedHandler(path) {
    const filename = path.replace(/^.*[\\\/]/, '');
    const index = filename.split('_')[0];
    const indexPath = SortingEngine._sortDir +
      (os.platform() === 'darwin' ? '/' : '\\') +
      index;
    // start watching index path
    this.initWatchDir('index', indexPath);
    // move photo to index path
    moveFile(path, 
      indexPath + (os.platform() === 'darwin' ? '/' : '\\') +
      filename)
    .then(() => {
      console.log(filename + ' moved.');
    });
  }

  onSourcePhotoRemovedHandler(path) {
    
  }

  onSortedPhotoAddedHandler(path) {
    emitter.emit(EVENT_PHOTO_ADDED, path);
  }

  onSortedPhotoRemovedHandler(path) {
    emitter.emit(EVENT_PHOTO_REMOVED, path);
  }

  routePhoto(path) {

  }
}
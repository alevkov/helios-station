import { emitter,
  EVENT_SOURCE_FOLDER_SELECTED,
  EVENT_PHOTO_ADDED,
} from '../common';

const electron = window.require('electron'); 
const choker = electron.remote.require('chokidar');
const fs = electron.remote.require('fs');
const os = window.require('os');

export default class SortingEngine {
  
  // dirs
  static _sourceDir = null;
  static _sortDir = null;

  constructor(source, sort) {
    // set up class methods
    this.routePhoto = this.routePhoto.bind(this);
    this.onPhotoAddedHandler = this.onPhotoAddedHandler.bind(this);

    // init dir strings
    SortingEngine._sourceDir = source;
    SortingEngine._sortDir = sort;
    // emit source folder event
    emitter.emit(EVENT_SOURCE_FOLDER_SELECTED, SortingEngine._sourceDir);
    // initialize dir string to watch
    let watchGlob = null;
    // set the watch dir according to OS
    if (os.platform() === 'darwin') {
      watchGlob = SortingEngine._sourceDir + '/**/*.jpg';
    } else {
      watchGlob = SortingEngine._sourceDir + '\\**\\*.jpg'
    }
    // watch the source dir
    const watcher = choker.watch(watchGlob, {
      ignored: /(^|[\/\\])\../,
      persistent: true
    });
    // when a file is added, send event to Home
    watcher.on('add', path => {
      this.onPhotoAddedHandler(path);
    });
  }

  onPhotoAddedHandler(path) {
    emitter.emit(EVENT_PHOTO_ADDED, path);
    console.log(path);
  }

  routePhoto(path) {

  }

  // methods
}
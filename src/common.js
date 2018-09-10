import ImageProcessor from './extras/ImageProcessor';

const { EventEmitter } = require('fbemitter');
const electron = window.require('electron'); 

export const emitter = new EventEmitter();

// Event Codes
export const EVENT_SOURCE_FOLDER_SELECTED = 'kSourceFolderSelectedEvent';
export const EVENT_PHOTO_ADDED = 'kPhotoAddedEvent';
export const EVENT_FRAME_ADDED = 'kFrameAddedEvent';
export const EVENT_PHOTO_REMOVED = 'kPhotoRemovedEvent';

// Settings
export const settings = electron.remote.require('electron-settings');

export const setIfNot = (key, value) => {
  if (settings.get(key) === undefined) settings.set(key, value);
}

// Defaults
setIfNot('event.name', 'abc');
setIfNot('event.station', 1);
setIfNot('event.shots', 1); // number of shots
setIfNot('media.width', 100);
setIfNot('media.height', 100);
setIfNot('media.frames', 10);
setIfNot('media.fps', 10);
setIfNot('media.boomerang', true);
setIfNot('media.format', 'gif');
setIfNot('media.filter', ImageProcessor.imgixFilters[0]);
setIfNot('photo.frame', 1);
setIfNot('photo.shot', 0); // selected shot
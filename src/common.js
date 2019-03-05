import ImageProcessor from './extras/ImageProcessor';

const { EventEmitter } = require('fbemitter');
const electron = window.require('electron'); 
const os = require('os');

export const emitter = new EventEmitter();

// Event Codes
export const EVENT_SOURCE_FOLDER_SELECTED = 'kSourceFolderSelectedEvent';
export const EVENT_PHOTO_ADDED = 'kPhotoAddedEvent';
export const EVENT_FRAME_ADDED = 'kFrameAddedEvent';
export const EVENT_PHOTO_REMOVED = 'kPhotoRemovedEvent';
export const EVENT_GALLERY_REFRESH = 'kGalleryRefreshed';

// Settings
export const settings = electron.remote.require('electron-settings');

export const setIfNot = (key, value) => {
  if (settings.get(key) === undefined) settings.set(key, value);
}

export const getInt = key => {
  return Number.parseInt(settings.get(key), 10);
}

export const getFloat = key => {
  return Number.parseFloat(settings.get(key));
}

export const getStr = key => {
  return `${settings.get(key)}`;
}

export const getBool = key => {
  return Boolean(settings.get(key));
}

export const getDelim = () => {
 return os.platform() === 'darwin' ? '/' : '\\';
}

// Defaults
setIfNot('event.name', 'abc');
setIfNot('event.station', 1);
setIfNot('media.width', 100);
setIfNot('media.height', 100);
setIfNot('media.frames', 10);
setIfNot('media.fps', 10);
setIfNot('media.boomerang', true);
setIfNot('media.format', 'gif');
setIfNot('media.filter', ImageProcessor.imgixFilters[0]);
setIfNot('photo.frame', 1);
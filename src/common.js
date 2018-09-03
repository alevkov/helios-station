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

// Defaults
if (settings.get('event.shots') === undefined) settings.set('event.shots', 1); // number of shots
if (settings.get('photo.crop-x') === undefined) settings.set('photo.crop-x', 0);
if (settings.get('photo.crop-y') === undefined) settings.set('photo.crop-y', 0);
if (settings.get('photo.crop-w') === undefined) settings.set('photo.crop-w', 100);
if (settings.get('photo.crop-h') === undefined) settings.set('photo.crop-h', 100);
if (settings.get('event.name') === undefined) settings.set('event.name', 'abc');
if (settings.get('event.station') === undefined) settings.set('event.station', 1);
if (settings.get('media.width') === undefined) settings.set('media.width', 100);
if (settings.get('media.height') === undefined) settings.set('media.height', 100);
if (settings.get('media.frames') === undefined) settings.set('media.frames', 10);
if (settings.get('media.fps') === undefined) settings.set('media.fps', 10);
if (settings.get('media.boomerang') === undefined) settings.set('media.boomerang', true);
if (settings.get('media.format') === undefined) settings.set('media.format', 'gif');
if (settings.get('photo.frame') === undefined) settings.set('photo.frame', 1);
if (settings.get('photo.shot') === undefined) settings.set('photo.shot', 0); // selected shot
const {EventEmitter} = require('fbemitter');

export const emitter = new EventEmitter();

// Event Codes
export const EVENT_SOURCE_FOLDER_SELECTED = 'kSourceFolderSelectedEvent';
export const EVENT_PHOTO_ADDED = 'kPhotoAddedEvent';
export const EVENT_FRAME_ADDED = 'kFrameAddedEvent';
export const EVENT_PHOTO_REMOVED = 'kPhotoRemovedEvent';
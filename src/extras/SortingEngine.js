import { emitter,
  EVENT_PHOTO_ADDED,
} from '../common';

export default class SortingEngine {

  // sub sandwhiches
  static _PhotoAddedSub = null;

  // paths
  static _destinationPath = null;

  constructor(path) {
    this.routePhoto = this.routePhoto.bind(this);
    this.onPhotoAddedHandler = this.onPhotoAddedHandler.bind(this);

    SortingEngine._destinationPath = path;
    if (SortingEngine._PhotoAddedSub === null) {
      SortingEngine._PhotoAddedSub = emitter.addListener(EVENT_PHOTO_ADDED,
       this.onPhotoAddedHandler);
    }
  }

  onPhotoAddedHandler(...args) {
    const path = args[0];
    console.log('eyo');
  }

  routePhoto(path) {

  }

  // methods
}
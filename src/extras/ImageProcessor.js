const Jimp = window.require('jimp');
const electron = window.require('electron'); 
const settings = electron.remote.require('electron-settings');

export default class ImageProcessor {
  constructor() {

  }

  reset = (images) => {
    const items = images.map((item, i) => {
      item.src = 'file://' + item.actual;
      item.modified = null;
      return item;
    })
    return items;
  }

  applyImgixEffect = async (params, toImages) => {
    let newItems = [];
    for (let i = 0; i < toImages.length; i++) {
      const url = this.getImgUrl(toImages[i]);
      const urlParams = this.imgixEffectParams(params);
      const effected = await Jimp.read(url + urlParams);
      const filepath = this.getFilePath(toImages[i]);
      const filename = filepath.replace(/^.*[\\\/]/, '');
      const index = filename.split('_')[0];
      const destPath = settings.get('dir.sort') + 
        '/' + index + '/' + 'proc' + '/'+ filename;
      await effected.writeAsync(destPath);
      const newItem = toImages[i];
      newItem.src = 'file://' + destPath + '?t=' + new Date().getTime();
      newItem.modified = destPath;
      newItems.push(newItem);
    }
    return newItems;
  }

  applyEffect = async (params, toImages) => {
    let newItems = [];
    for (let i = 0; i < toImages.length; i++) {
      const filepath = this.getFilePath(toImages[i]);
      // read img with JIMP
      const image = await Jimp.read(filepath);
      // apply effect
      const effected = this.imageWithEffect(image, params);
      // get filename
      const filename = filepath.replace(/^.*[\\\/]/, '');
      // get camera name
      const index = filename.split('_')[0];
      // get destination path
      const destPath = settings.get('dir.sort') + 
        '/' + index + '/' + 'proc' + '/'+ filename;
      // write to destination
      await effected.writeAsync(destPath);
      // modify image structure to point src to modified file
      const newItem = toImages[i];
      // add date to force img reload
      newItem.src = 'file://' + destPath + '?t=' + new Date().getTime();
      newItem.modified = destPath;
      newItems.push(newItem);
    }
    return newItems;
  }

  getFilePath = (imageObj) => {
    const filepath = imageObj.modified === null ?
      imageObj.actual : imageObj.modified;
    return filepath;
  }

  getImgUrl = (imageObj) => {
    const filepath = this.getFilePath(imageObj);
    const filename = filepath.replace(/^.*[\\\/]/, '');
    const url = 'https://helios-microsite.imgix.net/' +
      settings.get('event.name') + '/' + filename;
    return url;
  }

  imageWithEffect = (image, params) => {
    switch (params.type) {
      case 'crop': {
        return image.crop(
          params.values.x,
          params.values.y,
          params.values.w, 
          params.values.h
        );
      }
      case 'grayscale': {
        return image.grayscale();
      }
      case 'sepia': {
        return image.sepia();
      }
      case 'displace': {
        return image.displace(
          params.values.map,
          params.values.offset
        );
      }
      case 'scale': {
        return image.scale(params.values.scale / 100);
      }
      default: {
        return null;
      }
    }
  }

  imgixEffectParams = (params) => {
    switch (params.type) {
      case 'focal': {
        const urlParams = 
          `?fit=crop&crop=focalpoint&fp-x=${params.values.fp_x}&fp-y=${params.values.fp_y}&fp-z=${params.values.fp_z}`
        console.log(urlParams);
        return urlParams;
        break;
      }
      default: {
        break;
      }
    }
  }

  effectParamsFromSettings = (effect, index=null, camera=null) => {
    switch (effect) {
      case 'crop': {
        return {
          type: effect,
          values: {
            x: Number.parseInt(settings.get('photo.crop-x')),
            y: Number.parseInt(settings.get('photo.crop-y')),
            w: Number.parseInt(settings.get('photo.crop-w')),
            h: Number.parseInt(settings.get('photo.crop-h'))
          }
        };
      }
      case 'focal': {
        return {
          type: 'focal',
          values: {
            fp_x: Number.parseFloat(settings.get(
              'photo.fp_x_' + index + '_' + camera)
            ),
            fp_y: Number.parseFloat(settings.get(
              'photo.fp_y_' + index + '_' + camera)
            ),
            fp_z: Number.parseFloat(settings.get(
              'photo.fp_z_' + index + '_' + camera)
            )
          }
        }
      }
      case 'scale': {
        return {
          type: 'scale',
          values: {
            scale: Number.parseFloat(
                Number.parseFloat(
                  settings.get('photo.scale_' + index + '_' + camera)
                ) / 100
              )
          }
        }
      }
      default: {
        break;
      }
    }
  }
}
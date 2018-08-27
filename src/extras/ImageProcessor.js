const Jimp = window.require('jimp');
const electron = window.require('electron'); 
const settings = electron.remote.require('electron-settings');

export default class ImageProcessor {

  reset = (images) => {
    const items = images.map((item, i) => {
      item.src = 'file://' + item.actual;
      return item;
    })
    return items;
  }

  doImgixEffect = async (params, path) => {
    const url = this.getImgUrl(path);
    const urlParams = this.imgixEffectParams(params);
    return Jimp.read(url + urlParams);
  }

  doEffect = (params, image) => {
    return this.imageWithEffect(image, params);
  }

  writeImage = async (image, destination) => {
    await image.writeAsync(destination);
  }

  getImgUrl = (path) => {
    const filename = path.replace(/^.*[\\\/]/, '');
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
        const fp_x = params.values.fp_x;
        const fp_y = params.values.fp_y;
        const fp_z = params.values.fp_z;
        const urlParams = 
          `?fit=crop&crop=focalpoint&fp-x=${fp_x}&fp-y=${fp_y}&fp-z=${fp_z}`
        console.log(urlParams);
        return urlParams;
      }
      default: {
        break;
      }
    }
  }

  effectParamsFromSettings = (effect, index=null, camera=null) => {
    let params = {
      type: effect,
      values: null
    };
    switch (effect) {
      case 'crop': {
        params.values = {
          x: Number.parseInt(settings.get('photo.crop-x')),
          y: Number.parseInt(settings.get('photo.crop-y')),
          w: Number.parseInt(settings.get('photo.crop-w')),
          h: Number.parseInt(settings.get('photo.crop-h'))
        }
        console.log('got params for crop:');
        console.log(params);
        return params;
      }
      case 'focal': {
        params.values = {
          fp_x: Number.parseFloat(settings.get(
            'photo.fp_x_' + index + '_' + camera)
          ),
          fp_y: Number.parseFloat(settings.get(
            'photo.fp_y_' + index + '_' + camera)
          ),
          fp_z: Number.parseFloat(settings.get(
            'photo.fp_z_' + index + '_' + camera) / 100.0
          )
        }
        console.log('got params for focal:');
        console.log(params);
        return params;
      }
      case 'scale': {
        params.values = {
          scale: Number.parseFloat(
            Number.parseFloat(
              settings.get('photo.scale_' + index + '_' + camera)
            ) / 100
          )
        }
        console.log('got params for scale:');
        console.log(params);
        return params;
      }
      default: {
        break;
      }
    }
  }
}
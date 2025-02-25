import React from 'react';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Checkbox from '@material-ui/core/Checkbox';
import Select from 'react-select';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import { 
  settings,
  setIfNot,
  getInt, 
  getFloat 
} from '../../common';
import '../../styles/Adjuster.css';

const { dialog } = window.require('electron').remote; 

export default class SelectDock extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loadedImages: {}
    };
  }

  componentDidMount() {
    this.updateCanvas();
  }

  componentDidUpdate() {
    this.updateCanvas();
  }

  getImgUrl = img => {
    if (settings.get(`dir.${img}`) === undefined) {
      return null;
    }
    return 'file://' + settings.get(`dir.${img}`)
  }

  updateCanvas = () => {
    console.log('update canvas');
    if (this.getImgUrl('full-frame') === null || this.getImgUrl('ref-frame') === null) {
      return;
    }
    // get params
    const canvasZoomScalar = getFloat(`canvas.zoom`) / 100;
    const fullW = canvasZoomScalar * getInt(`photo.full_w`);
    const fullH = canvasZoomScalar * getInt(`photo.full_h`);
    const cropDeltaX = canvasZoomScalar * getInt(`photo.crop_delta_x.f_${this.props.selectedFrame.value}`);
    const cropDeltaY = canvasZoomScalar * getInt(`photo.crop_delta_y.f_${this.props.selectedFrame.value}`);
    const zoomScalar =  getFloat(`photo.zoom.f_${this.props.selectedFrame.value}`) / 100;
    const cropW = canvasZoomScalar * getInt(`photo.crop_w`);
    const cropH = canvasZoomScalar * getInt(`photo.crop_h`);
    const rotate = getFloat(`photo.rotate.f_${this.props.selectedFrame.value}`);
    const rotateRad = rotate * Math.PI / 180;
    const showAdjustOverlay = settings.get('canvas.adjustFrameOn');
    const adjustOpacity = getFloat(`canvas.adjustOpacity`);
    const referenceOpacity = getFloat(`canvas.referenceOpacity`);

    console.log([canvasZoomScalar, fullW, fullH, cropDeltaX, cropDeltaY]);
    console.log([zoomScalar, cropW, cropH, rotateRad]);

    // calculate crop frame offsets
    const cropOffsetX = cropDeltaX;
    const cropOffsetY = cropDeltaY;
    
    console.log([cropOffsetX, cropOffsetY]);

    const that = this;
    // load images and display in canvas
    Promise.all(this.loadImages()).then(() => {
      const ctx = that.refs.canvas.getContext('2d');
      let full = that.state.loadedImages[that.getImgUrl('full-frame')]
      let ref = that.state.loadedImages[that.getImgUrl('ref-frame')]
      ctx.save();
      // create outer rect
      ctx.clearRect(0, 0, this.refs.canvas.width, this.refs.canvas.height);
      // move to center
      ctx.translate(
        fullW * zoomScalar / 2, 
        fullH * zoomScalar / 2
      )
      // rotate about center
      ctx.rotate(rotateRad);
      ctx.translate(
        -(fullW * zoomScalar / 2), 
        -(fullH * zoomScalar / 2)
      )
      // draw full frame
      ctx.drawImage(full, 0, 0, fullW * zoomScalar, fullH * zoomScalar);
      ctx.restore();
      if (showAdjustOverlay) {
        ctx.globalAlpha = isNaN(adjustOpacity) ? 0 : adjustOpacity;
        // draw crop frame
        ctx.drawImage(ref, cropOffsetX, cropOffsetY, cropW, cropH);
        ctx.globalAlpha = 1.0; 
        ctx.strokeStyle = '#ff0000';
        // draw bounding rect
        ctx.strokeRect(cropOffsetX, cropOffsetY, cropW, cropH);
        ctx.resetTransform();
      }
    });
  }

  loadImages = () => {
    let images = [
      this.getImgUrl('full-frame'), 
      this.getImgUrl('ref-frame')
    ];
    const that = this;
    let promiseArray = images.map(function(imgurl){
      let prom = new Promise(function(resolve,reject){
        let img = new Image();
        img.onload = function(){
            that.state.loadedImages[imgurl] = img;
            resolve();
        };
        img.src = imgurl;
      });
      return prom;
    });
    return promiseArray;
  }

  onFullFrameSelectClick = () => {
    dialog.showOpenDialog({
        properties: ['openFile']
    }, (dir) => {
        if (dir !== undefined) {
          const filename = dir[0].replace(/^.*[\\\/]/, '');
          const camera = Number.parseInt(filename.split('_')[1].split('.')[0], 10);
          this.props.onDirSelected('full-frame', dir);
          this.updateCanvas();
          this.props.onSelectChanged('photo.frame')({value: camera, label: `Frame ${camera}`});
        }
    });
  }

  onReferenceFrameSelectClick = () => {
    dialog.showOpenDialog({
        properties: ['openFile']
    }, (dir) => {
        if (dir !== undefined) {
          this.props.onDirSelected('ref-frame', dir);
          this.updateCanvas();
        }
    });
  }

  render() {
    const fullW = getInt(`photo.full_w`);
    const fullH = getInt(`photo.full_h`);
    const cropDeltaX = Number.parseInt(
      settings.get(`photo.crop_delta_x.f_${this.props.selectedFrame.value}`), 10
    );
    const cropDeltaY = Number.parseInt(
      settings.get(`photo.crop_delta_y.f_${this.props.selectedFrame.value}`), 10
    );
    const zoom = Number.parseFloat(
      settings.get(`photo.zoom.f_${this.props.selectedFrame.value}`), 10
    );
    const cropW = getInt(`photo.crop_w`);
    const cropH = getInt(`photo.crop_h`);
    const canvasZoom = getFloat(`canvas.zoom`);
    const adjustOpacity = Number.parseFloat(
      settings.get(`canvas.adjustOpacity`)
    );
    const referenceOpacity = Number.parseFloat(
      settings.get(`canvas.referenceOpacity`)
    );
    const rotate = Number.parseFloat(
      settings.get(`photo.rotate.f_${this.props.selectedFrame.value}`)
    );
    return (
      <div className="Adjuster">
        <div className='Adjuster-photo-form-frame-select'>
          <Select 
            options={this.props.frameSelectOptions()}
            value={this.props.selectedFrame}
            placeholder='Frame...'
            onChange={this.props.onSelectChanged('photo.frame')}/>
        </div>
        <div className="Adjuster-toggle-frames">
          <FormControlLabel
            control={
              <Checkbox
                checked={settings.get('canvas.referenceOn')}
                onChange={this.props.onCheckboxChanged('canvas.referenceOn')}
                value='checkedReference'/>
            }
            label='Reference'/>
          <FormControlLabel
            control={
              <Checkbox
                checked={settings.get('canvas.adjustFrameOn')}
                onChange={this.props.onCheckboxChanged('canvas.adjustFrameOn')}
                value='checkedAdjust'/>
            }
            label='Crop Frame'/>
        </div>
        <div className="Adjuster-select-media">
          <Button 
            onClick={this.onFullFrameSelectClick}
            color='primary'
            variant='contained'>
            Full Frame
          </Button>
          <Button 
            onClick={this.onReferenceFrameSelectClick}
            color='primary'
            variant='contained'>
            Reference
          </Button>
        </div>
        <div className="Adjuster-param-canvas">
          <TextField
            id='canvas-zoom'
            label='Canvas Zoom'
            onChange={this.props.onTextChanged(`canvas.zoom`)}
            value={canvasZoom}
            type='number'
            margin='normal'/>
          <TextField
            id='canvas-adjust-opacity'
            label='Crop Frame Opacity'
            onChange={this.props.onTextChanged(`canvas.adjustOpacity`)}
            value={adjustOpacity}
            type='number'
            margin='normal'/>
        </div>
        <div className="Adjuster-param-full">
          <TextField
            id='full-w'
            label='Full-Frame-W'
            onChange={this.props.onTextChanged(`photo.full_w`)}
            value={fullW}
            type='number'
            margin='normal'/>
          <TextField
            id='full-h'
            label='Full-Frame-H'
            onChange={this.props.onTextChanged(`photo.full_h`)}
            value={fullH}
            type='number'
            margin='normal'/>
        </div>
        <div className="Adjuster-param-crop">
          <TextField
            id='crop-left'
            label='Crop-Frame-W'
            onChange={this.props.onTextChanged(`photo.crop_w`)}
            value={cropW}
            type='number'
            margin='normal'/>
          <TextField
            id='crop-right'
            label='Crop-Frame-H'
            onChange={this.props.onTextChanged(`photo.crop_h`)}
            value={cropH}
            type='number'
            margin='normal'/>
        </div>
        <div className="Adjuster-param-delta">
          <TextField
            id='crop-delta-x'
            label='Crop-Delta-X'
            onChange={
              this.props.onTextChanged(
                `photo.crop_delta_x.f_${this.props.selectedFrame.value}`
              )
            }
            value={cropDeltaX}
            type='number'
            margin='normal'/>
          <TextField
            id='crop-delta-y'
            label='Crop-Delta-Y'
            onChange={
              this.props.onTextChanged(
                `photo.crop_delta_y.f_${this.props.selectedFrame.value}`
              )
            }
            value={cropDeltaY}
            type='number'
            margin='normal'/>
        </div>
        <div className="Adjuster-param-zoom">
          <TextField
            id='zoom'
            label='Zoom'
            onChange={
              this.props.onTextChanged(
                `photo.zoom.f_${this.props.selectedFrame.value}`
              )
            }
            value={zoom}
            type='number'
            margin='normal'/>
          {//TODO: add back when rotate is figured out
          <TextField
            id='rotate'
            label='Rotate'
            onChange={
              this.props.onTextChanged(
                `photo.rotate.f_${this.props.selectedFrame.value}`
              )
            }
            value={rotate}
            type='number'
            margin='normal'/>}
        </div>
        <div className="Adjuster-preview-window">
          <canvas className="" 
            ref="canvas" 
            width={fullW * ((isNaN(canvasZoom) ? 100 : canvasZoom) / 100)}
            height={fullH * ((isNaN(canvasZoom) ? 100 : canvasZoom) / 100)}/>
        </div>
      </div>
    );
  }
}
import React, { Component } from 'react';
import Button from '@material-ui/core/Button';
import ButtonToolbar from 'react-bootstrap';
import { SegmentedControl } from 'segmented-control'
import Checkbox from '@material-ui/core/Checkbox';
import TextField from '@material-ui/core/TextField';
import Menu from '@material-ui/core/Menu';
import Select from 'react-select';
import { Home } from './Home';
import MenuItem from '@material-ui/core/MenuItem';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import SortingEngine from '../extras/SortingEngine';
import ImageProcessor from '../extras/ImageProcessor';
import '../styles/Admin.css';
import { observe } from 'mobx';
import { observer } from 'mobx-react';
import { 
  emitter,
  EVENT_FRAME_ADDED
} from '../common';

// electron packages 
const electron = window.require('electron'); 
const {dialog} = window.require('electron').remote; 
const settings = electron.remote.require('electron-settings');

export const Admin = observer(class Admin extends Component {
  // sorting engine instance
  static _sortingEngine = null;
  static _FrameAddedSub = null;

  constructor(props) {
    super(props);
    this.state = {
      sourceDir: settings.get('dir.source'),
      sortDir: settings.get('dir.sort'),
      mediaDir: settings.get('dir.media'),
      selectedSegment: 'general',
      selectedFrame: {value: 1, label: 'Frame 1'}
    };
    this.initSortingEngine();
    if (Admin._FrameAddedSub=== null) {
      Home._FrameAddedSub = emitter.addListener(EVENT_FRAME_ADDED,
       this.onFrameAdded);
    }
  }

  onFrameAdded = frame => {
    console.log(frame);
  }

  // Segmented Control
  onSegmentChanged = segValue => {
    this.setState({
      selectedSegment: segValue
    });
  }

  // General Page
  onSourceFolderClick = () => {
    dialog.showOpenDialog({
        properties: ['openDirectory']
    }, (dir) => {
        if (dir !== undefined) {
          this.onDirSelected('source', dir);
          this.setState({
            sourceDir: settings.get('dir.source')
          });
        }
    });
  }

  onSortFolderClick = () => {
    dialog.showOpenDialog({
        properties: ['openDirectory']
    }, (dir) => {
        if (dir !== undefined) {
          this.onDirSelected('sort', dir);
          this.setState({
            sortDir: settings.get('dir.sort')
          });
        }
    });
  }

  onMediaFolderClick = () => {
    dialog.showOpenDialog({
        properties: ['openDirectory']
    }, (dir) => {
        if (dir !== undefined) {
          this.onDirSelected('media', dir);
          this.setState({
            mediaDir: settings.get('dir.media') 
          });
        }
    });
  }

  onLogoImageclick = frame => () => {
    dialog.showOpenDialog({
        properties: ['openFile']
    }, (dir) => {
        if (dir !== undefined) {
          this.onDirSelected('logo', dir);
          this.setState({
            sortDir: settings.get('dir.logo')
          });
        }
    });
  }

  onApplyEffectsClick = effect => () => {
    const frameIdx = this.state.selectedFrame.value - 1;
    const proc = new ImageProcessor();
    switch (effect) {
      case 'scale': {
        const paramsScale = {
          type: 'scale',
          values: {
            scale: Number.parseFloat(settings.get('photo.scale_' + this.state.selectedFrame.value))
          }
        }
        proc.applyEffect(paramsScale, [Home.o_photosList[frameIdx]])
          .then((newImages) => {
            Home.o_photosList[frameIdx] = newImages[0];
          });
        break;
      }
      case 'focal': {
        const paramsFocal ={
          type: 'focal',
          values: {
            fp_x: Number.parseFloat(settings.get('photo.fp_x_' + this.state.selectedFrame.value)),
            fp_y: Number.parseFloat(settings.get('photo.fp_y_' + this.state.selectedFrame.value)),
            fp_z: Number.parseFloat(settings.get('photo.fp_z_' + this.state.selectedFrame.value))
          }
        }
        proc.applyImgixEffect(paramsFocal, [Home.o_photosList[frameIdx]])
          .then((newImages) => {
            Home.o_photosList[frameIdx] = newImages[0];
          })
        break;
      }
      case 'crop': {
        if (settings.get('photo.crop-x') === undefined ||
            settings.get('photo.crop-y') === undefined ||
            settings.get('photo.crop-w') === undefined || 
            settings.get('photo.crop-h') === undefined) { return; }
        const paramsCrop = {
          type: 'crop',
          values: {
            x: Number.parseInt(settings.get('photo.crop-x')),
            y: Number.parseInt(settings.get('photo.crop-y')),
            w: Number.parseInt(settings.get('photo.crop-w')),
            h: Number.parseInt(settings.get('photo.crop-h'))
          }
        };
        proc.applyEffect(paramsCrop, Home.o_photosList)
          .then((newImages) => {
            Home.o_photosList.replace(newImages);
            Home.sortFrames(true);
          });
        break;
      }
      default: {
        break;
      }
    }
  }

  // Abstract 
  onDirSelected = (type, dir) => {
    settings.set('dir.' + type, dir);
  }

  onTextChanged = name => event => {
    settings.set(name, event.target.value);
    this.forceUpdate();
  }

  onCheckboxChanged = name => event => {
    settings.set(name, event.target.checked);
    this.forceUpdate();
  }

  onSelectChanged = name => option => {
    switch (name) {
      case 'event.station': {
        console.log(option);
        break;
      }
      case 'media.format': {
        console.log(option);
        break;
      }
      case 'photo.frame': {
        console.log(option.value);
        this.setState({
          selectedFrame: option
        });
        break;
      }
      default: {
        break;
      }
    }
  }

  initSortingEngine = () => {
    if (settings.get('dir.source') !== undefined &&
        settings.get('dir.sort') !== undefined &&
        settings.get('dir.media') !== undefined) {
      // initialize sorting engine
      if (Admin._sortingEngine == null) {
              Admin._sortingEngine =
        new SortingEngine(settings.get('dir.source'), settings.get('dir.sort'));
      }
    }
  }

  frameSelectOptions = () => {
      const options = [];
      const frames = Number.parseInt(settings.get('media.frames'));
      for (let i = 0; i < frames; i++) {
        const option = {value: i+1, label: `Frame ${i+1}`};
        options.push(option);
      }
      return options;
    }

  render() {
    const stationSelectOptions = [
      {value: 1, label: 'Station 1'}
    ];
    const generalSegment = () => (
      <div className='Admin-general-form'>
        <div className='Admin-general-form-1'>
          <TextField
            id='event'
            label='Event Name'
            onChange={this.onTextChanged('event.name')}
            value={settings.get('event.name')}
            margin='normal'/>
          <TextField
            id='session'
            label='Session'
            onChange={this.onTextChanged('event.session')}
            value={settings.get('event.session')}
            type='number'
            margin='normal'/>
        </div>
        <Select 
          className='Admin-general-station-select'
          placeholder='Station...'
          value={{value: 1, label: 'Station 1'}}
          options={stationSelectOptions}
          onChange={this.onSelectChanged('event.station')} />
        <div className='Admin-general-form-2'>
          <Button 
            onClick={this.onSourceFolderClick}
            color='primary'
            variant='contained'>
            Source Path
          </Button>
          <Button 
            onClick={this.onSortFolderClick}
            color='primary'
            variant='contained'>
            Sorting Path
          </Button>
          <Button 
            onClick={this.onMediaFolderClick}
            color='primary'
            variant='contained'>
            Media Path
          </Button>
        </div>
        { <h4>Source: {this.state.sourceDir}</h4> }
        { <h4>Sort: {this.state.sortDir}</h4> }
        { <h4>Media: {this.state.mediaDir}</h4> }
      </div>
    );
    const mediaSelectOptions = [
      {value: 'jpg', label: '.jpg'},
      {value: 'gif', label: '.gif'},
      {value: 'mpeg', label: '.mpeg'}
    ];
    const mediaSegment = () => (
      <div className='Admin-media-form'>
        <div className='Admin-media-form-1'>
          <TextField
            id='width'
            label='Width'
            onChange={this.onTextChanged('media.width')}
            value={settings.get('media.width')}
            type='number'
            margin='normal'/>
          <TextField
            id='height'
            label='Height'
            onChange={this.onTextChanged('media.height')}
            value={settings.get('media.height')}
            type='number'
            margin='normal'/>
        </div>
        <div className='Admin-media-form-2'>
          <TextField
            id='frames'
            label='# of Frames'
            onChange={this.onTextChanged('media.frames')}
            value={settings.get('media.frames')}
            type='number'
            margin='normal'/>
          <TextField
            id='fps'
            label='FPS'
            onChange={this.onTextChanged('media.fps')}
            value={settings.get('media.fps')}
            type='number'
            margin='normal'/>
          <FormControlLabel
            control={
              <Checkbox
                checked={settings.get('media.loop')}
                onChange={this.onCheckboxChanged('media.loop')}
                value='checkedLoop'/>
            }
            label='Loop'/>
          <FormControlLabel
            control={
              <Checkbox
                checked={settings.get('media.boomerang')}
                onChange={this.onCheckboxChanged('media.boomerang')}
                value='checkedBoomerang'/>
            }
            label='Boomerang'/>
        </div>
        <div className='Admin-media-form-3'>
          <Button
            color='primary'
            onClick={this.onLogoImageclick}
            variant='contained'>
            Logo Image
          </Button>
          <Select 
            className='Admin-media-format-select'
            placeholder='Format...'
            value={{value: 'gif', label: '.gif'}}
            onChange={this.onSelectChanged('media.format')}
            options={mediaSelectOptions} />
        </div>
      </div>
    );
    const photoSegment = () => (
      <div className='Admin-photo-form'>
        <div className='Admin-photo-form-1'>
          {Home.o_photosList.length !== 0 ?
          (<div style={{width: '800', height: '450'}} key={0}>
            <img 
              style={{maxWidth: '100%', maxHeight: '100%'}} 
              src={Home.o_photosList[this.state.selectedFrame.value-1].src} />
          </div>) : null}
        </div>
        <div className='Admin-photo-croptions'>
          <TextField
            id='crop-x'
            label='Crop-X'
            onChange={this.onTextChanged('photo.crop-x')}
            defaultValue={settings.get('photo.crop-x')}
            type='number'
            margin='normal'/>
          <TextField
            id='crop-down'
            label='Crop-Y'
            onChange={this.onTextChanged('photo.crop-y')}
            defaultValue={settings.get('photo.crop-y')}
            type='number'
            margin='normal'/>
          <TextField
            id='crop-left'
            label='Crop-W'
            onChange={this.onTextChanged('photo.crop-w')}
            defaultValue={settings.get('photo.crop-w')}
            type='number'
            margin='normal'/>
          <TextField
            id='crop-right'
            label='Crop-H'
            onChange={this.onTextChanged('photo.crop-h')}
            defaultValue={settings.get('photo.crop-h')}
            type='number'
            margin='normal'/>
          <Button
            color='primary'
            onClick={this.onApplyEffectsClick('crop')}
            variant='contained'>
            Apply
          </Button>
        </div>
        <div className='Admin-photo-form-2'>
          <Select 
            options={this.frameSelectOptions()}
            value={this.state.selectedFrame}
            placeholder='Frame...'
            onChange={this.onSelectChanged('photo.frame')}/>
        </div>
        <div className='Admin-photo-form-focal'>
          <TextField
            id='fp-x'
            label='Focal Point X'
            onChange={this.onTextChanged('photo.fp_x_' + this.state.selectedFrame.value)}
            value={settings.get('photo.fp_x_' + this.state.selectedFrame.value)}
            margin='normal'/>
          <TextField
            id='fp-y'
            label='Focal Point Y'
            onChange={this.onTextChanged('photo.fp_y_' + this.state.selectedFrame.value)}
            value={settings.get('photo.fp_y_' + this.state.selectedFrame.value)}
            type='number'
            margin='normal'/>
          <TextField
            id='fp-z'
            label='Focal Point Zoom'
            onChange={this.onTextChanged('photo.fp_z_' + this.state.selectedFrame.value)}
            value={settings.get('photo.fp_z_' + this.state.selectedFrame.value)}
            type='number'
            margin='normal'/>
          <Button
            color='primary'
            onClick={this.onApplyEffectsClick('focal')}
            variant='contained'>
            Apply
          </Button>
        </div>
        <div className='Admin-photo-form-scale'>
          <TextField
            id='scale'
            label='Scale (%)'
            onChange={this.onTextChanged('photo.scale_' + this.state.selectedFrame.value)}
            value={settings.get('photo.scale_' + this.state.selectedFrame.value)}
            margin='normal'/>
          <Button
            color='primary'
            onClick={this.onApplyEffectsClick('crop')}
            variant='contained'>
            Apply
          </Button>
        </div>
        <div className='Admin-photo-logo-image'>
          <Button
            color='primary'
            onClick={this.onLogoImageclick}
            variant='contained'>
            Logo Image
          </Button>
        </div>
      </div>
    );
    return (
      <div className='Admin'>
        <SegmentedControl
          name='oneDisabled'
          options={[
            { label: 'General', value: 'general', default: true },
            { label: 'Media', value: 'media' },
            { label: 'Photo', value: 'photo' }
          ]}
          setValue={segValue => this.onSegmentChanged(segValue)}
          style={{ width: 400, color: '#303F9F' }}/>
        { this.state.selectedSegment === 'general' ? generalSegment() : null }
        { this.state.selectedSegment === 'media' ? mediaSegment() : null }
        { this.state.selectedSegment === 'photo' ? photoSegment() : null }
      </div>
    );
  }
});

export default Admin;

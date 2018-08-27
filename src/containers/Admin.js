import React, { Component } from 'react';
import Button from '@material-ui/core/Button';
import { SegmentedControl } from 'segmented-control'
import Checkbox from '@material-ui/core/Checkbox';
import TextField from '@material-ui/core/TextField';
import Select from 'react-select';
//import { Home } from './Home';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import SortingEngine from '../extras/SortingEngine';
import '../styles/Admin.css';
import { observer } from 'mobx-react';

// electron packages 
const electron = window.require('electron'); 
const {dialog} = window.require('electron').remote; 
const settings = electron.remote.require('electron-settings');

export const Admin = observer(class Admin extends Component {
  // sorting engine instance
  static _sortingEngine = null;

  constructor(props) {
    super(props);
    this.state = {
      sourceDir: settings.get('dir.source'),
      sortDir: settings.get('dir.sort'),
      mediaDir: settings.get('dir.media'),
      selectedSegment: 'general',
      selectedFrame: {value: 1, label: 'Frame 1'},
      selectedIndex: {value: 0, label: 'Session 0'}
    };
    this.initSortingEngineIfDirsSelected();
    console.log('Admin: constructor');
    console.log('Admin: sorting engine inited: ' + Admin._sortingEngine !== null);
  }

  componentDidMount() {
    console.log('Admin: did mount');
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

  // Abstract 
  onDirSelected = (type, dir) => {
    settings.set('dir.' + type, dir);
    this.initSortingEngineIfDirsSelected();
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
      case 'photo.index': {
        console.log(option.value);
        this.setState({
          selectedIndex: option
        });
        break;
      }
      default: {
        break;
      }
    }
  }

  initSortingEngineIfDirsSelected = () => {
    if (settings.get('dir.source') !== undefined &&
        settings.get('dir.sort') !== undefined &&
        settings.get('dir.media') !== undefined) {
      // initialize sorting engine
      if (Admin._sortingEngine == null) {
              Admin._sortingEngine =
        new SortingEngine(
          settings.get('dir.source'), 
          settings.get('dir.sort'),
          settings.get('dir.media'));
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

  indexSelectOptions = () => {
    const options = [];
    const indeces = Number.parseInt(settings.get('event.session'));
    for (let i = 0; i < indeces; i++) {
      const option = {value: i, label: `Session ${i}`};
      options.push(option);
    }
    return options;
  }

  render() {
    //const frameByIdxAndCam = Home.frameByIndexAndCamera(this.state.selectedIndex.value, this.state.selectedFrame.value);
    const fp_x = settings.get('photo.fp_x_' + this.state.selectedIndex.value + '_' + this.state.selectedFrame.value);
    const fp_y = settings.get('photo.fp_y_' + this.state.selectedIndex.value + '_' + this.state.selectedFrame.value);
    const fp_z = settings.get('photo.fp_z_' + this.state.selectedIndex.value + '_' + this.state.selectedFrame.value);
    const scale = settings.get('photo.scale_' + this.state.selectedIndex.value + '_' + this.state.selectedFrame.value);
    const crop_x = settings.get('photo.crop-x');
    const crop_y = settings.get('photo.crop-y');
    const crop_w = settings.get('photo.crop-w');
    const crop_h = settings.get('photo.crop-h');

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
            label='# of Sessions'
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
                checked={/*settings.get('media.loop')*/true}
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
        {/*
        <div className='Admin-photo-form-1'>
          {frameByIdxAndCam !== undefined ?
          (<div style={{width: '800', height: '450'}} key={0}>
            <img 
              style={{maxWidth: '100%', maxHeight: '100%'}} 
              src={frameByIdxAndCam.src} />
          </div>) : null}
        </div>*/}
        <div className='Admin-photo-croptions'>
          <TextField
            id='crop-x'
            label='Crop-X'
            onChange={this.onTextChanged('photo.crop-x')}
            value={crop_x === undefined ? 0 : crop_x}
            type='number'
            margin='normal'/>
          <TextField
            id='crop-down'
            label='Crop-Y'
            onChange={this.onTextChanged('photo.crop-y')}
            value={crop_y === undefined ? 0 : crop_y}
            type='number'
            margin='normal'/>
          <TextField
            id='crop-left'
            label='Crop-W'
            onChange={this.onTextChanged('photo.crop-w')}
            value={crop_w === undefined ? 0 : crop_w}
            type='number'
            margin='normal'/>
          <TextField
            id='crop-right'
            label='Crop-H'
            onChange={this.onTextChanged('photo.crop-h')}
            value={crop_h === undefined ? 0 : crop_h}
            type='number'
            margin='normal'/>
        </div>
        <div className='Admin-photo-form-2'>
          <Select 
            options={this.frameSelectOptions()}
            value={this.state.selectedFrame}
            placeholder='Frame...'
            onChange={this.onSelectChanged('photo.frame')}/>
        </div>
        <div className='Admin-photo-index-select'>
          <Select 
            options={this.indexSelectOptions()}
            value={this.state.selectedIndex}
            placeholder='Index...'
            onChange={this.onSelectChanged('photo.index')}/>
        </div>
        <div className='Admin-photo-form-focal'>
          <TextField
            id='fp-x'
            label='Focal Point X'
            onChange={this.onTextChanged('photo.fp_x_' +
              this.state.selectedIndex.value + '_' +
              this.state.selectedFrame.value)}
            value={fp_x === undefined ? 0 : fp_x}
            type='number'
            margin='normal'/>
          <TextField
            id='fp-y'
            label='Focal Point Y'
            onChange={this.onTextChanged('photo.fp_y_' +
              this.state.selectedIndex.value + '_' + 
              this.state.selectedFrame.value)}
            value={fp_y === undefined ? 0 : fp_y}
            type='number'
            type='number'
            margin='normal'/>
          <TextField
            id='fp-z'
            label='Focal Point Zoom (%)'
            onChange={this.onTextChanged('photo.fp_z_' + 
              this.state.selectedIndex.value + '_' + 
              this.state.selectedFrame.value)}
            value={fp_z === undefined ? 100 : fp_z}
            type='number'
            type='number'
            margin='normal'/>
        </div>
        {/**** UNUSED
        <div className='Admin-photo-form-scale'>
          <TextField
            id='scale'
            label='Scale (%)'
            onChange={this.onTextChanged('photo.scale_' + 
            this.state.selectedIndex.value + '_' + 
            this.state.selectedFrame.value)}
            value={scale === undefined ? 100 : scale}
            type='number'
            margin='normal'/>
        </div> */}
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

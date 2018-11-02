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
import { settings, setIfNot } from '../common';
import { observer } from 'mobx-react';

const { dialog } = window.require('electron').remote; 

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
      selectedFrame: {value: settings.get('photo.frame'), label: `Frame ${settings.get('photo.frame')}`},
      selectedFilter: settings.get('media.filter')
    };
    this.initSortingEngineIfDirsSelected();
  }

  componentDidMount() {
    console.log('Admin: did mount');
  }

  initFrameOptions = () => {
    const frames = Number.parseInt(settings.get('media.frames'), 10);
    for (let i = 0; i < frames; i++) {
      const j = i + 1;
      setIfNot(`photo.crop_x.f_${j}`, 0);
      setIfNot(`photo.crop_y.f_${j}`, 0);
      setIfNot(`photo.crop_w.f_${j}`, 100);
      setIfNot(`photo.crop_h.f_${j}`, 100);
      setIfNot(`photo.resize_w.f_${j}`, 50);
      setIfNot(`photo.resize_h.f_${j}`, 50);
      setIfNot(`photo.rotate.f_${j}`, 0);
    }
  }

  // Segmented Control
  onSegmentChanged = segValue => {
    this.setState({
      selectedSegment: segValue
    });
    if (this.state.selectedFrame.value > Number.parseInt(settings.get('media.frames'), 10)) {
      this.setState({
        selectedFrame: {value: 1, label: 'Frame 1'}
      });
      settings.set('photo.frame', 1);
    }
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
      case 'media.filter': {
        settings.set('media.filter', option);
        this.setState({
          selectedFilter: option
        });
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
    const frames = Number.parseInt(settings.get('media.frames'), 10);
    for (let i = 0; i < frames; i++) {
      const option = {value: i+1, label: `Frame ${i+1}`};
      options.push(option);
    }
    return options;
  }

  render() {
    this.initFrameOptions();
    //const effectsTestImgSrc = 'http://helios-microsite.imgix.net/test/sample.jpg';
    // options
    const crop_x = settings.get(`photo.crop_x.f_${this.state.selectedFrame.value}`);
    const crop_y = settings.get(`photo.crop_y.f_${this.state.selectedFrame.value}`);
    const crop_w = settings.get(`photo.crop_w.f_${this.state.selectedFrame.value}`);
    const crop_h = settings.get(`photo.crop_h.f_${this.state.selectedFrame.value}`);
    const resize_w = settings.get(`photo.resize_w.f_${this.state.selectedFrame.value}`);
    const resize_h = settings.get(`photo.resize_h.f_${this.state.selectedFrame.value}`);
    const rotate = settings.get(`photo.rotate.f_${this.state.selectedFrame.value}`)
    // station
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
        {/*
        <div className='Admin-media-filter-select'>
          <Select 
            options={ImageProcessor.imgixFilters}
            value={this.state.selectedFilter}
            placeholder='Filter...'
            onChange={this.onSelectChanged('media.filter')}/>
        </div>
        <div className='Admin-media-form-preview'>
          <div style={{width: '800', height: '450'}} key={0}>
            <img 
              style={{maxWidth: '100%', maxHeight: '100%'}} 
              src={`${effectsTestImgSrc}${this.state.selectedFilter.value}`} />
          </div>
        </div>*/}
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
        <div className='Admin-photo-form-2'>
          <Select 
            options={this.frameSelectOptions()}
            value={this.state.selectedFrame}
            placeholder='Frame...'
            onChange={this.onSelectChanged('photo.frame')}/>
        </div>
        <div className='Admin-photo-croptions'>
          <TextField
            id='crop-x'
            label='Crop-X'
            onChange={this.onTextChanged(`photo.crop_x.f_${this.state.selectedFrame.value}`)}
            value={crop_x}
            type='number'
            margin='normal'/>
          <TextField
            id='crop-down'
            label='Crop-Y'
            onChange={this.onTextChanged(`photo.crop_y.f_${this.state.selectedFrame.value}`)}
            value={crop_y}
            type='number'
            margin='normal'/>
          <TextField
            id='crop-left'
            label='Crop-W'
            onChange={this.onTextChanged(`photo.crop_w.f_${this.state.selectedFrame.value}`)}
            value={crop_w}
            type='number'
            margin='normal'/>
          <TextField
            id='crop-right'
            label='Crop-H'
            onChange={this.onTextChanged(`photo.crop_h.f_${this.state.selectedFrame.value}`)}
            value={crop_h}
            type='number'
            margin='normal'/>
          <TextField
            id='resize-w'
            label='Resize-W'
            onChange={this.onTextChanged(`photo.resize_w.f_${this.state.selectedFrame.value}`)}
            value={resize_w}
            type='number'
            margin='normal'/>
          <TextField
            id='resize-h'
            label='Resize-H'
            onChange={this.onTextChanged(`photo.resize_h.f_${this.state.selectedFrame.value}`)}
            value={resize_h}
            type='number'
            margin='normal'/>
          <TextField
            id='rotate'
            label='Rotate'
            onChange={this.onTextChanged(`photo.rotate.f_${this.state.selectedFrame.value}`)}
            value={rotate}
            type='number'
            margin='normal'/>
        </div>
        {/**** UNUSED
        <div className='Admin-photo-form-scale'>
          <TextField
            id='scale'
            label='Scale (%)'
            onChange={this.onTextChanged('photo.scale_' + 
            this.state.selectedShot.value + '_' + 
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

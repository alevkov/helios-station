import React, { Component } from 'react';
import Button from '@material-ui/core/Button';
import ButtonToolbar from 'react-bootstrap';
import { SegmentedControl } from 'segmented-control'
import Checkbox from '@material-ui/core/Checkbox';
import TextField from '@material-ui/core/TextField';
import Menu from '@material-ui/core/Menu';
import Select from 'react-select';
import MenuItem from '@material-ui/core/MenuItem';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import SortingEngine from '../extras/SortingEngine';
import '../styles/Admin.css';

// electron packages 
const electron = window.require('electron'); 
const {dialog} = window.require('electron').remote; 
const settings = electron.remote.require('electron-settings');

class Admin extends Component {
  // sorting engine instance
  static _sortingEngine = null;

  constructor(props) {
    super(props);
    this.state = {
      sourceDir: settings.get('dir.source'),
      sortDir: settings.get('dir.sort'),
      mediaDir: settings.get('dir.media'),
      selectedSegment: 'general',
      stationNameAnchor: null,
      mediaTypeAnchor: null
    };
    this.initSortingEngine();
  }

  // Segmented Control
  onSegmentedChangedHandler = segValue => {
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
          this.onDirSelectedHandler('source', dir);
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
          this.onDirSelectedHandler('sort', dir);
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
          this.onDirSelectedHandler('media', dir);
          this.setState({
            mediaDir: settings.get('dir.media') 
          });
        }
    });
  }

  onStationNameClick = event => {
    this.setState({ stationNameAnchor: event.currentTarget });
  }

  onStationNameClose = () => {
    this.setState({ stationNameAnchor: null });
  }

  // Media Page
  onMediaTypeClick = event => {
    this.setState({ mediaTypeAnchor: event.currentTarget });
  }

  onMediaTypeClose = () => {
    this.setState({ mediaTypeAnchor: null });
  }

  onLogoImageclick = () => {
    dialog.showOpenDialog({
        properties: ['openFile']
    }, (dir) => {
        if (dir !== undefined) {
          this.onDirSelectedHandler('logo', dir);
          this.setState({
            sortDir: settings.get('dir.logo')
          });
        }
    });
  }

  // Abstract 
  onDirSelectedHandler = (type, dir) => {
    settings.set('dir.' + type, dir);
  }

  onTextChangedHandler = name => event => {
    settings.set(name, event.target.value);
  }

  onCheckBoxChangedHandler = name => event => {
    settings.set(name, event.target.checked);
    // since we are using global state, force update
    this.forceUpdate();
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

  render() {
    const generalSegment = () => (
      <div className='Admin-general-form'>
        <div className='Admin-general-form-1'>
          <TextField
            id='event'
            label='Event Name'
            onChange={this.onTextChangedHandler('event.name')}
            defaultValue={settings.get('event.name')}
            margin='normal'/>
          <TextField
            id='session'
            label='Session'
            onChange={this.onTextChangedHandler('event.session')}
            defaultValue={settings.get('event.session')}
            type='number'
            margin='normal'/>
          <Button
            aria-owns={this.state.stationNameAnchor ? 'station-name-menu' : null}
            aria-haspopup='true'
            color='secondary'
            variant='contained'
            onClick={this.onStationNameClick}>
            Station
          </Button>
          <Menu
            id='station-name-menu'
            anchorEl={this.state.stationNameAnchor}
            open={Boolean(this.state.stationNameAnchor)}
            onClose={this.onStationNameClose}>
            <MenuItem onClick={this.onStationNameClose}>Station 1</MenuItem>
          </Menu>
        </div>
        <div className='Admin-general-form-2'>
          <Button onClick={this.onSourceFolderClick}
            color='primary'
            variant='contained'>
            Source Path
          </Button>
          <Button onClick={this.onSortFolderClick}
            color='primary'
            variant='contained'>
            Sorting Path
          </Button>
          <Button onClick={this.onMediaFolderClick}
            color='primary'
            variant='contained'>
            Media Path
          </Button>
        </div>
        { <h4>Source: {this.state.sourceDir}</h4> }
        { <h4>Sort: {this.state.sortDir}</h4> }
        { <h4>Media: {this.state.mediaDir}</h4> }
        {/*
        <FormControlLabel
          control={
            <Checkbox
              value='checkedA'/>
          }
          label='Generate Media'/> */}
      </div>
    );
    const mediaSegment = () => (
      <div className='Admin-media-form'>
        <div className='Admin-media-form-1'>
          <TextField
            id='width'
            label='Width'
            onChange={this.onTextChangedHandler('media.width')}
            defaultValue={settings.get('media.width')}
            type='number'
            margin='normal'/>
          <TextField
            id='height'
            label='Height'
            onChange={this.onTextChangedHandler('media.height')}
            defaultValue={settings.get('media.height')}
            type='number'
            margin='normal'/>
        </div>
        <div className='Admin-media-form-2'>
          <TextField
            id='frames'
            label='# of Frames'
            onChange={this.onTextChangedHandler('media.frames')}
            defaultValue={settings.get('media.frames')}
            type='number'
            margin='normal'/>
          <TextField
            id='fps'
            label='FPS'
            onChange={this.onTextChangedHandler('media.fps')}
            defaultValue={settings.get('media.fps')}
            type='number'
            margin='normal'/>
          <FormControlLabel
            control={
              <Checkbox
                checked={settings.get('media.loop')}
                onChange={this.onCheckBoxChangedHandler('media.loop')}
                value='checkedLoop'/>
            }
            label='Loop'/>
          <FormControlLabel
            control={
              <Checkbox
                checked={settings.get('media.boomerang')}
                onChange={this.onCheckBoxChangedHandler('media.boomerang')}
                value='checkedBoomerang'/>
            }
            label='Boomerang'/>
        </div>
        <div className='Admin-media-form-3'>
          <Button onClick={this.onLogoImageclick}
            color='primary'
            onClick={this.onLogoImageclick}
            variant='contained'>
            Logo Image
          </Button>
          <Button
            aria-owns={this.state.mediaTypeAnchor ? 'media-type-menu' : null}
            aria-haspopup='true'
            color='secondary'
            variant='contained'
            onClick={this.onMediaTypeClick}>
            FORMAT
          </Button>
          <Menu
            id='media-type-menu'
            anchorEl={this.state.mediaTypeAnchor}
            open={Boolean(this.state.mediaTypeAnchor)}
            onClose={this.onMediaTypeClose}>
            <MenuItem onClick={this.onMediaTypeClose}>.gif</MenuItem>
            <MenuItem onClick={this.onMediaTypeClose}>.mp4</MenuItem>
          </Menu>
        </div>
      </div>
    );
    const frameSelectOptions = () => {
      const options = [];
      const frames = Number.parseInt(settings.get('media.frames'));
      for (let i = 0; i < frames; i++) {
        const option = {value: i, label: `Frame ${i}`};
        options.push(option);
      }
      return options;
    }
    const photoSegment = () => (
      <div className='Admin-photo-form'>
        <div className='Admin-photo-form-1'>
          <TextField
            id='crop-up'
            label='Crop-Up'
            onChange={this.onTextChangedHandler('photo.crop-up')}
            defaultValue={settings.get('photo.crop-up')}
            type='number'
            margin='normal'/>
          <TextField
            id='crop-down'
            label='Crop-Down'
            onChange={this.onTextChangedHandler('photo.crop-down')}
            defaultValue={settings.get('photo.crop-down')}
            type='number'
            margin='normal'/>
          <TextField
            id='crop-left'
            label='Crop-Left'
            onChange={this.onTextChangedHandler('photo.crop-left')}
            defaultValue={settings.get('photo.crop-left')}
            type='number'
            margin='normal'/>
          <TextField
            id='crop-right'
            label='Crop-Right'
            onChange={this.onTextChangedHandler('photo.crop-right')}
            defaultValue={settings.get('photo.crop-right')}
            type='number'
            margin='normal'/>
        </div>
        <div className='Admin-photo-form-2'>
          <Select options={frameSelectOptions()} />
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
          setValue={segValue => this.onSegmentedChangedHandler(segValue)}
          style={{ width: 400, color: '#303F9F' }}/>
        { this.state.selectedSegment === 'general' ? generalSegment() : null }
        { this.state.selectedSegment === 'media' ? mediaSegment() : null }
        { this.state.selectedSegment === 'photo' ? photoSegment() : null }
      </div>
    );
  }
}

export default Admin;

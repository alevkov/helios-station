import React, { Component } from 'react';
import Button from '@material-ui/core/Button';
import { SegmentedControl } from 'segmented-control'
import Checkbox from '@material-ui/core/Checkbox';
import TextField from '@material-ui/core/TextField';
import Select from 'react-select';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import SortingEngine from '../extras/SortingEngine';
import Adjuster from '../components/admin/Adjuster';
import '../styles/Admin.css';
import { settings, setIfNot } from '../common';
import { observer } from 'mobx-react';

const { dialog } = window.require('electron').remote; 

export const Admin = observer(class Admin extends Component {
  // sorting engine instance
  static SortingEngine = null;

  constructor(props) {
    super(props);
    this.state = {
      sourceDir: settings.get('dir.source'),
      sortDir: settings.get('dir.sort'),
      mediaDir: settings.get('dir.media'),
      logoDir: settings.get('dir.logo'),
      overlayDir: settings.get('dir.overlay'),
      overlayList: [],
      applyOverlay: settings.get('media.applyOverlay'),
      selectedSegment: 'general',
      selectedFrame: {
        value: settings.get('photo.frame'),
        label: `Frame ${settings.get('photo.frame')}`
      },
      selectedFilter: settings.get('media.filter'),
      selectedOverlay: settings.get('media.overlay')
    };
    this.initSortingEngineIfDirsSelected();
  }

  componentDidMount() {
    this.initOverlayListIfSelected();
  }

  initFrameOptions = () => {
    const frames = Number.parseInt(settings.get('media.frames'), 10);
    setIfNot(`photo.crop_w`, 100);
    setIfNot(`photo.crop_h`, 100);
    setIfNot(`photo.full_w`, 0);
    setIfNot(`photo.full_h`, 0);
    setIfNot(`canvas.referenceOpacity`, 0.5);
    setIfNot(`canvas.adjustOpacity`, 0.5);
    setIfNot(`canvas.zoom`, 100);
    for (let i = 0; i < frames; i++) {
      const j = i + 1;
      setIfNot(`photo.rotate.f_${j}`, 0.0);
      setIfNot(`photo.crop_delta_x.f_${j}`, 100);
      setIfNot(`photo.crop_delta_y.f_${j}`, 100);
      setIfNot(`photo.zoom.f_${j}`, 100.0);
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
          this.initSortingEngineIfDirsSelected();
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
          this.initSortingEngineIfDirsSelected();
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
          this.initSortingEngineIfDirsSelected();
        }
    });
  }

  // Logo
  onLogoImageclick = () => {
    dialog.showOpenDialog({
        properties: ['openFile']
    }, (dir) => {
        if (dir !== undefined) {
          this.onDirSelected('logo', dir);
          this.setState({
            logoDir: settings.get('dir.logo')
          });
        }
    });
  }

  // Overlay
  onOverlayClick = () => {
    dialog.showOpenDialog({
        properties: ['openDirectory']
    }, (dir) => {
        if (dir !== undefined) {
          this.onDirSelected('overlay', dir);
          console.log(dir);
          this.setState({
            overlayDir: dir
          });
          this.initOverlayListIfSelected();
        }
    });
  }

  // Abstract 
  onDirSelected = (type, dir) => {
    console.log(dir);
    settings.set('dir.' + type, dir);
  }

  onTextChanged = name => event => {
    settings.set(name, event.target.value);
    this.forceUpdate();
  }

  onCheckboxChanged = name => event => {
    console.log(name);
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
        break;
      }
      case 'media.overlay': {
        settings.set('media.overlay', option);
        this.setState({
          selectedOverlay: option
        });
        console.log(option);
        break;
      }
      case 'photo.frame': {
        console.log(option);
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
    if (settings.has('dir.source') && 
      settings.has('dir.sort') && 
      settings.has('dir.media')) {
      // initialize sorting engine
      if (Admin.SortingEngine == null) {
              Admin.SortingEngine =
        new SortingEngine(
          settings.get('dir.source'), 
          settings.get('dir.sort'),
          settings.get('dir.media'));
      }
    }
  }

  initOverlayListIfSelected = () => {
    if (settings.has('dir.overlay')) {
      // why is this an array?
      const overlays = Admin.SortingEngine
        .unpackOverlays(settings.get('dir.overlay')[0]);
      this.setState({
        overlayList: overlays
      });
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

  overlaySelectOptions = () => {
    if (this.state.overlayList === undefined) return;
    let options = [];
    for (let i = 0; i < this.state.overlayList.length; i++) {
      const option = {value: this.state.overlayList[i], label: this.state.overlayList[i]};
      options.push(option);
    }
    return options;
  }

  render() {
    this.initFrameOptions();
    // options
    const logo_x = settings.get(`media.logo_x`);
    const logo_y = settings.get(`media.logo_y`);
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
        <div className='Admin-media-form-dimensions'>
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
        <div className='Admin-media-form-parameters'>
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
          <FormControlLabel
            control={
              <Checkbox
                checked={settings.get('media.applyOverlay')}
                onChange={this.onCheckboxChanged('media.applyOverlay')}
                value='checkedOverlay'/>
            }
            label='Overlay'/>
          <FormControlLabel
            control={
              <Checkbox
                checked={settings.get('media.applyLogo')}
                onChange={this.onCheckboxChanged('media.applyLogo')}
                value='checkedLogo'/>
            }
            label='Logo'/>
        </div>
        <div className='Admin-media-form-extra-assets'>
          <Button
            color='primary'
            onClick={this.onLogoImageclick}
            variant='contained'>
            Logo
          </Button>
          <Button
            color='secondary'
            onClick={this.onOverlayClick}
            variant='contained'>
            Overlay
          </Button>
          <Select 
            className='Admin-media-format-select'
            placeholder='Format...'
            value={{value: 'gif', label: '.gif'}}
            onChange={this.onSelectChanged('media.format')}
            options={mediaSelectOptions} />
          <Select 
            className='Admin-media-overlay-select'
            placeholder='Overlay...'
            value={this.state.selectedOverlay}
            onChange={this.onSelectChanged('media.overlay')}
            options={this.overlaySelectOptions()} />
        </div>
        <div className='Admin-media-form-logo-coordinates'>
          <TextField
            id='logo-x'
            label='Logo Position-X'
            onChange={this.onTextChanged('media.logo_x')}
            value={logo_x}
            type='number'
            margin='normal'/>
          <TextField
            id='logo-y'
            label='Logo Position-Y'
            onChange={this.onTextChanged('media.logo_y')}
            value={logo_y}
            type='number'
            margin='normal'/>
        </div>
      </div>
    );
    const photoSegment = () => (
      <Adjuster 
        onTextChanged={this.onTextChanged} 
        onDirSelected={this.onDirSelected}
        onCheckboxChanged={this.onCheckboxChanged}
        selectedFrame={this.state.selectedFrame}
        frameSelectOptions={this.frameSelectOptions}
        onSelectChanged={this.onSelectChanged}/>
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
    )
  }
});

export default Admin;

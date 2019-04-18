import React, { Component } from 'react';
import Admin from './Admin';
import SortingEngine from '../extras/SortingEngine';
import Gallery from '../components/neptunian/Gallery';
import { Carousel } from 'react-responsive-carousel';
import SelectedImage from '../components/neptunian/SelectedImage';
import SharingDock from '../components/home/SelectDock';
import Button from '@material-ui/core/Button';
import Select from 'react-select';
import CloudInterface from '../extras/CloudInterface';
import { Line } from 'rc-progress';
import '../styles/Home.css';
import styles from 'react-responsive-carousel/lib/styles/carousel.min.css';
import { 
  emitter,
  settings,
  EVENT_PHOTO_ADDED,
  EVENT_PHOTO_REMOVED
} from '../common';
import { observable } from 'mobx';
import { observer } from 'mobx-react';

const { ipcRenderer, remote } = window.require('electron');
const path = require('path');
const os = window.require('os');
const graphicsmagick = remote.require('graphicsmagick-static');
const imagemagick = remote.require('imagemagick-darwin-static');
let imagemagickPath = remote.require('imagemagick-darwin-static').path;
console.log(imagemagickPath);

const { subClass } = remote.require('gm');
let gm;

if (os.platform() == "win32") {
    gm = subClass({imageMagick: true})
} else {
    gm = subClass({
        imageMagick: true,
        appPath: path.join(`${imagemagickPath}`, '/')
    });
}

export const Home = observer(class Home extends Component {
  static OnPhotoAddedSubscriber = null;
  static OnPhotoRemovedSubscriber = null;
  static PhotosList = observable.array([], { deep: true });
  static ShotList = new Set();

  constructor(props) {
    super(props)
    this.state = {
      photos: Home.PhotosList,
      showPhotoCarousel: false,
      carouselStartPos: 0,
      selectedEffect: '',
      selectedPhotosList: new Set(),
      uploadProgress: 0
    }
  }

  componentDidMount() {
    if (Home.OnPhotoAddedSubscriber === null) {
      Home.OnPhotoAddedSubscriber = emitter.addListener(EVENT_PHOTO_ADDED,
       this.onPhotoAdded);
    }
    if (Home.OnPhotoRemovedSubscriber === null) {
      Home.OnPhotoRemovedSubscriber = emitter.addListener(EVENT_PHOTO_REMOVED,
       this.onPhotoRemoved);
    }
    this.initSortingEngineIfDirsSelected();
  }

  onPhotoAdded = (...args) => {
    console.log('media added');
    const path = args[0];
    gm(path)
    .size(function (err, size) {
      if (!err) {
        const filename = path.replace(/^.*[\\\/]/, '');
        const shot = Number.parseInt(filename.split('.')[0], 10);
        const image = {
          src: 'file://' + path,
          actual: path,
          name: filename,
          shot: shot, // shot number
          eventcode: settings.get('event.name'),
          width: size.width,
          height: size.height
        }
        console.log(image);
        Home.ShotList.add(shot);
        Home.PhotosList.push(image);
      } else {
        console.log(err);
      }
    });
    

  }

  onPhotoRemoved = (...args) => {
    // remove path from observable array
    const removedPath = args[0];
    const idx = Home.PhotosList.findIndex((item, index, array) => {
      return item.src === 'file://' + removedPath;
    });
    Home.PhotosList.remove(Home.PhotosList[idx]);
  }

  onSelectPhoto = (event, obj) => {
    Home.PhotosList[obj.index].selected = 
      !Home.PhotosList[obj.index].selected;
    if (Home.PhotosList[obj.index].selected === true) {
      this.state.selectedPhotosList.add(obj.index);
    } else {
      this.state.selectedPhotosList.delete(obj.index);
    }
    this.forceUpdate();
  }

  onExpandPhoto = index => () => {
    this.setState({
      showPhotoCarousel: true,
      carouselStartPos: index
    });
    console.log(index);
  }

  onCloseCarousel = () => {
    this.setState({
      showPhotoCarousel: false,
      carouselStartPos: 0
    });
  }

  getSelectedPhotosList = () => {
    let selectedPhotosPaths = [];
    this.state.selectedPhotosList.forEach(i => {
      const path = Home.PhotosList[i].actual;
      selectedPhotosPaths.push(path);
    });
    return selectedPhotosPaths;
  }

  onToggleModal = name => () => {
    console.log(name);
  }

  onLoveItClick = () => {
    const cloud = new CloudInterface(this.onUploadProgressReceived);
    const selected = this.getSelectedPhotosList();
    cloud.upload(selected, 'loveit');
  }

  onCarouselNav = pos => {
    console.log(pos);
  }

  onUploadProgressReceived = progress => {
    this.setState({
      uploadProgress: progress
    });
  }

  onTextChanged = name => event => {
    settings.set(name, event.target.value);
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

  render() {
    const carouselContent = Home.PhotosList
     .map((item, i) => <div key={i}><img src={item.src} /></div>);
    const ImageCarousel = () => (
      <Carousel 
        showArrows={false} 
        showThumbs={false} 
        showIndicators={false}
        emulateTouch={true}
        dynamicHeight={true}
        onChange={this.onCarouselNav}
        selectedItem={this.state.carouselStartPos}>
        {carouselContent}
      </Carousel>
    );
    return (
      <div className='Home'> 
      { this.state.uploadProgress > 0 && this.state.uploadProgress < 100 ? 
        <Line percent={this.state.uploadProgress} strokeWidth="2" strokeColor="#4b0082" />
        : null }
      {/*** Close Button ***/}
        { this.state.showPhotoCarousel === true ? 
        (<div className='Home-top-buttons' style={{width:'100%', height:'50px'}}>
          <Button
            style={{ fontSize: '25px', float: 'right'}}
            onClick={this.onCloseCarousel}>&#10539;</Button>
        </div>) : null}
      {/*** Dock ***/} 
        <SharingDock 
          showDock={this.state.selectedPhotosList.size !==0 && !this.state.showPhotoCarousel } 
          toggleModal={this.onToggleModal}
          onLoveItClick={this.onLoveItClick} />
      {/*** Carousel ***/} 
        { this.state.showPhotoCarousel === true ? <ImageCarousel /> :  null }
      {/*** Nothing ***/}
        { this.state.photos.length === 0 ? <NothingToShow /> : null }
      {/*** Gallery ***/}
        { this.state.showPhotoCarousel === false ?
        <Gallery 
          photos={this.state.photos}
          onClick={this.onSelectPhoto}
          onExpand={this.onExpandPhoto}
          ImageComponent={SelectedImage} /> : null }
      </div>
    );
  }
});

const NothingToShow = () => (
  <div className='NotFound'>
    <h3>No photos to display.</h3>
  </div>
);

export default Home;
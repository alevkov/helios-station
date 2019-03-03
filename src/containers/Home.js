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
  EVENT_PHOTO_REMOVED,
  EVENT_GALLERY_REFRESH
} from '../common';
import { observable } from 'mobx';
import { observer } from 'mobx-react';

// declare as observer to observe the state of data structs declared above
export const Home = observer(class Home extends Component {
  // sub sandwhiches
  static _PhotoAddedSub = null;
  static _PhotoRemovedSub = null;
  static _GalleryRefreshSub = null;
  // observables
  static o_photosList = observable.array([], { deep: true });
  static _shotList = new Set();

  constructor(props) {
    super(props)
    this.state = {
      photos: Home.o_photosList,
      showPhotoCarousel: false,
      carouselStartPos: 0,
      selectedEffect: '',
      selectedPhotosList: new Set(),
      uploadProgress: 0
    }
  }

  componentDidMount() {
    if (Home._PhotoAddedSub === null) {
      Home._PhotoAddedSub = emitter.addListener(EVENT_PHOTO_ADDED,
       this.onPhotoAdded);
    }
    if (Home._PhotoRemovedSub === null) {
      Home._PhotoRemovedSub = emitter.addListener(EVENT_PHOTO_REMOVED,
       this.onPhotoRemoved);
    }
    if (Home._GalleryRefreshSub === null) {
      Home._GalleryRefreshSub = emitter.addListener(EVENT_GALLERY_REFRESH,
       this.onGalleryRefresh);
    }
    this.initSortingEngineIfDirsSelected();
  }

  onPhotoAdded = (...args) => {
    console.log('media added')
    const path = args[0];
    const filename = path.replace(/^.*[\\\/]/, '');
    const shot = Number.parseInt(filename.split('.')[0], 10);
    const image = {
      src: 'file://' + path,
      actual: path,
      name: filename,
      shot: shot, // shot number
      eventcode: settings.get('event.name'),
      width: 3,
      height: 2
    }
    console.log(image);
    Home._shotList.add(shot);
    Home.o_photosList.push(image);

    this.forceUpdate();
  }

  onPhotoRemoved = (...args) => {
    // remove path from observable array
    const removedPath = args[0];
    const idx = Home.o_photosList.findIndex((item, index, array) => {
      return item.src === 'file://' + removedPath;
    });
    Home.o_photosList.remove(Home.o_photosList[idx]);
  }

  onGalleryRefresh = (...args) => {
    console.log('refresh');
    /*
      trick to refresh the gallery view,
      since gifs don't load fully immediately after creation
    */
    Home.o_photosList.concat(observable([]));
  }

  onSelectPhoto = (event, obj) => {
    Home.o_photosList[obj.index].selected = 
      !Home.o_photosList[obj.index].selected;
    if (Home.o_photosList[obj.index].selected === true) {
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
      const path = Home.o_photosList[i].actual;
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
    /*
    const effectsList = [
      {value: 'original', label: 'No Effect'},
      {value: 'sepia', label: 'Sepia'},
      {value: 'grayscale', label: 'Grayscale'},
    ];*/
    const carouselContent = Home.o_photosList
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
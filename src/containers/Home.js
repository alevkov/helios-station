import React, { Component } from 'react';
import Gallery from '../components/neptunian/Gallery';
import { Carousel } from 'react-responsive-carousel';
import SelectedImage from '../components/neptunian/SelectedImage';
import SharingDock from '../components/home/SelectDock';
import Button from '@material-ui/core/Button';
import Select from 'react-select';
import CloudInterface from '../extras/CloudInterface';
import TextField from '@material-ui/core/TextField';
import ImageProcessor from '../extras/ImageProcessor';
import Lightbox from 'react-images';
import logo from '../logo.svg';
import '../styles/Home.css';
import styles from 'react-responsive-carousel/lib/styles/carousel.min.css';
import { 
  emitter,
  EVENT_PHOTO_ADDED,
  EVENT_PHOTO_REMOVED,
  EVENT_FRAME_ADDED
} from '../common';
import { observable } from 'mobx';
import { observer } from 'mobx-react';

const electron = window.require('electron');
const settings = electron.remote.require('electron-settings');

// declare as observer to observe the state of data structs declared above
export const Home = observer(class Home extends Component {
  // sub sandwhiches
  static _PhotoAddedSub = null;
  static _PhotoRemovedSub = null;
  // observables
  static o_photosList = observable.array([], { deep: true });
  static sortFrames = ascending => {
    Home.o_photosList.replace(Home.o_photosList.slice().sort((a, b) => {
      const aFile = a.actual.replace(/^.*[\\\/]/, '');
      const aIndex = aFile.split('_')[1].split('.')[0];
      const bFile = b.actual.replace(/^.*[\\\/]/, '');
      const bIndex = bFile.split('_')[1].split('.')[0];
      return ascending ? 
        (aIndex > bIndex ? 1 : -1) : 
        (aIndex < bIndex ? 1 : -1);
    }));
  }
  static frameByIndexAndCamera = (index, camera) => {
    Home.o_photosList.forEach(i => {
      if (Home.o_photosList[i].idx === index && 
        Home.o_photosList[i].camera === camera) {
        return Home.o_photosList[i];
      }
    });
  }

  constructor(props) {
    super(props)
    this.state = {
      photos: Home.o_photosList,
      showPhotoCarousel: false,
      carouselStartPos: 0,
      selectedEffect: '',
      selectedPhotosList: new Set()
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
  }

  onPhotoAdded = (...args) => {
    const path = args[0];
    const filename = path.replace(/^.*[\\\/]/, '');
    const idx = filename.split('_')[1].split('.')[0];
    const camera = filename.split('_')[0];
    const image = {
      src: 'file://' + path,
      actual: path,
      name: filename,
      frame: idx,
      camera: Number.parseInt(camera),
      modified: null,
      eventcode: settings.get('event.name'),
      width: 3,
      height: 2
    }
    // add photo to observable array
    Home.o_photosList.push(image);
    Home.sortFrames(true);
    emitter.emit(EVENT_FRAME_ADDED, Home.o_photosList[idx-1]);
    // upload to server
    const cloud = new CloudInterface();
    cloud.upload([image.actual]);
  }

  onPhotoRemoved = (...args) => {
    // remove path from observable array
    const removedPath = args[0];
    const idx = Home.o_photosList.findIndex((item, index, array) => {
      return item.src === 'file://' + removedPath;
    });
    Home.o_photosList.remove(Home.o_photosList[idx]);
    Home.sortFrames(true);
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
      const path = Home.o_photosList[i].modified === null ?
        Home.o_photosList[i].actual : Home.o_photosList[i].modified;
      selectedPhotosPaths.push(path);
    });
    return selectedPhotosPaths;
  }

  onToggleModal = name => () => {
    console.log(name);
  }

  onLoveItClick = () => {
    const cloud = new CloudInterface();
    const selected = this.getSelectedPhotosList();
    cloud.upload(selected);
  }

  onCarouselNav = pos => {
    console.log(pos);
  }

  onSelectChanged = name => option => {
    switch (name) {
      case 'photo.effect': {
        const proc = new ImageProcessor();
        let params;
        const effectName = option.value;
        if (effectName === 'original') {
          const newImages = proc.reset(Home.o_photosList.slice());
          Home.o_photosList.replace(newImages);
          this.setState({
            selectedEffect: option.value
          });
        } else {
          if (effectName === 'grayscale') {
            params = {
              type: effectName
            };
          } else if (effectName === 'sepia') {
            params = {
              type: effectName
            };
          }
          proc.applyEffect(params, Home.o_photosList.slice())
            .then((newImages) => {
              Home.o_photosList.replace(newImages);
              this.setState({
                selectedEffect: option.value
              });
            });
        }
      }
      default: {
        break;
      }
    }
  }

  onTextChanged = name => event => {
    settings.set(name, event.target.value);
  }

  render() {
    const effectsList = [
      {value: 'original', label: 'No Effect'},
      {value: 'sepia', label: 'Sepia'},
      {value: 'grayscale', label: 'Grayscale'},
    ];
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
      {/*** Select Effects ***/} 
        <div className='Home-top-bar'>
        { this.state.photos.length > 0 ? 
          <Select
            autorize={false}
            options={effectsList} 
            placeholder='Effects..'
            onChange={this.onSelectChanged('photo.effect')}/> : null }
        </div>
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
          onEffects={this.onPhotoEffects}
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
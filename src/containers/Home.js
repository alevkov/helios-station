import React, { Component } from 'react';
import Admin from './Admin';
import SortingEngine from '../extras/SortingEngine';
import Gallery from '../components/neptunian/Gallery';
import { Carousel } from 'react-responsive-carousel';
import SelectedImage from '../components/neptunian/SelectedImage';
import SharingDock from '../components/home/SelectDock';
import Button from '@material-ui/core/Button';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Select from 'react-select';
import CloudInterface from '../extras/CloudInterface';
import { Line } from 'rc-progress';
import '../styles/Home.css';
import SmsModal from '../components/home/SmsModal';
import EmailModal from '../components/home/EmailModal';
import styles from 'react-responsive-carousel/lib/styles/carousel.min.css';
import { 
  emitter,
  settings,
  EVENT_PHOTO_ADDED,
  EVENT_PHOTO_REMOVED
} from '../common';
import { observable } from 'mobx';
import { observer } from 'mobx-react';
import ImageProcessor from "../extras/ImageProcessor";
import axios from 'axios';

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
      showSmsModal: false,
      showEmailModal: false,
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
    // will be shown when selected
    const path = args[0].full;
    // will be shown by default
    const staticFrame = args[0].static;
    const processor = new ImageProcessor();
    processor.get()(path)
    .size(function (err, size) {
      if (!err) {
        const filename = path.replace(/^.*[\\\/]/, '');
        const shot = Number.parseInt(filename.split('.')[0], 10);
        const image = {
          src: 'file://' + staticFrame,
          actual: path,
          staticframe: staticFrame,
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
      Home.PhotosList[obj.index].src = 'file://' + Home.PhotosList[obj.index].actual; 
      this.state.selectedPhotosList.add(obj.index);
    } else {
      Home.PhotosList[obj.index].src = 'file://' + Home.PhotosList[obj.index].staticframe;
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

  toggleSmsModal = () => {
    this.setState({
      showSmsModal: !this.state.showSmsModal
    });
  }

  toggleEmailModal = () => {
    this.setState({
      showEmailModal: !this.state.showEmailModal
    })
  }

  generateShareContentFromSelected = () => {
    let content = '';
    let photos = Home.PhotosList;
    this.state.selectedPhotosList.forEach(i => {
      content += photos[i].actual.replace(/ /g, "%20");
      content += '\n';
      content += '-------------------';
      content += '\n';
    });
    return content;
  }


  onLoveItClick = () => {
    const cloud = new CloudInterface(this.onUploadProgressReceived);
    const selected = this.getSelectedPhotosList();
    cloud.upload(selected, 'loveit');
    axios({
      method: 'post',
      url: `https://helios-api.herokuapp.com/password/${settings.get('event.name')}`,
      data: {
        pwd: settings.get('event.pwd')
      }
    }).then(response => {
      console.log(response);
    })
    .catch(error => {
      console.log(error);
    });
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

  onCheckboxChanged = name => event => {
    if (name === 'play') {
      settings.set(`media.play`, event.target.checked);
      for (let i = 0; i < Home.PhotosList.length; i++) {
        if (event.target.checked) {
          Home.PhotosList[i].src = 'file://' + Home.PhotosList[i].actual;
        } else {
          Home.PhotosList[i].src = 'file://' + Home.PhotosList[i].staticframe;
        }
      }
      this.forceUpdate();
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
      {/*** Play ***/}
        { this.state.photos.length > 0 && this.state.showPhotoCarousel === false ? 
        (<div className='Home-top-buttons' style={{width:'100%', height:'50px'}}>
          <FormControlLabel
            control={
              <Checkbox
                checked={settings.get(`media.play`)}
                onChange={this.onCheckboxChanged('play')}
                value='checkedPlay'/>
            }
            label='Play Media'/>
        </div>) : null}
      {/*** Dock ***/} 
        <SharingDock 
          showDock={this.state.selectedPhotosList.size !==0 && !this.state.showPhotoCarousel } 
          toggleSmsModal={this.toggleSmsModal}
          toggleEmailModal={this.toggleEmailModal}
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
        <SmsModal 
          isShown={this.state.showSmsModal} 
          handleClose={this.toggleSmsModal}
          smsRecepient="+19548042297"
          smsBody={this.generateShareContentFromSelected()}>
        </SmsModal>
        <EmailModal
          isShown={this.state.showEmailModal}
          handleClose={this.toggleEmailModal}
          emailRecepient="example@mail.com"
          emailBody={this.generateShareContentFromSelected()}>
        </EmailModal>
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
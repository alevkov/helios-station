import React, { Component } from 'react';
import Dock from 'react-dock';
import IconButton from '@material-ui/core/IconButton';
// assets
import SmsBox from 'material-ui-community-icons/icons/message-text';
import EmailBox from 'material-ui-community-icons/icons/email';
import FacebookBox from 'material-ui-community-icons/icons/facebook-box';
import TwitterBox from 'material-ui-community-icons/icons/twitter-box';

export default class SelectDock extends React.Component {
  render() {
    const sharingListStyles = {
      display:'flex',
      textAlign: 'center',
      justifyContent: 'center'
    }

    const sharingButtonStyles = {
      listStyleType: 'none',
      paddingRight: 40
    }

    const dockStyles = {
      backgroundColor: "white",
      opacity: 1
    }

    const dockIconStyles = {
      opacity: 1,
      width: 30,
      height: 30
    }
    
    return (
      <Dock
        size={0.1}
        position='top' 
        dimMode='none'
        fluid='false'
        dockStyle={dockStyles}
        isVisible={this.props.showDock}>
          <ul style={sharingListStyles}>
            <li style={sharingButtonStyles}>
              <IconButton onClick={this.props.toggleSms}>
                <SmsBox style={dockIconStyles} />
              </IconButton>
            </li>
            <li style={sharingButtonStyles}>
              <IconButton>
                <EmailBox style={dockIconStyles} />
              </IconButton>
            </li>
            <li style={sharingButtonStyles}>
              <IconButton>
                <FacebookBox style={dockIconStyles} />
              </IconButton>
            </li>
            <li style={sharingButtonStyles}>
              <IconButton>
                <TwitterBox style={dockIconStyles} />
              </IconButton>
            </li>
          </ul>
        </Dock>
    )
  }
}
import AWS from 'aws-sdk';

const electron = window.require('electron');
const fs = electron.remote.require('fs');
const settings = electron.remote.require('electron-settings');

export default class CloudInterface {
  static _bucket = 'helios-photos';
  static _region = 'us-east-2';
  static _accessKeyId = 'AKIAIXRLQLXZXCINEXTQ';
  static _secretAccessKey = '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';

  constructor() {
    this.s3 = new AWS.S3({
      region: CloudInterface._region,
      accessKeyId: CloudInterface._accessKeyId,
      secretAccessKey: CloudInterface._secretAccessKey
    });
  }

  upload = filepaths => {
    for (var i = 0; i < filepaths.length; i++) {
      const params = {
        Bucket: CloudInterface._bucket,
        Key: settings.get('event.name'),
        Body: ''
      };
      const path = String(filepaths[i]);
      fs.readFile(path, (err, data) => {
        const filename = path.replace(/^.*[\\\/]/, '')
        params.Body = data;
        params.Key = params.Key + '/' + filename;
        this.s3.upload(params, (err, data) => {
          if (err) {
            console.log('Error', err);
          } if (data) {
            console.log('Upload Success', data.Location);
          }
        });
      })

    }
  }
}
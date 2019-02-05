import AWS from 'aws-sdk';

const electron = window.require('electron');
const fs = electron.remote.require('fs');
const settings = electron.remote.require('electron-settings');

export default class CloudInterface {
  static _bucket = 'helios-photos';
  static _region = 'us-east-2';
  static _accessKeyId = 'AKIAIXRLQLXZXCINEXTQ';
  static _secretAccessKey = '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';

  constructor(uploadProgressHandler) {
    this.progressHandler = uploadProgressHandler;
    this.s3 = new AWS.S3({
      region: CloudInterface._region,
      accessKeyId: CloudInterface._accessKeyId,
      secretAccessKey: CloudInterface._secretAccessKey
    });
  }

  upload = (filepaths, subkey) => {
    const that = this;
    for (let i = 0; i < filepaths.length; i++) {
      const params = {
        Bucket: CloudInterface._bucket,
        Key: settings.get('event.name'),
        Body: ''
      };
      const path = String(filepaths[i]);
      const sub = String(subkey);
      fs.readFile(path, (err, data) => {
        const filename = path.replace(/^.*[\\\/]/, '');
        params.Body = data;
        params.Key = params.Key + '/' + sub + '/' + filename;
        
        this.s3.upload(params)
          .on('httpUploadProgress', function(evt) {
            that.progressHandler(parseInt((evt.loaded * 100) / evt.total));
          }).send(function(err, data) {
            alert("File uploaded successfully.");
          });
      });
    }
  }

  uploadSource = filepath => {
    return new Promise((resolve, reject) => {
      const params = {
        Bucket: CloudInterface._bucket,
        Key: settings.get('event.name'),
        Body: ''
      };
      const path = String(filepath);
      fs.readFile(path, (err, data) => {
        const filename = path.replace(/^.*[\\\/]/, '');
        params.Body = data;
        params.Key = params.Key + '/' + filename;
        this.s3.upload(params, (err, data) => {
          if (err) {
            reject(err);
          } if (data) {
            console.log('Upload Success', data.Location);
            resolve(data.Location);
          }
        });
      });
    }); 
  }

  update = (buffer, name) => {
    const params = {
      Bucket: CloudInterface._bucket,
      Key: settings.get('event.name'),
      Body: ''
    };
    params.Body = buffer;
    params.Key = params.Key + '/' + name;
    this.s3.upload(params, (err, data) => {
      if (err) {
        console.log('Error', err);
      } if (data) {
        console.log('Upload Success', data.Location);
      }
    });
  }
}
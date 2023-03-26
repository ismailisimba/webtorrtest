import express from 'express'
import { Storage } from '@google-cloud/storage';
import WebTorrent from 'webtorrent'
import fs from "fs";
import {open} from 'node:fs/promises'
import { Readable } from 'stream';




async function main (){
  const client = new WebTorrent();
const storage = new Storage();
const bucketName = 'torrentz';
const bucket = storage.bucket(bucketName);

const app = express();

app.get('/download', function(req, res) {
  const magnetURI = 'magnet:?xt=urn:btih:55f35a26b15aebce5cc11c65b25397e02769b780&dn=Obi-Wan.Kenobi.S01E02.720p.WEB.x265-MiNX%5bTGx%5d&tr=udp%3a%2f%2fopen.stealth.si%3a80%2fannounce&tr=udp%3a%2f%2ftracker.tiny-vps.com%3a6969%2fannounce&tr=udp%3a%2f%2ftracker.opentrackr.org%3a1337%2fannounce&tr=udp%3a%2f%2ftracker.torrent.eu.org%3a451%2fannounce&tr=udp%3a%2f%2fexplodie.org%3a6969%2fannounce&tr=udp%3a%2f%2ftracker.cyberia.is%3a6969%2fannounce&tr=udp%3a%2f%2fipv4.tracker.harry.lu%3a80%2fannounce&tr=udp%3a%2f%2fp4p.arenabg.com%3a1337%2fannounce&tr=udp%3a%2f%2ftracker.birkenwald.de%3a6969%2fannounce&tr=udp%3a%2f%2ftracker.moeking.me%3a6969%2fannounce&tr=udp%3a%2f%2fopentor.org%3a2710%2fannounce&tr=udp%3a%2f%2ftracker.dler.org%3a6969%2fannounce&tr=udp%3a%2f%2f9.rarbg.me%3a2970%2fannounce&tr=https%3a%2f%2ftracker.foreverpirates.co%3a443%2fannounce&tr=http%3a%2f%2ftracker.openbittorrent.com%3a80%2fannounce&tr=udp%3a%2f%2fopentracker.i2p.rocks%3a6969%2fannounce&tr=udp%3a%2f%2ftracker.internetwarriors.net%3a1337%2fannounce&tr=udp%3a%2f%2ftracker.leechers-paradise.org%3a6969%2fannounce&tr=udp%3a%2f%2fcoppersurfer.tk%3a6969%2fannounce&tr=udp%3a%2f%2ftracker.zer0day.to%3a1337%2fannounce';
  client.add(magnetURI, function(torrent) {
    const file = torrent.files.find(function(file) {
      return file.name.endsWith('.mkv'); // Replace with your desired file type
    });
    const blobName = `${file.name}`;
    const blob = bucket.file(blobName);
    const writeStream = blob.createWriteStream();
    file.createReadStream().pipe(writeStream);
    writeStream.on('error', function(err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
    });
    writeStream.on('finish', function() {
      const fileUrl = `https://storage.googleapis.com/${bucketName}/${blobName}`;
      res.status(200).send(`<a href="${fileUrl}">${file.name}</a>`);
    });
  });
});

/*app.get('/stream', function(req, res) {
  const magnetURI = 'magnet:?xt=urn:btih:55f35a26b15aebce5cc11c65b25397e02769b780&dn=Obi-Wan.Kenobi.S01E02.720p.WEB.x265-MiNX%5bTGx%5d&tr=udp%3a%2f%2fopen.stealth.si%3a80%2fannounce&tr=udp%3a%2f%2ftracker.tiny-vps.com%3a6969%2fannounce&tr=udp%3a%2f%2ftracker.opentrackr.org%3a1337%2fannounce&tr=udp%3a%2f%2ftracker.torrent.eu.org%3a451%2fannounce&tr=udp%3a%2f%2fexplodie.org%3a6969%2fannounce&tr=udp%3a%2f%2ftracker.cyberia.is%3a6969%2fannounce&tr=udp%3a%2f%2fipv4.tracker.harry.lu%3a80%2fannounce&tr=udp%3a%2f%2fp4p.arenabg.com%3a1337%2fannounce&tr=udp%3a%2f%2ftracker.birkenwald.de%3a6969%2fannounce&tr=udp%3a%2f%2ftracker.moeking.me%3a6969%2fannounce&tr=udp%3a%2f%2fopentor.org%3a2710%2fannounce&tr=udp%3a%2f%2ftracker.dler.org%3a6969%2fannounce&tr=udp%3a%2f%2f9.rarbg.me%3a2970%2fannounce&tr=https%3a%2f%2ftracker.foreverpirates.co%3a443%2fannounce&tr=http%3a%2f%2ftracker.openbittorrent.com%3a80%2fannounce&tr=udp%3a%2f%2fopentracker.i2p.rocks%3a6969%2fannounce&tr=udp%3a%2f%2ftracker.internetwarriors.net%3a1337%2fannounce&tr=udp%3a%2f%2ftracker.leechers-paradise.org%3a6969%2fannounce&tr=udp%3a%2f%2fcoppersurfer.tk%3a6969%2fannounce&tr=udp%3a%2f%2ftracker.zer0day.to%3a1337%2fannounce';
  client.add(magnetURI, function(torrent) {
    const file = torrent.files.find(function(file) {
      return file.name.endsWith('.mkv'); // Replace with your desired file type
    });
    const blobName = `${torrent.infoHash}/${file.name}`;
    const blob = bucket.file(blobName);
    const readStream = blob.createReadStream();
    res.setHeader('Content-type', 'video/mkv');
    readStream.pipe(res);
    readStream.on('error', function(err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
    });
  });
});*/


app.get('/stream/:filename', async (req, res, next) => {
  try {
    const filename = req.params.filename;
    const file = bucket.file(filename);

    // Check if the file exists
    const exists = await file.exists();

    if (!exists[0]) {
      return res.status(404).send('File not found');
    }
    const meta = await file.getMetadata().then(function(data) {
      const metadata = data[0];
      const apiResponse = data[1];
      return metadata;
    });

    const fileData = await file.download().then(function(data) {
      const contents = data[0];
      return contents;
    }).catch(e=>{
      console.log(e);
    });

    let range = req.headers.range;
    if (!range) {
        //res.status(400).send("Requires Range header");
        range = `bytes 0-`
    }
  
    const videoSize = fileData.length;
    const CHUNK_SIZE = 10 ** 6;
    const start = Number(range.replace(/\D/g, ""));
    const end = Math.min(start + CHUNK_SIZE, videoSize);
    const contentLength = end - start + 1;
    const headers = {
        "Content-Range": `bytes ${start}-${end}/${videoSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": contentLength,
        "Content-Type": meta.contentType,
    };

    console.log({start:start,end:end, length:contentLength, size:videoSize,chunks:videoSize/CHUNK_SIZE})
    //res.set('Content-Disposition', `inline; filename="${filename}"`);
    res.writeHead(206, headers);
    const stream = Readable.from(fileData,{start:start,end:end});
  




    // Set the content disposition header to force the file download
    //res.set('Content-Disposition', `attachment; filename="${filename}"`);
    // Create a read stream from the file in GCS
    
   

    // Pipe the read stream to the response stream
    stream.pipe(res);
  } catch (err) {
    next(err);
  }
});

app.listen(8080, function() {
  console.log('Server listening on port 8080');
});

}

main();
const fs = require('fs');
const path = require('path');

const ac = new AbortController();
const { signal } = ac;

const pathToFile = path.resolve(__dirname, 'file.txt');

fs.readFile(pathToFile, { signal, encoding: 'utf8' }, (err, data) => {
  if (err) {
    if (err.name === 'AbortError') {
      console.log('Read file process was aborted!');
    } else {
      console.log('Abort haven\'t work!\n');
      console.error(err);
    }
  } else {
    console.log('Abort haven\'t work!\n');
    console.log(data);
  }
});

ac.abort();

const fs = require('fs/promises');
const path = require('path');

const pathToFile = path.resolve(__dirname, 'file.txt');

const abortable = async (options = {}) => {
  const { signal } = options;

  const iac = new AbortController();
  const internalSignal = iac.signal;

  if (signal?.aborted) throw new Error(signal.reason);
  const abortEventListener = () => {
    console.log('abortEventListener was called!');
    iac.abort();
    //some other abort logic
  };
  if (signal) {
    signal.addEventListener('abort', abortEventListener, { once: true });
  }

  try {
    const data = await fs.readFile(pathToFile, { signal: internalSignal, encoding: 'utf8' });
    console.log('Abort haven\'t work!\n');
    console.log(data);
    //some other async or sync logic
  } catch (err) {
    if (err.name === 'AbortError') {
      console.log('Read file process was aborted!');
    } else {
      console.log('Abort haven\'t work!\n');
      console.error(err);
    }
  } finally {
    if (signal) {
      signal.removeEventListener('abort', abortEventListener);
    }
  }
};

const ac = new AbortController();
const { signal } = ac;

abortable({ signal });

ac.abort();

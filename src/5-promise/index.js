
class AbortError extends Error {
  constructor() {
    super();
    this.name = 'AbortError';
  }
}

const promise = async ({ signal }) => new Promise((resolve, reject) => {
  if (signal?.aborted) return reject(new AbortError());
  let timeout = undefined;
  const abortHandler = () => {
    clearTimeout(timeout);
    reject(new AbortError());
  };
  signal?.addEventListener('abort', abortHandler, { once: true });
  timeout = setTimeout(() => {
    console.log('Promise Resolved');
    resolve();
    signal?.removeEventListener('abort', abortHandler);
  }, 1000);
});

const ac = new AbortController();
const { signal } = ac;

promise({ signal }).catch((err) => {
  if (err.name === 'AbortError') {
    console.log('Process was aborted!');
  } else {
    console.log('Abort haven\'t work!\n');
    console.error(err);
  }
});

ac.abort();

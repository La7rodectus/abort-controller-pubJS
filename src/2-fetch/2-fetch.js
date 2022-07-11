const url = 'https://jsonplaceholder.typicode.com/todos/1';

const ac = new AbortController();
const { signal } = ac;

const execRequest = async (signal) => {
  try {
    const response = await fetch(url, { signal });
    const data = await response.json();
    console.log('Fetched data:', data);
  } catch (err) {
    if (err.name === 'AbortError') {
      console.log('Successful abort!');
    } else {
      console.log('Abort haven\'t work!');
      console.error('Error during fetch:', err);
    }
  }
};

execRequest(signal);
execRequest(signal);

Promise.all(Array(2).fill().map(() => execRequest(signal)));

ac.abort();

const debounce = (func) => {
  let timer;
  const DELAY = 500;
  return (...args) =>
    new Promise((resolve, reject) => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        try {
          resolve(await func(...args));
        } catch (e) {
          reject(e);
        }
      }, DELAY);
    });
};

export default debounce;

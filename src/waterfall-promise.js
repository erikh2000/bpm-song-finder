// Copied and modified from https://github.com/dotSlashLu/promise-waterfall (MIT-licensed on 4/30/17).
// I would have just imported it, but I wanted to use ES6 promises instead of the 'promise' package.
// My thanks to Zhang Qiang (dotSlashLu) for contributing to open source.

function isPromise(obj) {
  return obj && typeof obj.then === 'function';
}

function waterfall(list) {
  // malformed argument
  list = Array.prototype.slice.call(list);
  if (!Array.isArray(list)                    // not an array
      || typeof list.reduce !== "function"    // update your javascript engine
      || list.length < 1                      // empty array
     ) {
    return Promise.reject("Array with reduce function is needed.");
  }

  if (list.length === 1) {
    if (typeof list[0] !== "function")
      return Promise.reject("First element of the array should be a function, got " + typeof list[0]);
    return Promise.resolve(list[0]());
  }

  return list.reduce(function(l, r) {
    // first round
    // execute function and return promise
    var isFirst = (l === list[0]);
    if (isFirst) {
      if (typeof l !== "function") {
        return Promise.reject("List elements should be function to call.");
      }

      var lret = l();
      if (!isPromise(lret)) {
        return Promise.reject("Function return value should be a promise.");
      } else {
        return lret.then(r);
      }
    } else { // other rounds - l is a promise now
      if (!isPromise(l)) {
        Promise.reject("Function return value should be a promise.");
      } else {
        return l.then(r);
      }
    }
  });
}

export default waterfall;


import { getTimestamp, WEEK } from './time-calc';

let initData = null;

function _getStorage() {
  if (initData) {
    return initData.storage;
  }
  initData = { };
  try {
		initData.storage = window.localStorage;
		initData.storage.setItem('testKey', 'testValue');
		initData.storage.removeItem('testKey');
    console.log('Local storage used is about ' + _getUsedStorageSize() + ' bytes.');
	}
	catch(e) {
    console.warn('Caching disabled due to unavailability of localStorage in browser.');
		initData.storage = null;
	}
  return initData.storage;
}

function _isEntryExpired(entry) {
  const TOO_OLD = WEEK;
  return (getTimestamp() - entry.t > TOO_OLD);
}

function _serializeTracks(tracks) {
  const minifiedTracks = tracks.map( (track) => {
    return { t: track.track, a: track.album, b: track.bpm, p: track.previewUrl };
  });
  const entry = {
    t: getTimestamp(),
    x: minifiedTracks
  }
  return JSON.stringify(entry);
}

function _deserializeTracks(tracksJson) {
  try {
    const entry = JSON.parse(tracksJson);
    if (_isEntryExpired(entry)) {
      return null;
    }
    const minifiedTracks = entry.x;
    const tracks = minifiedTracks.map( (track) => {
      if (!track.t || !track.a || !track.b) { throw new Error('Invalid track data in cache.'); }
      return { track: track.t, album: track.a, bpm: track.b, previewUrl: track.p };
    });
    return {
      timestamp: entry.t,
      tracks
    };
  } catch(err) {
    console.error(err);
    return null;
  }
}

function _getArtistBpmKey(artistName, bpm) {
  return artistName.toLowerCase() + '/' + bpm;
}

export function _getUsedStorageSize() {
  const storage = window.localStorage;
  if (!storage) { return 0; }

  let storageSize = 0;
  Object.keys(storage).forEach( (key) => {
    const value = storage.getItem(key);
    storageSize += key.length + value.length;
  });

  return storageSize;
}

/** Try to free some space in local storage by first removing any expired/invalid entries.
 *  If that's not possible, remove the oldest entry found.
 *  And if that fails, just clear local storage completely.
 *  Designed to be called multiple times as needed to free enough space to store a new entry.
 *
 *  @return True if it may be possible to free more space by calling again, false otherwise.
 */
function _freeSomeLocalStorage() {
  const storage = _getStorage();
  let oldestTimestamp = getTimestamp(), oldestKey = null, removedSomething;
  Object.keys(storage).forEach( (key) => {
    const entryJson = storage.getItem(key);
    const result = _deserializeTracks(entryJson);
    if (result) {
      if (result.timestamp < oldestTimestamp) {
        oldestKey = key;
        oldestTimestamp = result.timestamp;
      }
    } else {
      storage.removeItem(key);
      removedSomething = true;
    }
  });

  // Return now if was able to remove any expired or invalid entries.
  if (removedSomething) { return true; }

  // Otherwise, try removing the oldest entry.
  if (oldestKey) {
    storage.removeItem(oldestKey);
    return true;
  }

  // Local storage might have something unexpected in it taking up lots of room.
  // Just clear the whole thing. Safe, because this app only uses local storage
  // for caching.
  storage.clear();
  return false;
}

export function getCachedTracks(artistName, bpm) {
  const storage = _getStorage();
  if (!storage) { return null; } //Caching disabled.

  const key = _getArtistBpmKey(artistName, bpm);
  const tracksJson = storage.getItem(key);
  if (!tracksJson) { return null; }

  const result = _deserializeTracks(tracksJson);
  if (!result) {
    //Probably, track is expired or was saved in an invalid format. So remove it from cache.
    storage.removeItem(key);
    return null;
  }
  return result.tracks;
}

export function cacheTracks(artistName, bpm, tracks) {
  const storage = _getStorage();
  if (!storage) { return; } //Caching disabled.

  const tracksJson = _serializeTracks(tracks);
  const key = _getArtistBpmKey(artistName, bpm);

  let okayToFreeMore = true;
  while(true) {
    try {
      storage.setItem(key, tracksJson);
      return;
    } catch(err) {
      //localStorage full.
      if (!okayToFreeMore) {
        // Weird case - maybe a really huge set of data, or really small local storage capacity
        // in the browser.
        console.error('Could not cache tracks for ' + key + ' even after freeing local storage.');
        return;
      }
    }
    okayToFreeMore = _freeSomeLocalStorage();
  }
}

import SpotifyWebApi from 'spotify-web-api-js';

import { calcBpmCloseness } from './bpm-calc';
import { getCachedTracks, cacheTracks } from './cache';
import waterfall from './waterfall-promise';

let initData = null;

const SEARCH_LIMIT = 50;
const AUDIO_FEATURES_LIMIT = 50;

function _init(spotifyApi) {
  let s;
  if (initData) {
    return Promise.resolve(initData);
  } else {
    s = new SpotifyWebApi();
    return fetch('https://spotify-web-api-token.herokuapp.com/token').then((response) => {
      return response.json();
    }).then((responseObj) => {
      s.setAccessToken(responseObj.token);
      initData = {
        spotifyWebApi: s
      };
      return initData;
    });
  }
}

function _getArtistId({s, artist}) {
  return s.searchArtists(`artist:${artist}`, { limit: 1 }).then( (response) => {
    if (!response.artists.total) {
      return null;
    } else {
      return response.artists.items[0].id;
    }
  });
}

function _getArtistAlbums({s, artistId}) {
  //Get first album, just to see how many there are.
  return s.getArtistAlbums(artistId, { limit: 1 }).then( (response) => {
    if (!response.total) {
      return 0; //A no-hit wonder?
    } else {
      return response.total;
    }
  }).then( (albumCount) => {
    if (!albumCount) return null;
    //Most artists just need one call to get all their albums. But then there is Prince.
    let apiCallPromises = [];
    for (let offset = 0; offset < albumCount; offset += SEARCH_LIMIT) {
      apiCallPromises.push( s.getArtistAlbums(artistId, { offset, limit: SEARCH_LIMIT }) );
    }
    return Promise.all(apiCallPromises);
  }).then( (albumResults) => {
    let albumIds = [];
    if (albumResults) {
      albumResults.forEach( (albumResult) => {
        albumIds = albumIds.concat( albumResult.items.map( (item) => item.id ) );
      });
    }
    return albumIds;
  });
}

function _isTrackByArtist(track, artistId) {
  return (track.artists.find( (artist) => artist.id === artistId ) !== undefined);
}

function _getAlbumTracks({s, artistId, albumIds}) {
  const ALBUMS_LIMIT = 20;
  let apiCallPromises = [];
  for (let offset = 0; offset < albumIds.length; offset += ALBUMS_LIMIT) {
    const someAlbumIds = albumIds.slice(offset, offset + ALBUMS_LIMIT);
    apiCallPromises.push( s.getAlbums(someAlbumIds, { limit: ALBUMS_LIMIT }) );
  }
  return Promise.all(apiCallPromises).then( (albumResults) => {
    let tracks = [];
    albumResults.forEach( (albumResult) => {
      albumResult.albums.forEach( (album) => {
        album.tracks.items.forEach( (track) => {
          if (_isTrackByArtist(track, artistId)) { // For case where a song by artist is on a compilation album with other work that isn't by them.
            tracks.push({ trackId: track.id, track: track.name, album: album.name, previewUrl: track.preview_url });
          }
        });
      });
    });
    return tracks;
  });
}

function _getAudioFeaturesForTracks(s, trackIds) {
  return s.getAudioFeaturesForTracks(trackIds);
}

function _findBpmForTracks({s, onUpdateLoaded, onNextTrackIds}) {
  const trackIds = onNextTrackIds();
  return _getAudioFeaturesForTracks(s, trackIds)
  .then( (response) => {
    const bpms = response.audio_features.map( (audioFeatures) =>
        Math.round(audioFeatures.tempo)
    );
    onUpdateLoaded(bpms);
    return; // BPM information gets passed via above call to onUpdateLoaded().
  });
}

function _getProgressSummary(progress) {
  const FIND_ARTIST_START_PERCENT = 1;
  const FIND_SONGS_START_PERCENT = 20;
  const FIND_BPM_START_PERCENT = 50;
  const FIND_BPM_END_PERCENT = 99;
  const FIND_BPM_SIZE = FIND_BPM_END_PERCENT - FIND_BPM_START_PERCENT;

  if (!progress.artistId) {
    return { description: 'Finding artist...', percent: FIND_ARTIST_START_PERCENT };
  }
  if (progress.trackCount === null) {
    return { description: 'Finding songs...', percent: FIND_SONGS_START_PERCENT };
  }

  if (progress.trackCount === 0) { return FIND_BPM_END_PERCENT; }
  const bpmsLoaded = (progress.bpmsLoaded === null) ? 0 : progress.bpmsLoaded;
  const calcPercent = FIND_BPM_START_PERCENT + Math.floor(FIND_BPM_SIZE *
    (bpmsLoaded / progress.trackCount));
  return { description: 'Finding BPM for ' + progress.trackCount + ' songs...', percent: calcPercent };
}

function _filterAndSortTracksByBpm(tracks, targetBpm) {
  const filteredTracks = tracks.filter( (track) => { return calcBpmCloseness(targetBpm, track.bpm) < 10; });
  const sortedTracks = filteredTracks.sort( (trackA, trackB) => Math.sign(trackB.bpm - trackA.bpm) );
  const deduped = sortedTracks.filter( (track, index) => {
    return (sortedTracks.find( (track2, index2) => {
      return (index !== index2 && track.track === track2.track && track.album === track2.album);
    }) === undefined);
  });
  return deduped;
}

// Returns an array of functions suitable for adding to a waterfall promise.
function _getFindBpmFuncs({s, trackCount, onNextTrackIds, onUpdateLoaded}) {
  let funcs = [];
  const findBpmFunc = () => _findBpmForTracks({s, onNextTrackIds, onUpdateLoaded});
  for (let offset = 0; offset < trackCount; offset += AUDIO_FEATURES_LIMIT) {
    funcs.push(findBpmFunc);
  }
  return funcs;
}

export function findTracksByArtistBpm({artist, targetBpm, onProgressUpdate}) {
  let s;

  const progress = {
    artistId: null,
    trackCount: null,
    bpmsLoaded: null,
    tracks: []
  };

  onProgressUpdate({description:'', percent:0});

  function _onNextBpmTrackIds() {
    let trackIds = [];
    const offset = (progress.bpmsLoaded === null) ? 0 : progress.bpmsLoaded;
    const end = Math.min(offset + AUDIO_FEATURES_LIMIT, progress.tracks.length);
    for (let i = offset; i < end; ++i) {
      trackIds.push(progress.tracks[i].trackId);
    }
    return trackIds;
  }

  function _updateBpmsLoaded(bpms) {
    const loadedCount = bpms.length;
    if (progress.bpmsLoaded === null) { progress.bpmsLoaded = 0; }
    const offset = progress.bpmsLoaded;
    for (let i = 0; i < loadedCount; ++i) {
      progress.tracks[offset + i].bpm = bpms[i];
    }
    progress.bpmsLoaded += loadedCount;
    onProgressUpdate(_getProgressSummary(progress));
  }

  // Grab a past look up from the local storage cache, if it's there.
  const cachedTracks = getCachedTracks(artist, targetBpm);
  if (cachedTracks) {
    onProgressUpdate({description:'', percent:100});
    return Promise.resolve(cachedTracks);
  }

  // Init the API, get an access token if needed.
  return _init().then( ({spotifyWebApi}) => {
    onProgressUpdate(_getProgressSummary(progress));
    s = spotifyWebApi;
    return _getArtistId({s, artist});
  }).then((artistId) => {
    if (!artistId) { throw new Error(`I couldn't find an artist matching that name.`); }
    progress.artistId = artistId;
    onProgressUpdate(_getProgressSummary(progress));
    return _getArtistAlbums({s, artistId});
  }).then((albumIds) => {
    if (!albumIds.length) { throw new Error(`I couldn't find any albums for that artist.`); }
    onProgressUpdate(_getProgressSummary(progress));
    return _getAlbumTracks({s, artistId:progress.artistId, albumIds});
  }).then((tracks) => {
    if (!tracks.length) { throw new Error(`I couldn't find any tracks for that artist.`); }

    progress.tracks = tracks;
    progress.trackCount = tracks.length;
    onProgressUpdate(_getProgressSummary(progress));

    // Run another set of queries to get BPM via audio features for all the tracks.
    const findBpmFuncs = _getFindBpmFuncs({s, trackCount:progress.trackCount,
      onUpdateLoaded:_updateBpmsLoaded, onNextTrackIds:_onNextBpmTrackIds});
    return waterfall(findBpmFuncs);
  }).then( () => {
    // Filter out tracks that aren't within 10 BPM of target, and sort by BPM. Cache all this work
    // in local storage for better performance and less API requests to Spotify in the future.
    const tracks = _filterAndSortTracksByBpm(progress.tracks, targetBpm);
    cacheTracks(artist, targetBpm, tracks);
    onProgressUpdate({description:'', percent:100});
    return tracks;
  });
}

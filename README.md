# The BPM Song Finder

It's a web app that finds songs with a specific tempo expressed in BPM (beats
per minute). I created it after noticing that every other solution I found on
the web wouldn't work well for me.

My gripes about other websites with BPM-searching options, e.g. jog.fm:
* They depend on a very small subset of tracks--not the full discography of artists.
* Only popular artists are in their selection.
* Some are just set playlists that don't change.

There is also software that analyzes all the audio files on your computer to show
the tempo of files in your own collection, which is cool. But this is not very
good for discovering new music that you haven't purchased and downloaded yet.

My app is pretty simple and lets you find a ton of songs in your target BPM.
You just put in the name of an artist you like, and a target BPM. (180 BPM is
commonly used for runners.) And then the app shows songs by that artist that
match or are close to the BPM you chose. The results are color-coded to show how
close each song is to the target BPM. Half-tempo results are also considered
close, e.g. 90bpm matches to every other beat of 180bpm.

# Underneath the Hood

The song database comes from Spotify. They have a great selection of songs and
a sweet API for accessing them.

This app is grabbing a huge amount of data from Spotify. When you ask for some
artists with big discographies like "Prince" or "David Bowie", data for
thousands of tracks is downloaded and processed. Popular artists
that have been around for decades, get their songs onto compilations, and multiple
versions of their songs are made, e.g. remixes, edits. There are request limits
imposed by Spotify, and I've taken a lot of care in making the API requests
efficient and reducing the need to call Spotify APIs.

Queries are cached in the browser's local storage, so if you enter an artist
and BPM a second time, you'll notice the screen update with results near instantly.
Cached results go stale after a week, and a new query will be made at that point.

# Open Source Stuff

I've put this out into the world under the oh-so-permissive MIT license. Feel
free to use the code for your own projects. I would appreciate bug reports and
source code contributions.

-Erik Hermansen
ehermansen@seespacelabs.com

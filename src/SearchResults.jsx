import React, { Component } from 'react';
import { Alert, Panel, ProgressBar, Table } from 'react-bootstrap';
import PropTypes from 'prop-types';

import { calcBpmCloseness } from './bpm-calc';
import MutantText from './MutantText';
import PreviewPlayer from './PreviewPlayer';

class SearchResults extends Component {
  constructor() {
    super();
    this.state = {
      playingIndex: null
    };

    this.audioPlayers = {}; //Purposefully not putting in this.state to avoid recursion issues with audioPlayer ref-binding.

    this._handleBindAudioPlayer = this._handleBindAudioPlayer.bind(this);
    this._handlePlay = this._handlePlay.bind(this);
    this._handlePause = this._handlePause.bind(this);
  }

  render() {
    const className = 'search-results-panel clear-float';

    if (this.props.loadingPercent !== null) {
      return (<Panel className={className}>{this.props.loadingDescription}<ProgressBar active now={this.props.loadingPercent} label={this.props.loadingPercent + '%'}/></Panel>);
    }

    if (this.props.searchError) {
      return (<Panel className={className}><Alert bsStyle='warning'>{this.props.searchError}</Alert></Panel>);
    }

    if (!this.props.searchResults) {
      return (<Panel className={className}><MutantText className='letsFindText' text="Let's find some songs!" /></Panel>);
    }
    if (!this.props.searchResults.length) {
      return (<Panel className={className}><Alert bsStyle='warning'>No results found. Maybe try different search criteria.</Alert></Panel>);
    }

    const _getRowClassForBpm = ( rowBpm, targetBpm ) => {
      let howCloseBpm = calcBpmCloseness(targetBpm, rowBpm);
      if (howCloseBpm < 10) {
        return 'search-result-row__bpm-' + howCloseBpm;
      }
    }

    const rows = this.props.searchResults.map( (result, index) => {
      const rowClass = _getRowClassForBpm( result.bpm, this.props.targetBpm );
      const isPlaying = (index === this.state.playingIndex);
      return (
        <tr className={rowClass} key={index}>
          <td>{result.bpm}</td>
          <td>{result.track}</td>
          <td>{result.album}</td>
          <td><PreviewPlayer onBindAudioPlayer={this._handleBindAudioPlayer} onPlay={this._handlePlay} onPause={this._handlePause} index={index} url={result.previewUrl} isPlaying={isPlaying}/></td>
        </tr>);
    });

    return (
      <Panel className={className}>
        <Table bordered condensed>
          <thead><tr className='search-results--header-row'><th>BPM</th><th>Track</th><th>Album</th><th>Preview</th></tr></thead>
          <tbody>{rows}</tbody>
        </Table>
      </Panel>
    );
  }

  _handleBindAudioPlayer(index, player) {
    this.audioPlayers[index] = player;
  }

  _handlePlay(index) {
    // Stop any player that is already playing.
    Object.keys(this.audioPlayers).forEach( (eachIndex) => {
      if (eachIndex !== index) {
        const player = this.audioPlayers[eachIndex];
        if (player && !player.paused) {
          player.pause();
        }
      }
    });

    // Start the new player playing.
    const player = this.audioPlayers[index];
    if (player) { player.play(); }

    //Causes associated play button to render in playing state.
    this.setState({playingIndex: index});
  }

  _handlePause(index) {
    const player = this.audioPlayers[index];
    if (player) { player.pause(); }

    if (index === this.state.playingIndex) {
      //Render buttons to show nothing is playing.
      this.setState({playingIndex: null});
    }
  }
};

SearchResults.propTypes = {
  searchResults: PropTypes.arrayOf(PropTypes.object),
  searchError: PropTypes.string,
  targetBpm: PropTypes.number,
  loadingPercent: PropTypes.number,
  loadingDescription: PropTypes.string
};

export default SearchResults;

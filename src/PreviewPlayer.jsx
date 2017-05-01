import React, { Component } from 'react';
import { Button, Glyphicon } from 'react-bootstrap';
import PropTypes from 'prop-types';


class PreviewPlayer extends Component {
  render() {
    if (!this.props.url || this.props.url === '') { return null; }

    const _onPlay = () => {
      this.props.onPlay(this.props.index);
    }

    const _onPause = () => {
      this.props.onPause(this.props.index);
    }

    let playPauseButton = (this.props.isPlaying) ?
      (<Button bsSize='xsmall' onClick={_onPause}><Glyphicon glyph='pause' /></Button>) :
      (<Button bsSize='xsmall' onClick={_onPlay}><Glyphicon glyph='play' /></Button>);

    return (
      <div className={this.props.className}>
        <audio ref={(el) => { this.audioPlayerRef = el; this.props.onBindAudioPlayer(this.props.index, el); }}>
          <source src={this.props.url} type='audio/mpeg' />
        </audio>
        {playPauseButton}
      </div>
    );
  }

};

PreviewPlayer.propTypes = {
  className: PropTypes.string,
  index: PropTypes.number.isRequired,
  onBindAudioPlayer: PropTypes.func.isRequired,
  onPlay: PropTypes.func.isRequired,
  onPause: PropTypes.func.isRequired,
  isPlaying: PropTypes.bool
};

export default PreviewPlayer;

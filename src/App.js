import React, { Component } from 'react';
import {
  Button,
  Col,
  Form,
  FormControl,
  FormGroup,
  HelpBlock
} from 'react-bootstrap';

// Util
import { findTracksByArtistBpm } from './search';
import {
  getArtistHelpText,
  getBpmHelpText,
  validateAll,
  validateArtist,
  validateBpm,
  valState
} from './validation';

// Components
import Footer from './Footer';
import SearchResults from './SearchResults';

class App extends Component {
  constructor() {
    super();
    this.state = {
      artist: '',
      bpm: 180,
      searchResults: null,
      searchError: null,
      loadingPercent: null,
      loadingDescription: null
    };

    this._handleArtistChange = this._handleArtistChange.bind(this);
    this._handleBpmChange = this._handleBpmChange.bind(this);
    this._handleKeyPress = this._handleKeyPress.bind(this);
    this._handleSearchClick = this._handleSearchClick.bind(this);
    this._handleProgressUpdate = this._handleProgressUpdate.bind(this);
    this._search = this._search.bind(this);
  }

  render() {
    const artistHelpText = getArtistHelpText(this.state.artist) || 'Artist';
    const bpmHelpText = getBpmHelpText(this.state.bpm) || 'Target BPM';
    const searchDisabled = (valState(validateAll(this.state)) !== 'success');

    return (
      <div className='app'>
        <div className='header'>
          <Form className='search-form'>
            <FormGroup controlId='formAuthor'
                validationState={valState(validateArtist(this.state.artist))}>
              <Col sm={2}>
                <FormControl type='text' value={this.state.artist} placeholder='e.g. David Bowie'
                  onChange={this._handleArtistChange} onKeyPress={this._handleKeyPress}
                />
                <HelpBlock>{artistHelpText}</HelpBlock>
              </Col>
            </FormGroup>
            <FormGroup controlId='formBPM' validationState={valState(validateBpm(this.state.bpm))}>
              <Col sm={2}>
                <FormControl type='text' value={this.state.bpm} placeholder='e.g. 180'
                  onChange={this._handleBpmChange} onKeyPress={this._handleKeyPress}
                />
                <HelpBlock>{bpmHelpText}</HelpBlock>
              </Col>
              <Col sm={1}>
                <Button bsStyle='primary' disabled={searchDisabled}
                  onClick={this._handleSearchClick}>Search</Button>
              </Col>
            </FormGroup>
          </Form>
          <div className='title-graphic' />
        </div>
        <SearchResults searchResults={this.state.searchResults} searchError={this.state.searchError}
            targetBpm={this.state.bpm} loadingPercent={this.state.loadingPercent}
            loadingDescription={this.state.loadingDescription}/>
        <Footer />
      </div>
    );
  }

  _handleProgressUpdate({description, percent}) {
    this.setState({loadingPercent:percent, loadingDescription:description});
  }

  _handleKeyPress(target) {
    if (target.charCode===13 /* enter */) {
      this._search();
    }
  }

  _handleSearchClick() {
    this._search();
  }

  _search() {
    this.setState({ searchError: null });
    findTracksByArtistBpm({
      artist: this.state.artist,
      targetBpm: this.state.bpm,
      onProgressUpdate: this._handleProgressUpdate,
      onLoadingTrackCount: this._handleLoadingTrackCount,
    })
    .then((searchResults) => {
      this.setState({ searchResults, loadingPercent: null });
    })
    .catch((err) => {
      if (err && err.status === 429) {
        this.setState({
          loadingPercent: null,
          searchError: `Spotify is complaining about the impressive number of ` +
            `requests you're making to their server. It could be that a different ` +
            `query will work. Or maybe just try again later.`
        });
      } else if (err && err.message) {
        this.setState({
          loadingPercent: null,
          searchError: err.message
        });
      } else {
        console.error(err);
        this.setState({
          loadingPercent: null,
          searchError: `Your search failed in some unexpected way, and I'm sorry about that. ` +
            `It could be that a different query will work. Or maybe just try again later.`
        });
      }
    });
  }

  _handleArtistChange(e) {
    this.setState({ artist: e.target.value });
  }

  _handleBpmChange(e) {
    const numeralsOnly = e.target.value.replace(/\D/g,'')
    const bpm = parseInt(numeralsOnly, 10);
    if (isNaN(bpm)) {
      this.setState({ bpm: '' });
    } else {
      this.setState({ bpm });
    }
  }
}

export default App;

function _consolidateHelpText({hints, warnings, errors}) {
  let messages = [];
  if (errors) { messages = messages.concat(errors); }
  if (warnings) { messages = messages.concat(warnings); }
  if (hints) { messages = messages.concat(hints); }
  return messages.join(' ');
}

export function validateArtist(artist) {
  let hints = [];
  if (!artist || !artist.length) {
    hints.push('Enter an artist.');
  }
  return { hints };
}

export function validateBpm(bpm) {
  let hints = [], errors = [];
  if (bpm === undefined || bpm === null || bpm === '') {
    hints.push('Enter a BPM.');
  } else if (bpm < 1 || bpm > 1000) {
    errors.push('BPM should be between 1 and 1000.');
  }
  return { hints, errors };
}

export function getArtistHelpText(artist) {
  return _consolidateHelpText(validateArtist(artist));
}

export function getBpmHelpText(bpm) {
  return _consolidateHelpText(validateBpm(bpm));
}

export function validateAll(state) {
  let errors = [], warnings = [], hints = [];

  function _addResults(validation) {
    if (validation.errors) { errors = errors.concat(validation.errors); }
    if (validation.warnings) { warnings = warnings.concat(validation.warnings); }
    if (validation.hints) { hints = hints.concat(validation.hints); }
  }

  _addResults(validateArtist(state.artist));
  _addResults(validateBpm(state.bpm));

  return { hints, warnings, errors };
}

export function valState({hints, warnings, errors}) {
  if (errors && errors.length) {
    return 'error';
  } else if (warnings && warnings.length) {
    return 'warning';
  } else if (hints && hints.length) {
    return;
  } else {
    return 'success';
  }
}

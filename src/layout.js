export const bsSize = {
  XS: 0,
  SM: 768,
  MD: 992,
  LG: 1200
};

export const getViewportWidth = () => {
  return Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
};

export const getViewportHeight = () => {
  return Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
};

export const getBootstrapSize = () => {
  const w = getViewportWidth();
  if (w >= bsSize.LG) { return bsSize.LG; }
  if (w >= bsSize.MD) { return bsSize.MD; }
  if (w >= bsSize.SM) { return bsSize.SM; }
  return bsSize.XS;
};

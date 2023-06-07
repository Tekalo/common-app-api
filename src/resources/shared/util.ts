import xss from 'xss';

const escapeHTML = (data: object): object => {
  const escaped = xss(JSON.stringify(data));
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return JSON.parse(escaped);
};

export default escapeHTML;

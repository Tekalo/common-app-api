import app from './app.js';

const port = app.get('port') as number;

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`server running at http://localhost:${port}`);
});

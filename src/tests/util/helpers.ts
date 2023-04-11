/**
 * Prepend this function to tests that you want to conditionally run
 * Example: itif(1 == 1)('should run test',() => {});
 */
const itif = (condition: boolean) => (condition ? it : it.skip);

const getRandomString = () => Math.random().toString(36).slice(2);

// const getAuthToken = (email: string) =>  JSON.parse(Buffer.from(authToken.split('.')[1], 'base64').toString());

// const authToken = req.get('Authorization') || '';

// const { email } = JSON.parse(Buffer.from(authToken.split('.')[1], 'base64').toString());

export { itif, getRandomString };

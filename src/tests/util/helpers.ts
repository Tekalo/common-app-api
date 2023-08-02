/**
 * Prepend this function to tests that you want to conditionally run
 * Example: itif(1 == 1)('should run test',() => {});
 */
const itif = (condition: boolean) => (condition ? it : it.skip);

const getRandomString = () => Math.random().toString(36).slice(2);

export { itif, getRandomString };

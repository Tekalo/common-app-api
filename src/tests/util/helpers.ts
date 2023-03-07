const itif = (condition: boolean) => (condition ? it : it.skip);

export default itif;

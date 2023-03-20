/* eslint-disable no-console */

/*
This is an example of the format of the RDS database secret JSON value
that will be parsed from the DATABASE_SECRET env var.
{
  "engine": "postgres",
  "host": "<instance host name/resolvable DNS name>",
  "username": "<username>",
  "password": "<password>",
  "dbname": "<database name. If not specified, defaults to 'postgres'>",
  "port": "<TCP port number. If not specified, defaults to 5432>"
}
*/

const prep = (obj, arg) => {
  const val = obj[arg];
  if (!val) {
    throw new Error(`Secret is missing value for ${arg}`);
  }
  return encodeURIComponent(val);
};

const secret = JSON.parse(process.env.DATABASE_SECRET);
console.log(
  'postgresql://%s:%s@%s:%s/%s',
  prep(secret, 'username'),
  prep(secret, 'password'),
  prep(secret, 'host'),
  prep(secret, 'port'),
  prep(secret, 'dbname'),
);

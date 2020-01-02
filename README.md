# rest-skeleton-js

## Getting started
### Start by cloning this repository
```bash
$ git clone git@github.com:emilhornlund/rest-skeleton-js.git
```

### Generate keys and certificates

Generate a self signed key and certificate
```bash
$ openssl genrsa -out localhost.key 2048
$ openssl req -new -x509 -key localhost.key -out localhost.cert -days 3650 -subj /CN=localhost
```

Generate JWT public and private key pair
```bash
$ openssl genrsa -out private.pem 2048
$ openssl rsa -in private.pem -outform PEM -pubout -out public.pem
```

### Configuration
```bash
$ mv config.sample.yml config.yml
$ vim config.yml
```

### Install the dependencies
```bash
$ npm install
```

### Migrations
```bash
$ npx sequelize db:migrate --env dev
$ npx sequelize db:seed:all --env dev 
```

### Start the server
```bash
$ npm start
```

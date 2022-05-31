# blockbook-wrapper

Exposes a partial Blockbook compatible websocket API wrapping an HTTP-only Blockbook API server

#### Installation

Install Node and Yarn

    curl -sL https://deb.nodesource.com/setup_16.x -o nodesource_setup.sh
    sudo bash nodesource_setup.sh
    sudo apt-get install -y nodejs

    curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
    echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
    sudo apt update -y
    sudo apt install -y yarn

Run Yarn

    yarn && yarn prepare

Install pm2 globally

    sudo npm install pm2 -g

Install pm2 log rotation (note: the command is pm2 instead of npm)

    sudo pm2 install pm2-logrotate

#### Running Source

    yarn start

#### Launch API server and rates engine for production

    pm2 start pm2.json

#### Restart, stop, delete service

Control pm2

    pm2 stop wrapperServer
    pm2 restart wrapperServer
    pm2 delete wrapperServer

Launch pm2 on restart

    pm2 startup
    pm2 save

#### Monitor logs and status

    pm2 monit
    pm2 logs wrapperServer

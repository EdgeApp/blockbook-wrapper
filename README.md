# blockbook-wrapper


## Installation

```sh
# Install Yarn

    https://linuxize.com/post/how-to-install-yarn-on-ubuntu-18-04/

# Install Node

    curl -sL https://deb.nodesource.com/setup_16.x -o nodesource_setup.sh
    sudo bash nodesource_setup.sh

# Run Yarn

    yarn

```

## Wrapper Server

To launch the server, just type `yarn start`.

You can also build the server code by running `yarn build`, which puts its output in the `lib` folder. You can then use `pm2` or similar tools to install the software on your server machine.

```

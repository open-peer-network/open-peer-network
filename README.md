# Elixir Websocket

## Setup

1) Setup and launch your Cayley database
2) Setup and launch your Phoenix server
3) Setup and launch your React frontend


### Setup and Launch Cayley Database

1) [Install the Cayley database](https://github.com/cayleygraph/cayley/blob/master/docs/installation.md).
   * You may have to [build from source](https://github.com/cayleygraph/cayley/blob/master/docs/contributing.md) as I did.
2) Make sure `cayley` is available from your path. You can use `which cayley` to check.
   * If it's not, move they cayley folder to your home directory and symlink to it from `/usr/local/bin`.
3) Back in the current project directory, copy `cayley.yml.example` -> `cayley.yml`
4) Run `cayley init`


### Setup and Launch Phoenix server

Assuming you have both Elixir and Mix properly installed...

1) Run `mix deps.get` to install the Elixir dependencies
2) Run `iex -S mix phx.server` to start Elixir


## Frontend

The project includes a React-based frontend.

1) `cd app/`
2) Copy app/.env.example -> app/.env
3) Run `npm install` or `yarn install` if you have yarn (yarn is better)
4) Run `npm start`


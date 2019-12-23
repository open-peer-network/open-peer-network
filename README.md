# Open Peer Network

## Security Resources For Developers
- https://smallstep.com/cli/
- https://github.com/OWASP/CheatSheetSeries/blob/master/Index.md


## Setup

1) Setup and launch your Cayley database
2) Setup and launch your Phoenix server
3) Setup and launch your React frontend


### Setup and Launch Cayley Database

1) Build the Cayley DB from source:
   * `git clone https://github.com/cayleygraph/cayley`
   * `cd cayley`
   * `git checkout -b v0.8.x-dev_opn 862dca511c07c883fa1553dbc7ef1f97fa2904ec`
   * `go mod download`
   * `go get -u github.com/gobuffalo/packr/v2/packr2`
   * `packr2` (If you can't find `packr2` in your path, try `~/go/bin/packr2`)
   * `go build ./cmd/cayley`
1) Make sure `cayley` is available from your path. You can use `which cayley` to check.
   * If it's not, move they cayley folder to your home directory and symlink to it from `/usr/local/bin`.
1) Back in the current project directory, copy `cayley.yml.example` -> `cayley.yml`
1) Run `cayley init`


### Setup and Launch Phoenix Server

Assuming you have both Elixir and Mix properly installed...

1) Move into the project directory using `cd`
1) Run `mix deps.get` to install the Elixir dependencies
1) Run `iex -S mix phx.server` to start the Elixir server


### Setup and Launch React Frontend

The project includes a React-based frontend.

1) `cd app/`
1) Copy `app/.env.example` -> `app/.env` and update the file with your test user credentials
1) Move into the `app/` directory: `cd app/`
1) Run `npm install` or `yarn install` if you have yarn (yarn is better)
1) Run `npm start`

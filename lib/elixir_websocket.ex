defmodule ElixirWebsocket do
  use Application

  def start(_type, _args) do
    children = [
      {
        Plug.Cowboy,
        scheme: :http,
        plug: ElixirWebsocket.Router,
        options: [dispatch: dispatch(), port: 4000]
      },
      {
        Registry,
        keys: :unique,
        name: Registry.ElixirWebsocket
      },
      {
        ElixirWebsocket.Caylir,
        [:caylir]
      },
      {
        ElixirWebsocket.Database,
        [:database]
      },
    ]
    Supervisor.start_link(children, [
      strategy: :one_for_one,
      name: ElixirWebsocket.Application,
    ])
  end

  defp dispatch do
    [
      {:_,
        [
          {"/ws/[...]", ElixirWebsocket.SocketHandler, []},
          {:_, Plug.Cowboy.Handler, {ElixirWebsocket.Router, []}},
        ]
      }
    ]
  end
end

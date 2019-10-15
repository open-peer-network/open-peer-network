defmodule ElixirWebsocket do
  use Application

  def start(_type, _args) do
    children = [
      Plug.Cowboy.child_spec(
        scheme: :http,
        plug: ElixirWebsocket.Router,
        options: [
          dispatch: dispatch(),
          port: 4000
        ]
      ),
      Registry.child_spec(
        keys: :duplicate,
        name: Registry.ElixirWebsocket
      )
    ]

    opts = [strategy: :one_for_one, name: ElixirWebsocket.Application]
    Supervisor.start_link(children, opts)
  end

  defp dispatch do
    [
      {:_,
        [
          {"/ws/[...]", ElixirWebsocket.SocketHandler, []},
          {:_, Plug.Cowboy.Handler, {ElixirWebsocket.Router, []}}
        ]
      }
    ]
  end
end

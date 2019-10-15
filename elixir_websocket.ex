defmodule MyWebsocketApp do
  use Application

  def start(_type, _args) do
    children = [
      Plug.Cowboy.child_spec(
        scheme: :http,
        plug: MyWebsocketApp.Router,
        options: [
          dispatch: dispatch(),
          port: 4000
        ]
      ),
      Registry.child_spec(
        keys: :duplicate,
        name: Registry.MyWebsocketApp
      )
    ]

    opts = [strategy: :one_for_one, name: MyWebsocketApp.Application]
    Supervisor.start_link(children, opts)
  end

  defp dispatch do
    [
      {:_,
        [
          {"/ws/[...]", MyWebsocketApp.SocketHandler, []},
          {:_, Plug.Cowboy.Handler, {MyWebsocketApp.Router, []}}
        ]
      }
    ]
  end
end

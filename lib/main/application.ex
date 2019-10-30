defmodule ElixirWebsocket.Application do
  @moduledoc false
  use Application

  def start(_type, _args) do
    children = [
      {
        Registry,
        keys: :unique,
        name: Registry.ElixirWebsocket
      },
      ElixirWebsocket.Database,
      ElixirWebsocketWeb.Endpoint,
    ]

    Supervisor.start_link(children, [
      strategy: :one_for_one,
      name: ElixirWebsocket.Supervisor,
    ])
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  def config_change(changed, _new, removed) do
    ElixirWebsocketWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end

defmodule ElixirWebsocket.SocketHandler do
  @behaviour :cowboy_websocket
  alias ElixirWebsocket.Database
  require Logger

  def init(request, _state) do
    Database.start_link(0)
    state = %{registry_key: request.path}
    {:cowboy_websocket, request, state}
  end

  def websocket_init(state) do
    Registry.ElixirWebsocket
    |> Registry.register(state.registry_key, {})

    {:ok, state}
  end

  def websocket_handle({:text, payload}, state) do
    Logger.info "websocket_handle #{payload}"

    case Jason.decode(payload) do
      {:ok, [s, p, o]} ->
        Database.write([s, p, o])
        {:reply, {:text, payload}, state}

      {:ok, [s, p, o, l]} ->
        Database.write([s, p, o, l])
        {:reply, {:text, payload}, state}

      {_, _} ->
        {:reply, {:text, Jason.encode!(%{ status: "invalid data" })}, state}
    end
  end

  def websocket_info(info, state) do
    {:reply, {:text, info}, state}
  end
end

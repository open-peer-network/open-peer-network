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

    if payload == "__ping__" do
      {:reply, {:text, "__pong__"}, state}
    else
      Logger.info "websocket_handle #{inspect(Jason.decode!(payload))}"

      case Jason.decode(payload) do
        {:ok, [ action, data ] } ->
          message = Database.run(action, data)
          {:reply, {:text, message}, state}
        {_, _} ->
          {:reply, {:text, Jason.encode!(%{ status: "invalid data" })}, state}
      end
    end
  end

  def websocket_info(info, state) do
    {:reply, {:text, info}, state}
  end
end

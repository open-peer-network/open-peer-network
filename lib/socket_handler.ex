defmodule ElixirWebsocket.SocketHandler do
  @behaviour :cowboy_websocket

  def init(request, _state) do
    state = %{registry_key: request.path}

    {:cowboy_websocket, request, state}
  end

  def websocket_init(state) do
    Registry.ElixirWebsocket
    |> Registry.register(state.registry_key, {})

    {:ok, state}
  end

  def websocket_handle({:text, json}, state) do
    %{ "data" => triple } = Jason.decode!(json)
    triple_string = Jason.encode! triple

    Registry.ElixirWebsocket
    |> Registry.dispatch(state.registry_key, fn(entries) ->
      for {pid, _} <- entries do
        if pid != self() do
          Process.send(pid, triple_string, [])
        end
      end
    end)

    {:reply, {:text, triple_string}, state}
  end

  def websocket_info(info, state) do
    {:reply, {:text, info}, state}
  end
end

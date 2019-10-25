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
    %{ "data" => %{ "spo" => triple } } = Jason.decode!(json)
    IO.puts "data: #{inspect triple}"
    tripleString = Jason.encode!(triple)

    Registry.ElixirWebsocket
    |> Registry.dispatch(state.registry_key, fn(entries) ->
      for {pid, _} <- entries do
        if pid != self() do
          Process.send(pid, tripleString, [])
        end
      end
    end)

    {:reply, {:text, tripleString}, state}
  end

  def websocket_info(info, state) do
    {:reply, {:text, info}, state}
  end
end

defmodule ElixirWebsocketWeb.LobbyChannel do
  use Phoenix.Channel
  alias ElixirWebsocket.Database

  def init(state), do: {:ok, state}

  def join(topic, _message, socket) do
    case topic do
      "topic:counter" ->
        send(self(), :after_join)
        {:ok, assign(socket, :count, 1)}
      _ ->
        {:ok, assign(socket, :count, 1)}
    end
  end

  def handle_in("query", payload, socket) do
    Database.query(payload, socket)
    {:noreply, socket}
  end

  def handle_in(message, _payload, socket) do
    IO.puts "no match for message: '#{message}'"
    {:noreply, socket}
  end

  def handle_info(:after_join, socket) do
    push(socket, "count", %{ value: socket.assigns.count })

    Process.sleep(1_000)
    socket = assign(socket, :count, socket.assigns.count + 1)
    send(self(), :after_join)

    {:noreply, socket}
  end
end

defmodule ElixirWebsocketWeb.LobbyChannel do
  use Phoenix.Channel
  # alias ElixirWebsocket.Database

  def join(topic, _message, socket) do
    case topic do
      "topic:counter" ->
        socket = assign(socket, :count, 1)
        send(self(), :after_join)
        {:ok, socket}
      _ ->
        {:ok, socket}
    end
  end

  def handle_in("topic:graph:read", resource_desc, socket) do
    # record = Database.read(record_id)
    IO.puts Jason.encode!(resource_desc)

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

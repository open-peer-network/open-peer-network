defmodule ElixirWebsocketWeb.Topics do
  use Phoenix.Channel
  alias ElixirWebsocket.Database

  @moduledoc """
  In our architecture, each ID is a topic.

      {
        "user_id1": {
          "firstName": "Rob"
        }
      }

  Would be topic `user_id1`, with a message payload of
  `{ "firstName": "Rob" }`
  """

  def init(state), do: {:ok, state}

  def join(_topic, _msg, socket), do: {:ok, socket}

  def handle_in("watch", %{"s" => subj, "p" => pred}, socket) do
    Database.query(%{"s" => subj, "p" => pred}, fn data ->
      push(socket, "value", data)
    end)

    {:noreply, socket}
  end

  def handle_in("read:" <> id, payload, socket) do
    Database.query(payload, fn data ->
      push(socket, "read:#{id}", data)
    end)

    {:noreply, socket}
  end

  def handle_in("login", payload, socket) do
    case payload do
      ["user1", "password"] ->
        IO.puts("login success")
        push(socket, "auth:success", %{data: "06ab7fe0-0039-11ea-9024-45e6b6f0fb4c"})
        {:noreply, socket}

      _ ->
        IO.puts("login failed")
        push(socket, "auth:failure", %{})
        {:noreply, socket}
    end
  end

  def handle_in(action, payload, socket) do
    IO.puts("not matched!!!!!!!!!!!!!! #{action}")
    IO.inspect(payload)
    {:noreply, socket}
  end
end

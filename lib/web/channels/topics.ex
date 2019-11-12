defmodule ElixirWebsocketWeb.Topics do
  use Phoenix.Channel
  alias ElixirWebsocket.Database
  alias ElixirWebsocketWeb.Endpoint

  @moduledoc """
  In our architecture, each ID is a topic.

      {
        "user_id1": {
          "firstName": "Rob"
        }
      }

  Would be topic `user_id1:firstName`, with a message payload of
  `{ "data": "Rob" }`
  """

  def init(state), do: {:ok, state}

  def join(_topic, _msg, socket) do
    {:ok, assign(socket, :topics, [])}
  end

  def handle_in("write", payload, socket) do
    case payload do
      %{"s" => s, "p" => p, "o" => o} when is_binary(s) and is_binary(p) and is_binary(o) ->
        resp = Database.write(s, p, o)
        IO.puts("write: #{inspect(resp)}")

        resp = Endpoint.broadcast!("topic:#{s}:#{p}", "value", %{"data" => o})
        IO.puts("broadcast returned: #{inspect(resp)}")

        {:noreply, socket}

      _ ->
        IO.puts("write fail, no match for payload: #{inspect(payload)}")
        {:noreply, socket}
    end
  end

  def handle_in("read:" <> request_id, payload, socket) do
    push(socket, "read:#{request_id}", Database.query(payload))
    {:noreply, socket}
  end

  def handle_in(action, payload, socket) do
    IO.puts("No matching action for action: #{inspect(action)}, payload: #{inspect(payload)}")
    {:noreply, socket}
  end
end

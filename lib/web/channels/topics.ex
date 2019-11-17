defmodule ElixirWebsocketWeb.Topics do
  use Phoenix.Channel
  # use Guardian, otp_app: :elixir_websocket
  alias ElixirWebsocket.Database
  alias ElixirWebsocketWeb.Endpoint
  alias DeltaCrdt.AWLWWMap

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

  def join(_topics, _msg, socket) do
    {:ok, Phoenix.Socket.assign(socket, %{"topics" => []})}
  end

  def handle_in("write", payload, socket) do
    case payload do
      %{"s" => s, "p" => p, "o" => o} when is_binary(s) and is_binary(p) and is_binary(o) ->
        {:ok, crdt_pid} = DeltaCrdt.start_link(AWLWWMap, sync_interval: 50)
        DeltaCrdt.mutate(crdt_pid, :add, ["#{s}:#{p}", o])

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

  def handle_in("read:" <> req_id, payload, socket) do
    push(socket, "read:#{req_id}", Database.query(payload))
    {:noreply, socket}
  end

  def handle_in("vault:" <> req_id, %{"s" => subj, "p" => pred, "password" => pw_stated}, socket) do
    #
    # Implement Guardian here
    #
    case Database.query(%{"s" => subj, "p" => pred}) do
      %{"data" => %{"password" => pw_found}} ->
        if pw_found == pw_stated do
          #
          # NOT A REAL IMPLEMENTATION
          #
          push(socket, "vault:#{req_id}", %{"status" => "success"})
        else
          push(socket, "vault:#{req_id}", %{"status" => "denied"})
        end

        {:noreply, socket}

      _ ->
        push(socket, "vault:#{req_id}", %{"status" => "error", "code" => 500})
        {:noreply, socket}
    end
  end

  def handle_in(action, payload, socket) do
    IO.puts("No match for action: #{inspect(action)}, payload: #{inspect(payload)}")
    {:noreply, socket}
  end
end

defmodule OPNWeb.TopicSP do
  use Phoenix.Channel
  import Phoenix.Socket, only: [assign: 2]
  alias OPN.Presence
  alias OPN.Database
  alias OPN.Util

  @moduledoc """
  In our architecture, each ID is a topic.

      {
        "user_id1": {
          "firstName": "Rob"
        }
      }

  Would be topic `sp:user_id1:firstName`, with a message payload of
  `{ "data": { "firstName": "Rob" } }`
  """

  def init(state), do: {:ok, state}

  def join(_topic, %{"public_key" => public_key}, socket) do
    send(self(), :after_join)
    {:ok, assign(socket, %{public_key: public_key})}
  end

  def join(topic, payload, _socket) do
    msg = "No match for topic: #{topic}, payload: #{inspect(payload)}. Likely missing public key."
    "ERROR: #{msg}" |> IO.puts()

    {:error, msg}
  end

  def handle_info(:after_join, socket) do
    users = Util.get_users_on_topic(socket.topic)
    "!!! FOUND USERS ON TOPIC #{socket.topic}: #{inspect(users)}" |> IO.puts()

    push(socket, "connect", %{"public_key" => Util.get_public_key(), "peers" => users})

    Presence.track(socket, socket.assigns.public_key, %{})
    push(socket, "presence_state", Presence.list(socket.topic))

    if !Enum.member?(users, socket.assigns.public_key) do
      :ets.insert(:users, {socket.topic, [socket.assigns.public_key | users]})
    end

    {:noreply, socket}
  end

  def handle_in("fetch", _payload, socket) do
    ["sp", subj, pred] = String.split(socket.topic, ":")

    case Util.get_data(socket.topic) do
      false ->
        case Database.query(%{"s" => subj, "p" => [pred]}) do
          {:ok, data} ->
            {msg, state} = Util.encrypt(socket, Jason.encode!(data))

            push(socket, "fetch response", %{
              "box" => Base.encode64(msg),
              "nonce" => Base.encode64(state.previous_nonce)
            })

            {:noreply, socket}

          {:error, reason} ->
            push(socket, "fetch response", %{"error" => reason})
            "query failed: #{inspect(reason)}" |> IO.puts()
            {:noreply, socket}
        end

      object ->
        {msg, state} = Util.encrypt(socket, Jason.encode!(%{
          "subject" => subj,
          "data" => %{pred => object},
        }))

        push(socket, "fetch response", %{
          "box" => Base.encode64(msg),
          "nonce" => Base.encode64(state.previous_nonce)
        })

        {:noreply, socket}
    end
  end

  def handle_in("write", %{"box" => box, "nonce" => nonce}, socket) do
    case Jason.decode(Util.decrypt(socket, box, nonce)) do
      {:ok, %{"s" => s, "p" => p, "o" => o}}
      when is_binary(s) and is_binary(p) and is_binary(o) ->
        # DeltaCrdt.mutate(crdt, :add, ["#{s}:#{p}", o])
        resp = Database.write(s, p, o)
        "write: #{inspect(resp)}" |> IO.puts()

        resp = OPNWeb.Endpoint.broadcast!("sp:#{s}:#{p}", "value", %{"data" => %{p => o}})
        "broadcast returned: #{inspect(resp)}" |> IO.puts()

        {:noreply, socket}

      json ->
        "JSON decode failed: #{inspect(json)}" |> IO.puts()
        {:noreply, socket}
    end
  end

  def handle_in(action, payload, socket) do
    "Topic: #{socket.topic}, no match for action: #{action}, payload: #{inspect(payload)}"
    |> IO.puts()

    {:noreply, socket}
  end
end

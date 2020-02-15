defmodule OPNWeb.TopicSP do
  use Phoenix.Channel
  import Phoenix.Socket, only: [assign: 2]
  # alias OPN.Presence
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

  def endpoint_broadcast!(socket, action, payload), do: OPNWeb.Endpoint.broadcast!(socket, action, payload)

  def join("sp:" <> topic, %{"public_key" => public_key}, socket) do
    send(self(), :after_join)

    {:ok, assign(socket, %{ public_key: public_key, db_topic: topic })}
  end

  def join(topic, payload, _socket) do
    msg = "No match for topic: #{topic}, payload: #{inspect(payload)}. Likely missing public key."
    "ERROR: #{msg}" |> IO.puts()

    {:error, msg}
  end

  def handle_info(:after_join, socket) do
    users = Util.get_users_on_topic(socket.assigns.db_topic)
    "!!! FOUND USERS ON TOPIC #{socket.assigns.db_topic}: #{inspect(users)}" |> IO.puts()

    push(socket, "connect", %{"public_key" => Util.get_public_key(:base64), "peers" => users})

    # Presence.track(socket, socket.assigns.public_key, %{})
    # push(socket, "presence_state", Presence.list(socket.topic))

    if !Enum.member?(users, socket.assigns.public_key) do
      :ets.insert(:users, {socket.assigns.db_topic, [socket.assigns.public_key | users]})
    end

    {:noreply, socket}
  end

  def handle_in("fetch", _payload, socket) do
    [subj, pred] = String.split(socket.assigns.db_topic, ":")

    case Util.get_data(socket.assigns.db_topic) do
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
        IO.puts "Found in :sp DB: #{IO.inspect(object)}"
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

  # def handle_in("write", ciphertext, socket) do
  def handle_in("write", %{"ct" => ciphertext}, socket) do
    ["sp", subj, pred] = socket.topic |> String.split(":")

    case Util.decrypt(socket, ciphertext) do
      {:ok, plaintext_obj} ->
        IO.puts("!!!!!!!! write received #{inspect(plaintext_obj)}")

        # DeltaCrdt.mutate(crdt, :add, ["#{s}:#{p}", o])
        :ok = Database.write(subj, pred, plaintext_obj)

        resp = endpoint_broadcast!(socket.topic, "value", %{"ct" => Util.encrypt(socket, plaintext_obj)})
        "broadcast returned: #{inspect(resp)}" |> IO.puts()

        :ets.insert(:sp, {socket.assigns.db_topic, plaintext_obj})

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

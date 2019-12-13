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
    # "!!! FOUND USERS ON TOPIC #{socket.topic}: #{inspect(users)}" |> IO.puts()

    push(socket, "connect", %{"public_key" => Util.get_public_key(:base64), "peers" => users})

    # Presence.track(socket, socket.assigns.public_key, %{})
    # push(socket, "presence_state", Presence.list(socket.topic))

    # if !Enum.member?(users, socket.assigns.public_key) do
    #   :ets.insert(:users, {socket.topic, [socket.assigns.public_key | users]})
    # end

    {:noreply, socket}
  end

  def handle_in("fetch", _, socket) do
    # "sp:" <> topic = socket.topic
    # ["sp", subj, pred] = Util.decrypt_sk(socket, topic) |> String.split(":")
    ["sp", subj, pred] = String.split(socket.topic, ":")

    case Database.get_one(subj, pred) do
      {:ok, plaintext_obj} ->
        {:ok, ciphertext} = socket |> Util.encrypt(plaintext_obj)
        push(socket, "fetch response", %{"ct" => Util.safe_encode64(ciphertext)})

        {:noreply, socket}

      {:error, reason} ->
        push(socket, "fetch response", %{"error" => reason})
        "query failed: #{inspect(reason)}" |> IO.puts()
        {:noreply, socket}

      other ->
        IO.puts("%%%%%% #{inspect(other)}")
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

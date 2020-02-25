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

  def endpoint_broadcast!(socket, action, payload), do: OPNWeb.Endpoint.broadcast!(socket, action, payload)

  def join("sp:" <> topic, %{"public_key" => public_key}, socket) do
    send(self(), :after_join)

    {:ok, assign(socket, %{ public_key: public_key, db_topic: topic })}
  end

  def join(topic, payload, _socket) do
    msg = "No match for topic: #{topic}, payload: #{inspect(payload)}. Likely missing public key."
    IO.puts("ERROR: #{msg}")

    {:error, msg}
  end

  def handle_info(:after_join, socket) do
    users = Util.get_users_on_topic(socket.assigns.db_topic)

    push(socket, "connect", %{"public_key" => Util.get_public_key(:base64), "peers" => users})

    Presence.track(socket, socket.assigns.public_key, %{})
    push(socket, "presence_state", Presence.list(socket.assigns.public_key) |> IO.inspect(label: "PRESENCE !!!"))

    if !Enum.member?(users, socket.assigns.public_key) do
      :ets.insert(:users, {socket.assigns.db_topic, [socket.assigns.public_key | users]})
    end

    {:noreply, socket}
  end

  def handle_in("fetch-request", _payload, socket) do
    [subj, pred] = String.split(socket.assigns.db_topic, ~r"(?<!base64):")

    case Util.get_data(socket.assigns.db_topic) do
      false ->
        case Database.get_one(subj, pred) do
          {:ok, nil} ->
            {:ok, ct} = Util.encrypt(socket, "")
            {:reply, {:json, %{"ct" => Util.safe_encode64(ct)}}, socket}

          {:ok, object} ->
            {:ok, ct} = Util.encrypt(socket, object)
            {:reply, {:json, %{"ct" => Util.safe_encode64(ct)}}, socket}

          {:error, reason} ->
            IO.puts("query failed: #{inspect(reason)}")
            {:reply, {:json, %{"error" => reason}}, socket}
        end

      object ->
        IO.puts("Found in :sp DB: #{IO.inspect(object)}")
        {:ok, ct} = Util.encrypt(socket, object)
        {:reply, {:json, %{"ct" => Util.safe_encode64(ct)}}, socket}
    end
  end

  def handle_in("write", %{"ct" => ciphertext}, socket) do
    [subj, pred] = String.split(socket.assigns.db_topic, ~r"(?<!base64):")

    case Util.decrypt(socket, ciphertext) do
      {:ok, obj_pt} ->
        IO.puts("WRITE RECEIVED, S: #{subj} P: #{pred} O: #{inspect(obj_pt)}")
        case Database.write(subj, pred, obj_pt) do
          :ok ->
            {:ok, ct} = Util.encrypt(socket, obj_pt)
            :ets.insert(:sp, {socket.assigns.db_topic, obj_pt})
            endpoint_broadcast!(socket.topic, "value", %{
              "ct" => Util.safe_encode64(ct),
              "pubkey" => socket.assigns.public_key,
            })

            {:noreply, socket}

          otherwise ->
            IO.warn(inspect(otherwise))

            {:noreply, socket}
        end

      json ->
        IO.puts("JSON decode failed: #{inspect(json)}")
        {:noreply, socket}
    end
  end

  def handle_in(action, payload, socket) do
    IO.puts("Topic: #{socket.topic}, no match for action: #{action}, payload: #{inspect(payload)}")

    {:noreply, socket}
  end
end

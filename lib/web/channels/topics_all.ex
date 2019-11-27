defmodule OPNWeb.TopicAll do
  use Phoenix.Channel
  import Phoenix.Socket, only: [assign: 2]
  alias OPN.Presence
  alias OPN.Database

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

  defp encrypt(socket, data) when is_map(data) do
    Kcl.box(
      Jason.encode!(data),
      :crypto.strong_rand_bytes(24),
      get_secret_key(),
      Base.decode64!(socket.assigns["public_key"])
    )
  end

  defp decrypt(socket, box, nonce) when is_binary(box) and is_binary(nonce) do
    {json, _state} =
      Kcl.unbox(
        Base.decode64!(box),
        Base.decode64!(nonce),
        get_secret_key(),
        Base.decode64!(socket.assigns["public_key"])
      )

    json
  end

  def get_secret_key() do
    :ets.lookup(:keys, :secret_key) |> List.first() |> Tuple.to_list() |> Enum.at(1)
  end

  def get_public_key() do
    :ets.lookup(:keys, :public_key) |> List.first() |> Tuple.to_list() |> Enum.at(1)
  end

  def init(state), do: {:ok, state}

  # def get_peers_on_topic(topic) do
  #   peers = :ets.lookup(:peers, topic)

  #   case Enum.count(peers) do
  #     x when x > 0 -> peers |> Enum.at(0) |> Tuple.to_list() |> Enum.at(1)
  #     _ -> []
  #   end
  # end

  # def include_peer_on_topic(topic, peers, public_key) do
  #   case topic do
  #     "none" ->
  #       []

  #     _ ->
  #       if !Enum.member?(peers, public_key) do
  #         peers = List.insert_at(peers, 0, public_key)
  #         :ets.insert(:peers, {topic, peers})
  #       end

  #       peers
  #   end
  # end

  def join(topic, payload, socket) do
    case payload do
      %{"public_key" => public_key} ->
        send(self(), :after_join)
        {:ok, assign(socket, %{"public_key" => public_key, "topic" => topic})}

      _ ->
        {:error, "connection requests must include your `public_key`"}
    end
  end

  def handle_info(:after_join, socket) do
    push(socket, "connect", %{"public_key" => get_public_key()})

    Presence.track(socket, socket.assigns.user_id, %{})
    push(socket, "presence_state", Presence.list(socket))

    # if Enum.count(socket.assigns["peers"]) > 1 do
    #   peers =
    #     socket.assigns["peers"]
    #     |> Enum.with_index(0)
    #     |> Enum.map(fn {k, v} -> {v, k} end)
    #     |> Map.new()

    #   push(socket, "peers", %{"peer_list" => peers, "offer" => nil})
    # end

    {:noreply, socket}
  end

  def handle_in("fetch", _, socket) do
    [subj, pred] = String.split(socket.assigns["topic"], ":")

    case Database.query(%{"s" => subj, "p" => [pred]}) do
      {:ok, data} ->
        {msg, state} = encrypt(socket, data)

        push(socket, "fetch response", %{
          "box" => Base.encode64(msg),
          "nonce" => Base.encode64(state.previous_nonce)
        })

        {:noreply, socket}

      {:error, reason} ->
        push(socket, "fetch response", %{"error" => reason})
        IO.puts("query failed: #{inspect(reason)}")
        {:noreply, socket}
    end
  end

  def handle_in("write", %{"box" => box, "nonce" => nonce}, socket) do
    case Jason.decode(decrypt(socket, box, nonce)) do
      {:ok, %{"s" => s, "p" => p, "o" => o}}
      when is_binary(s) and is_binary(p) and is_binary(o) ->
        # DeltaCrdt.mutate(crdt, :add, ["#{s}:#{p}", o])
        resp = Database.write(s, p, o)
        IO.puts("write: #{inspect(resp)}")

        resp = OPNWeb.Endpoint.broadcast!("#{s}:#{p}", "value", %{"data" => %{p => o}})
        IO.puts("broadcast returned: #{inspect(resp)}")

        {:noreply, socket}

      json ->
        IO.puts("JSON decode failed: #{inspect(json)}")
        {:noreply, socket}
    end
  end

  def handle_in(action, payload, socket) do
    IO.puts("No match for action: #{inspect(action)}, payload: #{inspect(payload)}")
    {:noreply, socket}
  end
end

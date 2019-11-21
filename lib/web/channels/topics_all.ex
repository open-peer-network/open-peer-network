defmodule OPNWeb.TopicAll do
  use Phoenix.Channel
  # use Guardian, otp_app: :opn
  alias OPN.Database
  # alias OPNWeb.Endpoint

  # Temporary hardcoded secret key to use until NaCl is setup
  @secret_key "48EkqJIWdB4bWoNznv9sNC3wagcoqAvQTSQjmTtyjtc="

  @public_key "GFEwAov/WzRS+Dmq3KUtScROZ8oEeh+mkAtWMYY41xY="

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

  def join(_topics, payload, socket) do
    case payload do
      %{"public_key" => peer_key} ->
        send(self(), :connect)
        {:ok, Phoenix.Socket.assign(socket, %{"peer_key" => peer_key})}

      _ ->
        {:error, "connection requests must include your public_key"}
    end
  end

  def handle_info(:connect, socket) do
    push(socket, "connect", %{"public_key" => @public_key})
    {:noreply, socket}
  end

  def handle_in("read:" <> req_id, payload, socket) do
    push(socket, "read:#{req_id}", Database.query(payload))
    {:noreply, socket}
  end

  def handle_in("write", %{"box" => _box, "nonce" => _nonce}, socket) do
    IO.puts("SOCKET: #{inspect(socket.assigns)}")

    # unboxed = Kcl.unbox(box, nonce, @secret_key, socket.assigns.peer_key)
    # IO.puts("unboxed: #{inspect(unboxed)}")
    # IO.puts("box: #{inspect(box)}")

    # case payload do
    #   %{"s" => s, "p" => p, "o" => o} when is_binary(s) and is_binary(p) and is_binary(o) ->
    #     # DeltaCrdt.mutate(crdt, :add, ["#{s}:#{p}", o])

    #     resp = Database.write(s, p, o)
    #     IO.puts("write: #{inspect(resp)}")

    #     resp = Endpoint.broadcast!("#{s}:#{p}", "value", %{"data" => o})
    #     IO.puts("broadcast returned: #{inspect(resp)}")

    #     {:noreply, socket}

    #   _ ->
    #     IO.puts("write fail, no match for payload: #{inspect(payload)}")
    #     {:noreply, socket}
    # end

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

defmodule OPNWeb.TopicSolo do
  use Phoenix.Channel
  import Phoenix.Socket, only: [assign: 2]
  alias OPN.Util

  def init(state), do: {:ok, state}

  def join("solo:" <> public_key, _payload, socket) do
    send(self(), :after_join)
    {:ok, assign(socket, %{public_key: public_key})}
  end

  def handle_info(:after_join, socket) do
    push(socket, "connect", %{"public_key" => Util.get_public_key(:base64)})
    {:noreply, socket}
  end

  @doc """
  Offer forwarding is done on `none` channel because we need this only once per peer,
  not per topic. Once peers are connected, they will coordinate directly between each
  other, which topics they have in common.
  """
  def handle_in(
        "forward",
        %{
          "message" => msg,
          "payload" => payload,
          "recipients" => recipients,
          "sender" => sender_key
        },
        socket
      )
      when is_list(recipients) do
    Enum.each(recipients, fn public_key ->
      OPNWeb.Endpoint.broadcast!("solo:#{public_key}", msg, %{
        "payload" => payload,
        "sender" => sender_key
      })
    end)

    {:noreply, socket}
  end

  def handle_in(action, payload, socket) do
    "Topic: #{socket.topic}, no match for action: #{action}, payload: #{inspect(payload)}"
    |> IO.puts()

    {:noreply, socket}
  end
end

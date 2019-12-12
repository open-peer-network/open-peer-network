defmodule OPNWeb.TopicNone do
  use Phoenix.Channel
  import Phoenix.Socket, only: [assign: 2]
  alias OPN.Util

  def init(state), do: {:ok, state}

  def join("none", %{"public_key" => pub_key}, socket) do
    send(self(), :after_join)
    {:ok, assign(socket, %{public_key: pub_key})}
  end

  def join(topic, payload, _socket) do
    msg = "No match for topic: #{topic}, payload: #{inspect(payload)}. Likely missing public key."
    "ERROR: #{msg}" |> IO.puts()

    {:error, msg}
  end

  def handle_info(:after_join, socket) do
    push(socket, "connect", %{"public_key" => Util.get_public_key(:base64)})
    {:noreply, socket}
  end

  def handle_in(action, payload, socket) do
    "Topic: #{socket.topic}, no match for action: #{action}, payload: #{inspect(payload)}"
    |> IO.puts()

    {:noreply, socket}
  end
end

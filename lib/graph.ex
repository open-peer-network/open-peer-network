defmodule ElixirWebsocket.Graph do
  use Caylir.Graph, otp_app: :elixir_websocket

  def incoming_message(payload) do
    IO.puts "incoming message: #{inspect payload}"
  end
end

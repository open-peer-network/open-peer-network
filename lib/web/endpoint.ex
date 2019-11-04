defmodule ElixirWebsocketWeb.Endpoint do
  use Phoenix.Endpoint, otp_app: :elixir_websocket

  socket "/socket", ElixirWebsocketWeb.UserSocket,
    websocket: true,
    longpoll: false
end

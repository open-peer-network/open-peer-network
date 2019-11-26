defmodule OPNWeb.Endpoint do
  use Phoenix.Endpoint, otp_app: :opn

  socket "/socket", OPNWeb.UserSocket,
    websocket: true,
    longpoll: false
end

defmodule OPN.Presence do
  use Phoenix.Presence,
    otp_app: :opn,
    pubsub_server: OPN.PubSub
end

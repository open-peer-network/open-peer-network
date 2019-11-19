defmodule ElixirWebsocketWeb.UserSocket do
  use Phoenix.Socket

  ## Channels
  channel("*", ElixirWebsocketWeb.TopicAll)

  # Socket params are passed from the client and can
  # be used to verify and authenticate a user. After
  # verification, you can put default assigns into
  # the socket that will be set for all channels, ie
  #
  #     {:ok, assign(socket, :user_id, verified_user_id)}
  #
  # To deny connection, return `:error`.
  #
  # See `Phoenix.Token` documentation for examples in
  # performing token verification on connect.
  def connect(params, socket, _connect_info) do
    IO.puts("connected!")
    {:ok, assign(socket, :user_id, params["user_id"] || UUID.uuid1())}
  end

  # Socket id's are topics that identify all sockets for a given user
  def id(socket), do: "session:#{socket.assigns.user_id}"
  # to broadcast a "disconnect" event and terminate
  # all active sockets and channels for a given user:
  # ElixirWebsocketWeb.Endpoint.broadcast("session:#{user.id}", "disconnect", %{})
end

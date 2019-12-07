defmodule OPN.Util do
  import Salty.Box.Curve25519xsalsa20poly1305, only: [easy: 4, open_easy: 4, noncebytes: 0]

  def unpack_ets(lookedup) do
    lookedup |> List.first() |> Tuple.to_list() |> Enum.at(1)
  end

  def get_secret_key() do
    :ets.lookup(:keys, :secret_key) |> unpack_ets()
  end

  def get_public_key() do
    :ets.lookup(:keys, :public_key) |> unpack_ets()
  end

  def get_users_on_topic(topic) do
    case :ets.lookup(:users, topic) do
      [] -> []
      results -> results |> unpack_ets()
    end
  end

  def encrypt(%Phoenix.Socket{} = socket, data) when is_binary(data) do
    encrypt(socket.assigns.public_key, data)
  end

  def encrypt(public_key, data) do
    easy(
      data,
      :crypto.strong_rand_bytes(24),
      get_secret_key(),
      Base.decode64!(public_key)
    )
  end

  def decrypt(socket, ciphertext) when is_binary(ciphertext) do
    nonce_size = noncebytes()
    <<nonce::binary-size(nonce_size), box::binary>> = ciphertext
    decrypt(socket, box, nonce)
  end

  defp decrypt(socket, box, nonce) when is_binary(box) and is_binary(nonce) do
    open_easy(
      box,
      nonce,
      get_secret_key(),
      Base.decode64!(socket.assigns.public_key)
    )
  end
end
